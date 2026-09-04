-- 연차/근태 관리 (사무국 직원 전용)
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create table if not exists public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  hire_date date not null,
  position text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

drop policy if exists "staff_select_self_or_admin" on public.staff;
create policy "staff_select_self_or_admin" on public.staff
  for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "staff_admin_write" on public.staff;
create policy "staff_admin_write" on public.staff
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type text not null check (leave_type in ('annual', 'half', 'quarter', 'business_trip')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  deduct_days numeric(4,2) not null default 0,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now()
);

alter table public.leave_requests enable row level security;

drop policy if exists "leave_requests_select_self_or_admin" on public.leave_requests;
create policy "leave_requests_select_self_or_admin" on public.leave_requests
  for select using (staff_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "leave_requests_insert_self" on public.leave_requests;
create policy "leave_requests_insert_self" on public.leave_requests
  for insert with check (staff_id = auth.uid() and status = 'pending');

drop policy if exists "leave_requests_delete_self_pending" on public.leave_requests;
create policy "leave_requests_delete_self_pending" on public.leave_requests
  for delete using (staff_id = auth.uid() and status = 'pending');

drop policy if exists "leave_requests_admin_update" on public.leave_requests;
create policy "leave_requests_admin_update" on public.leave_requests
  for update using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "leave_requests_admin_delete" on public.leave_requests;
create policy "leave_requests_admin_delete" on public.leave_requests
  for delete using (public.is_admin(auth.uid()));
