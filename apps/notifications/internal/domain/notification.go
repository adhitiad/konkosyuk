package domain

import "time"

type NotificationCategory string

const (
	CategoryBooking     NotificationCategory = "booking"
	CategoryPayment     NotificationCategory = "payment"
	CategoryMaintenance NotificationCategory = "maintenance"
	CategoryInspection  NotificationCategory = "inspection"
	CategoryChat        NotificationCategory = "chat"
	CategoryReview      NotificationCategory = "review"
	CategorySystem      NotificationCategory = "system"
)

type NotificationPriority string

const (
	PriorityLow    NotificationPriority = "low"
	PriorityNormal NotificationPriority = "normal"
	PriorityHigh   NotificationPriority = "high"
	PriorityUrgent NotificationPriority = "urgent"
)

type ChannelPreferences struct {
	InApp bool `json:"inApp"`
	Email bool `json:"email"`
	Push  bool `json:"push"`
}

type UserPreferences struct {
	Preferences      map[string]ChannelPreferences `json:"preferences"`
	EmailDigest      string                        `json:"emailDigest"`
	QuietHoursStart  *string                       `json:"quietHoursStart"`
	QuietHoursEnd    *string                       `json:"quietHoursEnd"`
	Timezone         string                        `json:"timezone"`
}

type NotificationEvent struct {
	UserID       string
	Type         string
	Category     NotificationCategory
	Priority     NotificationPriority
	Title        string
	Message      string
	ActionURL    string
	ActionLabel  string
	ReferenceID  string
	ReferenceType string
	Metadata     map[string]string
}

type Notification struct {
	ID          string
	UserID      string
	Title       string
	Message     string
	Type        string
	ReferenceID string
	IsRead      bool
	CreatedAt   time.Time
}

type PushSubscription struct {
	ID        string
	UserID    string
	Endpoint  string
	P256DH    string
	Auth      string
	CreatedAt time.Time
}

type NotificationSettings struct {
	ID                            string
	ResendAPIKey                  string
	ResendFromEmail               string
	MetaAccessToken               string
	MetaPhoneNumberID             string
	MetaMaintenanceCreatedTemplate string
	MetaMaintenanceUpdatedTemplate string
	CreatedAt                     time.Time
	UpdatedAt                     time.Time
}

type UserNotificationPreferences struct {
	ID              string
	UserID          string
	Preferences     map[string]ChannelPreferences
	EmailDigest     string
	QuietHoursStart *string
	QuietHoursEnd   *string
	Timezone        string
	UpdatedAt       time.Time
}

type DispatchResult struct {
	Success       bool
	ChannelResults map[string]bool
	Error         string
}
