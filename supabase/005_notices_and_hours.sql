-- 공지사항 + 봉사시간 관리 기능 추가
-- 기존 마이그레이션을 이미 실행하신 상태에서 이어서 실행하세요.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

-- ── 관리자: 전체 회원 프로필 조회 허용 (봉사시간 관리에서 이름 표시용) ──
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ── 공지사항 ─────────────────────────────────────────────
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_name text not null,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;

drop policy if exists "notices_select_all" on public.notices;
create policy "notices_select_all" on public.notices for select using (true);

drop policy if exists "notices_insert_admin" on public.notices;
create policy "notices_insert_admin" on public.notices for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "notices_update_admin" on public.notices;
create policy "notices_update_admin" on public.notices for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "notices_delete_admin" on public.notices;
create policy "notices_delete_admin" on public.notices for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ── 봉사시간 관리 (회원 기준, 관리자만 조회/기록) ────────────
create table if not exists public.volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  activity_name text not null,
  hours numeric(5,1) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.volunteer_hours enable row level security;

drop policy if exists "volunteer_hours_select_admin" on public.volunteer_hours;
create policy "volunteer_hours_select_admin" on public.volunteer_hours for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "volunteer_hours_insert_admin" on public.volunteer_hours;
create policy "volunteer_hours_insert_admin" on public.volunteer_hours for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "volunteer_hours_update_admin" on public.volunteer_hours;
create policy "volunteer_hours_update_admin" on public.volunteer_hours for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "volunteer_hours_delete_admin" on public.volunteer_hours;
create policy "volunteer_hours_delete_admin" on public.volunteer_hours for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
