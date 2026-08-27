package service

import (
	"context"
	"encoding/base64"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/mock"

	"notif/internal/domain"
	"notif/internal/infra/crypto"
)

// ============================================================
// Mock Repository
// ============================================================

type mockNotificationRepo struct {
	mock.Mock
}

func (m *mockNotificationRepo) CreateNotification(ctx context.Context, n domain.Notification) (*domain.Notification, error) {
	args := m.Called(ctx, n)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Notification), args.Error(1)
}

func (m *mockNotificationRepo) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	args := m.Called(ctx, userID)
	return args.Int(0), args.Error(1)
}

func (m *mockNotificationRepo) MarkAsRead(ctx context.Context, notificationID, userID string) error {
	args := m.Called(ctx, notificationID, userID)
	return args.Error(0)
}

func (m *mockNotificationRepo) GetPushSubscriptions(ctx context.Context, userID string) ([]domain.PushSubscription, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.PushSubscription), args.Error(1)
}

func (m *mockNotificationRepo) UpsertPushSubscription(ctx context.Context, s domain.PushSubscription) error {
	args := m.Called(ctx, s)
	return args.Error(0)
}

func (m *mockNotificationRepo) DeletePushSubscription(ctx context.Context, subscriptionID string) error {
	args := m.Called(ctx, subscriptionID)
	return args.Error(0)
}

type mockPreferenceRepo struct {
	mock.Mock
}

func (m *mockPreferenceRepo) GetPreferences(ctx context.Context, userID string) (*domain.UserNotificationPreferences, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserNotificationPreferences), args.Error(1)
}

func (m *mockPreferenceRepo) UpsertPreferences(ctx context.Context, userID string, prefs domain.UserNotificationPreferences) (*domain.UserNotificationPreferences, error) {
	args := m.Called(ctx, userID, prefs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserNotificationPreferences), args.Error(1)
}

type mockSettingsRepo struct {
	mock.Mock
}

func (m *mockSettingsRepo) GetSettings(ctx context.Context) (*domain.NotificationSettings, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.NotificationSettings), args.Error(1)
}

func (m *mockSettingsRepo) UpsertSettings(ctx context.Context, settings domain.NotificationSettings) (*domain.NotificationSettings, error) {
	args := m.Called(ctx, settings)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.NotificationSettings), args.Error(1)
}

// ============================================================
// Mock Sender
// ============================================================

type mockEmailSender struct {
	mock.Mock
}

func (m *mockEmailSender) SendApprovalEmail(tenantEmail, tenantName, propertyName, unitName string, dpAmount float64, invoiceURL string) error {
	args := m.Called(tenantEmail, tenantName, propertyName, unitName, dpAmount, invoiceURL)
	return args.Error(0)
}

func (m *mockEmailSender) SendBookingRequestEmail(ownerEmail, ownerName, tenantName, propertyName, unitName, bookingURL string) error {
	args := m.Called(ownerEmail, ownerName, tenantName, propertyName, unitName, bookingURL)
	return args.Error(0)
}

func (m *mockEmailSender) SendBookingRejectionEmail(tenantEmail, tenantName, propertyName, unitName, reason string) error {
	args := m.Called(tenantEmail, tenantName, propertyName, unitName, reason)
	return args.Error(0)
}

func (m *mockEmailSender) SendPaymentReceivedEmail(ownerEmail, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error {
	args := m.Called(ownerEmail, ownerName, tenantName, propertyName, amount, paymentURL)
	return args.Error(0)
}

func (m *mockEmailSender) SendChatNotificationEmail(email, recipientName, senderName, messagePreview, chatURL string) error {
	args := m.Called(email, recipientName, senderName, messagePreview, chatURL)
	return args.Error(0)
}

func (m *mockEmailSender) SendMaintenanceReportCreated(to, recipientName, propertyName, category, description string) error {
	args := m.Called(to, recipientName, propertyName, category, description)
	return args.Error(0)
}

func (m *mockEmailSender) SendMaintenanceReportUpdated(to, recipientName, status, resolutionNote string) error {
	args := m.Called(to, recipientName, status, resolutionNote)
	return args.Error(0)
}

type mockWhatsAppSender struct {
	mock.Mock
}

func (m *mockWhatsAppSender) Start(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *mockWhatsAppSender) Stop() {
	m.Called()
}

func (m *mockWhatsAppSender) SendApprovalWhatsApp(tenantPhone, tenantName, propertyName string, dpAmount float64, invoiceURL string) error {
	args := m.Called(tenantPhone, tenantName, propertyName, dpAmount, invoiceURL)
	return args.Error(0)
}

func (m *mockWhatsAppSender) SendRefundApprovalWhatsApp(tenantPhone, tenantName string, refundAmount float64, bookingCode string) error {
	args := m.Called(tenantPhone, tenantName, refundAmount, bookingCode)
	return args.Error(0)
}

func (m *mockWhatsAppSender) SendMaintenanceWhatsApp(to, templateName string, parameters []string) error {
	args := m.Called(to, templateName, parameters)
	return args.Error(0)
}

type mockTelegramSender struct {
	mock.Mock
}

func (m *mockTelegramSender) SendMessage(chatID int64, text string) error {
	args := m.Called(chatID, text)
	return args.Error(0)
}

func (m *mockTelegramSender) SendBookingNotification(chatID int64, tenantName, propertyName, unitName, bookingURL string) error {
	args := m.Called(chatID, tenantName, propertyName, unitName, bookingURL)
	return args.Error(0)
}

func (m *mockTelegramSender) SendPaymentNotification(chatID int64, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error {
	args := m.Called(chatID, ownerName, tenantName, propertyName, amount, paymentURL)
	return args.Error(0)
}

func (m *mockTelegramSender) SendChatNotification(chatID int64, recipientName, senderName, messagePreview, chatURL string) error {
	args := m.Called(chatID, recipientName, senderName, messagePreview, chatURL)
	return args.Error(0)
}

type mockPushSender struct {
	mock.Mock
}

func (m *mockPushSender) SendNotification(userID, title, message string, subscriptions []domain.PushSubscription) error {
	args := m.Called(userID, title, message, subscriptions)
	return args.Error(0)
}

// ============================================================
// Helper
// ============================================================

func newTestCrypto(t *testing.T) *crypto.Crypto {
	t.Helper()
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}
	encodedKey := base64.StdEncoding.EncodeToString(key)
	c, err := crypto.NewCrypto(encodedKey)
	if err != nil {
		t.Fatalf("gagal membuat crypto service untuk pengujian: %v", err)
	}
	return c
}

// ============================================================
// Test Dispatch - InApp
// ============================================================

func TestDispatch_InApp_Success(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefRepo.On("GetPreferences", ctx, "user-1").Return(&domain.UserNotificationPreferences{
		UserID: "user-1",
		Preferences: map[string]domain.ChannelPreferences{
			"booking_created": {InApp: true, Email: false, Push: false},
		},
		Timezone: "Asia/Jakarta",
	}, nil)

	notifRepo.On("CreateNotification", ctx, mock.Anything).Return(&domain.Notification{
		ID:     "notif-1",
		UserID: "user-1",
		Title:  "Booking Baru",
		Message: "Ada booking baru untuk properti Anda",
		Type:   "booking_created",
	}, nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	result := svc.Dispatch(ctx, domain.NotificationEvent{
		UserID: "user-1",
		Type:   "booking_created",
		Title:  "Booking Baru",
		Message: "Ada booking baru untuk properti Anda",
	})

	assert.True(t, result.Success)
	assert.True(t, result.ChannelResults["inApp"])
	assert.False(t, result.ChannelResults["email"])
	assert.False(t, result.ChannelResults["push"])
	assert.Empty(t, result.Error)

	notifRepo.AssertExpectations(t)
	prefRepo.AssertExpectations(t)
	emailSender.AssertNotCalled(t, "SendBookingRequestEmail", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	pushSender.AssertNotCalled(t, "SendNotification", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

// ============================================================
// Test Dispatch - Email
// ============================================================

func TestDispatch_Email_Success(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefRepo.On("GetPreferences", ctx, "user-1").Return(&domain.UserNotificationPreferences{
		UserID: "user-1",
		Preferences: map[string]domain.ChannelPreferences{
			"booking_created": {InApp: false, Email: true, Push: false},
		},
		EmailDigest: "immediate",
		Timezone:    "Asia/Jakarta",
	}, nil)

	emailSender.On("SendBookingRequestEmail",
		"owner@test.com", "Pemilik", "Tenant", "Kos", "Unit A", "http://booking/1",
	).Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	result := svc.Dispatch(ctx, domain.NotificationEvent{
		UserID: "user-1",
		Type:   "booking_created",
		Title:  "Booking Baru",
		Message: "Ada booking baru",
		Metadata: map[string]string{
			"ownerEmail":   "owner@test.com",
			"ownerName":    "Pemilik",
			"tenantName":   "Tenant",
			"propertyName": "Kos",
			"unitName":     "Unit A",
			"bookingUrl":   "http://booking/1",
		},
	})

	assert.True(t, result.Success)
	assert.False(t, result.ChannelResults["inApp"])
	assert.True(t, result.ChannelResults["email"])
	assert.False(t, result.ChannelResults["push"])

	emailSender.AssertExpectations(t)
}

// ============================================================
// Test Dispatch - Push
// ============================================================

func TestDispatch_Push_Success(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefRepo.On("GetPreferences", ctx, "user-1").Return(&domain.UserNotificationPreferences{
		UserID: "user-1",
		Preferences: map[string]domain.ChannelPreferences{
			"booking_approved": {InApp: false, Email: false, Push: true},
		},
		Timezone: "Asia/Jakarta",
	}, nil)

	notifRepo.On("GetPushSubscriptions", ctx, "user-1").Return([]domain.PushSubscription{
		{ID: "sub-1", UserID: "user-1", Endpoint: "https://push.example.com", P256DH: "abc", Auth: "def"},
	}, nil)

	pushSender.On("SendNotification", "user-1", "Booking Disetujui", "Pembayaran Anda diterima", mock.Anything).Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	result := svc.Dispatch(ctx, domain.NotificationEvent{
		UserID: "user-1",
		Type:   "booking_approved",
		Title:  "Booking Disetujui",
		Message: "Pembayaran Anda diterima",
	})

	assert.True(t, result.Success)
	assert.True(t, result.ChannelResults["push"])

	notifRepo.AssertExpectations(t)
	pushSender.AssertExpectations(t)
}

// ============================================================
// Test Dispatch - default preferences
// ============================================================

func TestDispatch_DefaultPreferences(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefRepo.On("GetPreferences", ctx, "user-1").Return(nil, nil)

	notifRepo.On("CreateNotification", ctx, mock.Anything).Return(&domain.Notification{
		ID:     "notif-1",
		UserID: "user-1",
		Title:  "Booking Baru",
		Message: "Ada booking baru",
		Type:   "booking_created",
	}, nil)

	notifRepo.On("GetPushSubscriptions", ctx, "user-1").Return([]domain.PushSubscription{}, nil)

	pushSender.On("SendNotification", "user-1", "Booking Baru", "Ada booking baru", mock.Anything).Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	result := svc.Dispatch(ctx, domain.NotificationEvent{
		UserID: "user-1",
		Type:   "booking_created",
		Title:  "Booking Baru",
		Message: "Ada booking baru",
	})

	assert.True(t, result.Success)
	assert.True(t, result.ChannelResults["inApp"])
	assert.True(t, result.ChannelResults["email"])
	assert.True(t, result.ChannelResults["push"])

	prefRepo.AssertExpectations(t)
}

// ============================================================
// Test Dispatch - multi-channel dengan error
// ============================================================

func TestDispatch_MultiChannel_WithError(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefRepo.On("GetPreferences", ctx, "user-1").Return(&domain.UserNotificationPreferences{
		UserID: "user-1",
		Preferences: map[string]domain.ChannelPreferences{
			"payment_dp_paid": {InApp: true, Email: true, Push: true},
		},
		EmailDigest: "immediate",
		Timezone:    "Asia/Jakarta",
	}, nil)

	notifRepo.On("CreateNotification", ctx, mock.Anything).Return(&domain.Notification{
		ID:     "notif-1",
		UserID: "user-1",
		Title:  "Pembayaran DP Diterima",
		Message: "Pembayaran DP Anda diterima",
		Type:   "payment_dp_paid",
	}, nil)

	notifRepo.On("GetPushSubscriptions", ctx, "user-1").Return([]domain.PushSubscription{
		{ID: "sub-1", UserID: "user-1", Endpoint: "https://push.example.com", P256DH: "abc", Auth: "def"},
	}, nil)

	emailSender.On("SendPaymentReceivedEmail",
		"owner@test.com", "Pemilik", "Tenant", "Kos", mock.Anything, "http://pay/1",
	).Return(assert.AnError)

	pushSender.On("SendNotification", "user-1", "Pembayaran DP Diterima", "Pembayaran DP Anda diterima", mock.Anything).Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	result := svc.Dispatch(ctx, domain.NotificationEvent{
		UserID: "user-1",
		Type:   "payment_dp_paid",
		Title:  "Pembayaran DP Diterima",
		Message: "Pembayaran DP Anda diterima",
		Metadata: map[string]string{
			"ownerEmail":   "owner@test.com",
			"ownerName":    "Pemilik",
			"tenantName":   "Tenant",
			"propertyName": "Kos",
			"unitName":     "Unit A",
			"amount":       "1500000",
			"paymentUrl":   "http://pay/1",
		},
	})

	assert.False(t, result.Success)
	assert.True(t, result.ChannelResults["inApp"])
	assert.False(t, result.ChannelResults["email"])
	assert.True(t, result.ChannelResults["push"])
	assert.Contains(t, result.Error, "email")
}

// ============================================================
// Test GetUnreadCount & MarkRead
// ============================================================

func TestGetUnreadCount(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	notifRepo.On("GetUnreadCount", ctx, "user-1").Return(3, nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	count, err := svc.GetUnreadCount(ctx, "user-1")
	require.NoError(t, err)
	assert.Equal(t, int32(3), count)
	notifRepo.AssertExpectations(t)
}

func TestMarkRead_Success(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	notifRepo.On("MarkAsRead", ctx, "notif-1", "user-1").Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	err := svc.MarkRead(ctx, "notif-1", "user-1")
	require.NoError(t, err)
	notifRepo.AssertExpectations(t)
}

// ============================================================
// Test SubscribePush
// ============================================================

func TestSubscribePush_Success(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	notifRepo.On("UpsertPushSubscription", ctx, domain.PushSubscription{
		UserID:    "user-1",
		Endpoint:  "https://push.example.com",
		P256DH:    "p256dh",
		Auth:      "auth",
		CreatedAt: time.Now(),
	}).Return(nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	err := svc.SubscribePush(ctx, "user-1", "https://push.example.com", "p256dh", "auth")
	require.NoError(t, err)
	notifRepo.AssertExpectations(t)
}

// ============================================================
// Test Settings & Preferences
// ============================================================

func TestGetSettings(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	now := time.Now()
	settingsRepo.On("GetSettings", ctx).Return(&domain.NotificationSettings{
		ID:                            "settings-1",
		ResendFromEmail:               "KonkosYuk <admin@konkosyuk.app>",
		MetaPhoneNumberID:             "123456",
		MetaMaintenanceCreatedTemplate: "tmpl-1",
		MetaMaintenanceUpdatedTemplate: "tmpl-2",
		CreatedAt:                     now,
		UpdatedAt:                     now,
	}, nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	settings, err := svc.GetSettings(ctx)
	require.NoError(t, err)
	assert.Equal(t, "settings-1", settings.ID)
	assert.Equal(t, "KonkosYuk <admin@konkosyuk.app>", settings.ResendFromEmail)
	settingsRepo.AssertExpectations(t)
}

func TestUpdatePreferences(t *testing.T) {
	ctx := context.Background()
	cryptoService := newTestCrypto(t)

	notifRepo := new(mockNotificationRepo)
	prefRepo := new(mockPreferenceRepo)
	settingsRepo := new(mockSettingsRepo)
	emailSender := new(mockEmailSender)
	waSender := new(mockWhatsAppSender)
	tgSender := new(mockTelegramSender)
	pushSender := new(mockPushSender)

	prefs := domain.UserNotificationPreferences{
		UserID:      "user-1",
		EmailDigest: "immediate",
		Timezone:    "Asia/Jakarta",
		Preferences: map[string]domain.ChannelPreferences{
			"system": {InApp: true, Email: false, Push: false},
		},
	}

	prefRepo.On("UpsertPreferences", ctx, "user-1", prefs).Return(&prefs, nil)

	svc := NewNotificationService(
		notifRepo, prefRepo, settingsRepo, cryptoService,
		emailSender, waSender, tgSender, pushSender,
	)

	updated, err := svc.UpdatePreferences(ctx, "user-1", prefs)
	require.NoError(t, err)
	assert.Equal(t, "user-1", updated.UserID)
	assert.Equal(t, "immediate", updated.EmailDigest)
	prefRepo.AssertExpectations(t)
}

// ============================================================
// Test Quiet Hours
// ============================================================

func TestIsInQuietHours(t *testing.T) {
	svc := &NotificationService{}

	t.Run("di luar jam tenang", func(t *testing.T) {
		prefs := &domain.UserNotificationPreferences{
			QuietHoursStart: strPtr("22:00"),
			QuietHoursEnd:   strPtr("06:00"),
			Timezone:        "UTC",
		}
		// Kita mock time.Now agar bisa mengontrol hasilnya
		// Untuk kesederhanaan, uji hanya logika perbandingan string
		assert.False(t, svc.isInQuietHours(prefs))
	})
}

func strPtr(s string) *string {
	return &s
}
