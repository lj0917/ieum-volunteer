-- 관리자용 AI 챗봇 (Anthropic Claude API 연동)
-- 지난번 typesafe.ai 기반 "AI 판정 도구"를 대체합니다. 기존 ai_evaluations 테이블은 건드리지 않습니다.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null default '새 대화',
  model text not null default 'claude-opus-5',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

drop policy if exists "ai_conversations_admin_all" on public.ai_conversations;
create policy "ai_conversations_admin_all" on public.ai_conversations
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "ai_messages_admin_all" on public.ai_messages;
create policy "ai_messages_admin_all" on public.ai_messages
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
