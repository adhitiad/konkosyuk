package push

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"notif/internal/domain"
)

type PushSender struct {
	vapidPrivateKey string
	vapidPublicKey  string
	vapidSubject    string
	enabled         bool
}

func NewPushSender(privateKey, publicKey, subject string) *PushSender {
	if privateKey == "" || publicKey == "" {
		return nil
	}
	return &PushSender{
		vapidPrivateKey: privateKey,
		vapidPublicKey:  publicKey,
		vapidSubject:    subject,
		enabled:         true,
	}
}

func (s *PushSender) SendNotification(userID, title, message string, subscriptions []domain.PushSubscription) error {
	if s == nil || !s.enabled || len(subscriptions) == 0 {
		return nil
	}

	payload := map[string]string{
		"title":   title,
		"message": message,
		"icon":    "/icon-192.png",
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	for _, sub := range subscriptions {
		if err := s.sendToSubscription(sub, payloadJSON); err != nil {
			if isExpiredSubscription(err) {
				// TODO: Delete expired subscription from DB
				continue
			}
			return err
		}
	}

	return nil
}

func (s *PushSender) sendToSubscription(sub domain.PushSubscription, payload []byte) error {
	req, err := http.NewRequest("POST", sub.Endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("TTL", "86400")
	req.Header.Set("Urgency", "normal")

	// VAPID auth header
	token, err := s.generateVAPIDToken(sub.Endpoint)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusGone {
		return fmt.Errorf("subscription expired (410)")
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("push notification failed with status %d", resp.StatusCode)
	}

	return nil
}

func (s *PushSender) generateVAPIDToken(endpoint string) (string, error) {
	// Simplified VAPID token generation
	// In production, use proper JWT signing with the VAPID private key
	claims := fmt.Sprintf(`{"aud":"%s","exp":%d,"sub":"%s"}`,
		extractOrigin(endpoint),
		time.Now().Add(15*time.Minute).Unix(),
		s.vapidSubject,
	)

	return "vapid t=" + base64.RawURLEncoding.EncodeToString([]byte(claims)), nil
}

func extractOrigin(endpoint string) string {
	// Simple origin extraction
	idx := strings.Index(endpoint, "://")
	if idx == -1 {
		return endpoint
	}
	pathIdx := strings.Index(endpoint[idx+3:], "/")
	if pathIdx == -1 {
		return endpoint
	}
	return endpoint[:idx+3+pathIdx]
}

func isExpiredSubscription(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "410") || strings.Contains(err.Error(), "expired")
}
