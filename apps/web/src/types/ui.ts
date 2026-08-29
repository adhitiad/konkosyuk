/**
 * Tipe-tipe UI: komponen, props, dan utilitas tampilan.
 */

export type Currency = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

export interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  convertCurrency: (value: number, from: Currency, to: Currency) => number;
}

export interface FilterChips {
  label: string;
  value: string;
  onRemove: () => void;
}

export type KycStep = "personal_info" | "document_upload" | "face_scan" | "review";

export interface KycStepInfo {
  step: KycStep;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string | null;
  location: string;
  price: string | null;
  type: string;
  advertiserName: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string;
  unread: boolean;
  category: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  adminId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ChannelComparisonData {
  channel: string;
  bookings: number;
  revenue: number;
  conversionRate: number;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface WithKycVerifiedOptions {
  redirectTo?: string;
  showKycPrompt?: boolean;
}

export type PaymentStatusType = "pending" | "paid" | "failed" | "expired";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  isActive: boolean;
}

export interface RoomFacilityOption {
  value: string;
  label: string;
  icon: string;
  selected: boolean;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface BookingCalendarDay {
  date: string;
  status: "available" | "booked" | "maintenance" | "blocked";
  price?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  senderName?: string;
  senderImage?: string;
}

export interface ChatRoom {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  createdAt: Date;
  unreadCount?: number;
}

export type TypingUser = {
  clientId: string;
  timestamp: number;
};

export interface UseChatOptions {
  roomId: string | null;
  currentUserId: string;
  onMessageReceived?: (message: ChatMessage) => void;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  connectionStatus: string;
  isTyping: boolean;
  typingUsers: TypingUser[];
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithAttachment: (content: string, file: File) => Promise<void>;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface UsePaymentPollingOptions {
  invoiceNumber: string | null | undefined;
  onSuccess?: (payment: Record<string, unknown>) => void;
  intervalMs?: number;
  maxAttempts?: number;
}

export interface UsePaymentPollingResult {
  payment: Record<string, unknown> | null;
  isLoading: boolean;
  isSuccess: boolean;
  isTimeout: boolean;
  attempt: number;
  error: string | null;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  enabled: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface OccupancyResponse {
  overallOccupancy: number;
  byProperty: Array<{
    propertyId: string;
    propertyName: string;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    avgDailyRate: number;
  }>;
  dailyData: Array<{
    date: string;
    occupied: number;
    total: number;
    rate: number;
  }>;
}

export type RevenuePeriod = "month" | "quarter" | "year";

export interface RevenueResponse {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  comparedToPreviousPeriod: {
    revenueChange: number;
    transactionChange: number;
  };
  monthlyData: Array<{
    label: string;
    revenue: number;
    transactions: number;
  }>;
  topProperties: Array<{
    propertyId: string;
    propertyName: string;
    revenue: number;
    transactions: number;
    occupancyRate: number;
  }>;
}
