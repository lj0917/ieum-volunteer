-- 긴급 수정: profiles_select_admin 정책이 profiles를 재귀적으로 셀렉트하면서
-- "infinite recursion detected in policy for relation profiles" 오류 발생.
-- 이 오류는 profiles를 참조하는 다른 정책(글쓰기 승인 체크 등)에도 영향을 줘서
-- 게시글/댓글/사진 등록까지 막고 있었음.
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select
  using (public.is_admin(auth.uid()));
