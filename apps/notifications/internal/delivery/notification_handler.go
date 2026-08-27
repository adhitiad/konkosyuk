package delivery

import (
	"context"
	"time"

	pb "notif/proto/konkosyuk/v1"
	"notif/internal/domain"
	"notif/internal/service"
)

type NotificationHandler struct {
	pb.UnimplementedNotificationServiceServer
	service *service.NotificationService
}

func NewNotificationHandler(service *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) Dispatch(ctx context.Context, req *pb.NotificationEvent) (*pb.DispatchResponse, error) {
	event := domain.NotificationEvent{
		UserID:       req.UserId,
		Type:         req.Type,
		Category:     domain.NotificationCategoryFromProto(req.Category),
		Priority:     domain.NotificationPriorityFromProto(req.Priority),
		Title:        req.Title,
		Message:      req.Message,
		ActionURL:    req.ActionUrl,
		ActionLabel:  req.ActionLabel,
		ReferenceID:  req.ReferenceId,
		ReferenceType: req.ReferenceType,
		Metadata:     req.Metadata,
	}

	result := h.service.Dispatch(ctx, event)

	channelResults := make(map[string]bool)
	for k, v := range result.ChannelResults {
		channelResults[k] = v
	}

	return &pb.DispatchResponse{
		Success:       result.Success,
		ChannelResults: channelResults,
		Error:         result.Error,
	}, nil
}

func (h *NotificationHandler) DispatchBatch(req *pb.DispatchBatchRequest, stream pb.NotificationService_DispatchBatchServer) error {
	events := make([]domain.NotificationEvent, len(req.Events))
	for i, e := range req.Events {
		events[i] = domain.NotificationEvent{
			UserID:       e.UserId,
			Type:         e.Type,
			Category:     domain.NotificationCategoryFromProto(e.Category),
			Priority:     domain.NotificationPriorityFromProto(e.Priority),
			Title:        e.Title,
			Message:      e.Message,
			ActionURL:    e.ActionUrl,
			ActionLabel:  e.ActionLabel,
			ReferenceID:  e.ReferenceId,
			ReferenceType: e.ReferenceType,
			Metadata:     e.Metadata,
		}
	}

	results := h.service.DispatchBatch(stream.Context(), events)
	for _, result := range results {
		channelResults := make(map[string]bool)
		for k, v := range result.ChannelResults {
			channelResults[k] = v
		}
		if err := stream.Send(&pb.DispatchResponse{
			Success:       result.Success,
			ChannelResults: channelResults,
			Error:         result.Error,
		}); err != nil {
			return err
		}
	}

	return nil
}

func (h *NotificationHandler) GetUnreadCount(ctx context.Context, req *pb.GetUnreadCountRequest) (*pb.GetUnreadCountResponse, error) {
	count, err := h.service.GetUnreadCount(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	return &pb.GetUnreadCountResponse{Count: count}, nil
}

func (h *NotificationHandler) MarkRead(ctx context.Context, req *pb.MarkReadRequest) (*pb.MarkReadResponse, error) {
	err := h.service.MarkRead(ctx, req.NotificationId, req.UserId)
	if err != nil {
		return &pb.MarkReadResponse{Success: false}, err
	}
	return &pb.MarkReadResponse{Success: true}, nil
}

func (h *NotificationHandler) SubscribePush(ctx context.Context, req *pb.SubscribePushRequest) (*pb.SubscribePushResponse, error) {
	err := h.service.SubscribePush(ctx, req.UserId, req.Endpoint, req.P256Dh, req.Auth)
	if err != nil {
		return &pb.SubscribePushResponse{Success: false}, err
	}
	return &pb.SubscribePushResponse{Success: true}, nil
}

func (h *NotificationHandler) GetSettings(ctx context.Context, req *pb.GetSettingsRequest) (*pb.GetSettingsResponse, error) {
	settings, err := h.service.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	return &pb.GetSettingsResponse{
		Settings: &pb.NotificationSettings{
			Id:                            settings.ID,
			ResendApiKey:                  settings.ResendAPIKey,
			ResendFromEmail:               settings.ResendFromEmail,
			MetaAccessToken:               settings.MetaAccessToken,
			MetaPhoneNumberId:             settings.MetaPhoneNumberID,
			MetaMaintenanceCreatedTemplate: settings.MetaMaintenanceCreatedTemplate,
			MetaMaintenanceUpdatedTemplate: settings.MetaMaintenanceUpdatedTemplate,
			CreatedAt:                    settings.CreatedAt.Format(time.RFC3339),
			UpdatedAt:                    settings.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *NotificationHandler) UpdateSettings(ctx context.Context, req *pb.UpdateNotificationSettingsRequest) (*pb.UpdateNotificationSettingsResponse, error) {
	settings := domain.NotificationSettings{
		ID:                            req.Settings.Id,
		ResendAPIKey:                  req.Settings.ResendApiKey,
		ResendFromEmail:               req.Settings.ResendFromEmail,
		MetaAccessToken:               req.Settings.MetaAccessToken,
		MetaPhoneNumberID:             req.Settings.MetaPhoneNumberId,
		MetaMaintenanceCreatedTemplate: req.Settings.MetaMaintenanceCreatedTemplate,
		MetaMaintenanceUpdatedTemplate: req.Settings.MetaMaintenanceUpdatedTemplate,
	}

	updated, err := h.service.UpdateSettings(ctx, settings)
	if err != nil {
		return nil, err
	}

	return &pb.UpdateNotificationSettingsResponse{
		Settings: &pb.NotificationSettings{
			Id:                            updated.ID,
			ResendApiKey:                  updated.ResendAPIKey,
			ResendFromEmail:               updated.ResendFromEmail,
			MetaAccessToken:               updated.MetaAccessToken,
			MetaPhoneNumberId:             updated.MetaPhoneNumberID,
			MetaMaintenanceCreatedTemplate: updated.MetaMaintenanceCreatedTemplate,
			MetaMaintenanceUpdatedTemplate: updated.MetaMaintenanceUpdatedTemplate,
			CreatedAt:                    updated.CreatedAt.Format(time.RFC3339),
			UpdatedAt:                    updated.UpdatedAt.Format(time.RFC3339),
		},
	}, nil
}

func (h *NotificationHandler) GetPreferences(ctx context.Context, req *pb.GetPreferencesRequest) (*pb.GetPreferencesResponse, error) {
	prefs, err := h.service.GetPreferences(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	pbPrefs := &pb.UserNotificationPreferences{
		Id:       prefs.ID,
		UserId:   prefs.UserID,
		Timezone: prefs.Timezone,
		UpdatedAt: prefs.UpdatedAt.Format(time.RFC3339),
	}

	if prefs.Preferences != nil {
		pbPrefs.Preferences = make(map[string]*pb.ChannelPreferences)
		for k, v := range prefs.Preferences {
			pbPrefs.Preferences[k] = &pb.ChannelPreferences{
				InApp: v.InApp,
				Email: v.Email,
				Push:  v.Push,
			}
		}
	}

	if prefs.EmailDigest != "" {
		pbPrefs.EmailDigest = domain.EmailDigestToProto(prefs.EmailDigest)
	}
	if prefs.QuietHoursStart != nil {
		pbPrefs.QuietHoursStart = *prefs.QuietHoursStart
	}
	if prefs.QuietHoursEnd != nil {
		pbPrefs.QuietHoursEnd = *prefs.QuietHoursEnd
	}

	return &pb.GetPreferencesResponse{Preferences: pbPrefs}, nil
}

func (h *NotificationHandler) UpdatePreferences(ctx context.Context, req *pb.UpdatePreferencesRequest) (*pb.UpdatePreferencesResponse, error) {
	prefs := domain.UserNotificationPreferences{
		UserID:          req.UserId,
		EmailDigest:     domain.EmailDigestFromProto(req.EmailDigest),
		QuietHoursStart: stringPtr(req.QuietHoursStart),
		QuietHoursEnd:   stringPtr(req.QuietHoursEnd),
		Timezone:        req.Timezone,
	}

	if req.Preferences != nil {
		prefs.Preferences = make(map[string]domain.ChannelPreferences)
		for k, v := range req.Preferences {
			prefs.Preferences[k] = domain.ChannelPreferences{
				InApp: v.InApp,
				Email: v.Email,
				Push:  v.Push,
			}
		}
	}

	updated, err := h.service.UpdatePreferences(ctx, req.UserId, prefs)
	if err != nil {
		return nil, err
	}

	pbPrefs := &pb.UserNotificationPreferences{
		Id:       updated.ID,
		UserId:   updated.UserID,
		Timezone: updated.Timezone,
		UpdatedAt: updated.UpdatedAt.Format(time.RFC3339),
	}

	if updated.Preferences != nil {
		pbPrefs.Preferences = make(map[string]*pb.ChannelPreferences)
		for k, v := range updated.Preferences {
			pbPrefs.Preferences[k] = &pb.ChannelPreferences{
				InApp: v.InApp,
				Email: v.Email,
				Push:  v.Push,
			}
		}
	}

	if updated.EmailDigest != "" {
		pbPrefs.EmailDigest = domain.EmailDigestToProto(updated.EmailDigest)
	}
	if updated.QuietHoursStart != nil {
		pbPrefs.QuietHoursStart = *updated.QuietHoursStart
	}
	if updated.QuietHoursEnd != nil {
		pbPrefs.QuietHoursEnd = *updated.QuietHoursEnd
	}

	return &pb.UpdatePreferencesResponse{Preferences: pbPrefs}, nil
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
