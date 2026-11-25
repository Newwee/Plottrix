create extension if not exists "pgcrypto";

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_plan_tier_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_tier_check
      check (plan_tier in ('free', 'pro_trial', 'pro', 'ultra'));
  end if;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('PRO_FREE_TRIAL_TERMS')),
  terms_version text not null,
  accepted boolean not null check (accepted = true),
  terms_summary jsonb not null default '{}'::jsonb,
  user_agent text not null default '',
  ip_hash text not null default '',
  accepted_at timestamptz not null default timezone('utc', now()),
  constraint uq_user_consents_user_type unique (user_id, consent_type)
);

create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  price_satang bigint generated always as ((round(price * 100))::bigint) stored,
  currency text not null default 'THB' check (currency = 'THB'),
  duration_days integer not null check (duration_days >= 0),
  trix_grant integer not null default 0 check (trix_grant >= 0),
  tier_rank integer not null check (tier_rank >= 0),
  features jsonb not null default '[]'::jsonb,
  entitlements_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.membership_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  amount_satang bigint not null check (amount_satang > 0),
  currency text not null default 'THB' check (currency = 'THB'),
  plan_snapshot jsonb not null,
  selected_channel text check (selected_channel is null or selected_channel in ('promptpay', 'bank_transfer')),
  status text not null default 'PENDING' check (status in ('PENDING', 'VERIFYING', 'MANUAL_REVIEW', 'PAID', 'REJECTED', 'EXPIRED', 'CANCELLED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.membership_orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  payment_method text not null check (payment_method in ('promptpay', 'bank_transfer')),
  amount numeric(12,2) not null check (amount > 0),
  expected_amount_satang bigint not null check (expected_amount_satang > 0),
  verified_amount_satang bigint check (verified_amount_satang is null or verified_amount_satang >= 0),
  currency text not null default 'THB' check (currency = 'THB'),
  verification_provider text not null default 'easyslip_v2',
  verification_attempt_id uuid not null unique default gen_random_uuid(),
  verifying_expires_at timestamptz,
  verification_status text not null default 'UPLOADED' check (verification_status in ('UPLOADED', 'VERIFYING', 'VERIFIED', 'PENDING_BANK', 'MANUAL_REVIEW', 'REJECTED', 'PROVIDER_ERROR')),
  transaction_reference text,
  detected_trans_ref text,
  slip_storage_path text not null,
  slip_sha256 text not null default '',
  provider_error_code text,
  failure_reason text,
  provider_response jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  order_id uuid not null unique references public.membership_orders(id) on delete restrict,
  starts_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > starts_at),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'SUPERSEDED', 'CANCELLED')),
  trix_grant_txn_id uuid unique references public.trix_transactions(id) on delete restrict,
  trix_granted integer not null default 0 check (trix_granted >= 0),
  trix_granted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.membership_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'PAID' check (source_type in ('FREE', 'TRIAL', 'PAID')),
  subscription_id uuid references public.user_subscriptions(id) on delete cascade,
  entitlement_key text not null,
  entitlement_value jsonb not null default 'true'::jsonb,
  is_active boolean not null default true,
  valid_from timestamptz not null default timezone('utc', now()),
  valid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_membership_entitlements_user_key unique (user_id, entitlement_key)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('ORDER_CREATED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'MEMBERSHIP_ACTIVATED', 'PAYMENT_FAILED', 'MANUAL_REVIEW', 'MEMBERSHIP_EXPIRING_SOON', 'MEMBERSHIP_EXPIRED', 'TRIAL_ACTIVATED', 'TRIAL_EXPIRING_SOON', 'TRIAL_EXPIRED')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  dedup_key text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.membership_orders(id) on delete set null,
  payment_id uuid references public.membership_payments(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('USER', 'SYSTEM', 'EASYSLIP', 'ADMIN')),
  event_type text not null check (event_type in ('ORDER_CREATED', 'PAYMENT_SUBMITTED', 'VERIFICATION_STARTED', 'VERIFICATION_PASSED', 'VERIFICATION_FAILED', 'PAYMENT_APPROVED', 'MEMBERSHIP_ACTIVATED', 'PAYMENT_REJECTED', 'ADMIN_INTERVENTION', 'SUBSCRIPTION_EXPIRED', 'CHANNEL_SETTINGS_UPDATED')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_channel_settings (
  id uuid primary key default gen_random_uuid(),
  channel_type text not null unique check (channel_type in ('promptpay', 'bank_transfer')),
  is_enabled boolean not null default false,
  display_name text not null,
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  promptpay_id text not null default '',
  qr_storage_path text not null default '',
  instructions text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_channel_verification_rules (
  channel_id uuid primary key references public.payment_channel_settings(id) on delete cascade,
  allowed_bank_codes text[] not null default '{}'::text[],
  expected_account_digits text not null default '',
  expected_proxy_type text not null default '',
  expected_proxy_value text not null default '',
  expected_account_name_th text not null default '',
  expected_account_name_en text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_consents_user on public.user_consents(user_id, accepted_at desc);
create index if not exists idx_membership_plans_active on public.membership_plans(is_active, sort_order);
create index if not exists idx_membership_orders_user on public.membership_orders(user_id, created_at desc);
create index if not exists idx_membership_orders_status_exp on public.membership_orders(status, expires_at);
create index if not exists idx_membership_payments_order on public.membership_payments(order_id, created_at desc);
create index if not exists idx_membership_payments_user on public.membership_payments(user_id, created_at desc);
create index if not exists idx_membership_payments_status on public.membership_payments(verification_status, created_at desc);
create index if not exists idx_membership_payments_detected_ref on public.membership_payments(detected_trans_ref) where detected_trans_ref is not null;
create unique index if not exists uq_payments_verified_trans_ref on public.membership_payments(transaction_reference) where transaction_reference is not null;
create unique index if not exists uq_payments_one_verified_order on public.membership_payments(order_id) where verification_status = 'VERIFIED';
create unique index if not exists uq_payments_one_verifying_order on public.membership_payments(order_id) where verification_status = 'VERIFYING';
create unique index if not exists uq_user_active_subscription on public.user_subscriptions(user_id) where status = 'ACTIVE';
create index if not exists idx_user_subscriptions_status_exp on public.user_subscriptions(status, expires_at);
create index if not exists idx_membership_entitlements_user_active on public.membership_entitlements(user_id, is_active, valid_until);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);
create unique index if not exists uq_notifications_dedup on public.notifications(user_id, type, dedup_key) where dedup_key is not null;
create index if not exists idx_payment_audit_logs_order on public.payment_audit_logs(order_id, created_at desc);
create index if not exists idx_payment_audit_logs_payment on public.payment_audit_logs(payment_id, created_at desc);
create index if not exists idx_payment_audit_logs_created on public.payment_audit_logs(created_at desc);

drop trigger if exists trg_membership_plans_updated on public.membership_plans;
create trigger trg_membership_plans_updated
  before update on public.membership_plans
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_membership_orders_updated on public.membership_orders;
create trigger trg_membership_orders_updated
  before update on public.membership_orders
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_membership_payments_updated on public.membership_payments;
create trigger trg_membership_payments_updated
  before update on public.membership_payments
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_user_subscriptions_updated on public.user_subscriptions;
create trigger trg_user_subscriptions_updated
  before update on public.user_subscriptions
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_membership_entitlements_updated on public.membership_entitlements;
create trigger trg_membership_entitlements_updated
  before update on public.membership_entitlements
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_payment_channel_settings_updated on public.payment_channel_settings;
create trigger trg_payment_channel_settings_updated
  before update on public.payment_channel_settings
  for each row execute procedure public.set_updated_at_timestamp();

drop trigger if exists trg_payment_channel_rules_updated on public.payment_channel_verification_rules;
create trigger trg_payment_channel_rules_updated
  before update on public.payment_channel_verification_rules
  for each row execute procedure public.set_updated_at_timestamp();

create or replace function public.get_admin_role(p_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.admin_users where user_id = p_user_id limit 1;
$$;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = p_user_id and role in ('owner', 'admin')
  );
$$;

create or replace function public.protect_profile_system_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if new.trix_balance is distinct from old.trix_balance
       or new.plan is distinct from old.plan
       or new.plan_tier is distinct from old.plan_tier
       or new.trial_used is distinct from old.trial_used
       or new.trial_started_at is distinct from old.trial_started_at
       or new.trial_ends_at is distinct from old.trial_ends_at
       or new.last_claim_date is distinct from old.last_claim_date then
      raise exception 'Direct client modification of protected profile system columns is prohibited.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_system_columns on public.profiles;
create trigger trg_protect_profile_system_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_system_columns();

create or replace function public.prevent_paid_order_regression()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'PAID' then
    if new.status is distinct from old.status
       or new.amount_satang is distinct from old.amount_satang
       or new.amount is distinct from old.amount
       or new.user_id is distinct from old.user_id
       or new.plan_id is distinct from old.plan_id then
      raise exception 'Paid membership orders are immutable.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_paid_order_regression on public.membership_orders;
create trigger trg_prevent_paid_order_regression
  before update on public.membership_orders
  for each row execute procedure public.prevent_paid_order_regression();

create or replace function public.prevent_verified_payment_regression()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.verification_status = 'VERIFIED' then
    if new.verification_status is distinct from old.verification_status
       or new.transaction_reference is distinct from old.transaction_reference
       or new.verified_amount_satang is distinct from old.verified_amount_satang
       or new.order_id is distinct from old.order_id
       or new.user_id is distinct from old.user_id then
      raise exception 'Verified payment records are immutable.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_verified_payment_regression on public.membership_payments;
create trigger trg_prevent_verified_payment_regression
  before update on public.membership_payments
  for each row execute procedure public.prevent_verified_payment_regression();

create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if new.user_id is distinct from old.user_id
       or new.type is distinct from old.type
       or new.title is distinct from old.title
       or new.message is distinct from old.message
       or new.metadata is distinct from old.metadata
       or new.dedup_key is distinct from old.dedup_key then
      raise exception 'Only notification read state may be updated by clients.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_notification_columns on public.notifications;
create trigger trg_protect_notification_columns
  before update on public.notifications
  for each row execute procedure public.protect_notification_columns();

create or replace function public.deduct_trix_safely(
  p_user_id uuid,
  p_amount integer,
  p_action text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_uid uuid := auth.uid();
  v_current_balance integer;
  v_new_balance integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin') and (v_caller_uid is null or v_caller_uid <> p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Unauthorized caller');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid deduction amount');
  end if;

  perform set_config('app.trusted_profile_write', 'on', true);

  select trix_balance into v_current_balance
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User profile not found');
  end if;

  if coalesce(v_current_balance, 0) < p_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient Trix balance', 'current_balance', coalesce(v_current_balance, 0));
  end if;

  v_new_balance := v_current_balance - p_amount;

  update public.profiles
  set trix_balance = v_new_balance,
      updated_at = timezone('utc', now())
  where id = p_user_id;

  insert into public.trix_transactions (user_id, amount, type, action)
  values (p_user_id, -p_amount, 'deduct', coalesce(p_action, 'AI Execution'));

  return jsonb_build_object('success', true, 'remaining_balance', v_new_balance);
end;
$$;

create or replace function public.claim_daily_trix_safely()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today text := to_char(timezone('utc', now()), 'YYYY-MM-DD');
  v_last_claim text;
  v_current_balance integer;
  v_new_balance integer;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  perform set_config('app.trusted_profile_write', 'on', true);

  select trix_balance, coalesce(last_claim_date, '')
  into v_current_balance, v_last_claim
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_last_claim = v_today then
    return jsonb_build_object('success', false, 'already_claimed', true, 'current_balance', v_current_balance, 'last_claim_date', v_today);
  end if;

  v_new_balance := coalesce(v_current_balance, 0) + 3;

  update public.profiles
  set trix_balance = v_new_balance,
      last_claim_date = v_today,
      updated_at = timezone('utc', now())
  where id = v_user_id;

  insert into public.trix_transactions (user_id, amount, type, action)
  values (v_user_id, 3, 'claim', 'รับ Trix รายวัน');

  return jsonb_build_object('success', true, 'remaining_balance', v_new_balance, 'last_claim_date', v_today);
end;
$$;

create or replace function public.sync_user_entitlements_internal(
  p_user_id uuid,
  p_source_type text,
  p_subscription_id uuid,
  p_config jsonb,
  p_valid_from timestamptz,
  p_valid_until timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry record;
begin
  update public.membership_entitlements
  set is_active = false,
      updated_at = timezone('utc', now())
  where user_id = p_user_id
    and is_active = true;

  for v_entry in select key, value from jsonb_each(coalesce(p_config, '{}'::jsonb))
  loop
    insert into public.membership_entitlements (
      user_id,
      source_type,
      subscription_id,
      entitlement_key,
      entitlement_value,
      is_active,
      valid_from,
      valid_until
    )
    values (
      p_user_id,
      p_source_type,
      p_subscription_id,
      v_entry.key,
      v_entry.value,
      true,
      p_valid_from,
      p_valid_until
    )
    on conflict (user_id, entitlement_key) do update set
      source_type = excluded.source_type,
      subscription_id = excluded.subscription_id,
      entitlement_value = excluded.entitlement_value,
      is_active = true,
      valid_from = excluded.valid_from,
      valid_until = excluded.valid_until,
      updated_at = timezone('utc', now());
  end loop;
end;
$$;

create or replace function public.activate_pro_trial_safely(
  p_user_id uuid,
  p_terms_version text,
  p_accepted boolean,
  p_terms_summary jsonb default '{}'::jsonb,
  p_user_agent text default '',
  p_ip_hash text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_ends timestamptz := timezone('utc', now()) + interval '72 hours';
  v_profile public.profiles%rowtype;
  v_pro_plan public.membership_plans%rowtype;
  v_has_active_paid boolean;
begin
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  if p_accepted is distinct from true then
    raise exception 'Trial Terms and Conditions must be accepted before activation';
  end if;

  if coalesce(trim(p_terms_version), '') = '' then
    raise exception 'Terms version is required';
  end if;

  perform set_config('app.trusted_profile_write', 'on', true);

  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User profile not found';
  end if;

  if coalesce(v_profile.trial_used, false) = true then
    return jsonb_build_object('success', false, 'code', 'TRIAL_ALREADY_USED', 'error', 'คุณเคยใช้สิทธิ์ทดลองใช้ Pro ฟรี 3 วันไปแล้ว ไม่สามารถเปิดใช้งานซ้ำได้');
  end if;

  select exists (
    select 1 from public.user_subscriptions
    where user_id = p_user_id and status = 'ACTIVE' and expires_at > v_now
  ) into v_has_active_paid;

  if v_has_active_paid or coalesce(v_profile.plan_tier, 'free') in ('pro', 'ultra') then
    return jsonb_build_object('success', false, 'code', 'ALREADY_PAID_MEMBER', 'error', 'บัญชีของคุณอยู่ในระดับสมาชิกที่สูงกว่าอยู่แล้ว');
  end if;

  insert into public.user_consents (
    user_id,
    consent_type,
    terms_version,
    accepted,
    terms_summary,
    user_agent,
    ip_hash,
    accepted_at
  )
  values (
    p_user_id,
    'PRO_FREE_TRIAL_TERMS',
    trim(p_terms_version),
    true,
    coalesce(p_terms_summary, '{}'::jsonb),
    coalesce(p_user_agent, ''),
    coalesce(p_ip_hash, ''),
    v_now
  );

  select * into v_pro_plan
  from public.membership_plans
  where slug = 'pro'
  limit 1;

  update public.profiles
  set plan_tier = 'pro_trial',
      plan = 'Pro Plan++',
      trial_used = true,
      trial_started_at = v_now,
      trial_ends_at = v_ends,
      updated_at = v_now
  where id = p_user_id
  returning * into v_profile;

  perform public.sync_user_entitlements_internal(
    p_user_id,
    'TRIAL',
    null,
    coalesce(v_pro_plan.entitlements_config, '{"max_novels":-1,"max_chapters_per_novel":-1,"ai_cooldown_ms":2000,"style_persona_limit":3,"batch_proofread":true,"full_book_analysis":false,"ebook_export":false,"priority_ai":false}'::jsonb),
    v_now,
    v_ends
  );

  insert into public.trix_transactions (user_id, amount, type, action)
  values (p_user_id, 0, 'bonus', 'เปิดใช้งานทดลองใช้ Pro ฟรี 3 วัน');

  insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
  values (
    p_user_id,
    'TRIAL_ACTIVATED',
    'เปิดใช้งาน Pro Free Trial 3 วันสำเร็จ',
    'เริ่มทดลองใช้ฟีเจอร์ระดับ Pro ฟรี 72 ชั่วโมง ไม่มีค่าใช้จ่ายและไม่ต่ออายุอัตโนมัติ',
    jsonb_build_object('trial_started_at', v_now, 'trial_ends_at', v_ends, 'terms_version', trim(p_terms_version)),
    'trial_activated_' || to_char(v_now, 'YYYYMMDDHH24MISS')
  )
  on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

  return jsonb_build_object(
    'success', true,
    'plan_tier', 'pro_trial',
    'plan', 'Pro Plan++',
    'trial_used', true,
    'trial_started_at', v_now,
    'trial_ends_at', v_ends,
    'trix_balance', v_profile.trix_balance
  );
end;
$$;

create or replace function public.expire_subscriptions_if_needed(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_sub record;
  v_free_plan public.membership_plans%rowtype;
  v_expired_count integer := 0;
begin
  perform set_config('app.trusted_profile_write', 'on', true);

  select * into v_free_plan from public.membership_plans where slug = 'free' limit 1;

  for v_sub in
    select s.*, p.name as plan_name
    from public.user_subscriptions s
    join public.membership_plans p on p.id = s.plan_id
    where s.status = 'ACTIVE'
      and s.expires_at <= v_now
      and (p_user_id is null or s.user_id = p_user_id)
    for update of s
  loop
    update public.user_subscriptions
    set status = 'EXPIRED',
        updated_at = v_now
    where id = v_sub.id;

    update public.membership_entitlements
    set is_active = false,
        updated_at = v_now
    where user_id = v_sub.user_id
      and source_type = 'PAID'
      and subscription_id = v_sub.id;

    if not exists (
      select 1 from public.user_subscriptions s2
      where s2.user_id = v_sub.user_id
        and s2.status = 'ACTIVE'
        and s2.expires_at > v_now
    ) then
      update public.profiles
      set plan_tier = 'free',
          plan = 'Free Plan',
          updated_at = v_now
      where id = v_sub.user_id
        and plan_tier in ('pro', 'ultra');

      if v_free_plan.id is not null then
        perform public.sync_user_entitlements_internal(
          v_sub.user_id,
          'FREE',
          null,
          v_free_plan.entitlements_config,
          v_now,
          null
        );
      end if;
    end if;

    insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
    values (
      v_sub.user_id,
      'MEMBERSHIP_EXPIRED',
      'แพ็กเกจสมาชิกหมดอายุแล้ว',
      'แพ็กเกจ ' || v_sub.plan_name || ' ของคุณหมดอายุแล้ว ระบบได้ปรับบัญชีเป็น Free Plan สามารถต่ออายุได้ทุกเมื่อที่ต้องการ',
      jsonb_build_object('subscription_id', v_sub.id, 'plan_name', v_sub.plan_name, 'expired_at', v_sub.expires_at),
      'sub_expired_' || v_sub.id::text
    )
    on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

    insert into public.payment_audit_logs (order_id, user_id, actor_type, event_type, details)
    values (
      v_sub.order_id,
      v_sub.user_id,
      'SYSTEM',
      'SUBSCRIPTION_EXPIRED',
      jsonb_build_object('subscription_id', v_sub.id, 'expired_at', v_sub.expires_at)
    );

    v_expired_count := v_expired_count + 1;
  end loop;

  return jsonb_build_object('success', true, 'expired_subscriptions', v_expired_count);
end;
$$;

create or replace function public.expire_trial_if_needed(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_prof record;
  v_free_plan public.membership_plans%rowtype;
  v_expired_trials integer := 0;
  v_has_active_paid boolean;
begin
  perform set_config('app.trusted_profile_write', 'on', true);

  select * into v_free_plan from public.membership_plans where slug = 'free' limit 1;

  for v_prof in
    select id, trial_ends_at, plan_tier
    from public.profiles
    where plan_tier = 'pro_trial'
      and trial_ends_at is not null
      and trial_ends_at <= v_now
      and (p_user_id is null or id = p_user_id)
    for update
  loop
    select exists (
      select 1 from public.user_subscriptions
      where user_id = v_prof.id
        and status = 'ACTIVE'
        and expires_at > v_now
    ) into v_has_active_paid;

    if not v_has_active_paid then
      update public.profiles
      set plan_tier = 'free',
          plan = 'Free Plan',
          updated_at = v_now
      where id = v_prof.id;

      update public.membership_entitlements
      set is_active = false,
          updated_at = v_now
      where user_id = v_prof.id
        and source_type = 'TRIAL';

      if v_free_plan.id is not null then
        insert into public.membership_entitlements (
          user_id, source_type, subscription_id, entitlement_key, entitlement_value, is_active, valid_from, valid_until
        )
        select
          v_prof.id, 'FREE', null, key, value, true, v_now, null
        from jsonb_each(v_free_plan.entitlements_config)
        on conflict (user_id, entitlement_key) do update set
          source_type = excluded.source_type,
          subscription_id = null,
          entitlement_value = excluded.entitlement_value,
          is_active = true,
          valid_from = v_now,
          valid_until = null,
          updated_at = v_now;
      end if;

      insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
      values (
        v_prof.id,
        'TRIAL_EXPIRED',
        'หมดเวลาทดลองใช้ Pro ฟรี 3 วันแล้ว',
        'ระบบได้ปรับบัญชีกลับเป็น Free Plan โดยไม่มีค่าใช้จ่ายหรือการหักเงินใดๆ',
        jsonb_build_object('trial_ends_at', v_prof.trial_ends_at),
        'trial_expired_' || to_char(v_prof.trial_ends_at, 'YYYYMMDDHH24MISS')
      )
      on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

      v_expired_trials := v_expired_trials + 1;
    end if;
  end loop;

  return jsonb_build_object('success', true, 'expired_trials', v_expired_trials);
end;
$$;

create or replace function public.process_expiring_and_expired_memberships(p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_sub_res jsonb;
  v_trial_res jsonb;
  v_sub record;
  v_prof record;
begin
  v_sub_res := public.expire_subscriptions_if_needed(p_user_id);
  v_trial_res := public.expire_trial_if_needed(p_user_id);

  update public.membership_orders
  set status = 'EXPIRED',
      updated_at = v_now
  where status = 'PENDING'
    and expires_at <= v_now
    and (p_user_id is null or user_id = p_user_id);

  for v_sub in
    select s.id, s.user_id, s.expires_at, p.name as plan_name
    from public.user_subscriptions s
    join public.membership_plans p on p.id = s.plan_id
    where s.status = 'ACTIVE'
      and s.expires_at > v_now
      and s.expires_at <= v_now + interval '3 days'
      and (p_user_id is null or s.user_id = p_user_id)
  loop
    insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
    values (
      v_sub.user_id,
      'MEMBERSHIP_EXPIRING_SOON',
      'แพ็กเกจสมาชิกใกล้หมดอายุ',
      'แพ็กเกจ ' || v_sub.plan_name || ' จะหมดอายุเร็วๆ นี้ คุณสามารถต่ออายุล่วงหน้าได้โดยไม่เสียวันคงเหลือ',
      jsonb_build_object('subscription_id', v_sub.id, 'expires_at', v_sub.expires_at),
      'sub_soon_' || v_sub.id::text || '_' || to_char(v_sub.expires_at, 'YYYYMMDD')
    )
    on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;
  end loop;

  for v_prof in
    select id, trial_ends_at
    from public.profiles
    where plan_tier = 'pro_trial'
      and trial_ends_at > v_now
      and trial_ends_at <= v_now + interval '12 hours'
      and (p_user_id is null or id = p_user_id)
  loop
    insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
    values (
      v_prof.id,
      'TRIAL_EXPIRING_SOON',
      'เวลาทดลองใช้ Pro เหลือน้อยกว่า 12 ชั่วโมง',
      'สิทธิ์ทดลองใช้ Pro ฟรีใกล้สิ้นสุดแล้ว เมื่อครบกำหนดจะกลับสู่ Free Plan โดยไม่มีการหักเงิน',
      jsonb_build_object('trial_ends_at', v_prof.trial_ends_at),
      'trial_soon_' || to_char(v_prof.trial_ends_at, 'YYYYMMDDHH24MISS')
    )
    on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;
  end loop;

  return jsonb_build_object('success', true, 'subscriptions', v_sub_res, 'trials', v_trial_res);
end;
$$;

create or replace function public.claim_payment_verification_attempt(
  p_order_id uuid,
  p_user_id uuid,
  p_payment_method text,
  p_slip_storage_path text,
  p_slip_sha256 text default '',
  p_verification_provider text default 'easyslip_v2'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_order public.membership_orders%rowtype;
  v_attempt_id uuid := gen_random_uuid();
  v_payment_id uuid;
begin
  select * into v_order
  from public.membership_orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'http_status', 404, 'code', 'ORDER_NOT_FOUND', 'error', 'ไม่พบคำสั่งซื้อที่ระบุ');
  end if;

  if v_order.user_id <> p_user_id then
    return jsonb_build_object('success', false, 'http_status', 403, 'code', 'FORBIDDEN', 'error', 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้');
  end if;

  if v_order.status = 'PAID' then
    return jsonb_build_object('success', false, 'http_status', 409, 'code', 'ORDER_ALREADY_PAID', 'error', 'คำสั่งซื้อนี้ชำระเงินสำเร็จเรียบร้อยแล้ว');
  end if;

  if v_order.status in ('EXPIRED', 'CANCELLED', 'REJECTED') or v_order.expires_at <= v_now then
    if v_order.status = 'PENDING' and v_order.expires_at <= v_now then
      update public.membership_orders set status = 'EXPIRED', updated_at = v_now where id = v_order.id;
    end if;
    return jsonb_build_object('success', false, 'http_status', 400, 'code', 'ORDER_EXPIRED_OR_CLOSED', 'error', 'คำสั่งซื้อหมดอายุหรือถูกปิดแล้ว กรุณาสร้างคำสั่งซื้อใหม่');
  end if;

  if v_order.status = 'MANUAL_REVIEW' then
    return jsonb_build_object('success', false, 'http_status', 409, 'code', 'ORDER_IN_MANUAL_REVIEW', 'error', 'คำสั่งซื้อนี้อยู่ระหว่างรอการตรวจสอบจากเจ้าหน้าที่');
  end if;

  update public.membership_payments
  set verification_status = 'PROVIDER_ERROR',
      failure_reason = 'Previous verification attempt timed out',
      updated_at = v_now
  where order_id = v_order.id
    and verification_status = 'VERIFYING'
    and verifying_expires_at is not null
    and verifying_expires_at < v_now;

  if exists (
    select 1 from public.membership_payments
    where order_id = v_order.id and verification_status = 'VERIFYING'
  ) or v_order.status = 'VERIFYING' then
    if not exists (
      select 1 from public.membership_payments
      where order_id = v_order.id and verification_status = 'VERIFYING'
    ) and v_order.status = 'VERIFYING' then
      update public.membership_orders set status = 'PENDING', updated_at = v_now where id = v_order.id;
    else
      return jsonb_build_object('success', false, 'http_status', 409, 'code', 'VERIFICATION_IN_PROGRESS', 'error', 'ระบบกำลังตรวจสอบสลิปของคำสั่งซื้อนี้อยู่ กรุณารอสักครู่');
    end if;
  end if;

  if exists (
    select 1 from public.membership_payments
    where order_id = v_order.id and verification_status = 'VERIFIED'
  ) then
    return jsonb_build_object('success', false, 'http_status', 409, 'code', 'ALREADY_VERIFIED', 'error', 'คำสั่งซื้อนี้ได้รับการยืนยันแล้ว');
  end if;

  if coalesce(v_order.attempt_count, 0) >= 8 then
    update public.membership_orders set status = 'MANUAL_REVIEW', updated_at = v_now where id = v_order.id;
    return jsonb_build_object('success', false, 'http_status', 429, 'code', 'TOO_MANY_ATTEMPTS', 'error', 'ส่งหลักฐานครบจำนวนครั้งที่กำหนด คำสั่งซื้อนี้ถูกส่งให้เจ้าหน้าที่ตรวจสอบเพิ่มเติม');
  end if;

  insert into public.membership_payments (
    order_id,
    user_id,
    payment_method,
    amount,
    expected_amount_satang,
    currency,
    verification_provider,
    verification_attempt_id,
    verifying_expires_at,
    verification_status,
    slip_storage_path,
    slip_sha256
  )
  values (
    v_order.id,
    p_user_id,
    p_payment_method,
    v_order.amount,
    v_order.amount_satang,
    v_order.currency,
    coalesce(p_verification_provider, 'easyslip_v2'),
    v_attempt_id,
    v_now + interval '90 seconds',
    'VERIFYING',
    p_slip_storage_path,
    coalesce(p_slip_sha256, '')
  )
  returning id into v_payment_id;

  update public.membership_orders
  set status = 'VERIFYING',
      selected_channel = p_payment_method,
      attempt_count = v_order.attempt_count + 1,
      updated_at = v_now
  where id = v_order.id;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_id, actor_type, event_type, details)
  values
    (v_order.id, v_payment_id, p_user_id, p_user_id, 'USER', 'PAYMENT_SUBMITTED', jsonb_build_object('method', p_payment_method, 'attempt_id', v_attempt_id)),
    (v_order.id, v_payment_id, p_user_id, p_user_id, 'SYSTEM', 'VERIFICATION_STARTED', jsonb_build_object('provider', coalesce(p_verification_provider, 'easyslip_v2'), 'attempt_id', v_attempt_id));

  insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
  values (
    p_user_id,
    'PAYMENT_SUBMITTED',
    'ส่งหลักฐานการชำระเงินแล้ว',
    'ได้รับสลิปสำหรับคำสั่งซื้อ ' || v_order.order_code || ' แล้ว ระบบกำลังดำเนินการตรวจสอบ',
    jsonb_build_object('order_id', v_order.id, 'order_code', v_order.order_code, 'payment_id', v_payment_id),
    'submitted_' || v_payment_id::text
  )
  on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'attempt_id', v_attempt_id,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'amount', v_order.amount,
    'amount_satang', v_order.amount_satang,
    'currency', v_order.currency,
    'expires_at', v_order.expires_at
  );
end;
$$;

create or replace function public.activate_membership_core_internal(
  p_order_id uuid,
  p_payment_id uuid,
  p_verified_amount_satang bigint,
  p_trans_ref text,
  p_provider_response jsonb,
  p_actor_id uuid,
  p_actor_type text,
  p_review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_order public.membership_orders%rowtype;
  v_payment public.membership_payments%rowtype;
  v_plan public.membership_plans%rowtype;
  v_active_sub public.user_subscriptions%rowtype;
  v_prev_plan public.membership_plans%rowtype;
  v_existing_sub public.user_subscriptions%rowtype;
  v_profile public.profiles%rowtype;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_duration_days integer;
  v_trix_grant integer;
  v_new_tier_rank integer;
  v_new_price_satang bigint;
  v_prev_tier_rank integer;
  v_prev_price_satang bigint;
  v_remaining_pro_secs numeric;
  v_bonus_ultra_secs bigint;
  v_txn_id uuid;
  v_sub_id uuid;
  v_entitlements jsonb;
  v_plan_slug text;
  v_plan_name text;
begin
  perform set_config('app.trusted_profile_write', 'on', true);

  select * into v_order from public.membership_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  select * into v_payment from public.membership_payments where id = p_payment_id for update;
  if not found or v_payment.order_id <> v_order.id then
    raise exception 'Payment not found for order';
  end if;

  if v_order.status = 'PAID' and v_payment.verification_status = 'VERIFIED' then
    select * into v_existing_sub from public.user_subscriptions where order_id = v_order.id;
    return jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', v_order.id,
      'subscription_id', v_existing_sub.id,
      'expires_at', v_existing_sub.expires_at
    );
  end if;

  if v_order.status = 'PAID' then
    raise exception 'Order already paid by another payment record';
  end if;

  if coalesce(trim(p_trans_ref), '') <> '' then
    if exists (
      select 1 from public.membership_payments
      where transaction_reference = trim(p_trans_ref)
        and id <> v_payment.id
    ) then
      raise exception 'Transaction reference already used';
    end if;
  end if;

  select * into v_plan from public.membership_plans where id = v_order.plan_id;

  v_plan_slug := coalesce(v_order.plan_snapshot->>'slug', v_plan.slug);
  v_plan_name := coalesce(v_order.plan_snapshot->>'name', v_plan.name);
  v_duration_days := coalesce((v_order.plan_snapshot->>'duration_days')::integer, v_plan.duration_days);
  v_trix_grant := coalesce((v_order.plan_snapshot->>'trix_grant')::integer, v_plan.trix_grant);
  v_new_tier_rank := coalesce((v_order.plan_snapshot->>'tier_rank')::integer, v_plan.tier_rank);
  v_new_price_satang := greatest(1, v_order.amount_satang);
  v_entitlements := coalesce(v_order.plan_snapshot->'entitlements_config', v_plan.entitlements_config);

  update public.membership_payments
  set verification_status = 'VERIFIED',
      transaction_reference = nullif(trim(coalesce(p_trans_ref, '')), ''),
      detected_trans_ref = coalesce(nullif(trim(coalesce(p_trans_ref, '')), ''), detected_trans_ref),
      verified_amount_satang = p_verified_amount_satang,
      provider_response = coalesce(p_provider_response, provider_response),
      reviewed_by = case when p_actor_type = 'ADMIN' then p_actor_id else reviewed_by end,
      review_note = coalesce(p_review_note, review_note),
      verifying_expires_at = null,
      verified_at = v_now,
      updated_at = v_now
  where id = v_payment.id;

  update public.membership_orders
  set status = 'PAID',
      paid_at = v_now,
      updated_at = v_now
  where id = v_order.id;

  select * into v_active_sub
  from public.user_subscriptions
  where user_id = v_order.user_id
    and status = 'ACTIVE'
  for update;

  if found and v_active_sub.expires_at > v_now then
    select * into v_prev_plan from public.membership_plans where id = v_active_sub.plan_id;
    v_prev_tier_rank := coalesce(v_prev_plan.tier_rank, 0);
    v_prev_price_satang := greatest(1, coalesce(v_prev_plan.price_satang, 24900));

    update public.user_subscriptions
    set status = 'SUPERSEDED',
        updated_at = v_now
    where id = v_active_sub.id;

    v_starts_at := v_now;

    if v_new_tier_rank = v_prev_tier_rank then
      v_expires_at := v_active_sub.expires_at + make_interval(days => v_duration_days);
    elsif v_new_tier_rank > v_prev_tier_rank then
      v_remaining_pro_secs := greatest(0::numeric, extract(epoch from (v_active_sub.expires_at - v_now)));
      v_bonus_ultra_secs := floor(v_remaining_pro_secs * (v_prev_price_satang::numeric / v_new_price_satang::numeric))::bigint;
      v_expires_at := v_now + make_interval(days => v_duration_days) + (v_bonus_ultra_secs * interval '1 second');
    else
      raise exception 'Strict No-Downgrade Policy violated';
    end if;
  else
    if found and v_active_sub.expires_at <= v_now then
      update public.user_subscriptions
      set status = 'EXPIRED',
          updated_at = v_now
      where id = v_active_sub.id;
    end if;
    v_starts_at := v_now;
    v_expires_at := v_now + make_interval(days => v_duration_days);
  end if;

  select * into v_profile
  from public.profiles
  where id = v_order.user_id
  for update;

  if not found then
    raise exception 'User profile missing';
  end if;

  if v_trix_grant > 0 then
    insert into public.trix_transactions (user_id, amount, type, action)
    values (
      v_order.user_id,
      v_trix_grant,
      'topup',
      'เปิดใช้งานแพ็กเกจ ' || v_plan_name || ' (' || v_order.order_code || ')'
    )
    returning id into v_txn_id;

    update public.profiles
    set plan = v_plan_name,
        plan_tier = v_plan_slug,
        trix_balance = coalesce(trix_balance, 0) + v_trix_grant,
        trial_used = true,
        updated_at = v_now
    where id = v_order.user_id
    returning * into v_profile;
  else
    update public.profiles
    set plan = v_plan_name,
        plan_tier = v_plan_slug,
        trial_used = true,
        updated_at = v_now
    where id = v_order.user_id
    returning * into v_profile;
  end if;

  insert into public.user_subscriptions (
    user_id,
    plan_id,
    order_id,
    starts_at,
    expires_at,
    status,
    trix_grant_txn_id,
    trix_granted,
    trix_granted_at
  )
  values (
    v_order.user_id,
    v_order.plan_id,
    v_order.id,
    v_starts_at,
    v_expires_at,
    'ACTIVE',
    v_txn_id,
    v_trix_grant,
    case when v_trix_grant > 0 then v_now else null end
  )
  returning id into v_sub_id;

  perform public.sync_user_entitlements_internal(
    v_order.user_id,
    'PAID',
    v_sub_id,
    v_entitlements,
    v_starts_at,
    v_expires_at
  );

  insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
  values
    (
      v_order.user_id,
      'PAYMENT_VERIFIED',
      'ยืนยันการชำระเงินสำเร็จ',
      'ยอดชำระ ' || v_order.amount::text || ' บาท สำหรับคำสั่งซื้อ ' || v_order.order_code || ' ผ่านการตรวจสอบแล้ว',
      jsonb_build_object('order_id', v_order.id, 'order_code', v_order.order_code, 'payment_id', v_payment.id),
      'pay_ok_' || v_order.id::text
    ),
    (
      v_order.user_id,
      'MEMBERSHIP_ACTIVATED',
      'เปิดใช้งาน ' || v_plan_name || ' สำเร็จ!',
      'สิทธิ์ ' || v_plan_name || ' และ +' || v_trix_grant::text || ' Trix พร้อมใช้งานแล้ว',
      jsonb_build_object('subscription_id', v_sub_id, 'plan_name', v_plan_name, 'plan_slug', v_plan_slug, 'expires_at', v_expires_at, 'trix_granted', v_trix_grant),
      'sub_ok_' || v_sub_id::text
    )
  on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_id, actor_type, event_type, details)
  values
    (v_order.id, v_payment.id, v_order.user_id, p_actor_id, p_actor_type, 'PAYMENT_APPROVED', jsonb_build_object('trans_ref', p_trans_ref, 'amount_satang', p_verified_amount_satang, 'review_note', p_review_note)),
    (v_order.id, v_payment.id, v_order.user_id, p_actor_id, p_actor_type, 'MEMBERSHIP_ACTIVATED', jsonb_build_object('subscription_id', v_sub_id, 'plan_slug', v_plan_slug, 'starts_at', v_starts_at, 'expires_at', v_expires_at, 'trix_granted', v_trix_grant));

  return jsonb_build_object(
    'success', true,
    'already_processed', false,
    'order_id', v_order.id,
    'payment_id', v_payment.id,
    'subscription_id', v_sub_id,
    'plan', v_plan_name,
    'plan_tier', v_plan_slug,
    'starts_at', v_starts_at,
    'expires_at', v_expires_at,
    'trix_granted', v_trix_grant,
    'trix_balance', v_profile.trix_balance
  );
end;
$$;

create or replace function public.finalize_membership_payment(
  p_order_id uuid,
  p_payment_id uuid,
  p_attempt_id uuid,
  p_verified_amount_satang bigint,
  p_trans_ref text,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_order public.membership_orders%rowtype;
  v_payment public.membership_payments%rowtype;
begin
  select * into v_order from public.membership_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  select * into v_payment from public.membership_payments where id = p_payment_id for update;
  if not found or v_payment.order_id <> v_order.id then
    raise exception 'Payment not found';
  end if;

  if v_order.status = 'PAID' and v_payment.verification_status = 'VERIFIED' then
    return public.activate_membership_core_internal(
      p_order_id, p_payment_id, p_verified_amount_satang, p_trans_ref, p_provider_response, v_order.user_id, 'SYSTEM', null
    );
  end if;

  if v_payment.verification_attempt_id <> p_attempt_id then
    raise exception 'Attempt ID mismatch';
  end if;

  if v_payment.verification_status <> 'VERIFYING' then
    raise exception 'Payment is not in VERIFYING state';
  end if;

  if v_order.expires_at <= v_now then
    raise exception 'Order expired before finalization';
  end if;

  if p_verified_amount_satang <> v_order.amount_satang then
    raise exception 'Amount mismatch at finalize';
  end if;

  if coalesce(trim(p_trans_ref), '') = '' then
    raise exception 'Transaction reference required';
  end if;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_id, actor_type, event_type, details)
  values (v_order.id, v_payment.id, v_order.user_id, null, 'EASYSLIP', 'VERIFICATION_PASSED', jsonb_build_object('attempt_id', p_attempt_id, 'trans_ref', trim(p_trans_ref), 'amount_satang', p_verified_amount_satang));

  return public.activate_membership_core_internal(
    p_order_id,
    p_payment_id,
    p_verified_amount_satang,
    p_trans_ref,
    p_provider_response,
    v_order.user_id,
    'SYSTEM',
    null
  );
end;
$$;

create or replace function public.reject_payment_attempt(
  p_order_id uuid,
  p_payment_id uuid,
  p_attempt_id uuid,
  p_error_code text,
  p_failure_reason text,
  p_detected_trans_ref text default null,
  p_provider_response jsonb default null,
  p_target_payment_status text default 'REJECTED'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_order public.membership_orders%rowtype;
  v_payment public.membership_payments%rowtype;
  v_next_order_status text;
  v_clean_status text;
begin
  if p_target_payment_status not in ('REJECTED', 'PENDING_BANK', 'PROVIDER_ERROR') then
    raise exception 'Invalid payment failure target status';
  end if;
  v_clean_status := p_target_payment_status;

  select * into v_order from public.membership_orders where id = p_order_id for update;
  select * into v_payment from public.membership_payments where id = p_payment_id for update;

  if not found or v_payment.order_id <> v_order.id then
    raise exception 'Order or payment not found';
  end if;

  if v_payment.verification_status = 'VERIFIED' or v_order.status = 'PAID' then
    return jsonb_build_object('success', true, 'already_verified', true);
  end if;

  if v_payment.verification_attempt_id <> p_attempt_id then
    raise exception 'Attempt ID mismatch';
  end if;

  update public.membership_payments
  set verification_status = v_clean_status,
      detected_trans_ref = nullif(trim(coalesce(p_detected_trans_ref, '')), ''),
      provider_error_code = p_error_code,
      failure_reason = p_failure_reason,
      provider_response = coalesce(p_provider_response, provider_response),
      verifying_expires_at = null,
      updated_at = v_now
  where id = v_payment.id;

  v_next_order_status := case when v_order.expires_at <= v_now then 'EXPIRED' else 'PENDING' end;

  update public.membership_orders
  set status = v_next_order_status,
      updated_at = v_now
  where id = v_order.id;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_type, event_type, details)
  values (
    v_order.id,
    v_payment.id,
    v_order.user_id,
    'EASYSLIP',
    'VERIFICATION_FAILED',
    jsonb_build_object('attempt_id', p_attempt_id, 'status', v_clean_status, 'error_code', p_error_code, 'reason', p_failure_reason, 'detected_trans_ref', p_detected_trans_ref)
  );

  if v_clean_status = 'REJECTED' then
    insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
    values (
      v_order.user_id,
      'PAYMENT_FAILED',
      'ตรวจสอบสลิปไม่ผ่าน',
      coalesce(p_failure_reason, 'ไม่สามารถตรวจสอบสลิปนี้ได้ กรุณาตรวจสอบรูปภาพและลองอีกครั้ง'),
      jsonb_build_object('order_id', v_order.id, 'order_code', v_order.order_code, 'payment_id', v_payment.id, 'can_retry', v_next_order_status = 'PENDING'),
      'fail_' || v_payment.id::text
    )
    on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;
  end if;

  return jsonb_build_object(
    'success', true,
    'payment_status', v_clean_status,
    'order_status', v_next_order_status,
    'can_retry', v_next_order_status = 'PENDING'
  );
end;
$$;

create or replace function public.mark_payment_manual_review(
  p_order_id uuid,
  p_payment_id uuid,
  p_attempt_id uuid,
  p_reason text,
  p_detected_trans_ref text default null,
  p_provider_response jsonb default null,
  p_error_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_order public.membership_orders%rowtype;
  v_payment public.membership_payments%rowtype;
begin
  select * into v_order from public.membership_orders where id = p_order_id for update;
  select * into v_payment from public.membership_payments where id = p_payment_id for update;

  if not found or v_payment.order_id <> v_order.id then
    raise exception 'Order or payment not found';
  end if;

  if v_payment.verification_status = 'VERIFIED' or v_order.status = 'PAID' then
    return jsonb_build_object('success', true, 'already_verified', true);
  end if;

  if v_payment.verification_attempt_id <> p_attempt_id then
    raise exception 'Attempt ID mismatch';
  end if;

  update public.membership_payments
  set verification_status = 'MANUAL_REVIEW',
      detected_trans_ref = coalesce(nullif(trim(coalesce(p_detected_trans_ref, '')), ''), detected_trans_ref),
      provider_error_code = p_error_code,
      failure_reason = p_reason,
      provider_response = coalesce(p_provider_response, provider_response),
      verifying_expires_at = null,
      updated_at = v_now
  where id = v_payment.id;

  update public.membership_orders
  set status = 'MANUAL_REVIEW',
      updated_at = v_now
  where id = v_order.id;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_type, event_type, details)
  values (
    v_order.id,
    v_payment.id,
    v_order.user_id,
    'SYSTEM',
    'VERIFICATION_FAILED',
    jsonb_build_object('attempt_id', p_attempt_id, 'status', 'MANUAL_REVIEW', 'reason', p_reason, 'detected_trans_ref', p_detected_trans_ref)
  );

  insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
  values (
    v_order.user_id,
    'MANUAL_REVIEW',
    'กำลังตรวจสอบหลักฐานการโอนเพิ่มเติม',
    'ได้รับหลักฐานการชำระเงินสำหรับ ' || v_order.order_code || ' แล้ว กำลังตรวจสอบเพิ่มเติม',
    jsonb_build_object('order_id', v_order.id, 'order_code', v_order.order_code, 'payment_id', v_payment.id),
    'manual_' || v_payment.id::text
  )
  on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

  return jsonb_build_object('success', true, 'payment_status', 'MANUAL_REVIEW', 'order_status', 'MANUAL_REVIEW');
end;
$$;

create or replace function public.admin_approve_membership_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_review_note text,
  p_override_trans_ref text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.membership_payments%rowtype;
  v_order public.membership_orders%rowtype;
  v_trans_ref text;
  v_result jsonb;
begin
  if not public.is_admin(p_admin_id) then
    raise exception 'Unauthorized admin access';
  end if;

  if coalesce(trim(p_review_note), '') = '' then
    raise exception 'Review note is required for manual approval';
  end if;

  select * into v_payment from public.membership_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found';
  end if;

  select * into v_order from public.membership_orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_payment.verification_status not in ('MANUAL_REVIEW', 'PENDING_BANK', 'REJECTED', 'PROVIDER_ERROR') then
    if v_payment.verification_status = 'VERIFIED' then
      return public.activate_membership_core_internal(
        v_order.id, v_payment.id, v_order.amount_satang, v_payment.transaction_reference, null, p_admin_id, 'ADMIN', p_review_note
      );
    end if;
    raise exception 'Payment state % cannot be manually approved right now', v_payment.verification_status;
  end if;

  v_trans_ref := nullif(trim(coalesce(p_override_trans_ref, v_payment.detected_trans_ref, '')), '');

  v_result := public.activate_membership_core_internal(
    v_order.id,
    v_payment.id,
    v_order.amount_satang,
    v_trans_ref,
    null,
    p_admin_id,
    'ADMIN',
    trim(p_review_note)
  );

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_id, actor_type, event_type, details)
  values (
    v_order.id,
    v_payment.id,
    v_order.user_id,
    p_admin_id,
    'ADMIN',
    'ADMIN_INTERVENTION',
    jsonb_build_object('action', 'manual_approve', 'review_note', trim(p_review_note), 'trans_ref', v_trans_ref)
  );

  return v_result;
end;
$$;

create or replace function public.admin_reject_membership_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_review_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_payment public.membership_payments%rowtype;
  v_order public.membership_orders%rowtype;
begin
  if not public.is_admin(p_admin_id) then
    raise exception 'Unauthorized admin access';
  end if;

  if coalesce(trim(p_review_note), '') = '' then
    raise exception 'Review note is required for manual rejection';
  end if;

  select * into v_payment from public.membership_payments where id = p_payment_id for update;
  if not found then
    raise exception 'Payment not found';
  end if;

  select * into v_order from public.membership_orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_payment.verification_status = 'VERIFIED' or v_order.status = 'PAID' then
    raise exception 'Verified payments cannot be rejected';
  end if;

  update public.membership_payments
  set verification_status = 'REJECTED',
      reviewed_by = p_admin_id,
      review_note = trim(p_review_note),
      failure_reason = trim(p_review_note),
      verifying_expires_at = null,
      updated_at = v_now
  where id = v_payment.id;

  update public.membership_orders
  set status = 'REJECTED',
      updated_at = v_now
  where id = v_order.id;

  insert into public.payment_audit_logs (order_id, payment_id, user_id, actor_id, actor_type, event_type, details)
  values
    (v_order.id, v_payment.id, v_order.user_id, p_admin_id, 'ADMIN', 'PAYMENT_REJECTED', jsonb_build_object('review_note', trim(p_review_note))),
    (v_order.id, v_payment.id, v_order.user_id, p_admin_id, 'ADMIN', 'ADMIN_INTERVENTION', jsonb_build_object('action', 'manual_reject', 'review_note', trim(p_review_note)));

  insert into public.notifications (user_id, type, title, message, metadata, dedup_key)
  values (
    v_order.user_id,
    'PAYMENT_FAILED',
    'การตรวจสอบการชำระเงินไม่ผ่าน',
    'คำสั่งซื้อ ' || v_order.order_code || ' ไม่ผ่านการตรวจสอบ: ' || trim(p_review_note),
    jsonb_build_object('order_id', v_order.id, 'order_code', v_order.order_code, 'payment_id', v_payment.id),
    'admin_reject_' || v_payment.id::text
  )
  on conflict (user_id, type, dedup_key) where dedup_key is not null do nothing;

  return jsonb_build_object('success', true, 'payment_status', 'REJECTED', 'order_status', 'REJECTED');
end;
$$;

create or replace function public.get_public_payment_channels()
returns table (
  id uuid,
  channel_type text,
  display_name text,
  bank_name text,
  account_name text,
  account_number text,
  promptpay_id text,
  qr_storage_path text,
  instructions text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.channel_type,
    c.display_name,
    c.bank_name,
    c.account_name,
    c.account_number,
    c.promptpay_id,
    c.qr_storage_path,
    c.instructions
  from public.payment_channel_settings c
  where c.is_enabled = true
  order by c.channel_type asc;
$$;

create or replace function public.user_has_entitlement(p_user_id uuid, p_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_ent record;
begin
  if coalesce((select auth.role()), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin') and (auth.uid() is null or auth.uid() <> p_user_id) then
    return jsonb_build_object('allowed', false);
  end if;

  select entitlement_value, source_type, valid_until
  into v_ent
  from public.membership_entitlements
  where user_id = p_user_id
    and entitlement_key = p_key
    and is_active = true
    and (valid_until is null or valid_until > v_now)
  limit 1;

  if not found then
    return jsonb_build_object('allowed', false);
  end if;

  return jsonb_build_object(
    'allowed', true,
    'value', v_ent.entitlement_value,
    'source_type', v_ent.source_type,
    'valid_until', v_ent.valid_until
  );
end;
$$;

alter table public.admin_users enable row level security;
alter table public.user_consents enable row level security;
alter table public.membership_plans enable row level security;
alter table public.membership_orders enable row level security;
alter table public.membership_payments enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.membership_entitlements enable row level security;
alter table public.notifications enable row level security;
alter table public.payment_audit_logs enable row level security;
alter table public.payment_channel_settings enable row level security;
alter table public.payment_channel_verification_rules enable row level security;

drop policy if exists "Users can view own admin record" on public.admin_users;
create policy "Users can view own admin record" on public.admin_users
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own consents" on public.user_consents;
create policy "Users can view own consents" on public.user_consents
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Anyone can view active membership plans" on public.membership_plans;
create policy "Anyone can view active membership plans" on public.membership_plans
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can manage membership plans" on public.membership_plans;
create policy "Admins can manage membership plans" on public.membership_plans
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists "Users can view own membership orders" on public.membership_orders;
create policy "Users can view own membership orders" on public.membership_orders
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

drop policy if exists "Users can view own membership payments" on public.membership_payments;
create policy "Users can view own membership payments" on public.membership_payments
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

drop policy if exists "Users can view own subscriptions" on public.user_subscriptions;
create policy "Users can view own subscriptions" on public.user_subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

drop policy if exists "Users can view own entitlements" on public.membership_entitlements;
create policy "Users can view own entitlements" on public.membership_entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can view payment audit logs" on public.payment_audit_logs;
create policy "Admins can view payment audit logs" on public.payment_audit_logs
  for select to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Admins can view channel settings" on public.payment_channel_settings;
create policy "Admins can view channel settings" on public.payment_channel_settings
  for select to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Owners can manage channel settings" on public.payment_channel_settings;
create policy "Owners can manage channel settings" on public.payment_channel_settings
  for all to authenticated
  using (public.get_admin_role((select auth.uid())) = 'owner')
  with check (public.get_admin_role((select auth.uid())) = 'owner');

drop policy if exists "Admins can view channel rules" on public.payment_channel_verification_rules;
create policy "Admins can view channel rules" on public.payment_channel_verification_rules
  for select to authenticated
  using (public.is_admin((select auth.uid())));

drop policy if exists "Owners can manage channel rules" on public.payment_channel_verification_rules;
create policy "Owners can manage channel rules" on public.payment_channel_verification_rules
  for all to authenticated
  using (public.get_admin_role((select auth.uid())) = 'owner')
  with check (public.get_admin_role((select auth.uid())) = 'owner');

revoke all on public.admin_users, public.user_consents, public.membership_plans, public.membership_orders, public.membership_payments, public.user_subscriptions, public.membership_entitlements, public.notifications, public.payment_audit_logs, public.payment_channel_settings, public.payment_channel_verification_rules from anon, authenticated;
grant select on public.membership_plans to anon, authenticated;
grant select on public.admin_users, public.user_consents, public.membership_orders, public.membership_payments, public.user_subscriptions, public.membership_entitlements, public.payment_audit_logs, public.payment_channel_settings, public.payment_channel_verification_rules to authenticated;
grant select, update on public.notifications to authenticated;
revoke insert, update, delete on public.trix_transactions from anon, authenticated;
grant select on public.trix_transactions to authenticated;
drop policy if exists "Users can insert own trix transactions" on public.trix_transactions;
grant all on public.admin_users, public.user_consents, public.membership_plans, public.membership_orders, public.membership_payments, public.user_subscriptions, public.membership_entitlements, public.notifications, public.payment_audit_logs, public.payment_channel_settings, public.payment_channel_verification_rules to service_role;
grant all on all sequences in schema public to service_role;

revoke all on function public.set_updated_at_timestamp() from public, anon, authenticated;
revoke all on function public.protect_profile_system_columns() from public, anon, authenticated;
revoke all on function public.prevent_paid_order_regression() from public, anon, authenticated;
revoke all on function public.prevent_verified_payment_regression() from public, anon, authenticated;
revoke all on function public.protect_notification_columns() from public, anon, authenticated;
revoke all on function public.get_admin_role(uuid) from public, anon;
grant execute on function public.get_admin_role(uuid) to authenticated, service_role;
revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
revoke all on function public.deduct_trix_safely(uuid, integer, text) from public, anon;
grant execute on function public.deduct_trix_safely(uuid, integer, text) to authenticated, service_role;
revoke all on function public.claim_daily_trix_safely() from public, anon;
grant execute on function public.claim_daily_trix_safely() to authenticated, service_role;
revoke all on function public.sync_user_entitlements_internal(uuid, text, uuid, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.sync_user_entitlements_internal(uuid, text, uuid, jsonb, timestamptz, timestamptz) to service_role;
revoke all on function public.activate_pro_trial_safely(uuid, text, boolean, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.activate_pro_trial_safely(uuid, text, boolean, jsonb, text, text) to service_role;
revoke all on function public.expire_subscriptions_if_needed(uuid) from public, anon, authenticated;
grant execute on function public.expire_subscriptions_if_needed(uuid) to service_role;
revoke all on function public.expire_trial_if_needed(uuid) from public, anon, authenticated;
grant execute on function public.expire_trial_if_needed(uuid) to service_role;
revoke all on function public.process_expiring_and_expired_memberships(uuid) from public, anon, authenticated;
grant execute on function public.process_expiring_and_expired_memberships(uuid) to service_role;
revoke all on function public.claim_payment_verification_attempt(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_payment_verification_attempt(uuid, uuid, text, text, text, text) to service_role;
revoke all on function public.activate_membership_core_internal(uuid, uuid, bigint, text, jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.activate_membership_core_internal(uuid, uuid, bigint, text, jsonb, uuid, text, text) to service_role;
revoke all on function public.finalize_membership_payment(uuid, uuid, uuid, bigint, text, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_membership_payment(uuid, uuid, uuid, bigint, text, jsonb) to service_role;
revoke all on function public.reject_payment_attempt(uuid, uuid, uuid, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.reject_payment_attempt(uuid, uuid, uuid, text, text, text, jsonb, text) to service_role;
revoke all on function public.mark_payment_manual_review(uuid, uuid, uuid, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.mark_payment_manual_review(uuid, uuid, uuid, text, text, jsonb, text) to service_role;
revoke all on function public.admin_approve_membership_payment(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_approve_membership_payment(uuid, uuid, text, text) to service_role;
revoke all on function public.admin_reject_membership_payment(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_reject_membership_payment(uuid, uuid, text) to service_role;
revoke all on function public.get_public_payment_channels() from public, anon;
grant execute on function public.get_public_payment_channels() to authenticated, service_role;
revoke all on function public.user_has_entitlement(uuid, text) from public, anon;
grant execute on function public.user_has_entitlement(uuid, text) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'membership-payment-slips',
  'membership-payment-slips',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

drop policy if exists "Owners and admins can read membership slips" on storage.objects;
create policy "Owners and admins can read membership slips" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'membership-payment-slips'
    and (
      public.is_admin((select auth.uid()))
      or (
        name like 'slips/%'
        and (storage.foldername(name))[2] = ((select auth.uid())::text)
      )
    )
  );

insert into public.membership_plans (
  slug, name, description, price, currency, duration_days, trix_grant, tier_rank, features, entitlements_config, sort_order, is_active
)
values
  (
    'free',
    'Free Plan',
    'เครื่องมือพื้นฐานครบครันสำหรับเริ่มเขียนนิยายเรื่องแรก',
    0.00,
    'THB',
    0,
    0,
    0,
    '[
      "สร้างนิยายได้ 3 เรื่อง สูงสุด 5 ตอน",
      "แก้คำผิด & เช็คคำพ้องเสียง (1 Trix / ครั้ง)",
      "เกลาสำนวนประโยคตามบริบท (3 Trix / ครั้ง)",
      "คลังคำศัพท์นิยายเปิดใช้ฟรีทุกแพลน",
      "ระบบบันทึกงานเขียนอัตโนมัติบนคลาวด์"
    ]'::jsonb,
    '{
      "max_novels": 3,
      "max_chapters_per_novel": 5,
      "ai_cooldown_ms": 4000,
      "style_persona_limit": 1,
      "batch_proofread": false,
      "full_book_analysis": false,
      "ebook_export": false,
      "priority_ai": false
    }'::jsonb,
    1,
    true
  ),
  (
    'pro',
    'Pro Plan++',
    'ปลดล็อกผู้ช่วยบรรณาธิการและระบบจำบริบทข้ามตอนเต็มรูปแบบ',
    249.00,
    'THB',
    30,
    400,
    2,
    '[
      "สร้างนิยายและตอนไม่จำกัด + AI จำบริบท 15 ตอน",
      "Character & Lore Bible ไม่จำกัดตัวละคร",
      "Style Persona บันทึกโปรไฟล์สำนวนได้ 3 โปรไฟล์",
      "Batch Proofread ตรวจทั้งตอน & Custom Dictionary",
      "ประวัติการแก้ไข (Version History) ย้อนหลัง 30 วัน",
      "ลดระยะเวลา Cooldown เหลือเพียง 2 วินาที"
    ]'::jsonb,
    '{
      "max_novels": -1,
      "max_chapters_per_novel": -1,
      "ai_cooldown_ms": 2000,
      "style_persona_limit": 3,
      "batch_proofread": true,
      "full_book_analysis": false,
      "ebook_export": false,
      "priority_ai": false
    }'::jsonb,
    2,
    true
  ),
  (
    'ultra',
    'Ultra Plan',
    'ได้สิทธิ์ทั้งหมดของ Pro Plan++ พร้อมเครื่องมือระดับมืออาชีพ',
    599.00,
    'THB',
    30,
    1000,
    3,
    '[
      "ได้สิทธิ์ทั้งหมดของ Pro Plan++ ครบถ้วน",
      "วิเคราะห์พล็อตทั้งเล่ม (ฟรี 10 ครั้ง/เดือน)",
      "แปลภาษาทั้งตอนโดยคงบริบทตัวละคร",
      "จัดหน้าและส่งออกไฟล์ E-Book (EPUB / PDF)",
      "เข้าถึงโมเดล AI สปีดสูงสุด (High-Priority AI)"
    ]'::jsonb,
    '{
      "max_novels": -1,
      "max_chapters_per_novel": -1,
      "ai_cooldown_ms": 1000,
      "style_persona_limit": -1,
      "batch_proofread": true,
      "full_book_analysis": true,
      "ebook_export": true,
      "priority_ai": true
    }'::jsonb,
    3,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_days = excluded.duration_days,
  trix_grant = excluded.trix_grant,
  tier_rank = excluded.tier_rank,
  features = excluded.features,
  entitlements_config = excluded.entitlements_config,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

insert into public.payment_channel_settings (
  channel_type, is_enabled, display_name, bank_name, account_name, account_number, promptpay_id, qr_storage_path, instructions
)
values
  (
    'promptpay',
    false,
    'PromptPay QR Code',
    '',
    '',
    '',
    '',
    '',
    'สแกน QR Code เพื่อโอนยอดเงินให้ตรงตามจำนวนบาทและสตางค์ที่ระบุ จากนั้นอัปโหลดสลิปเพื่อตรวจสอบอัตโนมัติ'
  ),
  (
    'bank_transfer',
    false,
    'โอนเงินผ่านบัญชีธนาคาร (Bank Transfer)',
    '',
    '',
    '',
    '',
    '',
    'โอนเงินเข้าบัญชีด้านบนให้ตรงยอดที่ระบุ จากนั้นอัปโหลดสลิปที่มี QR Code ชัดเจนเพื่อตรวจสอบอัตโนมัติ'
  )
on conflict (channel_type) do nothing;

insert into public.payment_channel_verification_rules (channel_id)
select id from public.payment_channel_settings
on conflict (channel_id) do nothing;
