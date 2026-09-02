-- 사진첩에 활동 항목/활동 일자 분류 기능 추가
-- 기존 마이그레이션을 이미 실행하신 상태에서 이어서 실행하세요.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

alter table public.photos add column if not exists activity_item_id uuid references public.activity_items(id) on delete set null;
alter table public.photos add column if not exists activity_date date;

-- 사진 업로드 시 활동 항목을 선택할 수 있도록, 승인회원도 활동 항목 목록을
-- 볼 수 있어야 함(기존엔 관리자만 조회 가능했음) → 전체 공개로 변경
drop policy if exists "activity_items_select_admin" on public.activity_items;
drop policy if exists "activity_items_select_all" on public.activity_items;
create policy "activity_items_select_all" on public.activity_items for select using (true);
