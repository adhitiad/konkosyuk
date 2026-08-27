package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"notif/internal/domain"
	"notif/internal/infra/crypto"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PreferenceRepository struct {
	db     *pgxpool.Pool
	crypto *crypto.Crypto
}

func NewPreferenceRepository(db *pgxpool.Pool, crypto *crypto.Crypto) *PreferenceRepository {
	return &PreferenceRepository{db: db, crypto: crypto}
}

func (r *PreferenceRepository) GetPreferences(ctx context.Context, userID string) (*domain.UserNotificationPreferences, error) {
	query := `
		SELECT id, user_id, preferences, email_digest, quiet_hours_start, quiet_hours_end, timezone, updated_at
		FROM user_notification_preferences
		WHERE user_id = $1
	`
	row := r.db.QueryRow(ctx, query, userID)

	var prefs domain.UserNotificationPreferences
	var preferencesJSON []byte
	var quietHoursStart, quietHoursEnd sql.NullString

	err := row.Scan(
		&prefs.ID, &prefs.UserID, &preferencesJSON,
		&prefs.EmailDigest, &quietHoursStart, &quietHoursEnd,
		&prefs.Timezone, &prefs.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	if quietHoursStart.Valid {
		prefs.QuietHoursStart = &quietHoursStart.String
	}
	if quietHoursEnd.Valid {
		prefs.QuietHoursEnd = &quietHoursEnd.String
	}

	if len(preferencesJSON) > 0 {
		if err := json.Unmarshal(preferencesJSON, &prefs.Preferences); err != nil {
			return nil, fmt.Errorf("failed to unmarshal preferences: %w", err)
		}
	} else {
		prefs.Preferences = make(map[string]domain.ChannelPreferences)
	}

	return &prefs, nil
}

func (r *PreferenceRepository) UpsertPreferences(ctx context.Context, userID string, prefs domain.UserNotificationPreferences) (*domain.UserNotificationPreferences, error) {
	preferencesJSON, err := json.Marshal(prefs.Preferences)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal preferences: %w", err)
	}

	query := `
		INSERT INTO user_notification_preferences (user_id, preferences, email_digest, quiet_hours_start, quiet_hours_end, timezone, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			preferences = EXCLUDED.preferences,
			email_digest = EXCLUDED.email_digest,
			quiet_hours_start = EXCLUDED.quiet_hours_start,
			quiet_hours_end = EXCLUDED.quiet_hours_end,
			timezone = EXCLUDED.timezone,
			updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, updated_at
	`

	var id, returnedUserID string
	var updatedAt time.Time
	err = r.db.QueryRow(ctx, query,
		userID, preferencesJSON, prefs.EmailDigest,
		prefs.QuietHoursStart, prefs.QuietHoursEnd, prefs.Timezone, time.Now(),
	).Scan(&id, &returnedUserID, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert preferences: %w", err)
	}

	return &domain.UserNotificationPreferences{
		ID:              id,
		UserID:          returnedUserID,
		Preferences:     prefs.Preferences,
		EmailDigest:     prefs.EmailDigest,
		QuietHoursStart: prefs.QuietHoursStart,
		QuietHoursEnd:   prefs.QuietHoursEnd,
		Timezone:        prefs.Timezone,
		UpdatedAt:       updatedAt,
	}, nil
}
