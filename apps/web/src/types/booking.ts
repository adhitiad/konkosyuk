/**
 * Tipe-tipe booking dan pemesanan.
 */

export type BookingType = "instant" | "request";

export type BookingStatus =
  | "pending"
  | "pending_dp"
  | "partial_paid"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired"
  | "refunded";

export type BookingSortField = "createdAt" | "startDate" | "endDate" | "totalPrice";

export type BookingSortOrder = "asc" | "desc";

export interface OwnerBooking {
  id: string;
  propertyId: string;
  unitId: string;
  unitName: string;
  tenantId: string;
  tenantName: string;
  tenantImage: string | null;
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  dpAmount: number;
  remainingAmount: number;
  dpPaid: boolean;
  isFullyPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingPayment {
  bookingId: string;
  dpAmount: number;
  remainingAmount: number;
  totalPrice: number;
  dpPaid: boolean;
  isFullyPaid: boolean;
}
