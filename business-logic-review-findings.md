# Business Logic Review Findings: Client-to-Server-Action Migration

## 1. Race Condition in `useActionState` — Stale State Read After `await uploadAction()`

**Path:** `src/components/image-uploader.tsx:92`  
**Confidence:** high  
**Why:** `useActionState` updates state asynchronously after the Server Action resolves. Reading `uploadState` immediately after `await uploadAction(formData)` returns the _previous_ render's state, not the new result.  
**Finding:** Image upload returns `null`/`undefined` URL despite successful upload because `uploadState` is stale.  
**Suggestion:** Use the return value of `uploadAction(formData)` directly (it returns the new state), or await the promise and read from the returned state object.

---

**Path:** `src/components/owner/add-property-form.tsx:170`  
**Confidence:** high  
**Why:** Same `useActionState` race condition — `uploadState` read immediately after `await uploadAction()` is stale.  
**Finding:** Uploaded image URLs not captured; `uploadImages()` throws "Gagal upload gambar" even on success.  
**Suggestion:** Capture the return value: `const result = await uploadAction(formData); if (result?.success && result.data?.url) ...`

---

**Path:** `src/components/property/property-images-upload.tsx:100`  
**Confidence:** high  
**Why:** Same pattern — `uploadState` checked synchronously after `await uploadAction()`.  
**Finding:** Property image uploads appear to fail silently; images not added to the form.  
**Suggestion:** Use the returned state from `uploadAction(formData)` instead of the closure `uploadState`.

---

**Path:** `src/components/reports/report-form.tsx:70`  
**Confidence:** high  
**Why:** Same `useActionState` race condition in report image upload.  
**Finding:** Report image uploads fail to attach URLs to the form.  
**Suggestion:** Use the return value of `uploadAction(formData)`.

---

## 2. Property Wizard — Sequential Unit Creation Without Rollback

**Path:** `src/components/owner/property-wizard.tsx:279-299`  
**Confidence:** high  
**Why:** Property created first (line 277), then units created sequentially in a loop (lines 282-298). If any unit creation fails, the property remains in DB with no units — orphaned property.  
**Finding:** Partial failure leaves inconsistent data (property without units, or incomplete unit set).  
**Suggestion:** Wrap property + all unit creations in a single Server Action transaction, or implement compensating deletion on failure.

---

## 3. Missing Cache Invalidation for Review Actions

**Path:** `src/actions/reviews.ts` (all actions)  
**Confidence:** high  
**Why:** `createReviewAction`, `updateReviewAction`, `deleteReviewAction`, `replyReviewAction` don't call `invalidateCacheByTag("reviews")`, unlike `properties.ts` and `units.ts` which invalidate their respective tags.  
**Finding:** Server-side cached review data (if any) becomes stale after mutations.  
**Suggestion:** Add `await invalidateCacheByTag("reviews")` after each successful mutation in review actions.

---

## 4. CSRF Protection Missing on `uploadImageAction`

**Path:** `src/actions/upload.ts:19-76`  
**Confidence:** high  
**Why:** All API route mutations use `validateMutationCsrf(req)` (e.g., `src/app/api/owner/bank-accounts/route.ts:20`), but the Server Action `uploadImageAction` has no CSRF validation.  
**Finding:** Image upload endpoint vulnerable to CSRF attacks via forged form submissions.  
**Suggestion:** Add CSRF token validation in `uploadImageAction` using the same mechanism as API routes (check `csrf` token in FormData against session).

---

## 5. FormData JSON Parsing Fragility — Silent Empty Arrays on Parse Failure

**Path:** `src/actions/properties.ts:71-99` (create), `src/actions/properties.ts:206-244` (update)  
**Confidence:** high  
**Why:** Server actions parse `images`, `packages`, `amenities` as JSON strings from FormData. `JSON.parse` failures silently fall back to empty arrays/undefined (lines 77, 87, 97, 212, 222, 232). Client components _must_ `JSON.stringify()` these fields.  
**Finding:** Any client omission of `JSON.stringify()` causes silent data loss (empty images/amenities/packages) without error.  
**Suggestion:** Add validation to reject non-JSON array strings, or accept both JSON strings and repeated FormData entries (e.g., `formData.append("images[]", url)`).

---

## 6. Property Wizard — Unit Images Uploaded via Old Client-Side `uploadFile`, Not Server Action

**Path:** `src/components/owner/property-wizard.tsx:7,244`  
**Confidence:** high  
**Why:** `uploadUnitImages` uses `uploadFile` from `@/lib/storage-manager` (client-side direct upload), bypassing the new `uploadImageAction` Server Action which includes auth checks, file type/size validation, and role authorization.  
**Finding:** Unit image uploads skip Server Action validation (file type, size, owner role check) and are inconsistent with property image uploads.  
**Suggestion:** Replace `uploadFile` calls with `uploadImageAction` Server Action (requires converting to `useActionState` pattern).

---

## 7. Review Reputation Score — Race Condition in Concurrent Review Creation

**Path:** `src/actions/reviews.ts:344-375`  
**Confidence:** high  
**Why:** `createReviewAction` calculates new reputation score by: (1) SELECT current score, (2) SELECT review count, (3) compute average, (4) UPDATE user. The SELECTs don't lock rows (`FOR SHARE`/`FOR UPDATE`). Concurrent review creations for the same `reviewedUserId` read the same count, compute wrong average.  
**Finding:** Reputation score becomes inaccurate under concurrent review submissions.  
**Suggestion:** Use `SELECT ... FOR UPDATE` on the user row, or compute average in a single atomic SQL statement: `UPDATE users SET reputationScore = (SELECT avg(rating)::text FROM reviews WHERE reviewedUserId = $1 AND type = 'tenant') WHERE id = $1`.

---

## 8. Property Wizard — Unit Images Not Sent to `createUnitAction`

**Path:** `src/components/owner/property-wizard.tsx:287-295`  
**Confidence:** high  
**Why:** `uploadUnitImages` returns enriched unit with `images` array, but the `unitFormData` sent to `createUnitAction` omits the `images` field. The `createUnitSchema` doesn't include `images` but the DB schema supports it.  
**Finding:** Unit images uploaded but not persisted to the unit record.  
**Suggestion:** Add `formData.append("images", JSON.stringify(enrichedUnit.images))` and update `createUnitSchema`/`createUnitAction` to accept and persist images.

---

## Summary

| Category                         | Count  |
| -------------------------------- | ------ |
| Race conditions (useActionState) | 4      |
| Missing rollback/transaction     | 1      |
| Missing cache invalidation       | 1      |
| Missing CSRF protection          | 1      |
| Fragile FormData parsing         | 1      |
| Inconsistent upload path         | 1      |
| DB race condition                | 1      |
| Missing field in mutation        | 1      |
| **Total**                        | **11** |
