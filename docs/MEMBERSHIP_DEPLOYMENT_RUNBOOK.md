# Plottrix Membership & Payment System — Deployment, Backup & Rollback Runbook

> **CRITICAL SAFETY GATE:** Do NOT run any SQL migration, Edge Function deploy, secret update, Owner seed, or payment channel activation on Production (`jqgbgqlhztixhkrqdwtf`) until Staging verification passes and the Project Owner explicitly authorizes Production Deployment.

---

## 1. Environment Separation (Staging First)

1. Provision an **isolated Supabase Staging Project** (or dedicated Supabase Preview Branch with separate database, auth users, storage, and Edge Functions).
2. Confirm Staging `PROJECT_REF !== 'jqgbgqlhztixhkrqdwtf'`.
3. Create `.env.staging.local` (never commit to Git) pointing frontend + test scripts strictly to Staging URL & Staging keys.
4. Set `EASYSLIP_API_KEY` **only** inside Supabase Secrets (`supabase secrets set EASYSLIP_API_KEY=... --project-ref <STAGING_REF>`). Never store `EASYSLIP_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables or Git.

---

## 2. Backup Plan (Before Any Production Migration)

Execute and verify all backup steps **before** running SQL on Production:

1. **Supabase Dashboard / PITR / Logical Backup:**
   - Trigger an on-demand Database Backup or confirm latest Point-in-Time Recovery (PITR) checkpoint in Supabase Project (`jqgbgqlhztixhkrqdwtf`).
2. **Pre-Migration Schema & Critical Data Export (`pg_dump` via direct DB connection string):**
   ```bash
   pg_dump "$PROD_DB_URL" --schema=public --format=custom --file="plottrix_pre_membership_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Record Pre-Migration Baseline Counts (SQL Read-Only):**
   ```sql
   select
     (select count(*) from public.profiles) as profiles_count,
     (select count(*) from public.novels) as novels_count,
     (select count(*) from public.chapters) as chapters_count,
     (select count(*) from public.trix_transactions) as trix_txns_count,
     (select coalesce(sum(trix_balance), 0) from public.profiles) as total_trix_balance;
   ```
4. **Export Legacy Grants & Policies Snapshot** so exact pre-migration permissions on `profiles`, `novels`, `chapters`, `trix_transactions`, `story_comments`, and `story_followers` are preserved for audit.

---

## 3. Migration Execution Plan

Migration file: [`supabase/migrations/202611250001_membership_payment_system.sql`](../supabase/migrations/202611250001_membership_payment_system.sql)

### Pre-Flight Risk & Compatibility Checks
- Verify existing `public.profiles` has columns `id`, `email`, `plan`, `plan_tier`, `trial_used`, `trial_started_at`, `trial_ends_at`, `trix_balance`, `last_claim_date`, `updated_at`.
- Check for legacy rows violating `profiles_plan_tier_check` or `trix_transactions_type_check` before applying constraints:
  ```sql
  select id, plan, plan_tier from public.profiles
  where plan_tier not in ('free', 'pro_trial', 'pro', 'ultra') or plan_tier is null;
  ```
- Confirm zero legacy `profiles.plan_tier` nulls (backfill to `'free'` first if any exist).

### Deployment Order
1. **Apply SQL Migration** (Staging first, verify E2E, then Production during maintenance window):
   ```bash
   supabase db push --project-ref <TARGET_PROJECT_REF>
   ```
   *(Or execute `supabase/migrations/202611250001_membership_payment_system.sql` via Supabase SQL Editor inside a single transaction).*
2. **Verify Post-Migration DB Objects & Grants:**
   - Confirm 11 new tables exist with RLS enabled (`admin_users`, `user_consents`, `membership_plans`, `membership_orders`, `membership_payments`, `user_subscriptions`, `membership_entitlements`, `notifications`, `payment_audit_logs`, `payment_channel_settings`, `payment_channel_verification_rules`).
   - Confirm `public.membership_plans` contains exact rows (`free` = 0, `pro` = 249.00 / 30d / 400 Trix, `ultra` = 599.00 / 30d / 1000 Trix).
   - Confirm both `payment_channel_settings` rows (`promptpay`, `bank_transfer`) start with `is_enabled = false`.
   - Confirm `anon` still can `SELECT` published `public.novels`, `public.chapters`, `public.stories`, and `public.membership_plans`.
   - Confirm Private Storage bucket `membership-payment-slips` exists with `public = false` and `file_size_limit = 4194304`.
3. **Set Edge Function Secrets:**
   ```bash
   supabase secrets set EASYSLIP_API_KEY="<YOUR_EASYSLIP_V2_KEY>" --project-ref <TARGET_PROJECT_REF>
   ```
   *(Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically into Edge Functions.)*
4. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy activate-pro-trial --no-verify-jwt --project-ref <TARGET_PROJECT_REF>
   supabase functions deploy get-membership-status --no-verify-jwt --project-ref <TARGET_PROJECT_REF>
   supabase functions deploy create-membership-order --no-verify-jwt --project-ref <TARGET_PROJECT_REF>
   supabase functions deploy verify-membership-payment --no-verify-jwt --project-ref <TARGET_PROJECT_REF>
   supabase functions deploy admin-membership --no-verify-jwt --project-ref <TARGET_PROJECT_REF>
   ```
   *(Note: Every Edge Function explicitly handles CORS `OPTIONS` preflight and validates user JWT server-side via `supabaseAdmin.auth.getUser(token)` inside `requireAuthenticatedUser(req)`.)*
5. **Configure Vercel Environment Variables & Deploy Web App:**
   - Ensure Vercel Project has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (required by `api/subscription.js` Option S2 RPC delegation & `api/ai.js`).
   - Deploy updated Vite + `/api/subscription.js` bundle after Edge Functions are live.

---

## 4. Required Owner Setup & Payment Channel Configuration

### Step A: Register Real Owner Account (Zero Dummy UUIDs)
1. Locate your real authenticated account UUID from Supabase Dashboard (`Authentication -> Users`).
2. Run in SQL Editor **replacing `<REAL_OWNER_USER_UUID>`**:
   ```sql
   insert into public.admin_users (user_id, role, note)
   values ('<REAL_OWNER_USER_UUID>'::uuid, 'owner', 'Primary Platform Owner')
   on conflict (user_id) do update set role = 'owner';
   ```
3. *(Optional)* Grant additional staff `admin` role (`admin` can view dashboard, inspect slips, and approve/reject `MANUAL_REVIEW`, but **cannot** change payment accounts/QR):
   ```sql
   insert into public.admin_users (user_id, role, created_by, note)
   values ('<REAL_ADMIN_USER_UUID>'::uuid, 'admin', '<REAL_OWNER_USER_UUID>'::uuid, 'Operations Admin')
   on conflict (user_id) do update set role = 'admin';
   ```

### Step B: Configure Real Bank Account & PromptPay in `/admin/payments`
1. Log in as Owner and navigate to `/admin/payments` -> tab **`ช่องทางรับเงิน (Owner)`**.
2. **EasySlip Developer Portal Prerequisite:**
   - Register the **exact same receiving Bank Account / PromptPay ID** in your EasySlip Developer Dashboard so `POST https://api.easyslip.com/v2/verify/bank` with `matchAccount=true` populates `data.matchedAccount`.
3. **Configure PromptPay QR:**
   - Enter real `Account Name`, real `PromptPay ID` (Phone e.g. `08xxxxxxxx` / Citizen ID / e-Wallet ID), upload real QR code image (`channel-qr/...` in private storage), set `Proxy Type` (`MSISDN`, `NATID`, or `EWALLETID`), set `Proxy Value` matching your PromptPay ID, and (if bank fallback is possible) `Allowed Bank Codes`.
4. **Configure Bank Transfer:**
   - Enter real `Bank Name` (e.g., `ธนาคารกสิกรไทย`), real `Account Name`, real `Account Number`, and `Allowed Bank Codes` (e.g., `KBANK,004`; `SCB,014`; `BBL,002`; `KTB,006`; `BAY,025`; `TTB,011`; `GSB,030`) + numeric `expected_account_digits`.
5. Keep `is_enabled = false` until ready to run a controlled live verification transfer, then toggle `is_enabled = true`.

---

## 5. Risk Register by Step

| Phase | Risk | Mitigation |
| --- | --- | --- |
| Migration | Legacy `profiles` rows violating check constraint | Pre-flight query inspects invalid `plan_tier` values before constraint creation |
| Migration | Revoking table grants breaking public novel reading | Migration scopes `REVOKE` strictly to new membership tables + locks `trix_transactions` client INSERT; leaves `novels`, `chapters`, `stories` intact |
| Edge Functions | Missing `EASYSLIP_API_KEY` secret causes `PROVIDER_CONFIG` error | Deploy secrets before deploying UI checkout buttons; `create-membership-order` blocks checkout (`503`) if no channel is enabled |
| Channel Config | Mismatched bank code or masked digits triggers false reject / manual review | `AdminPaymentsView` syncs `expected_account_digits` / `expected_proxy_value`; ambiguous masks route to `MANUAL_REVIEW` rather than auto-reject |
| Vercel API | Missing `SUPABASE_SERVICE_ROLE_KEY` in Vercel env breaks `/api/subscription` | Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production env before promoting deployment |

---

## 6. Rollback Plan

### Level 1 — Immediate Kill Switch (Zero Data Loss, ~10 Seconds)
To pause all incoming payments without dropping tables:
```sql
update public.payment_channel_settings set is_enabled = false;
```

### Level 2 — Revert Frontend & Vercel API (~1 Minute)
1. Promote the previous stable deployment in **Vercel Dashboard -> Deployments -> Instant Rollback**.
2. Disable or delete new Edge Functions if needed:
   ```bash
   supabase functions delete verify-membership-payment --project-ref <TARGET_PROJECT_REF>
   supabase functions delete create-membership-order --project-ref <TARGET_PROJECT_REF>
   supabase functions delete activate-pro-trial --project-ref <TARGET_PROJECT_REF>
   supabase functions delete get-membership-status --project-ref <TARGET_PROJECT_REF>
   supabase functions delete admin-membership --project-ref <TARGET_PROJECT_REF>
   ```

### Level 3 — Full Database Schema Rollback (Preserves Existing Users, Novels & Legacy Trix)
1. Restore full logical dump `plottrix_pre_membership_*.dump` if severe structural corruption occurred **or** drop new objects cleanly while restoring legacy policies:
   ```sql
   drop trigger if exists trg_protect_notification_columns on public.notifications;
   drop trigger if exists trg_prevent_verified_payment_regression on public.membership_payments;
   drop trigger if exists trg_prevent_paid_order_regression on public.membership_orders;
   drop trigger if exists trg_protect_profile_system_columns on public.profiles;

   drop function if exists public.user_has_entitlement(uuid, text);
   drop function if exists public.get_public_payment_channels();
   drop function if exists public.admin_reject_membership_payment(uuid, uuid, text);
   drop function if exists public.admin_approve_membership_payment(uuid, uuid, text, text);
   drop function if exists public.mark_payment_manual_review(uuid, uuid, uuid, text, text, jsonb, text);
   drop function if exists public.reject_payment_attempt(uuid, uuid, uuid, text, text, text, jsonb, text);
   drop function if exists public.finalize_membership_payment(uuid, uuid, uuid, bigint, text, jsonb);
   drop function if exists public.activate_membership_core_internal(uuid, uuid, bigint, text, jsonb, uuid, text, text);
   drop function if exists public.claim_payment_verification_attempt(uuid, uuid, text, text, text, text);
   drop function if exists public.process_expiring_and_expired_memberships(uuid);
   drop function if exists public.expire_trial_if_needed(uuid);
   drop function if exists public.expire_subscriptions_if_needed(uuid);
   drop function if exists public.activate_pro_trial_safely(uuid, text, boolean, jsonb, text, text);
   drop function if exists public.sync_user_entitlements_internal(uuid, text, uuid, jsonb, timestamptz, timestamptz);
   drop function if exists public.claim_daily_trix_safely();
   drop function if exists public.protect_notification_columns();
   drop function if exists public.prevent_verified_payment_regression();
   drop function if exists public.prevent_paid_order_regression();
   drop function if exists public.is_admin(uuid);
   drop function if exists public.get_admin_role(uuid);

   drop table if exists public.payment_audit_logs cascade;
   drop table if exists public.notifications cascade;
   drop table if exists public.membership_entitlements cascade;
   drop table if exists public.user_subscriptions cascade;
   drop table if exists public.membership_payments cascade;
   drop table if exists public.membership_orders cascade;
   drop table if exists public.payment_channel_verification_rules cascade;
   drop table if exists public.payment_channel_settings cascade;
   drop table if exists public.membership_plans cascade;
   drop table if exists public.user_consents cascade;
   drop table if exists public.admin_users cascade;

   drop policy if exists "Owners and admins can read membership slips" on storage.objects;
   ```
   *(Note: Restore original `protect_profile_system_columns()`, `deduct_trix_safely()`, and `"Users can insert own trix transactions"` policy from `schema.sql` immediately if rolling back Frontend to pre-STEP 4 release.)*

---

## 7. Staging & Production E2E Verification Checklist

- [ ] **SQL Schema & Idempotency:** Apply migration twice in Staging without errors; verify all 11 tables, constraints, triggers, and grants.
- [ ] **RLS Isolation (Customer A vs B vs Admin vs Owner vs Anon):**
  - Customer A REST `GET` on Customer B's `membership_orders` / `membership_payments` / `user_subscriptions` / `notifications` / `user_consents` returns `[]`.
  - Direct REST `PATCH` on `profiles.trix_balance`, `profiles.plan_tier`, `profiles.trial_used` fails with trigger exception.
  - Direct REST `INSERT` on `trix_transactions` fails with permission denied.
  - Customer A `GET` on `payment_audit_logs` returns `[]`; Customer A `SELECT` on published `novels` & `chapters` succeeds for both anon & authenticated.
- [ ] **Private Storage Isolation:**
  - Direct unauthenticated URL to `membership-payment-slips/slips/...` rejected.
  - Admin signed URL loads slip image cleanly and expires after 120s.
- [ ] **Pro Free Trial E2E:**
  - Calling `activate-pro-trial` without `accepted: true` returns `400 TERMS_NOT_ACCEPTED`.
  - Valid consent creates `user_consents` row, sets `plan_tier = 'pro_trial'`, `+0 Trix`, `0` rows in `membership_orders`, retries rejected with `400 TRIAL_ALREADY_USED`.
  - Backdating `trial_ends_at` to past + calling `get-membership-status` reverts Trial-only user to `'free'` while leaving active Paid Subscriber untouched.
- [ ] **EasySlip & Paid Membership E2E:**
  - Valid PromptPay & Bank Transfer test slips -> `VERIFIED` -> Order `PAID` -> Subscription `ACTIVE` -> Trix credited once -> concurrent duplicate request blocked (`409 VERIFICATION_IN_PROGRESS` or idempotent return).
  - Duplicate `transRef` against another order rejected (`400 DUPLICATE_SLIP_OTHER_ORDER`).
  - `SLIP_PENDING` -> `202 PENDING_BANK` allowing retry on same slip.
  - Pro (active) -> Ultra upgrade verifies Pro-rata duration (`FLOOR(remaining_secs * 249 / 599)`) + `+1,000 Trix`.
  - Same-tier renewal extends `expires_at + 30 days`; Ultra -> Pro blocked (`403 NO_DOWNGRADE_ALLOWED`).
- [ ] **Admin Panel RBAC:**
  - Non-admin receives `403`; `admin` can review slips but receives `403` on channel settings; `owner` can upload QR and save channels.
