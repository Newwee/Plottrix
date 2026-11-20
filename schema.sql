-- ==============================================================================
-- PLOTTRIX AI WRITING WORKSPACE - SUPABASE DATABASE SCHEMA
-- Production-Ready Migration Script for Vercel Pro & Supabase
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE (Linked with Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text default '',
  avatar_url text default '',
  plan text default 'Free Plan' check (plan in ('Free Plan', 'Pro Plan', 'Pro Plan++', 'Ultra Plan')),
  plan_tier text default 'free' check (plan_tier in ('free', 'pro_trial', 'pro', 'ultra')),
  trial_used boolean default false,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trix_balance integer default 30 check (trix_balance >= 0),
  last_claim_date text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table was already created
alter table public.profiles
  add column if not exists plan_tier text default 'free',
  add column if not exists trial_used boolean default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

-- 3. NOVELS TABLE
create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'นิยายเรื่องใหม่',
  synopsis text default '',
  genre text default 'ระทึกขวัญ / สืบสวน',
  pov text default 'มุมมองบุคคลที่ 3 (สรรพนาม เขา/เธอ)',
  cover_url text default '',
  is_favorite boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. CHAPTERS TABLE
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_number integer not null default 1,
  title text default '',
  pages jsonb not null default '[""]'::jsonb,
  word_count integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. CHARACTERS TABLE (Character Bible)
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text default 'ตัวเอก',
  description text default '',
  traits text default '',
  secrets text default '',
  speech_pattern text default '',
  avatar_url text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. USER SKILLS TABLE (Custom AI Skills)
create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text default 'custom',
  prompt text not null,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. PERSONAS TABLE (Style Persona)
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  prompt_modifier text default '',
  sample_text text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. CUSTOM DICTIONARY TABLE
create table if not exists public.custom_dictionary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  description text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. VERSION HISTORY TABLE
create table if not exists public.version_history (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  novel_id uuid references public.novels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_index integer default 0,
  content text not null,
  summary text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. TRIX TRANSACTIONS LOG
create table if not exists public.trix_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('claim', 'deduct', 'topup', 'bonus')),
  action text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXES FOR FOREIGN KEYS & PERFORMANCE
-- ==============================================================================
create index if not exists idx_novels_user_id on public.novels(user_id);
create index if not exists idx_chapters_novel_id on public.chapters(novel_id);
create index if not exists idx_chapters_user_id on public.chapters(user_id);
create index if not exists idx_characters_novel_id on public.characters(novel_id);
create index if not exists idx_characters_user_id on public.characters(user_id);
create index if not exists idx_user_skills_user_id on public.user_skills(user_id);
create index if not exists idx_personas_user_id on public.personas(user_id);
create index if not exists idx_custom_dict_user_id on public.custom_dictionary(user_id);
create index if not exists idx_version_history_chapter_id on public.version_history(chapter_id);
create index if not exists idx_version_history_user_id on public.version_history(user_id);
create index if not exists idx_trix_transactions_user_id on public.trix_transactions(user_id);

-- ==============================================================================
-- GRANTS & PERMISSIONS (ENABLE SUPABASE REST & DATA API ACCESS)
-- ==============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.characters enable row level security;
alter table public.user_skills enable row level security;
alter table public.personas enable row level security;
alter table public.custom_dictionary enable row level security;
alter table public.version_history enable row level security;
alter table public.trix_transactions enable row level security;

-- Profiles: Users can read and update their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Novels: Full CRUD for owner
drop policy if exists "Users can manage own novels" on public.novels;
create policy "Users can manage own novels" on public.novels
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Chapters: Full CRUD for owner
drop policy if exists "Users can manage own chapters" on public.chapters;
create policy "Users can manage own chapters" on public.chapters
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Characters: Full CRUD for owner
drop policy if exists "Users can manage own characters" on public.characters;
create policy "Users can manage own characters" on public.characters
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- User Skills: Full CRUD for owner
drop policy if exists "Users can manage own skills" on public.user_skills;
create policy "Users can manage own skills" on public.user_skills
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Personas: Full CRUD for owner
drop policy if exists "Users can manage own personas" on public.personas;
create policy "Users can manage own personas" on public.personas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Custom Dictionary: Full CRUD for owner
drop policy if exists "Users can manage own dictionary" on public.custom_dictionary;
create policy "Users can manage own dictionary" on public.custom_dictionary
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Version History: Full CRUD for owner
drop policy if exists "Users can manage own version history" on public.version_history;
create policy "Users can manage own version history" on public.version_history
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Trix Transactions: Users can view and insert own transactions
drop policy if exists "Users can view own trix transactions" on public.trix_transactions;
create policy "Users can view own trix transactions" on public.trix_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own trix transactions" on public.trix_transactions;
create policy "Users can insert own trix transactions" on public.trix_transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, trix_balance, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    30,
    'Free Plan'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- COLUMN-LEVEL PROTECTION TRIGGER (PREVENT CLIENT TRIX & PLAN TAMPERING)
-- ==============================================================================
create or replace function public.protect_profile_system_columns()
returns trigger as $$
begin
  -- Prevent client-side manipulation of balance and plan tier
  if current_user = 'authenticated' then
    if new.trix_balance is distinct from old.trix_balance then
      raise exception 'Direct modification of trix_balance from client is prohibited. Use deduct_trix_safely.';
    end if;
    if new.plan is distinct from old.plan then
      raise exception 'Direct modification of plan from client is prohibited.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_protect_profile_system_columns on public.profiles;
create trigger trg_protect_profile_system_columns
  before update on public.profiles
  for each row execute procedure public.protect_profile_system_columns();

-- ==============================================================================
-- ATOMIC TRIX DEDUCTION RPC (PREVENT RACE CONDITION & DOUBLE-SPENDING)
-- ==============================================================================
create or replace function public.deduct_trix_safely(
  p_user_id uuid,
  p_amount integer,
  p_action text default ''
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_balance integer;
  v_new_balance integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid deduction amount');
  end if;

  -- Lock user row with FOR UPDATE to prevent concurrency exploitation
  select trix_balance into v_current_balance
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User profile not found');
  end if;

  if v_current_balance < p_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient Trix balance', 'current_balance', v_current_balance);
  end if;

  v_new_balance := v_current_balance - p_amount;

  update public.profiles
  set trix_balance = v_new_balance,
      updated_at = timezone('utc'::text, now())
  where id = p_user_id;

  -- Log transaction
  insert into public.trix_transactions (user_id, amount, type, action)
  values (p_user_id, -p_amount, 'deduct', p_action);

  return jsonb_build_object('success', true, 'remaining_balance', v_new_balance);
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.deduct_trix_safely(uuid, integer, text) to authenticated;

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (plottrix-assets)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plottrix-assets',
  'plottrix-assets',
  true,
  5242880, -- 5 MB
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/gif'];

-- Storage RLS Policies
drop policy if exists "Public assets are accessible by everyone" on storage.objects;
create policy "Public assets are accessible by everyone" on storage.objects
  for select to public
  using (bucket_id = 'plottrix-assets');

drop policy if exists "Authenticated users can upload assets" on storage.objects;
create policy "Authenticated users can upload assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'plottrix-assets'
    and ((select auth.uid())::text = (storage.foldername(name))[1] or name like 'covers/%' or name like 'avatars/%')
  );

drop policy if exists "Authenticated users can update their own assets" on storage.objects;
create policy "Authenticated users can update their own assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'plottrix-assets');

drop policy if exists "Authenticated users can delete their own assets" on storage.objects;
create policy "Authenticated users can delete their own assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'plottrix-assets');

-- ==============================================================================
-- 11. PUBLIC NOVEL PUBLISHING & READER PLATFORM (STORIES & COMMENTS)
-- ==============================================================================

-- Ensure novels table has all publishing fields
alter table public.novels
  add column if not exists is_published boolean default false,
  add column if not exists published_at timestamptz,
  add column if not exists author_display_name text default '',
  add column if not exists synopsis text default '',
  add column if not exists cover_url text default '',
  add column if not exists published_arc text default '',
  add column if not exists published_snapshot jsonb;

-- View: stories alias for novels
create or replace view public.stories as 
  select * from public.novels;

-- Table: story_comments (open to everyone)
create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  commenter_name text not null,
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_novels_published on public.novels(is_published, published_at desc);
create index if not exists idx_story_comments_story_id on public.story_comments(story_id);
create index if not exists idx_story_comments_chapter_id on public.story_comments(chapter_id);
create index if not exists idx_story_comments_created_at on public.story_comments(created_at desc);

-- RLS & Grants for Public Stories and Comments
alter table public.story_comments enable row level security;

drop policy if exists "Allow public read published novels" on public.novels;
create policy "Allow public read published novels" 
  on public.novels for select 
  using (is_published = true or auth.uid() = user_id);

drop policy if exists "Allow public read chapters of published novels" on public.chapters;
create policy "Allow public read chapters of published novels" 
  on public.chapters for select 
  using (
    exists (
      select 1 from public.novels 
      where public.novels.id = public.chapters.novel_id 
        and (public.novels.is_published = true or public.novels.user_id = auth.uid())
    )
  );

drop policy if exists "Allow public read story comments" on public.story_comments;
create policy "Allow public read story comments" 
  on public.story_comments for select 
  to public, anon, authenticated 
  using (true);

drop policy if exists "Allow public insert story comments" on public.story_comments;
create policy "Allow public insert story comments" 
  on public.story_comments for insert 
  to public, anon, authenticated 
  with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.story_comments to anon, authenticated, service_role;
grant all on public.novels to anon, authenticated, service_role;
grant all on public.chapters to anon, authenticated, service_role;
