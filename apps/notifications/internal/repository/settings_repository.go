package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"notif/internal/domain"
	"notif/internal/infra/crypto"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SettingsRepository struct {
	db     *pgxpool.Pool
	crypto *crypto.Crypto
}

func NewSettingsRepository(db *pgxpool.Pool, crypto *crypto.Crypto) *SettingsRepository {
	return &SettingsRepository{db: db, crypto: crypto}
}

func (r *SettingsRepository) GetSettings(ctx context.Context) (*domain.NotificationSettings, error) {
	query := `
		SELECT id, resend_api_key, resend_from_email, meta_access_token, meta_phone_number_id,
		       meta_maintenance_created_template, meta_maintenance_updated_template,
		       created_at, updated_at
		FROM notification_settings
		LIMIT 1
	`
	row := r.db.QueryRow(ctx, query)

	var settings domain.NotificationSettings
	var resendAPIKey, metaAccessToken sql.NullString

	err := row.Scan(
		&settings.ID, &resendAPIKey, &settings.ResendFromEmail,
		&metaAccessToken, &settings.MetaPhoneNumberID,
		&settings.MetaMaintenanceCreatedTemplate, &settings.MetaMaintenanceUpdatedTemplate,
		&settings.CreatedAt, &settings.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return &domain.NotificationSettings{}, nil
		}
		return nil, fmt.Errorf("failed to get settings: %w", err)
	}

	if resendAPIKey.Valid && resendAPIKey.String != "" {
		decrypted, err := r.crypto.Decrypt(resendAPIKey.String)
		if err == nil {
			settings.ResendAPIKey = decrypted
		}
	}
	if metaAccessToken.Valid && metaAccessToken.String != "" {
		decrypted, err := r.crypto.Decrypt(metaAccessToken.String)
		if err == nil {
			settings.MetaAccessToken = decrypted
		}
	}

	return &settings, nil
}

func (r *SettingsRepository) UpsertSettings(ctx context.Context, settings domain.NotificationSettings) (*domain.NotificationSettings, error) {
	var resendAPIKeyJSON, metaAccessTokenJSON string
	var err error

	if settings.ResendAPIKey != "" {
		resendAPIKeyJSON, err = r.crypto.Encrypt(settings.ResendAPIKey)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt resend API key: %w", err)
		}
	}
	if settings.MetaAccessToken != "" {
		metaAccessTokenJSON, err = r.crypto.Encrypt(settings.MetaAccessToken)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt meta access token: %w", err)
		}
	}

	query := `
		INSERT INTO notification_settings (id, resend_api_key, resend_from_email, meta_access_token, meta_phone_number_id,
		                                   meta_maintenance_created_template, meta_maintenance_updated_template,
		                                   created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			resend_api_key = EXCLUDED.resend_api_key,
			resend_from_email = EXCLUDED.resend_from_email,
			meta_access_token = EXCLUDED.meta_access_token,
			meta_phone_number_id = EXCLUDED.meta_phone_number_id,
			meta_maintenance_created_template = EXCLUDED.meta_maintenance_created_template,
			meta_maintenance_updated_template = EXCLUDED.meta_maintenance_updated_template,
			updated_at = EXCLUDED.updated_at
		RETURNING id, created_at, updated_at
	`

	var id string
	var createdAt, updatedAt time.Time
	err = r.db.QueryRow(ctx, query,
		settings.ID, resendAPIKeyJSON, settings.ResendFromEmail,
		metaAccessTokenJSON, settings.MetaPhoneNumberID,
		settings.MetaMaintenanceCreatedTemplate, settings.MetaMaintenanceUpdatedTemplate,
		time.Now(), time.Now(),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert settings: %w", err)
	}

	return &domain.NotificationSettings{
		ID:                            id,
		ResendAPIKey:                  settings.ResendAPIKey,
		ResendFromEmail:               settings.ResendFromEmail,
		MetaAccessToken:               settings.MetaAccessToken,
		MetaPhoneNumberID:             settings.MetaPhoneNumberID,
		MetaMaintenanceCreatedTemplate: settings.MetaMaintenanceCreatedTemplate,
		MetaMaintenanceUpdatedTemplate: settings.MetaMaintenanceUpdatedTemplate,
		CreatedAt:                     createdAt,
		UpdatedAt:                     updatedAt,
	}, nil
}
