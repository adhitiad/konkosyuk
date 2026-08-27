package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"notif/internal/domain"
	"notif/internal/infra/crypto"
	"notif/internal/infra/email"
	"notif/internal/infra/push"
	"notif/internal/infra/telegram"
	"notif/internal/infra/whatsapp"
	"notif/internal/repository"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	preferenceRepo   *repository.PreferenceRepository
	settingsRepo     *repository.SettingsRepository
	crypto           *crypto.Crypto
	emailSender      *email.EmailSender
	whatsappSender   *whatsapp.WhatsAppSender
	telegramSender   *telegram.TelegramSender
	pushSender       *push.PushSender
}

func NewNotificationService(
	notificationRepo *repository.NotificationRepository,
	preferenceRepo *repository.PreferenceRepository,
	settingsRepo *repository.SettingsRepository,
	crypto *crypto.Crypto,
	emailSender *email.EmailSender,
	whatsappSender *whatsapp.WhatsAppSender,
	telegramSender *telegram.TelegramSender,
	pushSender *push.PushSender,
) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		preferenceRepo:   preferenceRepo,
		settingsRepo:     settingsRepo,
		crypto:           crypto,
		emailSender:      emailSender,
		whatsappSender:   whatsappSender,
		telegramSender:   telegramSender,
		pushSender:       pushSender,
	}
}

func (s *NotificationService) Dispatch(ctx context.Context, event domain.NotificationEvent) domain.DispatchResult {
	channels := s.shouldSendNotification(ctx, event.UserID, event.Type, event.Priority)
	if !channels.InApp && !channels.Email && !channels.Push {
		return domain.DispatchResult{
			Success:        true,
			ChannelResults: map[string]bool{"inApp": false, "email": false, "push": false},
		}
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	channelResults := make(map[string]bool)
	var errors []string

	if channels.InApp {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := s.notificationRepo.CreateNotification(ctx, domain.Notification{
				UserID:      event.UserID,
				Title:       event.Title,
				Message:     event.Message,
				Type:        event.Type,
				ReferenceID: event.ReferenceID,
				IsRead:      false,
				CreatedAt:   time.Now(),
			}); err != nil {
				mu.Lock()
				errors = append(errors, fmt.Sprintf("inApp: %v", err))
				channelResults["inApp"] = false
				mu.Unlock()
			} else {
				mu.Lock()
				channelResults["inApp"] = true
				mu.Unlock()
			}
		}()
	}

	if channels.Push {
		wg.Add(1)
		go func() {
			defer wg.Done()
			subscriptions, err := s.notificationRepo.GetPushSubscriptions(ctx, event.UserID)
			if err != nil {
				mu.Lock()
				errors = append(errors, fmt.Sprintf("push: %v", err))
				channelResults["push"] = false
				mu.Unlock()
				return
			}
			if err := s.pushSender.SendNotification(event.UserID, event.Title, event.Message, subscriptions); err != nil {
				mu.Lock()
				errors = append(errors, fmt.Sprintf("push: %v", err))
				channelResults["push"] = false
				mu.Unlock()
			} else {
				mu.Lock()
				channelResults["push"] = true
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	if channels.Email {
		if err := s.sendEmailNotification(ctx, event); err != nil {
			channelResults["email"] = false
			errors = append(errors, fmt.Sprintf("email: %v", err))
		} else {
			channelResults["email"] = true
		}
	}

	success := len(errors) == 0
	var errorMsg string
	if len(errors) > 0 {
		errorMsg = strings.Join(errors, "; ")
	}

	return domain.DispatchResult{
		Success:        success,
		ChannelResults: channelResults,
		Error:          errorMsg,
	}
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID string) (int32, error) {
	count, err := s.notificationRepo.GetUnreadCount(ctx, userID)
	if err != nil {
		return 0, err
	}
	return int32(count), nil
}

func (s *NotificationService) MarkRead(ctx context.Context, notificationID, userID string) error {
	return s.notificationRepo.MarkAsRead(ctx, notificationID, userID)
}

func (s *NotificationService) SubscribePush(ctx context.Context, userID, endpoint, p256dh, auth string) error {
	return s.notificationRepo.UpsertPushSubscription(ctx, domain.PushSubscription{
		UserID:    userID,
		Endpoint:  endpoint,
		P256DH:    p256dh,
		Auth:      auth,
		CreatedAt: time.Now(),
	})
}

func (s *NotificationService) GetSettings(ctx context.Context) (*domain.NotificationSettings, error) {
	return s.settingsRepo.GetSettings(ctx)
}

func (s *NotificationService) UpdateSettings(ctx context.Context, settings domain.NotificationSettings) (*domain.NotificationSettings, error) {
	return s.settingsRepo.UpsertSettings(ctx, settings)
}

func (s *NotificationService) GetPreferences(ctx context.Context, userID string) (*domain.UserNotificationPreferences, error) {
	return s.preferenceRepo.GetPreferences(ctx, userID)
}

func (s *NotificationService) UpdatePreferences(ctx context.Context, userID string, prefs domain.UserNotificationPreferences) (*domain.UserNotificationPreferences, error) {
	return s.preferenceRepo.UpsertPreferences(ctx, userID, prefs)
}

func (s *NotificationService) shouldSendNotification(ctx context.Context, userID, notifType string, priority domain.NotificationPriority) domain.ChannelPreferences {
	prefs, err := s.preferenceRepo.GetPreferences(ctx, userID)
	if err != nil || prefs == nil {
		return domain.ChannelPreferences{InApp: true, Email: false, Push: false}
	}

	typePrefs, ok := prefs.Preferences[notifType]
	if !ok {
		typePrefs = domain.ChannelPreferences{InApp: true, Email: false, Push: false}
	}

	if s.isInQuietHours(prefs) && priority != domain.PriorityUrgent {
		typePrefs.Push = false
		if prefs.EmailDigest != "immediate" {
			typePrefs.Email = false
		}
	}

	if prefs.EmailDigest != "immediate" {
		typePrefs.Email = false
	}

	return typePrefs
}

func (s *NotificationService) isInQuietHours(prefs *domain.UserNotificationPreferences) bool {
	if prefs.QuietHoursStart == nil || prefs.QuietHoursEnd == nil {
		return false
	}

	loc, err := time.LoadLocation(prefs.Timezone)
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	currentTime := now.Format("15:04")

	start := *prefs.QuietHoursStart
	end := *prefs.QuietHoursEnd

	if start > end {
		return currentTime >= start || currentTime <= end
	}
	return currentTime >= start && currentTime <= end
}

func (s *NotificationService) sendEmailNotification(ctx context.Context, event domain.NotificationEvent) error {
	if s.emailSender == nil {
		return nil
	}

	switch event.Type {
	case "booking_approved":
		if event.Metadata["tenantEmail"] != "" && event.Metadata["tenantName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["unitName"] != "" &&
			event.Metadata["dpAmount"] != "" && event.Metadata["invoiceUrl"] != "" {
			dpAmount := parseFloat(event.Metadata["dpAmount"])
			return s.emailSender.SendApprovalEmail(
				event.Metadata["tenantEmail"],
				event.Metadata["tenantName"],
				event.Metadata["propertyName"],
				event.Metadata["unitName"],
				dpAmount,
				event.Metadata["invoiceUrl"],
			)
		}
	case "booking_created":
		if event.Metadata["ownerEmail"] != "" && event.Metadata["ownerName"] != "" &&
			event.Metadata["tenantName"] != "" && event.Metadata["propertyName"] != "" &&
			event.Metadata["unitName"] != "" && event.Metadata["bookingUrl"] != "" {
			return s.emailSender.SendBookingRequestEmail(
				event.Metadata["ownerEmail"],
				event.Metadata["ownerName"],
				event.Metadata["tenantName"],
				event.Metadata["propertyName"],
				event.Metadata["unitName"],
				event.Metadata["bookingUrl"],
			)
		}
	case "booking_rejected":
		if event.Metadata["tenantEmail"] != "" && event.Metadata["tenantName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["unitName"] != "" {
			reason := ""
			if event.Metadata["reason"] != "" {
				reason = event.Metadata["reason"]
			}
			return s.emailSender.SendBookingRejectionEmail(
				event.Metadata["tenantEmail"],
				event.Metadata["tenantName"],
				event.Metadata["propertyName"],
				event.Metadata["unitName"],
				reason,
			)
		}
	case "payment_full_paid", "payment_dp_paid":
		if event.Metadata["ownerEmail"] != "" && event.Metadata["ownerName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["unitName"] != "" &&
			event.Metadata["amount"] != "" && event.Metadata["paymentUrl"] != "" {
			amount := parseFloat(event.Metadata["amount"])
			return s.emailSender.SendPaymentReceivedEmail(
				event.Metadata["ownerEmail"],
				event.Metadata["ownerName"],
				event.Metadata["tenantName"],
				event.Metadata["propertyName"],
				amount,
				event.Metadata["paymentUrl"],
			)
		}
	case "chat_message":
		if event.Metadata["email"] != "" && event.Metadata["senderName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["chatUrl"] != "" {
			return s.emailSender.SendChatNotificationEmail(
				event.Metadata["email"],
				event.Metadata["senderName"],
				event.Metadata["senderName"],
				event.Message,
				event.Metadata["chatUrl"],
			)
		}
	}

	return nil
}

func (s *NotificationService) DispatchBatch(ctx context.Context, events []domain.NotificationEvent) []domain.DispatchResult {
	results := make([]domain.DispatchResult, len(events))
	var wg sync.WaitGroup
	for i, event := range events {
		wg.Add(1)
		go func(idx int, e domain.NotificationEvent) {
			defer wg.Done()
			results[idx] = s.Dispatch(ctx, e)
		}(i, event)
	}
	wg.Wait()
	return results
}

func parseFloat(s string) float64 {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	if err != nil {
		return 0
	}
	return f
}

func roundAmount(amount float64) float64 {
	return math.Round(amount*100) / 100
}
