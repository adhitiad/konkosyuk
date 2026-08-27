package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	NotificationsSentTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "notifications_sent_total",
			Help: "Total number of notifications sent per channel",
		},
		[]string{"channel"},
	)
	NotificationSendDurationSeconds = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "notification_send_duration_seconds",
			Help:    "Duration of notification send operations in seconds",
			Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5},
		},
		[]string{"channel"},
	)
	NotificationFailuresTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "notification_failures_total",
			Help: "Total number of failed notification sends per channel",
		},
		[]string{"channel"},
	)
)
