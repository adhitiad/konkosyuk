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
	"notif/internal/metrics"
)

type NotificationService struct {
	notificationRepo NotificationRepository
	preferenceRepo   PreferenceRepository
	settingsRepo     SettingsRepository
	crypto           *crypto.Crypto
	emailSender      EmailSender
	whatsappSender   WhatsAppSender
	telegramSender   TelegramSender
	pushSender       PushSender
}

type NotificationRepository interface {
	CreateNotification(ctx context.Context, n domain.Notification) (*domain.Notification, error)
	GetUnreadCount(ctx context.Context, userID string) (int, error)
	MarkAsRead(ctx context.Context, notificationID, userID string) error
	GetPushSubscriptions(ctx context.Context, userID string) ([]domain.PushSubscription, error)
	UpsertPushSubscription(ctx context.Context, s domain.PushSubscription) error
	DeletePushSubscription(ctx context.Context, subscriptionID string) error
}

type PreferenceRepository interface {
	GetPreferences(ctx context.Context, userID string) (*domain.UserNotificationPreferences, error)
	UpsertPreferences(ctx context.Context, userID string, prefs domain.UserNotificationPreferences) (*domain.UserNotificationPreferences, error)
}

type SettingsRepository interface {
	GetSettings(ctx context.Context) (*domain.NotificationSettings, error)
	UpsertSettings(ctx context.Context, settings domain.NotificationSettings) (*domain.NotificationSettings, error)
}

type EmailSender interface {
	SendApprovalEmail(tenantEmail, tenantName, propertyName, unitName string, dpAmount float64, invoiceURL string) error
	SendBookingRequestEmail(ownerEmail, ownerName, tenantName, propertyName, unitName, bookingURL string) error
	SendBookingRejectionEmail(tenantEmail, tenantName, propertyName, unitName, reason string) error
	SendPaymentReceivedEmail(ownerEmail, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error
	SendChatNotificationEmail(email, recipientName, senderName, messagePreview, chatURL string) error
	SendMaintenanceReportCreated(to, recipientName, propertyName, category, description string) error
	SendMaintenanceReportUpdated(to, recipientName, status, resolutionNote string) error
}

type WhatsAppSender interface {
	Start(ctx context.Context) error
	Stop()
	SendApprovalWhatsApp(tenantPhone, tenantName, propertyName string, dpAmount float64, invoiceURL string) error
	SendRefundApprovalWhatsApp(tenantPhone, tenantName string, refundAmount float64, bookingCode string) error
	SendMaintenanceWhatsApp(to, templateName string, parameters []string) error
}

type TelegramSender interface {
	SendMessage(chatID int64, text string) error
	SendBookingNotification(chatID int64, tenantName, propertyName, unitName, bookingURL string) error
	SendPaymentNotification(chatID int64, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error
	SendChatNotification(chatID int64, recipientName, senderName, messagePreview, chatURL string) error
}

type PushSender interface {
	SendNotification(userID, title, message string, subscriptions []domain.PushSubscription) error
}

func NewNotificationService(
	notificationRepo NotificationRepository,
	preferenceRepo PreferenceRepository,
	settingsRepo SettingsRepository,
	crypto *crypto.Crypto,
	emailSender EmailSender,
	whatsappSender WhatsAppSender,
	telegramSender TelegramSender,
	pushSender PushSender,
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
			start := time.Now()
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
				metrics.NotificationFailuresTotal.WithLabelValues("inApp").Inc()
				mu.Unlock()
			} else {
				mu.Lock()
				channelResults["inApp"] = true
				metrics.NotificationsSentTotal.WithLabelValues("inApp").Inc()
				metrics.NotificationSendDurationSeconds.WithLabelValues("inApp").Observe(time.Since(start).Seconds())
				mu.Unlock()
			}
		}()
	}

	if channels.Push {
		wg.Add(1)
		go func() {
			defer wg.Done()
			start := time.Now()
			subscriptions, err := s.notificationRepo.GetPushSubscriptions(ctx, event.UserID)
			if err != nil {
				mu.Lock()
				errors = append(errors, fmt.Sprintf("push: %v", err))
				channelResults["push"] = false
				metrics.NotificationFailuresTotal.WithLabelValues("push").Inc()
				mu.Unlock()
				return
			}
			if err := s.pushSender.SendNotification(event.UserID, event.Title, event.Message, subscriptions); err != nil {
				mu.Lock()
				errors = append(errors, fmt.Sprintf("push: %v", err))
				channelResults["push"] = false
				metrics.NotificationFailuresTotal.WithLabelValues("push").Inc()
				mu.Unlock()
			} else {
				mu.Lock()
				channelResults["push"] = true
				metrics.NotificationsSentTotal.WithLabelValues("push").Inc()
				metrics.NotificationSendDurationSeconds.WithLabelValues("push").Observe(time.Since(start).Seconds())
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	if channels.Email {
		start := time.Now()
		if err := s.sendEmailNotification(ctx, event); err != nil {
			channelResults["email"] = false
			errors = append(errors, fmt.Sprintf("email: %v", err))
			metrics.NotificationFailuresTotal.WithLabelValues("email").Inc()
		} else {
			channelResults["email"] = true
			metrics.NotificationsSentTotal.WithLabelValues("email").Inc()
			metrics.NotificationSendDurationSeconds.WithLabelValues("email").Observe(time.Since(start).Seconds())
		}
	}

	if s.whatsappSender != nil {
		start := time.Now()
		if err := s.sendWhatsAppNotification(ctx, event); err != nil {
			channelResults["whatsapp"] = false
			errors = append(errors, fmt.Sprintf("whatsapp: %v", err))
			metrics.NotificationFailuresTotal.WithLabelValues("whatsapp").Inc()
		} else {
			channelResults["whatsapp"] = true
			metrics.NotificationsSentTotal.WithLabelValues("whatsapp").Inc()
			metrics.NotificationSendDurationSeconds.WithLabelValues("whatsapp").Observe(time.Since(start).Seconds())
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
		return defaultPreferences(notifType, priority)
	}

	typePrefs, ok := prefs.Preferences[notifType]
	if !ok {
		return defaultPreferences(notifType, priority)
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

func defaultPreferences(notifType string, priority domain.NotificationPriority) domain.ChannelPreferences {
	defaults := map[string]domain.ChannelPreferences{
		"booking_created":       {InApp: true, Email: true, Push: true},
		"booking_approved":      {InApp: true, Email: true, Push: true},
		"booking_rejected":      {InApp: true, Email: true, Push: false},
		"booking_completed":     {InApp: true, Email: false, Push: true},
		"booking_cancelled":     {InApp: true, Email: true, Push: false},
		"payment_dp_paid":       {InApp: true, Email: false, Push: true},
		"payment_full_paid":     {InApp: true, Email: true, Push: true},
		"payment_failed":        {InApp: true, Email: true, Push: true},
		"payment_refunded":      {InApp: true, Email: true, Push: true},
		"maintenance_created":   {InApp: true, Email: true, Push: true},
		"maintenance_updated":   {InApp: true, Email: true, Push: true},
		"maintenance_resolved":  {InApp: true, Email: false, Push: true},
		"inspection_created":    {InApp: true, Email: false, Push: true},
		"inspection_completed":  {InApp: true, Email: true, Push: true},
		"inspection_disputed":   {InApp: true, Email: true, Push: true},
		"chat_message":          {InApp: true, Email: false, Push: true},
		"review_received":       {InApp: true, Email: false, Push: false},
		"booking_reminder_24h":  {InApp: true, Email: true, Push: true},
		"booking_reminder_1h":   {InApp: true, Email: false, Push: true},
		"pricing_alert":         {InApp: true, Email: false, Push: true},
		"referral_created":      {InApp: true, Email: true, Push: false},
		"referral_verifying":    {InApp: true, Email: true, Push: true},
		"referral_eligible":     {InApp: true, Email: true, Push: true},
		"referral_failed":       {InApp: true, Email: true, Push: true},
		"referral_completed":    {InApp: true, Email: true, Push: true},
		"referral_voucher_converted": {InApp: true, Email: true, Push: true},
		"referral_offset_applied":    {InApp: true, Email: true, Push: true},
		"referral_reward_earned":     {InApp: true, Email: true, Push: true},
		"group_booking_invite":       {InApp: true, Email: true, Push: true},
		"group_booking_updated":      {InApp: true, Email: false, Push: true},
		"system":                      {InApp: true, Email: false, Push: false},
	}

	if defaults, ok := defaults[notifType]; ok {
		return defaults
	}

	return domain.ChannelPreferences{InApp: true, Email: false, Push: false}
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
	case "maintenance_created":
		if event.Metadata["email"] != "" && event.Metadata["recipientName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["category"] != "" &&
			event.Metadata["description"] != "" {
			return s.emailSender.SendMaintenanceReportCreated(
				event.Metadata["email"],
				event.Metadata["recipientName"],
				event.Metadata["propertyName"],
				event.Metadata["category"],
				event.Metadata["description"],
			)
		}
	case "maintenance_updated":
		if event.Metadata["email"] != "" && event.Metadata["recipientName"] != "" &&
			event.Metadata["status"] != "" {
			return s.emailSender.SendMaintenanceReportUpdated(
				event.Metadata["email"],
				event.Metadata["recipientName"],
				event.Metadata["status"],
				event.Metadata["resolutionNote"],
			)
		}
	}

	return nil
}

func (s *NotificationService) sendWhatsAppNotification(ctx context.Context, event domain.NotificationEvent) error {
	if s.whatsappSender == nil {
		return nil
	}

	switch event.Type {
	case "booking_approved":
		if event.Metadata["tenantPhone"] != "" && event.Metadata["tenantName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["dpAmount"] != "" &&
			event.Metadata["invoiceUrl"] != "" {
			dpAmount := parseFloat(event.Metadata["dpAmount"])
			return s.whatsappSender.SendApprovalWhatsApp(
				event.Metadata["tenantPhone"],
				event.Metadata["tenantName"],
				event.Metadata["propertyName"],
				dpAmount,
				event.Metadata["invoiceUrl"],
			)
		}
	case "payment_refunded":
		if event.Metadata["tenantPhone"] != "" && event.Metadata["tenantName"] != "" &&
			event.Metadata["bookingCode"] != "" && event.Metadata["refundAmount"] != "" {
			refundAmount := parseFloat(event.Metadata["refundAmount"])
			return s.whatsappSender.SendRefundApprovalWhatsApp(
				event.Metadata["tenantPhone"],
				event.Metadata["tenantName"],
				refundAmount,
				event.Metadata["bookingCode"],
			)
		}
	case "maintenance_created", "maintenance_updated":
		if event.Metadata["tenantPhone"] != "" && event.Metadata["recipientName"] != "" &&
			event.Metadata["propertyName"] != "" && event.Metadata["category"] != "" &&
			event.Metadata["description"] != "" {
			parameters := []string{
				event.Metadata["recipientName"],
				event.Metadata["propertyName"],
				event.Metadata["category"],
				event.Metadata["description"],
			}
			return s.whatsappSender.SendMaintenanceWhatsApp(
				event.Metadata["tenantPhone"],
				event.Type,
				parameters,
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
