/**
 * Tipe-tipe infrastruktur: Redis, rate limiting, cache, pool, dan layanan eksternal.
 */

import type { ChannelStatus } from "@/types/analytics";

export type RedisProvider = "upstash" | "memory";

export type RedisValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface RedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  incrby(key: string, increment: number, ttlSeconds?: number): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  push(key: string, value: RedisValue, ttlSeconds?: number): Promise<void>;
  range<T = unknown>(key: string, start: number, stop: number): Promise<T[]>;
  ping(): Promise<string>;
}

export interface RedisConnectionOptions {
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: string;
}

export interface RateLimitDeviceInput {
  deviceId?: string;
  deviceName?: string;
  clientIp?: string;
}

export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
  condition?: boolean;
}

export interface PoolOptions<T> {
  create: () => T;
  reset: (obj: T) => void;
  initialSize?: number;
  maxSize?: number;
}

export interface PooledMetric {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  lastLatencyMs: number;
  lastErrorAt?: string;
  lastError?: string;
}

export interface PooledRateLimitResult {
  success: boolean;
  remaining: number;
  resetAtMs: number;
}

export interface PooledCookieMap {
  [key: string]: string;
}

export type AblyClient = ReturnType<typeof import("@/lib/ably/client").createAblyClient>;

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
}

export interface MetricSnapshot {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  lastLatencyMs: number;
  lastErrorAt?: string;
  lastError?: string;
  averageLatencyMs: number;
  errorRate: number;
}

export interface ChannelStatusResult {
  ok: boolean;
  provider: ChannelStatus;
}

export interface FraudCheckResult {
  isBlocked: boolean;
  reason?: string;
  requiresManualReview: boolean;
}

export type ExperimentStatus = "draft" | "running" | "completed";

export interface ExperimentVariant {
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  name: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  metrics: Array<{ name: string; primary?: boolean }>;
  startDate?: Date;
  endDate?: Date;
}

export interface LeadQualityResult {
  score: number;
  tier: "platinum" | "gold" | "silver" | "bronze";
  breakdown: {
    verification: number;
    reputation: number;
    intent: number;
    fit: number;
  };
}

export interface UserInterestVector {
  typeWeights: Record<string, number>;
  cityWeights: Record<string, number>;
  priceBucketWeights: Record<number, number>;
  amenitySet: string[];
  areaWeights: Record<string, number>;
}

export type AIProvider = "aion" | "groq" | "static";

export interface AIConfig {
  provider: AIProvider;
  aionApiKey: string;
  aionModel: string;
  aionTemperature: number;
  groqApiKey: string;
  groqModel: string;
  groqTemperature: number;
}

export interface AITemplateRequest {
  notificationType: string;
  channel: "email" | "whatsapp";
  language?: "id" | "en";
  context: Record<string, unknown>;
}

export interface AITemplateResponse {
  subject?: string;
  title?: string;
  body: string;
  provider: AIProvider;
}

export interface UsageTracker {
  minuteTokens: number;
  dailyTokens: number;
  minuteRequests: number;
  dailyRequests: number;
  lastMinuteReset: number;
  lastDayReset: number;
}

export type QStashJobType = "SEND_NOTIFICATION" | "SYNC_ANALYTICS";

export interface QStashJobPayload {
  type: QStashJobType;
  payload: Record<string, unknown>;
}

export interface PublishToQStashOptions {
  url?: string;
  retries?: number;
  retryDelay?: string;
  delay?: string | number;
  label?: string | string[];
}

export type CommissionCategory = "owner" | "tenant";

export interface OffsetPreview {
  availableBalance: number;
  referralIds: string[];
}

export interface StartReferralVerificationInput {
  refereeUserId: string;
  paymentId: string;
  paymentAmount: number;
}

export interface VoucherValidationResult {
  valid: boolean;
  error?: string;
  finalAmount?: number;
  referralId?: string;
}

export type Theme = "light" | "dark" | "aurora";

export interface StructuredAddress {
  displayName: string;
  province: string;
  city: string;
  district: string;
}

export type Language = "en" | "id" | "my" | "th" | "vi" | "ko" | "zh" | "ru";

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

export interface QStashMessage {
  schedule: string;
  qstashScheduleId: string;
}

export interface WebhookDelivery {
  id: string;
  url: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  attempts: number;
}

export type ReferralCommissionTier = 1 | 2 | 3 | 4;

export interface ReferralCommissionInfo {
  tier: ReferralCommissionTier;
  rate: number;
  commissionAmount: number;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  provider: string;
  status: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AblyMessage {
  name: string;
  data: unknown;
  clientId?: string;
  connectionId?: string;
  timestamp?: number;
  id?: string;
}

export type Env = Record<string, string>;

export type UploadResult = {
  url: string;
  provider: string;
};

export type AuditAction = string;

export type AuditEntityType = string;

export type AuditLogInput = {
  adminId: string;
  action: AuditAction;
  targetType: AuditEntityType;
  targetId: string;
  details?: Record<string, unknown>;
};
