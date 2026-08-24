# Referral & Loyalty System Documentation

## 1. Executive Summary

KonkosYuk implements a **dual-category referral program** (Owner & Tenant) with tiered commissions, a **loyalty points system**, and a **group booking** feature. The system is partially implemented: database, API routes, and UI are complete, but core business logic (commission calculation, verification, payouts, point accrual) is missing.

---

## 2. System Architecture

### 2.1 Database Schema

#### `users` (referral columns)
```sql
referral_code text UNIQUE    -- Unique code for each user
referred_by uuid             -- FK to users.id (who invited this user)
loyalty_tier text DEFAULT 'bronze'  -- bronze/silver/gold/platinum
total_referrals integer DEFAULT 0   -- Count of completed referrals
```

#### `referrals`
```sql
id uuid PRIMARY KEY
referrer_id uuid NOT NULL      -- FK users.id
referee_id uuid                -- FK users.id (nullable until registration)
code text NOT NULL             -- 8-char alphanumeric referral code
status text DEFAULT 'pending'  -- pending/verifying/eligible/failed/completed/cancelled
category text DEFAULT 'tenant' -- owner or tenant
property_id uuid               -- Optional linked property
base_amount numeric(12,2)      -- Base commission amount
commission_rate numeric(5,2)   -- Tier-based percentage
commission_amount numeric(12,2)-- Calculated commission
referee_transaction_id uuid    -- FK to payment transaction
eligible_at timestamp           -- When 5-day no-refund period ends
payout_scheduled_at timestamp   -- Scheduled payout date
voucher_code text               -- Generated voucher (owner redemptions)
offset_applied boolean          -- Whether tenant offset was applied
tier integer DEFAULT 1         -- Referrer's commission tier (1-4)
metadata jsonb DEFAULT '{}'     -- { refereeName, message }
completed_at timestamp          -- When commission was paid out
```

#### `loyalty_points`
```sql
id uuid PRIMARY KEY
user_id uuid NOT NULL           -- FK users.id
points integer DEFAULT 0        -- Current balance
type text                       -- earned/redeemed/expired/bonus
source text                     -- e.g., "booking", "referral"
reference_id text               -- FK to related entity
description text                -- Human-readable description
expires_at timestamp            -- Optional expiration
```

#### `loyalty_transactions`
```sql
id uuid PRIMARY KEY
user_id uuid NOT NULL           -- FK users.id
amount integer NOT NULL         -- Positive or negative
type text NOT NULL              -- earn/redeem/expire/bonus
description text NOT NULL
reference_id uuid               -- FK to related entity
reference_type text             -- e.g., "reward_redemption"
expires_at timestamp            -- When points expire
```

#### `rewards`
```sql
id uuid PRIMARY KEY
name text NOT NULL
description text
points_cost integer NOT NULL    -- Points required to redeem
value numeric(12,2) NOT NULL    -- Monetary value of reward
is_active boolean DEFAULT true
```

#### `reward_redemptions`
```sql
id uuid PRIMARY KEY
user_id uuid NOT NULL           -- FK users.id
reward_id uuid NOT NULL         -- FK rewards.id
points_used integer NOT NULL
status text DEFAULT 'pending'   -- pending/completed/cancelled
```

#### `group_bookings`
```sql
id uuid PRIMARY KEY
lead_user_id uuid NOT NULL      -- FK users.id
property_id uuid NOT NULL       -- FK properties.id
unit_id uuid NOT NULL           -- FK units.id
status text DEFAULT 'pending'   -- pending/confirmed/cancelled/completed
total_amount numeric NOT NULL
deposit_amount numeric NOT NULL
start_date timestamp NOT NULL
end_date timestamp NOT NULL
metadata jsonb DEFAULT '{}'
```

#### `group_booking_members`
```sql
id uuid PRIMARY KEY
group_booking_id uuid NOT NULL  -- FK group_bookings.id
user_id uuid NOT NULL           -- FK users.id
share_percentage numeric(5,2)   -- e.g., 33.33
share_amount numeric NOT NULL   -- Calculated share
paid_amount numeric DEFAULT '0'
status text DEFAULT 'invited'   -- invited/accepted/rejected/paid
joined_at timestamp
```

---

## 3. Business Rules

### 3.1 Referral Commission Tiers

#### Owner Category (Recurring Commission)
| Tier | Completed Referrals | Commission Rate | Example (Rp 3M rent) |
|------|---------------------|-----------------|----------------------|
| 1 | 1-100 | 1.00% | Rp 30,000 |
| 2 | 101-372 | 2.00% | Rp 60,000 |
| 3 | 373-846 | 3.67% | Rp 110,100 |
| 4 | ≥847 | 4.82% | Rp 144,600 |

**Rule:** Commission is recurring per new tenant per room. Extensions or room changes by the same tenant do NOT generate new commission.

#### Tenant Category (One-Time Commission)
| Tier | Completed Referrals | Commission Rate | Example (Rp 2.5M rent) |
|------|---------------------|-----------------|------------------------|
| 1 | 1-100 | 0.90% | Rp 22,500 |
| 2 | 101-372 | 1.86% | Rp 46,500 |
| 3 | 373-846 | 2.79% | Rp 69,750 |
| 4 | ≥847 | 3.96% | Rp 99,000 |

**Rule:** One-time commission only. Renewals or room changes do not generate new commission.

### 3.2 Referral Status Flow

```
pending ──▶ verifying ──▶ eligible ──▶ completed
               │              │
               ▼              ▼
            failed         cancelled
```

**Transitions:**
- `pending` → `verifying`: When referee registers (existing user) or is invited (new user)
- `verifying` → `eligible`: After 5-day no-refund period passes
- `verifying` → `failed`: If referee refunds/cancels/disputes within 5 days
- `eligible` → `completed`: When owner converts to voucher OR tenant applies offset
- Any → `cancelled`: Manual cancellation by referrer or admin

### 3.3 Verification Rules

1. **Full Payment Required:** Referee must complete 100% of rent via payment gateway
2. **5-Day No-Refund Window:** Starts at 00:01 WIB day after full payment, ends 23:59 WIB on day 5
3. **Auto-Failure:** Any refund, cancellation, or chargeback during window = failed
4. **Eligible:** After 5 clean days, referral becomes eligible for payout

### 3.4 Payout Rules

#### Owner (Voucher Conversion)
- Convert eligible balance to discount vouchers
- Max 50% discount on service fees (Listing Premium or Promosi)
- Voucher validity: 30 days (Listing) or 14 days (Promosi)
- Non-transferable, non-cashable

#### Tenant (Rent Offset)
- Apply eligible balance to next month's rent
- Minimum usage: Rp 10,000
- If balance < rent, remainder paid via regular method
- Cannot be used for fines or utilities

#### Scheduled Payouts
- **Standard months (11 months):** 16th and 30th
- **February:** 28th or 29th only
- **Queue rule:** Missed payout date → next scheduled date

### 3.5 Loyalty Rules

- Points accrue from bookings, referrals, and bonuses
- Points can expire (tracked via `expires_at`)
- Redemption requires sufficient balance
- Transaction types: `earn`, `redeem`, `expire`, `bonus`

### 3.6 Group Booking Rules

- Maximum 50 members per group
- Share percentage = 100% / (member_count + 1 for lead)
- Lead user creates booking and invites members via email
- Members accept/reject invites
- When confirmed, individual bookings created for each member
- Share amounts calculated from total/deposit

---

## 4. API Reference

### Referrals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/referrals` | Required | List current user's referrals |
| POST | `/api/referrals` | Required | Create new referral |
| PUT | `/api/referrals/[id]` | Required | Convert voucher or apply offset |

**Query Parameters (GET):**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (owner/tenant)
- `status` (pending/verifying/eligible/failed/completed/cancelled)

**POST Body:**
```json
{
  "refereeEmail": "string (valid email)",
  "refereeName": "string (required)",
  "category": "owner" | "tenant",
  "propertyId": "uuid (optional)",
  "message": "string (optional)"
}
```

**PUT Body:**
```json
{
  "id": "uuid",
  "action": "convert_voucher" | "apply_offset"
}
```

### Loyalty

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/loyalty/transactions` | Required | List transactions + balance |
| GET | `/api/loyalty/rewards` | Public | List active rewards |
| POST | `/api/loyalty/rewards/redeem` | Required | Redeem a reward |

### Group Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/group-bookings` | Required | List group bookings |
| POST | `/api/group-bookings` | Required | Create group booking |
| GET | `/api/group-bookings/[id]` | Required | Get group booking detail |
| PUT | `/api/group-bookings/[id]` | Required | Update group booking |
| DELETE | `/api/group-bookings/[id]` | Required | Cancel group booking |
| GET | `/api/group-bookings/[id]/members/me` | Required | Get my membership |
| PUT | `/api/group-bookings/[id]/members/me` | Required | Accept/reject invite |

---

## 5. Notification Events

| Event Type | Trigger | Channels |
|------------|---------|----------|
| `referral_reward_earned` | Reward redeemed | in-app, email, push |
| `referral_verifying` | Referee registered, waiting | in-app, email, push |
| `referral_eligible` | Passed 5-day verification | in-app, email, push |
| `referral_failed` | Refund/cancel/dispute | in-app, email, push |
| `referral_completed` | Commission paid out | in-app, email, push |
| `referral_voucher_converted` | Owner converted to voucher | in-app, email, push |
| `referral_offset_applied` | Tenant applied offset | in-app, email, push |
| `group_booking_invite` | Member invited | in-app, email, push |
| `group_booking_updated` | Booking status changed | in-app, push |

---

## 6. Tier Calculation Logic

```typescript
function getTierForCategory(
  category: "owner" | "tenant",
  completedCount: number,
): number {
  if (category === "owner") {
    if (completedCount >= 847) return 4;
    if (completedCount >= 373) return 3;
    if (completedCount >= 101) return 2;
    return 1;
  }
  if (completedCount >= 847) return 4;
  if (completedCount >= 373) return 3;
  if (completedCount >= 101) return 2;
  return 1;
}
```

**Note:** Tier thresholds are currently hardcoded in the UI page. They should be moved to shared constants.

---

## 7. Commission Calculation Logic (MISSING)

The following logic needs to be implemented:

```typescript
// TODO: Implement in apps/web/src/lib/referrals/commission.ts

function calculateCommission(
  rentAmount: number,
  category: "owner" | "tenant",
  tier: number,
): number {
  const rates = {
    owner: { 1: 0.01, 2: 0.02, 3: 0.0367, 4: 0.0482 },
    tenant: { 1: 0.009, 2: 0.0186, 3: 0.0279, 4: 0.0396 },
  };
  return rentAmount * rates[category][tier];
}
```

**Trigger:** Should be called when:
1. Referee completes 100% payment
2. After 5-day no-refund period
3. On booking completion webhook

---

## 8. Verification Flow (MISSING)

```
Payment Webhook (full_payment)
    │
    ▼
Create referral record (status: verifying)
    │
    ▼
Schedule 5-day timer (eligible_at = now + 5 days)
    │
    ├── Refund/Cancel/Dispute within 5 days
    │   └──▶ status = failed
    │
    └── 5 days pass with no issues
        └──▶ status = eligible
            └──▶ Notify referrer
```

---

## 9. Payout Processing (MISSING)

**Cron Schedule:**
- Runs on 16th and 30th (Feb: 28th/29th)
- Queries referrals with `status = 'eligible'` and `payout_scheduled_at <= now`
- For owners: Generate voucher code, mark completed
- For tenants: Create offset transaction, mark completed
- Send notification to referrer

---

## 10. Loyalty Point Accrual (MISSING)

**Points should be awarded for:**
- Booking completion: X points per Rp 1,000 spent
- Referral completion: Bonus points
- Daily login: Small bonus
- Review submission: Small bonus

**Points should expire:**
- After 12 months of inactivity
- Or specific expiration date set at accrual

---

## 11. Security & Fraud Prevention

### Current Measures
- Duplicate referral check (same referrer + referee email)
- Self-referral prevention
- Unique referral codes

### Missing Measures
- KTP/bank account duplicate detection
- IP address tracking for suspicious patterns
- Rate limiting on referral creation
- Admin tools for manual review/blocking
- Automated fraud scoring

---

## 12. Testing Coverage

**Current:** 0%  
**Required:** 90% for business logic

**Missing Tests:**
- Referral creation and validation
- Commission calculation accuracy
- Tier progression logic
- Verification timer logic
- Loyalty point accrual and expiration
- Reward redemption flow
- Group booking member management

---

## 13. Migration Notes

The shared schemas in `packages/shared/src/api/referrals-loyalty.ts` are **not imported** anywhere in the web app. API routes define inline schemas instead. This should be refactored to use the shared contracts.

---

## 14. Quick Reference: File Locations

| Feature | File Path |
|---------|-----------|
| DB Schema | `apps/web/src/db/schema.ts` |
| Referral API | `apps/web/src/app/api/referrals/route.ts` |
| Loyalty API | `apps/web/src/app/api/loyalty/transactions/route.ts` |
| Rewards API | `apps/web/src/app/api/loyalty/rewards/route.ts` |
| Group Booking API | `apps/web/src/app/api/group-bookings/route.ts` |
| Group Booking Action | `apps/web/src/actions/group-bookings.ts` |
| Referral UI | `apps/web/src/app/[locale]/(protected)/dashboard/referrals/page.tsx` |
| Loyalty UI | `apps/web/src/app/[locale]/(protected)/dashboard/loyalty/page.tsx` |
| Group Booking UI | `apps/web/src/app/[locale]/(protected)/dashboard/group-bookings/page.tsx` |
| Terms Page | `apps/web/src/app/[locale]/referrals/terms/page.tsx` |
| Notifications | `apps/web/src/lib/notification-service.ts` |
| Shared Schemas | `packages/shared/src/api/referrals-loyalty.ts` |
| Shared Enums | `packages/shared/src/constants/enums.ts` |
