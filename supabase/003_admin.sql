-- 관리자 승인/거절/탈퇴 처리 기능을 위한 스키마 변경
-- schema.sql, 002_approval.sql을 이미 실행하신 상태에서 이어서 실행하세요.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- 기존 approved 값을 status로 이관
update public.profiles set status = case when approved then 'approved' else 'pending' end;

-- 이메일 백필
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- approved 컬럼을 참조하는 기존 정책부터 제거해야 컬럼을 지울 수 있음
drop policy if exists "posts_insert_authenticated" on public.posts;
drop policy if exists "comments_insert_authenticated" on public.comments;

alter table public.profiles drop column if exists approved;

-- 회원가입 트리거 함수: email도 함께 저장하도록 갱신
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), new.email);
  return new;
end;
$$;

-- 글쓰기/댓글 작성 권한을 status = 'approved' 기준으로 재생성
create policy "posts_insert_authenticated" on public.posts for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "comments_insert_authenticated" on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- ── 첫 관리자 지정 (1회만) ─────────────────────────────
-- 아래 줄의 이메일을 관리자로 쓸 본인 계정 이메일로 바꾸고 주석(--) 지운 뒤 실행하세요.
-- update public.profiles set is_admin = true where email = 'your-admin-email@example.com';
