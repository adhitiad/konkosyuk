import { z } from "zod";
import {
  REFERRAL_CATEGORIES,
  REFERRAL_STATUSES,
  LOYALTY_TRANSACTION_TYPES,
  GROUP_BOOKING_STATUSES,
} from "../constants/enums";

export const createReferralSchema = z.object({
  refereeEmail: z.string().email("Format email tidak valid"),
  refereeName: z.string().min(1, "Nama harus diisi"),
  category: z.enum(REFERRAL_CATEGORIES).default("tenant"),
  propertyId: z.string().uuid().optional(),
  message: z.string().optional(),
});

export const referralQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.enum(REFERRAL_CATEGORIES).optional(),
  status: z.enum(REFERRAL_STATUSES).optional(),
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

export const loyaltyTransactionSchema = z.object({
  userId: z.string().uuid(),
  amount: z.coerce.number().int("Jumlah poin harus bilangan bulat"),
  type: z.enum(LOYALTY_TRANSACTION_TYPES),
  description: z.string().min(1),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const loyaltyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(LOYALTY_TRANSACTION_TYPES).optional(),
});

export const createGroupBookingSchema = z.object({
  name: z.string().min(1, "Nama group harus diisi").max(255),
  description: z.string().optional(),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxMembers: z.coerce.number().int().positive().max(50),
  memberIds: z.array(z.string().uuid()).min(1, "Minimal 1 anggota"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateGroupBookingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(GROUP_BOOKING_STATUSES).optional(),
  maxMembers: z.coerce.number().int().positive().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const groupBookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(GROUP_BOOKING_STATUSES).optional(),
  propertyId: z.string().uuid().optional(),
});

export const referralActionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["convert_voucher", "apply_offset"]),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type ReferralQuery = z.infer<typeof referralQuerySchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
export type LoyaltyTransactionInput = z.infer<typeof loyaltyTransactionSchema>;
export type LoyaltyQuery = z.infer<typeof loyaltyQuerySchema>;
export type CreateGroupBookingInput = z.infer<typeof createGroupBookingSchema>;
export type UpdateGroupBookingInput = z.infer<typeof updateGroupBookingSchema>;
export type GroupBookingQuery = z.infer<typeof groupBookingQuerySchema>;
