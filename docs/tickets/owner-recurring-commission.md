# Ticket: Owner Recurring Commission per New Tenant

**Status**: Backlog — pending product decision  
**Created**: 2026-08-24  
**Priority**: P1 (high business value, blocked on architecture)  

---

## Problem

Current referral system pays the **referrer** (the user who shared a code) once when the referee completes their first payment.

There is **no recurring commission for property owners** when a referred tenant books their property repeatedly.

### Example gap

1. Owner A refers Tenant B via referral code.
2. Tenant B books Owner A's property → Owner A gets nothing.
3. Tenant B stays for 12 months and pays rent monthly → Owner A gets nothing every month.
4. Tenant B moves out → Owner A gets nothing.

**Expected behavior (to be defined):** Owner A should earn a commission for every successful tenancy/renewal from Tenant B.

---

## Questions for Product

1. **Commission basis**
   - One-time commission only, or recurring per payment?
   - If recurring: per booking period, per month, per renewal?

2. **Commission rate**
   - Flat fee per tenancy?
   - Percentage of booking value / monthly rent?
   - Tiered by owner tier or property type?

3. **Payout model**
   - Auto-credit to owner wallet on payment success?
   - Manual payout via withdrawal?
   - Hold period / clawback if tenant refunds?

4. **Scope**
   - First referral only, or every new tenant referred by the same owner?
   - Does this stack with existing tenant/owner referral bonuses?

5. **Fraud / abuse**
   - Self-referral guard already exists.
   - Need duplicate guard per referee per owner?
   - Need max lifetime cap per referee?

---

## Current Implementation (for reference)

| File | Responsibility |
|------|----------------|
| `apps/web/src/lib/referrals/commission.ts` | Commission calculation by category + tier |
| `apps/web/src/lib/referrals/verification.ts` | Marks referrals `verifying` → `eligible` on payment |
| `apps/web/src/lib/referrals/voucher.ts` | Owner voucher redemption (one-time) |
| `apps/web/src/workers/processors/referral-eligibility-sweep.processor.ts` | Hourly sweep for eligible referrals |
| `apps/web/src/app/api/referrals/route.ts` | `convert_voucher` (owner) / `apply_offset` (tenant) |
| `packages/shared/src/db/schema.ts` `referrals` table | Stores `baseAmount`, `commissionRate`, `commissionAmount`, `voucherCode`, `offsetApplied` |

### Gaps in current schema

- No `recurring` flag or `renewalCount`.
- No `nextPayoutAt` / `payoutSchedule`.
- No `ownerRecurringRate` separate from one-time `commissionRate`.

---

## Proposed Options (for product review)

### Option A — One-time owner bonus per first booking

- Owner gets a fixed bonus the first time a referred tenant books.
- Simpler: reuse existing `commissionAmount` + `convert_voucher`.
- **Pro**: minimal schema change, fast to ship.  
- **Con**: still not truly "recurring."

### Option B — Recurring per completed stay

- On booking confirmation → create a **recurring referral record**.
- On each successful payment webhook → accrue owner commission.
- Payout when `eligibleAt` reached or on manual withdrawal.
- **Pro**: matches "recurring" requirement.  
- **Con**: needs new `referral_events` / `referral_payouts` tables.

### Option C — Monthly passive income model

- Referral becomes a **subscription-like relationship**.
- Owner earns X% of every payment from referee for N months.
- **Pro**: strongest owner incentive.  
- **Con**: complex accounting, refunds, cancellations, proration.

---

## Acceptance Criteria (draft)

- [ ] Product defines commission basis, rate, and payout model.
- [ ] Product defines scope (first referral only vs every new tenant).
- [ ] Product defines fraud guardrails (caps, hold periods, clawback).
- [ ] Engineering estimates schema + worker changes.
- [ ] QA defines test cases for refund/cancel/renewal flows.

---

## Dependencies

- Referral system P0 (shipped).
- Payment webhook reliability (already in place).
- Wallet / withdrawal system (already in place).

---

## Notes

- Current codebase treats `category: "owner"` referrals as voucher-based one-time rewards.
- Recurring model should likely introduce a new `referral_type` or separate `owner_commissions` table to avoid mixing concerns.
- Worker `referral-eligibility-sweep` may need a companion `owner-commission-accrual` processor if Option B/C is chosen.
