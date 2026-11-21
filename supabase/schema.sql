-- Offerly database schema.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run again (it drops and re-creates policies and triggers).

-- =====================================================
-- 1. PROFILES (one row per user)
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  college text,
  -- null means "not asked yet" (the app then shows the Preferences page)
  preferred_locations text[],
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- creates the profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, college)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'college'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- true if the logged-in user is an admin.
-- security definer lets the policies below read profiles without a loop.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- =====================================================
-- 2. LISTINGS (the official internship programs)
-- =====================================================

create table if not exists public.listings (
  id text primary key default gen_random_uuid()::text,
  category text not null
    check (category in ('government', 'private', 'startup', 'research', 'remote', 'ngo')),
  organisation text not null,
  program_name text not null,
  role text not null,
  locations text[] not null default '{}',
  states text[] not null default '{}',
  mode text not null check (mode in ('On-site', 'Remote', 'Hybrid')),
  stipend text,
  duration text,
  eligibility text,
  description text,
  application_status text not null default 'check_site'
    check (application_status in ('open', 'opens_soon', 'rolling', 'closed', 'check_site')),
  deadline date,
  application_window text,
  apply_link text not null check (apply_link ~* '^https://'),
  source_name text,
  last_verified date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- =====================================================
-- 3. LISTING_CHECKS (written by the daily robot)
-- =====================================================

create table if not exists public.listing_checks (
  id bigint generated always as identity primary key,
  listing_id text not null references public.listings (id) on delete cascade,
  checked_at timestamptz not null default now(),
  http_status integer,
  page_hash text,
  changed boolean not null default false,
  found_dates text[] not null default '{}',
  found_keywords text[] not null default '{}',
  note text,
  -- null = nothing to review. The robot sets 'pending' when something needs a human.
  review_status text check (review_status in ('pending', 'approved', 'ignored')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz
);

create index if not exists listing_checks_listing_idx
  on public.listing_checks (listing_id, checked_at desc);

-- =====================================================
-- 4. SAVED_INTERNSHIPS (each user's "My Internships")
-- =====================================================

create table if not exists public.saved_internships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- null for items the user typed in with "Quick add"
  listing_id text references public.listings (id) on delete set null,
  organisation text not null,
  role text not null,
  category text,
  deadline date,
  status text not null default 'Wishlist'
    check (status in ('Wishlist', 'Applied', 'Test', 'Interview', 'Offer', 'Rejected')),
  notes text,
  apply_link text,
  created_at timestamptz not null default now(),
  -- extra columns so the current My Internships cards keep all their details
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  location text,
  mode text,
  stipend_text text,
  duration text,
  application_window text,
  deadline_time time,
  source text not null default 'manual' check (source in ('manual', 'saved')),
  unique (user_id, listing_id)
);

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_checks enable row level security;
alter table public.saved_internships enable row level security;

-- logged-out visitors (the anon role) get no table access at all
revoke all on public.profiles, public.listings, public.listing_checks, public.saved_internships
  from anon;

-- ---- profiles: only your own row, and you cannot touch is_admin ----
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- column-level rule: users may only change these three columns.
-- is_admin can only be changed in the SQL Editor (or with the service role key).
revoke update on public.profiles from authenticated;
grant update (full_name, college, preferred_locations) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

-- ---- listings: logged-in users read published ones, admins do everything ----
drop policy if exists "listings: read published" on public.listings;
create policy "listings: read published" on public.listings
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "listings: admin insert" on public.listings;
create policy "listings: admin insert" on public.listings
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "listings: admin update" on public.listings;
create policy "listings: admin update" on public.listings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "listings: admin delete" on public.listings;
create policy "listings: admin delete" on public.listings
  for delete to authenticated
  using (public.is_admin());

-- ---- listing_checks: admins read and review. The robot inserts with the service role. ----
drop policy if exists "checks: admin read" on public.listing_checks;
create policy "checks: admin read" on public.listing_checks
  for select to authenticated
  using (public.is_admin());

drop policy if exists "checks: admin update" on public.listing_checks;
create policy "checks: admin update" on public.listing_checks
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke insert, delete on public.listing_checks from authenticated;

-- ---- saved_internships: each user sees and changes only their own rows ----
drop policy if exists "saved: own rows" on public.saved_internships;
create policy "saved: own rows" on public.saved_internships
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
