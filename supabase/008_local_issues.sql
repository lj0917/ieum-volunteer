-- 지역 소식(북구청 공지 + 관련 뉴스) 모아보기 기능
-- 기존 마이그레이션을 이미 실행하신 상태에서 이어서 실행하세요.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create table if not exists public.local_issues (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('bukgu', 'naver')),
  category text,
  title text not null,
  url text not null,
  published_at date,
  fetched_at timestamptz not null default now(),
  external_id text not null,
  unique (source, external_id)
);

alter table public.local_issues enable row level security;

drop policy if exists "local_issues_select_all" on public.local_issues;
create policy "local_issues_select_all" on public.local_issues for select using (true);

drop policy if exists "local_issues_delete_admin" on public.local_issues;
create policy "local_issues_delete_admin" on public.local_issues for delete
  using (public.is_admin(auth.uid()));

-- 등록(insert)/갱신(update)은 서버(서비스 롤) 스크래핑 함수에서만 수행하므로
-- 별도 insert/update 정책은 두지 않음 (service role은 RLS를 우회함)
