package whatsapp

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"notif/internal/config"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/types/events"
	"go.mau.fi/whatsmeow/util/keys"
)

type WhatsAppSender struct {
	client      *whatsmeow.Client
	phoneNumber string
	deviceStore *store.Device
	mu          sync.Mutex
	connected   bool
	sessionPath string
}

func NewWhatsAppSender(cfg *config.Config) (*WhatsAppSender, error) {
	if cfg.WhatsAppPhoneNumber == "" {
		return nil, nil
	}

	sessionPath := cfg.WhatsAppSessionPath
	if err := os.MkdirAll(sessionPath, 0700); err != nil {
		return nil, fmt.Errorf("failed to create WhatsApp session directory: %w", err)
	}

	deviceStore, err := loadOrCreateDevice(sessionPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load/create device: %w", err)
	}

	client := whatsmeow.NewClient(deviceStore, nil)
	
	sender := &WhatsAppSender{
		client:      client,
		phoneNumber: cfg.WhatsAppPhoneNumber,
		deviceStore: deviceStore,
		sessionPath: sessionPath,
	}

	client.AddEventHandler(sender.handleEvents)

	return sender, nil
}

func (s *WhatsAppSender) Start(ctx context.Context) error {
	if s == nil || s.client == nil {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.connected {
		return nil
	}

	if err := s.client.Connect(); err != nil {
		return fmt.Errorf("failed to connect WhatsApp: %w", err)
	}

	s.connected = true
	return nil
}

func (s *WhatsAppSender) Stop() {
	if s == nil || s.client == nil {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.connected {
		s.client.Disconnect()
		s.connected = false
	}
}

func (s *WhatsAppSender) SendMaintenanceWhatsApp(to, templateName string, parameters []string) error {
	if s == nil || !s.isConnected() {
		return nil
	}

	message := fmt.Sprintf("[%s] %s", templateName, strings.Join(parameters, ", "))
	return s.sendTextMessage(to, message)
}

func (s *WhatsAppSender) SendApprovalWhatsApp(tenantPhone, tenantName, propertyName string, dpAmount float64, invoiceURL string) error {
	if s == nil || !s.isConnected() {
		return nil
	}

	message := fmt.Sprintf("Halo %s, permintaan sewa Anda untuk %s telah disetujui. DP: Rp %.2f. Link pembayaran: %s",
		tenantName, propertyName, dpAmount, invoiceURL)
	return s.sendTextMessage(tenantPhone, message)
}

func (s *WhatsAppSender) SendRefundApprovalWhatsApp(tenantPhone, tenantName string, refundAmount float64, bookingCode string) error {
	if s == nil || !s.isConnected() {
		return nil
	}

	message := fmt.Sprintf("Halo %s, pengembalian dana untuk booking %s sebesar Rp %.2f telah disetujui.",
		tenantName, bookingCode, refundAmount)
	return s.sendTextMessage(tenantPhone, message)
}

func (s *WhatsAppSender) sendTextMessage(to, text string) error {
	if !s.isConnected() {
		return fmt.Errorf("WhatsApp client not connected")
	}

	formattedPhone := formatPhone(to)
	recipient, err := types.ParseJID(formattedPhone + "@s.whatsapp.net")
	if err != nil {
		return fmt.Errorf("failed to parse phone number: %w", err)
	}

	_, err = s.client.SendMessage(context.Background(), recipient, &waProto.Message{
		Conversation: &text,
	})
	if err != nil {
		return fmt.Errorf("failed to send WhatsApp message: %w", err)
	}

	return nil
}

func (s *WhatsAppSender) isConnected() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.connected && s.client != nil && s.client.IsConnected()
}

func (s *WhatsAppSender) handleEvents(evt interface{}) {
	switch e := evt.(type) {
	case *events.QR:
		fmt.Printf("QR Code: %s\n", strings.Join(e.Codes, "\n"))
	case *events.PairSuccess:
		fmt.Printf("WhatsApp paired successfully: %s\n", e.ID)
		_ = s.saveDevice()
	case *events.Connected:
		fmt.Println("WhatsApp connected")
	case *events.Disconnected:
		fmt.Println("WhatsApp disconnected")
	case *events.LoggedOut:
		fmt.Println("WhatsApp logged out")
	case *events.StreamReplaced:
		fmt.Println("WhatsApp stream replaced")
	case *events.StreamError:
		fmt.Printf("WhatsApp stream error: %s\n", e.Code)
	case *events.TemporaryBan:
		fmt.Printf("WhatsApp temporary ban: %v (expires in %v)\n", e.Code, e.Expire)
	}
}

func (s *WhatsAppSender) saveDevice() error {
	data, err := json.Marshal(s.deviceStore)
	if err != nil {
		return err
	}
	path := filepath.Join(s.sessionPath, "device.json")
	return os.WriteFile(path, data, 0600)
}

func loadOrCreateDevice(sessionPath string) (*store.Device, error) {
	path := filepath.Join(sessionPath, "device.json")
	
	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
		return createNewDevice(), nil
	}

	var device store.Device
	if err := json.Unmarshal(data, &device); err != nil {
		return nil, err
	}

	return &device, nil
}

func createNewDevice() *store.Device {
	noiseKey := &keys.KeyPair{
		Priv: &[32]byte{},
		Pub:  &[32]byte{},
	}
	identityKey := &keys.KeyPair{
		Priv: &[32]byte{},
		Pub:  &[32]byte{},
	}
	
	device := &store.Device{
		NoiseKey:    noiseKey,
		IdentityKey: identityKey,
		Identities:  store.NoopDevice.Identities,
		Sessions:    store.NoopDevice.Sessions,
		PreKeys:     store.NoopDevice.PreKeys,
		SenderKeys:  store.NoopDevice.SenderKeys,
		AppStateKeys: store.NoopDevice.AppStateKeys,
		AppState:    store.NoopDevice.AppState,
		Contacts:    store.NoopDevice.Contacts,
		ChatSettings: store.NoopDevice.ChatSettings,
		MsgSecrets:  store.NoopDevice.MsgSecrets,
		PrivacyTokens: store.NoopDevice.PrivacyTokens,
		NCTSalt:     store.NoopDevice.NCTSalt,
		EventBuffer: store.NoopDevice.EventBuffer,
		LIDs:        store.NoopDevice.LIDs,
		Container:   store.NoopDevice.Container,
	}
	
	return device
}

func formatPhone(phone string) string {
	phone = stripNonDigits(phone)
	if len(phone) > 0 && phone[0] == '0' {
		return "62" + phone[1:]
	}
	return phone
}

func stripNonDigits(s string) string {
	var result strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			result.WriteRune(r)
		}
	}
	return result.String()
}
