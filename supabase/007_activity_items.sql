-- 봉사 활동 항목 관리 + 활동 단위 인원 일괄 등록 지원
-- 기존 마이그레이션을 이미 실행하신 상태에서 이어서 실행하세요.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create table if not exists public.activity_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.activity_items enable row level security;

drop policy if exists "activity_items_select_admin" on public.activity_items;
create policy "activity_items_select_admin" on public.activity_items for select
  using (public.is_admin(auth.uid()));

drop policy if exists "activity_items_insert_admin" on public.activity_items;
create policy "activity_items_insert_admin" on public.activity_items for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "activity_items_delete_admin" on public.activity_items;
create policy "activity_items_delete_admin" on public.activity_items for delete
  using (public.is_admin(auth.uid()));

-- 봉사시간 기록에 활동 항목 연결 (활동명은 기존처럼 텍스트로도 스냅샷 저장)
alter table public.volunteer_hours
  add column if not exists activity_item_id uuid references public.activity_items(id) on delete set null;
