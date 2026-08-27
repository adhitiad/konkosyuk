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

type NotificationRepository struct {
	db     *pgxpool.Pool
	crypto *crypto.Crypto
}

func NewNotificationRepository(db *pgxpool.Pool, crypto *crypto.Crypto) *NotificationRepository {
	return &NotificationRepository{db: db, crypto: crypto}
}

func (r *NotificationRepository) CreateNotification(ctx context.Context, n domain.Notification) (*domain.Notification, error) {
	query := `
		INSERT INTO notifications (user_id, title, message, type, reference_id, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	var id string
	var createdAt time.Time
	err := r.db.QueryRow(ctx, query,
		n.UserID, n.Title, n.Message, n.Type, n.ReferenceID, n.IsRead, n.CreatedAt,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	return &domain.Notification{
		ID:          id,
		UserID:      n.UserID,
		Title:       n.Title,
		Message:     n.Message,
		Type:        n.Type,
		ReferenceID: n.ReferenceID,
		IsRead:      n.IsRead,
		CreatedAt:   createdAt,
	}, nil
}

func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get unread count: %w", err)
	}
	return count, nil
}

func (r *NotificationRepository) MarkAsRead(ctx context.Context, notificationID, userID string) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`
	result, err := r.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}
	if result.RowsAffected() == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *NotificationRepository) GetPushSubscriptions(ctx context.Context, userID string) ([]domain.PushSubscription, error) {
	query := `SELECT id, user_id, endpoint, p256dh, auth, created_at FROM push_subscriptions WHERE user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get push subscriptions: %w", err)
	}
	defer rows.Close()

	var subscriptions []domain.PushSubscription
	for rows.Next() {
		var s domain.PushSubscription
		err := rows.Scan(&s.ID, &s.UserID, &s.Endpoint, &s.P256DH, &s.Auth, &s.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan push subscription: %w", err)
		}
		subscriptions = append(subscriptions, s)
	}

	return subscriptions, nil
}

func (r *NotificationRepository) UpsertPushSubscription(ctx context.Context, s domain.PushSubscription) error {
	query := `
		INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
	`
	_, err := r.db.Exec(ctx, query, s.UserID, s.Endpoint, s.P256DH, s.Auth, s.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to upsert push subscription: %w", err)
	}
	return nil
}

func (r *NotificationRepository) DeletePushSubscription(ctx context.Context, subscriptionID string) error {
	query := `DELETE FROM push_subscriptions WHERE id = $1`
	_, err := r.db.Exec(ctx, query, subscriptionID)
	if err != nil {
		return fmt.Errorf("failed to delete push subscription: %w", err)
	}
	return nil
}
