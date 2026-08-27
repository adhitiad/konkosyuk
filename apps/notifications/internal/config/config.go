package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL              string
	RedisURL                 string
	EncryptionKey            string
	GRPCPort                 string
	MetricsPort              string
	ResendAPIKey             string
	ResendFromEmail          string
	WhatsAppPhoneNumber      string
	WhatsAppSessionPath      string
	TelegramBotToken         string
	VAPIDPrivateKey          string
	VAPIDPublicKey           string
	VAPIDSubject             string
	NotificationServiceSecret string
}

func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:              os.Getenv("DATABASE_URL"),
		RedisURL:                 os.Getenv("REDIS_URL"),
		EncryptionKey:            os.Getenv("NOTIFICATION_ENCRYPTION_KEY"),
		GRPCPort:                 getEnvOrDefault("GRPC_PORT", "50052"),
		MetricsPort:              getEnvOrDefault("METRICS_PORT", "9091"),
		ResendAPIKey:             os.Getenv("RESEND_API_KEY"),
		ResendFromEmail:          os.Getenv("RESEND_FROM_EMAIL"),
		WhatsAppPhoneNumber:      os.Getenv("WHATSAPP_PHONE_NUMBER"),
		WhatsAppSessionPath:      getEnvOrDefault("WHATSAPP_SESSION_PATH", "./whatsapp-session"),
		TelegramBotToken:         os.Getenv("TELEGRAM_BOT_TOKEN"),
		VAPIDPrivateKey:          os.Getenv("VAPID_PRIVATE_KEY"),
		VAPIDPublicKey:           os.Getenv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
		VAPIDSubject:             getEnvOrDefault("VAPID_SUBJECT", "mailto:admin@konkosyuk.app"),
		NotificationServiceSecret: os.Getenv("NOTIFICATION_SERVICE_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL is required")
	}
	if cfg.EncryptionKey == "" {
		return nil, fmt.Errorf("NOTIFICATION_ENCRYPTION_KEY is required")
	}

	return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
