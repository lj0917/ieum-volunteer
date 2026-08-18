-- 사진첩 업로드에 계정 연동: 로그인한 승인회원만 업로드 가능하게 하고
-- 본인이 올린 사진은 직접 삭제(관리)할 수 있도록 변경
-- schema.sql, 002_approval.sql, 003_admin.sql을 이미 실행하신 상태에서 이어서 실행하세요.

alter table public.photos add column if not exists uploader_id uuid references auth.users(id) on delete set null;

-- 업로드는 로그인 + 관리자 승인된 회원만 가능
drop policy if exists "photos_insert_all" on public.photos;
drop policy if exists "photos_insert_authenticated" on public.photos;
create policy "photos_insert_authenticated" on public.photos for insert
  with check (
    auth.uid() = uploader_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- 본인이 올린 사진은 직접 삭제 가능
drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_delete_own" on public.photos for delete
  using (auth.uid() = uploader_id);

-- 스토리지 업로드도 로그인 + 승인 회원만 가능하도록 강화
drop policy if exists "activity_photos_public_insert" on storage.objects;
drop policy if exists "activity_photos_authenticated_insert" on storage.objects;
create policy "activity_photos_authenticated_insert" on storage.objects for insert
  with check (
    bucket_id = 'activity-photos'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- 본인이 올린 파일은 스토리지에서도 직접 삭제 가능 (업로드 시 owner가 자동으로 auth.uid()로 기록됨)
drop policy if exists "activity_photos_owner_delete" on storage.objects;
create policy "activity_photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'activity-photos' and owner = auth.uid());
