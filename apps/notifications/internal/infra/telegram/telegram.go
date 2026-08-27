package telegram

import (
	"fmt"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type TelegramSender struct {
	botToken string
	botAPI   *tgbotapi.BotAPI
	enabled  bool
}

func NewTelegramSender(botToken string) *TelegramSender {
	if botToken == "" {
		return nil
	}

	bot, err := tgbotapi.NewBotAPI(botToken)
	if err != nil {
		return nil
	}

	return &TelegramSender{
		botToken: botToken,
		botAPI:   bot,
		enabled:  true,
	}
}

func (s *TelegramSender) SendMessage(chatID int64, text string) error {
	if s == nil || !s.enabled {
		return nil
	}

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = tgbotapi.ModeHTML

	_, err := s.botAPI.Send(msg)
	if err != nil {
		return fmt.Errorf("failed to send telegram message: %w", err)
	}
	return nil
}

func (s *TelegramSender) SendBookingNotification(chatID int64, tenantName, propertyName, unitName, bookingURL string) error {
	text := fmt.Sprintf("Ada permintaan booking baru untuk properti Anda.\n\nTenant: %s\nProperti: %s\nUnit: %s\n\nLihat detail: %s",
		tenantName, propertyName, unitName, bookingURL)
	return s.SendMessage(chatID, text)
}

func (s *TelegramSender) SendPaymentNotification(chatID int64, ownerName, tenantName, propertyName string, amount float64, paymentURL string) error {
	text := fmt.Sprintf("Pembayaran dari %s telah diterima untuk properti %s.\n\nJumlah: Rp %.2f\nLihat detail: %s",
		tenantName, propertyName, amount, paymentURL)
	return s.SendMessage(chatID, text)
}

func (s *TelegramSender) SendChatNotification(chatID int64, recipientName, senderName, messagePreview, chatURL string) error {
	text := fmt.Sprintf("Anda menerima pesan baru dari %s:\n\n\"%s\"\n\nBuka chat: %s",
		senderName, messagePreview, chatURL)
	return s.SendMessage(chatID, text)
}
