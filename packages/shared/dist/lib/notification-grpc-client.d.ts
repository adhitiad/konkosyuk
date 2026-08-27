import { NotificationCategory, NotificationPriority } from "../constants";
export interface NotificationEvent {
    userId: string;
    type: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, string>;
}
export interface ChannelPreferences {
    inApp: boolean;
    email: boolean;
    push: boolean;
}
export interface UserPreferences {
    preferences: Record<string, ChannelPreferences>;
    emailDigest: "immediate" | "daily" | "weekly" | "never";
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone: string;
}
export interface NotificationSettings {
    id: string;
    resendApiKey: string | null;
    resendFromEmail: string | null;
    metaAccessToken: string | null;
    metaPhoneNumberId: string | null;
    metaMaintenanceCreatedTemplate: string | null;
    metaMaintenanceUpdatedTemplate: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface DispatchResponse {
    success: boolean;
    channelResults: Record<string, boolean>;
    error: string;
}
export declare class NotificationGrpcClient {
    private client;
    private notificationClient;
    private notificationService;
    constructor(address: string, protoPath?: string);
    private getAuthMetadata;
    dispatch(event: NotificationEvent, authToken?: string): Promise<DispatchResponse>;
    dispatchBatch(events: NotificationEvent[], authToken?: string): Promise<{
        next: () => Promise<{
            value: DispatchResponse;
            done: boolean;
        }>;
    }>;
    getUnreadCount(userId: string, authToken?: string): Promise<number>;
    markRead(notificationId: string, userId: string, authToken?: string): Promise<boolean>;
    subscribePush(userId: string, endpoint: string, p256dh: string, auth: string, authToken?: string): Promise<boolean>;
    getSettings(serviceSecret?: string): Promise<NotificationSettings>;
    updateSettings(settings: Partial<NotificationSettings>, serviceSecret?: string): Promise<NotificationSettings>;
    getPreferences(userId: string, authToken?: string): Promise<UserPreferences>;
    updatePreferences(userId: string, updates: Partial<UserPreferences>, authToken?: string): Promise<UserPreferences>;
    private getServiceMetadata;
    close(): void;
}
//# sourceMappingURL=notification-grpc-client.d.ts.map