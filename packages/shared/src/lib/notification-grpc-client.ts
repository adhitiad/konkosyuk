import { Client, ChannelCredentials } from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NotificationCategory, NotificationPriority } from "../constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export class NotificationGrpcClient {
  private client: Client;
  private notificationClient: any;
  private notificationService: any;

  constructor(address: string, protoPath?: string) {
    this.client = new Client(address, ChannelCredentials.createInsecure());

    const resolvedProtoPath =
      protoPath ||
      path.join(
        __dirname,
        "../../../../proto/konkosyuk/v1/notification.proto",
      );

    const packageDefinition = protoLoader.loadSync(resolvedProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDefinition = loadPackageDefinition(packageDefinition);
    const konkosyukV1 = (protoDefinition as any).konkosyuk.v1;

    this.notificationService = new konkosyukV1.NotificationService(
      address,
      ChannelCredentials.createInsecure(),
    );
  }

  private getAuthMetadata(token?: string) {
    const metadata: any = {};
    if (token) {
      metadata.authorization = token;
    }
    return metadata;
  }

  async dispatch(
    event: NotificationEvent,
    authToken?: string,
  ): Promise<DispatchResponse> {
    return new Promise((resolve, reject) => {
      this.notificationService.Dispatch(
        {
          ...event,
          category: event.category.toUpperCase(),
          priority: event.priority?.toUpperCase() || "NORMAL",
        },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: response.success,
            channelResults: response.channel_results || {},
            error: response.error || "",
          });
        },
      );
    });
  }

  async dispatchBatch(
    events: NotificationEvent[],
    authToken?: string,
  ): Promise<{ next: () => Promise<{ value: DispatchResponse; done: boolean }> }> {
    const stream = this.notificationService.DispatchBatch(
      {
        events: events.map((e) => ({
          ...e,
          category: e.category.toUpperCase(),
          priority: e.priority?.toUpperCase() || "NORMAL",
        })),
      },
      this.getAuthMetadata(authToken),
    );

    const responses: DispatchResponse[] = [];
    stream.on("data", (response: any) => {
      responses.push({
        success: response.success,
        channelResults: response.channel_results || {},
        error: response.error || "",
      });
    });

    return {
      next: async () => {
        if (responses.length > 0) {
          const value = responses[0];
          responses.shift();
          return { value, done: false };
        }
        return { value: undefined as any, done: true };
      },
    };
  }

  async getUnreadCount(userId: string, authToken?: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.notificationService.GetUnreadCount(
        { user_id: userId },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.count || 0);
        },
      );
    });
  }

  async markRead(
    notificationId: string,
    userId: string,
    authToken?: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.notificationService.MarkRead(
        { notification_id: notificationId, user_id: userId },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.success || false);
        },
      );
    });
  }

  async subscribePush(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    authToken?: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.notificationService.SubscribePush(
        { user_id: userId, endpoint, p256dh, auth },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.success || false);
        },
      );
    });
  }

  async getSettings(serviceSecret?: string): Promise<NotificationSettings> {
    return new Promise((resolve, reject) => {
      this.notificationService.GetSettings(
        {},
        this.getServiceMetadata(serviceSecret),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          const settings = response.settings || {};
          resolve({
            id: settings.id || "",
            resendApiKey: settings.resend_api_key || null,
            resendFromEmail: settings.resend_from_email || null,
            metaAccessToken: settings.meta_access_token || null,
            metaPhoneNumberId: settings.meta_phone_number_id || null,
            metaMaintenanceCreatedTemplate:
              settings.meta_maintenance_created_template || null,
            metaMaintenanceUpdatedTemplate:
              settings.meta_maintenance_updated_template || null,
            createdAt: settings.created_at || "",
            updatedAt: settings.updated_at || "",
          });
        },
      );
    });
  }

  async updateSettings(
    settings: Partial<NotificationSettings>,
    serviceSecret?: string,
  ): Promise<NotificationSettings> {
    return new Promise((resolve, reject) => {
      this.notificationService.UpdateSettings(
        {
          settings: {
            id: settings.id || "",
            resend_api_key: settings.resendApiKey || "",
            resend_from_email: settings.resendFromEmail || "",
            meta_access_token: settings.metaAccessToken || "",
            meta_phone_number_id: settings.metaPhoneNumberId || "",
            meta_maintenance_created_template:
              settings.metaMaintenanceCreatedTemplate || "",
            meta_maintenance_updated_template:
              settings.metaMaintenanceUpdatedTemplate || "",
          },
        },
        this.getServiceMetadata(serviceSecret),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          const s = response.settings || {};
          resolve({
            id: s.id || "",
            resendApiKey: s.resend_api_key || null,
            resendFromEmail: s.resend_from_email || null,
            metaAccessToken: s.meta_access_token || null,
            metaPhoneNumberId: s.meta_phone_number_id || null,
            metaMaintenanceCreatedTemplate:
              s.meta_maintenance_created_template || null,
            metaMaintenanceUpdatedTemplate:
              s.meta_maintenance_updated_template || null,
            createdAt: s.created_at || "",
            updatedAt: s.updated_at || "",
          });
        },
      );
    });
  }

  async getPreferences(
    userId: string,
    authToken?: string,
  ): Promise<UserPreferences> {
    return new Promise((resolve, reject) => {
      this.notificationService.GetPreferences(
        { user_id: userId },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          const prefs = response.preferences || {};
          resolve({
            preferences: prefs.preferences
              ? Object.fromEntries(
                  Object.entries(prefs.preferences).map(([k, v]: [string, any]) => [
                    k,
                    {
                      inApp: v.in_app,
                      email: v.email,
                      push: v.push,
                    },
                  ]),
                )
              : {},
            emailDigest: (prefs.email_digest || "immediate").toLowerCase(),
            quietHoursStart: prefs.quiet_hours_start || null,
            quietHoursEnd: prefs.quiet_hours_end || null,
            timezone: prefs.timezone || "Asia/Jakarta",
          });
        },
      );
    });
  }

  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>,
    authToken?: string,
  ): Promise<UserPreferences> {
    return new Promise((resolve, reject) => {
      const preferences: any = {};
      if (updates.preferences) {
        for (const [k, v] of Object.entries(updates.preferences)) {
          preferences[k] = {
            in_app: v.inApp,
            email: v.email,
            push: v.push,
          };
        }
      }

      this.notificationService.UpdatePreferences(
        {
          user_id: userId,
          preferences,
          email_digest: (updates.emailDigest || "immediate").toUpperCase(),
          quiet_hours_start: updates.quietHoursStart || "",
          quiet_hours_end: updates.quietHoursEnd || "",
          timezone: updates.timezone || "Asia/Jakarta",
        },
        this.getAuthMetadata(authToken),
        (err: any, response: any) => {
          if (err) {
            reject(err);
            return;
          }
          const prefs = response.preferences || {};
          resolve({
            preferences: prefs.preferences
              ? Object.fromEntries(
                  Object.entries(prefs.preferences).map(([k, v]: [string, any]) => [
                    k,
                    {
                      inApp: v.in_app,
                      email: v.email,
                      push: v.push,
                    },
                  ]),
                )
              : {},
            emailDigest: (prefs.email_digest || "immediate").toLowerCase(),
            quietHoursStart: prefs.quiet_hours_start || null,
            quietHoursEnd: prefs.quiet_hours_end || null,
            timezone: prefs.timezone || "Asia/Jakarta",
          });
        },
      );
    });
  }

  private getServiceMetadata(secret?: string) {
    const metadata: any = {};
    if (secret) {
      metadata["x-service-secret"] = secret;
    }
    return metadata;
  }

  close(): void {
    this.client.close();
  }
}
