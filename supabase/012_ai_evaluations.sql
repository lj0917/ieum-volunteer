-- 관리자용 AI 판정 도구 (typesafe.ai 연동)
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create table if not exists public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  state text not null,
  question_type text not null check (question_type in ('noul', 'choice', 'score')),
  instructions text not null,
  criteria jsonb not null,
  model text not null default 'jev-latest',
  answer jsonb,
  usage jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table public.ai_evaluations enable row level security;

drop policy if exists "ai_evaluations_admin_all" on public.ai_evaluations;
create policy "ai_evaluations_admin_all" on public.ai_evaluations
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
