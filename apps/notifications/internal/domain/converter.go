package domain

import pb "notif/proto/konkosyuk/v1"

func NotificationCategoryFromProto(cat pb.NotificationCategory) NotificationCategory {
	switch cat {
	case pb.NotificationCategory_BOOKING:
		return CategoryBooking
	case pb.NotificationCategory_PAYMENT:
		return CategoryPayment
	case pb.NotificationCategory_MAINTENANCE:
		return CategoryMaintenance
	case pb.NotificationCategory_INSPECTION:
		return CategoryInspection
	case pb.NotificationCategory_CHAT:
		return CategoryChat
	case pb.NotificationCategory_REVIEW:
		return CategoryReview
	case pb.NotificationCategory_SYSTEM:
		return CategorySystem
	default:
		return CategorySystem
	}
}

func NotificationCategoryToProto(cat NotificationCategory) pb.NotificationCategory {
	switch cat {
	case CategoryBooking:
		return pb.NotificationCategory_BOOKING
	case CategoryPayment:
		return pb.NotificationCategory_PAYMENT
	case CategoryMaintenance:
		return pb.NotificationCategory_MAINTENANCE
	case CategoryInspection:
		return pb.NotificationCategory_INSPECTION
	case CategoryChat:
		return pb.NotificationCategory_CHAT
	case CategoryReview:
		return pb.NotificationCategory_REVIEW
	case CategorySystem:
		return pb.NotificationCategory_SYSTEM
	default:
		return pb.NotificationCategory_SYSTEM
	}
}

func NotificationPriorityFromProto(prio pb.NotificationPriority) NotificationPriority {
	switch prio {
	case pb.NotificationPriority_LOW:
		return PriorityLow
	case pb.NotificationPriority_NORMAL:
		return PriorityNormal
	case pb.NotificationPriority_HIGH:
		return PriorityHigh
	case pb.NotificationPriority_URGENT:
		return PriorityUrgent
	default:
		return PriorityNormal
	}
}

func NotificationPriorityToProto(prio NotificationPriority) pb.NotificationPriority {
	switch prio {
	case PriorityLow:
		return pb.NotificationPriority_LOW
	case PriorityNormal:
		return pb.NotificationPriority_NORMAL
	case PriorityHigh:
		return pb.NotificationPriority_HIGH
	case PriorityUrgent:
		return pb.NotificationPriority_URGENT
	default:
		return pb.NotificationPriority_NORMAL
	}
}

func EmailDigestFromProto(digest pb.EmailDigest) string {
	switch digest {
	case pb.EmailDigest_IMMEDIATE:
		return "immediate"
	case pb.EmailDigest_DAILY:
		return "daily"
	case pb.EmailDigest_WEEKLY:
		return "weekly"
	case pb.EmailDigest_NEVER:
		return "never"
	default:
		return "immediate"
	}
}

func EmailDigestToProto(digest string) pb.EmailDigest {
	switch digest {
	case "immediate":
		return pb.EmailDigest_IMMEDIATE
	case "daily":
		return pb.EmailDigest_DAILY
	case "weekly":
		return pb.EmailDigest_WEEKLY
	case "never":
		return pb.EmailDigest_NEVER
	default:
		return pb.EmailDigest_IMMEDIATE
	}
}
