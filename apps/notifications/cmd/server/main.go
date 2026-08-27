package main

import (
	"context"
	"fmt"
	"net"

	"notif/internal/config"
	"notif/internal/delivery"
	"notif/internal/infra/crypto"
	"notif/internal/infra/email"
	"notif/internal/infra/push"
	"notif/internal/infra/telegram"
	"notif/internal/infra/whatsapp"
	"notif/internal/repository"
	"notif/internal/service"

	pb "notif/proto/konkosyuk/v1"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Info().Msg("starting notification service")

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}

	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer pool.Close()

	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisURL,
		Password: "",
		DB:       0,
	})
	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		log.Fatal().Err(err).Msg("failed to connect to redis")
	}

	cryptoService, err := crypto.NewCrypto(cfg.EncryptionKey)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create crypto service")
	}

	notificationRepo := repository.NewNotificationRepository(pool, cryptoService)
	preferenceRepo := repository.NewPreferenceRepository(pool, cryptoService)
	settingsRepo := repository.NewSettingsRepository(pool, cryptoService)

	emailSender := email.NewEmailSender(cfg.ResendAPIKey, cfg.ResendFromEmail)
	
	whatsappSender, err := whatsapp.NewWhatsAppSender(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create WhatsApp sender")
	}
	
	if whatsappSender != nil {
		if err := whatsappSender.Start(ctx); err != nil {
			log.Warn().Err(err).Msg("failed to start WhatsApp client")
		}
	}
	
	telegramSender := telegram.NewTelegramSender(cfg.TelegramBotToken)
	pushSender := push.NewPushSender(cfg.VAPIDPrivateKey, cfg.VAPIDPublicKey, cfg.VAPIDSubject)

	notificationService := service.NewNotificationService(
		notificationRepo,
		preferenceRepo,
		settingsRepo,
		cryptoService,
		emailSender,
		whatsappSender,
		telegramSender,
		pushSender,
	)

	handler := delivery.NewNotificationHandler(notificationService)

	server := grpc.NewServer()
	pb.RegisterNotificationServiceServer(server, handler)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.GRPCPort)
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to listen")
	}

	log.Info().Str("addr", addr).Msg("gRPC server listening")
	
	go func() {
		if err := server.Serve(lis); err != nil {
			log.Fatal().Err(err).Msg("failed to serve")
		}
	}()

	<-ctx.Done()
	
	if whatsappSender != nil {
		whatsappSender.Stop()
	}
	server.GracefulStop()
	pool.Close()
}
