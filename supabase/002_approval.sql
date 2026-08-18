-- 회원 승인 기능 추가
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run
-- (schema.sql을 이미 실행하신 상태에서 이어서 실행하는 마이그레이션입니다)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (auth.uid() = id);

-- 회원가입 시 profiles row를 자동 생성 (기본 approved = false)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 마이그레이션 이전에 가입한 계정이 있다면 profiles row를 채워줌 (미승인 상태로)
insert into public.profiles (id, display_name, approved)
select id, coalesce(raw_user_meta_data->>'display_name', email), false
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 글쓰기/댓글은 승인된 유저만 가능하도록 정책 강화
drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated" on public.posts for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved = true)
  );

drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated" on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.approved = true)
  );
