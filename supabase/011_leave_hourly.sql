-- 연차/근태: 시간차(1시간 단위) 유형 추가
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

alter table public.leave_requests alter column deduct_days type numeric(6, 3);

alter table public.leave_requests drop constraint if exists leave_requests_leave_type_check;
alter table public.leave_requests add constraint leave_requests_leave_type_check
  check (leave_type in ('annual', 'half', 'quarter', 'hourly', 'business_trip'));
