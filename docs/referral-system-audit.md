# Referral & Loyalty System Audit Report

**Date:** 2026-08-24  
**Auditor:** Kilo (Senior Software Architect)  
**Scope:** Full codebase audit for referral, loyalty, and group booking features

---

## Executive Summary

**YES — A referral and loyalty system IS implemented**, but it is **incomplete**. The system has a full database schema, API routes, UI pages, and notification infrastructure. However, **critical business logic is missing**: commission calculations, automatic verification workflows, payout scheduling, and loyalty point accrual are not implemented.

### Implementation Status

| Component | Status | Completeness |
|-----------|--------|--------------|
| Database Schema | ✅ Implemented | 100% |
| API Routes | ✅ Implemented | ~60% |
| UI Pages | ✅ Implemented | ~70% |
| Notification Service | ✅ Implemented | 100% |
| Business Logic | ❌ Missing | 0% |
| Tests | ❌ Missing | 0% |
| Documentation | ❌ Missing | 0% |

---

## Detailed Findings

### 1. Database Schema (Fully Implemented)

The following tables exist in `apps/web/src/db/schema.ts` and migrations:

#### `users` table (referral-related columns)
- `referral_code` (text, unique) — Unique code generated for each user
- `referred_by` (uuid) — References the referrer's user ID
- `loyalty_tier` (text, enum: bronze/silver/gold/platinum) — Default: bronze
- `total_referrals` (integer) — Default: 0

#### `referrals` table
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| referrer_id | uuid | Who invited (FK to users) |
| referee_id | uuid | Who was invited (FK to users, nullable) |
| code | text | Unique referral code |
| status | text | pending/verifying/eligible/failed/completed/cancelled |
| category | text | owner or tenant |
| property_id | uuid | Optional linked property |
| base_amount | numeric | Base commission amount |
| commission_rate | numeric | Tier-based percentage |
| commission_amount | numeric | Calculated commission |
| referee_transaction_id | uuid | Links to payment transaction |
| eligible_at | timestamp | When 5-day no-refund period passes |
| payout_scheduled_at | timestamp | Scheduled payout date |
| voucher_code | text | Generated voucher for owner redemptions |
| offset_applied | boolean | Whether tenant offset was applied |
| tier | integer | Referrer's commission tier (1-4) |
| metadata | jsonb | Stores referee name, message |
| completed_at | timestamp | When commission was paid out |

#### `loyalty_points` table
- Tracks user point balances
- Types: earned, redeemed, expired, bonus
- Points expire (has `expires_at`)

#### `loyalty_transactions` table
- Audit log for all point movements
- References `reference_id` and `reference_type`

#### `rewards` table
- Catalog of redeemable rewards
- `pointsCost`, `value`, `isActive`

#### `reward_redemptions` table
- Tracks reward redemption history
- Status: pending/completed/cancelled

#### `group_bookings` table
- Lead user, property, unit, dates, amounts
- Status: pending/confirmed/cancelled/completed

#### `group_booking_members` table
- Members of a group booking
- Share percentage, share amount, paid amount
- Status: invited/accepted/rejected/paid

### 2. API Routes (Partially Implemented)

#### Referrals API (`/api/referrals`)
- **GET** — List referrals for current user with pagination, filtering by category/status
- **POST** — Create new referral (generates 8-char alphanumeric code)
- **PUT** — Actions: `convert_voucher` (owner) or `apply_offset` (tenant)

**Missing:** No webhook endpoint for payment status changes, no admin endpoints for bulk verification.

#### Loyalty API (`/api/loyalty/transactions`)
- **GET** — List transactions with balance calculation

#### Rewards API (`/api/loyalty/rewards`)
- **GET** — List active rewards
- **POST** (`/redeem`) — Redeem reward (deducts points, creates transaction)

#### Group Bookings API (`/api/group-bookings`)
- **GET** — List group bookings (filtered by role)
- **POST** — Create group booking with member invites
- **GET/PUT/DELETE** — Single group booking operations
- **PUT** (`/members/me`) — Respond to invite (accept/reject)

**Missing:** No automatic booking creation from confirmed group bookings in API layer (this is partially in the API route but may have issues).

### 3. UI Pages (Partially Implemented)

#### `/dashboard/referrals` (`apps/web/src/app/[locale]/(protected)/dashboard/referrals/page.tsx`)
- Displays referral list with status badges
- Tier progress visualization (Tier 1-4)
- Commission statistics (total, eligible, pending)
- Create referral dialog (email, name, category, message)
- Action buttons: "Tukar Voucher" (owner), "Potong Tagihan" (tenant)
- Tabbed interface for owner vs tenant categories

#### `/referrals/terms` (`apps/web/src/app/[locale]/referrals/terms/page.tsx`)
- Comprehensive S&K (Terms & Conditions) page
- Detailed tier tables for owner and tenant
- 5-day no-refund verification rules
- Payout schedule (16th and 30th of month)
- Prohibited activities and sanctions
- Version 2.5, effective August 19, 2026

#### `/dashboard/loyalty` (`apps/web/src/app/[locale]/(protected)/dashboard/loyalty/page.tsx`)
- Points balance display
- Transaction history with type badges (earn/redeem/expire/bonus)
- Rewards catalog with redemption
- Active rewards count

#### `/dashboard/group-bookings` (`apps/web/src/app/[locale]/(protected)/dashboard/group-bookings/page.tsx`)
- Group booking list with status
- Create group booking dialog
- Member management (invite/accept/reject)
- Share percentage display

### 4. Business Rules (From Terms & Code)

#### Referral Tier System

**Owner Tiers (Recurring Commission):**
| Tier | Completed Referrals | Commission Rate |
|------|---------------------|-----------------|
| 1 | 1-100 | 1.00% |
| 2 | 101-372 | 2.00% |
| 3 | 373-846 | 3.67% |
| 4 | ≥847 | 4.82% |

**Tenant Tiers (One-Time Commission):**
| Tier | Completed Referrals | Commission Rate |
|------|---------------------|-----------------|
| 1 | 1-100 | 0.90% |
| 2 | 101-372 | 1.86% |
| 3 | 373-846 | 2.79% |
| 4 | ≥847 | 3.96% |

#### Referral Status Flow
1. **pending** — Referee invited but not yet registered
2. **verifying** — Referee registered, waiting for 5-day no-refund period
3. **eligible** — Passed verification, ready for payout/conversion
4. **completed** — Commission paid out or voucher/offset applied
5. **failed** — Refund/cancellation/dispute occurred
6. **cancelled** — Referral cancelled by referrer or admin

#### Verification Rules
- **5-day no-refund period** after referee completes 100% payment
- Any refund, cancellation, or chargeback during this period = failed
- After 5 days with no issues = eligible

#### Payout Rules
- **Owners:** Can convert eligible balance to discount vouchers (max 50% off service fees)
- **Tenants:** Can apply eligible balance as rent offset (min Rp 10,000)
- Scheduled payouts: 16th and 30th of each month (Feb: 28th/29th only)

#### Loyalty Rules
- Points earned from bookings, referrals, bonuses
- Points can be redeemed for rewards
- Points can expire (has `expires_at`)
- Transaction types: earn, redeem, expire, bonus

#### Group Booking Rules
- Max 50 members per group
- Share percentage = 100% / member_count
- Lead user creates booking, invites members via email
- Members accept/reject invites
- When confirmed, individual bookings are created for each member

### 5. Gaps and Missing Features

#### Critical Missing Business Logic

| Feature | Status | Impact |
|---------|--------|--------|
| Commission calculation on booking completion | ❌ Missing | Referrers never get paid |
| 5-day verification timer/cron | ❌ Missing | Referrals stay in "verifying" forever |
| Automatic status transitions | ❌ Missing | Manual intervention required |
| Loyalty point accrual logic | ❌ Missing | Users never earn points |
| Tier recalculation | ❌ Missing | Tier display works but doesn't affect calculations |
| Payout processing cron | ❌ Missing | "Eligible" referrals never become "completed" |
| Admin referral management | ❌ Missing | No way to resolve disputes |
| Referral code validation on signup | ❌ Missing | `referred_by` never populated |
| Duplicate account detection | ❌ Missing | Fraud prevention not implemented |

#### Missing Tests
- No unit tests for referral/loyalty/group booking logic
- No integration tests for API routes
- No E2E tests for user flows

#### Missing Documentation
- No architecture docs
- No API documentation
- No business logic documentation (this file)

#### Code Quality Issues
1. **Inline schemas in API routes** instead of importing from `@konkosyuk/shared` — violates DRY
2. **No server actions** for referrals/loyalty — only API route handlers
3. **Duplicate schema definitions** — `packages/shared/src/api/referrals-loyalty.ts` defines schemas that are duplicated in API routes
4. **Hardcoded tier thresholds** in UI page instead of shared constants
5. **No error boundary** for referral/loyalty pages

---

## Related Files

### Database & Schema
- `apps/web/src/db/schema.ts` — All table definitions (lines 195-200, 523-579, 2300-2374, 2377-2406)
- `apps/web/drizzle/0020_brief_madelyne_pryor.sql` — Migration creating tables
- `apps/web/drizzle/0021_hesitant_firebird.sql` — Migration adding columns
- `apps/web/drizzle/0028_baseline.sql` — Baseline with all tables

### Shared Contracts
- `packages/shared/src/api/referrals-loyalty.ts` — Zod schemas (NOT imported anywhere)
- `packages/shared/src/constants/enums.ts` — Enums for referral/loyalty/group booking

### API Routes
- `apps/web/src/app/api/referrals/route.ts` — Referral CRUD + actions
- `apps/web/src/app/api/loyalty/transactions/route.ts` — Loyalty transaction history
- `apps/web/src/app/api/loyalty/rewards/route.ts` — Rewards catalog + redemption
- `apps/web/src/app/api/group-bookings/route.ts` — Group booking CRUD
- `apps/web/src/app/api/group-bookings/[id]/route.ts` — Single group booking
- `apps/web/src/app/api/group-bookings/[id]/members/me/route.ts` — Member invite response

### Server Actions
- `apps/web/src/actions/group-bookings.ts` — Server action for group booking creation

### UI Pages
- `apps/web/src/app/[locale]/(protected)/dashboard/referrals/page.tsx` — Referral dashboard
- `apps/web/src/app/[locale]/referrals/terms/page.tsx` — Terms & conditions
- `apps/web/src/app/[locale]/(protected)/dashboard/loyalty/page.tsx` — Loyalty dashboard
- `apps/web/src/app/[locale]/(protected)/dashboard/group-bookings/page.tsx` — Group bookings

### Business Logic
- `apps/web/src/lib/notification-service.ts` — Notification dispatchers (lines 292-406)

### Missing Files (Need to be Created)
- `apps/web/src/actions/referrals.ts` — Referral server actions
- `apps/web/src/lib/referrals/commission.ts` — Commission calculation logic
- `apps/web/src/lib/referrals/verification.ts` — Verification cron logic
- `apps/web/src/lib/loyalty/accrual.ts` — Loyalty point earning logic
- `apps/web/src/lib/referrals/payout.ts` — Payout processing logic
- `apps/web/src/__tests__/referrals/` — Unit tests
- `apps/web/src/__tests__/loyalty/` — Unit tests

---

## Recommendations

### Immediate (P0)
1. **Implement commission calculation** on booking completion — this is the core value proposition
2. **Implement 5-day verification cron** — without this, referrals never transition from "verifying" to "eligible"
3. **Add referral code validation on user registration** — currently `referred_by` is never populated
4. **Import shared schemas** instead of duplicating them in API routes

### Short-term (P1)
5. **Implement payout scheduling** — monthly cron for 16th and 30th
6. **Add loyalty point accrual** on booking/payment completion
7. **Create admin referral management** UI for dispute resolution
8. **Add duplicate account detection** (KTP, phone, email, bank account)

### Medium-term (P2)
9. **Write comprehensive tests** for all referral/loyalty/group booking logic
10. **Create API documentation** (OpenAPI/Swagger)
11. **Add analytics dashboard** for referral program performance
12. **Implement fraud detection** (suspicious referral patterns)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                          │
│                   (with referral code)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      USERS TABLE                              │
│  referral_code, referred_by, loyalty_tier, total_referrals   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  REFERRALS    │   │  LOYALTY      │   │  GROUP        │
│  TABLE        │   │  POINTS       │   │  BOOKINGS     │
│               │   │  TABLE        │   │  TABLE        │
│  - referrer   │   │               │   │               │
│  - referee    │   │  - user_id    │   │  - lead_user  │
│  - code       │   │  - points     │   │  - property   │
│  - status     │   │  - type       │   │  - unit       │
│  - tier       │   │  - expires    │   │  - members    │
│  - commission │   │               │   │               │
│  - eligible   │   │ TRANSACTIONS  │   │  MEMBERS      │
│  - voucher    │   │ TABLE         │   │  TABLE        │
│  - offset     │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  REFERRAL     │   │  REWARDS      │   │  NOTIFICATIONS│
│  STATUS FLOW  │   │  TABLE        │   │               │
│               │   │               │   │  - Referral   │
│  pending      │   │  - name       │   │    created    │
│  → verifying  │   │  - cost       │   │  - Referral   │
│  → eligible   │   │  - value      │   │    eligible   │
│  → completed  │   │               │   │  - Group      │
│  → failed     │   │ REDEMPTIONS   │   │    invite     │
│  → cancelled  │   │  TABLE        │   │  - Group      │
│               │   │               │   │    updated    │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Referral Commission Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Referrer │     │ Referee  │     │ Payment  │     │  Cron /  │
│ Creates  │────▶│ Registers│────▶│ Completes│────▶│ Webhook  │
│ Referral │     │ & Books  │     │ 100%     │     │ Trigger  │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                         │
                    ┌──────────────────────────────────────┘
                    ▼
            ┌──────────────┐
            │  5-Day       │
            │  No-Refund   │
            │  Timer       │
            └──────┬───────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌──────────┐     ┌──────────┐
    │ Eligible │     │  Failed  │
    │ (No      │     │ (Refund/ │
    │  refund) │     │ Cancel)  │
    └────┬─────┘     └──────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐ ┌──────┐
│Owner │ │Tenant│
│Voucher│ │Offset│
│Convert│ │Apply │
└──────┘ └──────┘
    │         │
    ▼         ▼
┌──────────┐
│ Completed│
│ Commission│
│ Paid Out  │
└──────────┘
```

---

## Conclusion

The KonkosYuk referral and loyalty system has a **solid foundation** — database schema, API routes, UI pages, and notification infrastructure are all in place. However, it is **not production-ready** because the core business logic is missing.

The system currently allows:
- Creating referrals
- Viewing referral history
- Redeeming loyalty rewards
- Managing group bookings

But it **cannot**:
- Calculate or pay commissions
- Verify referrals automatically
- Accrue loyalty points
- Process scheduled payouts

**Estimated effort to complete:** 3-4 weeks of backend development + 1 week of testing.
