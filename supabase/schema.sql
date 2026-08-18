-- 이음봉사단 게시판 + 사진첩 스키마
-- Supabase 대시보드 → SQL Editor → 새 쿼리 → 아래 전체 붙여넣고 Run

-- ── 게시판 ───────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (true);

drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated" on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete
  using (auth.uid() = author_id);

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated" on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete
  using (auth.uid() = author_id);

-- ── 활동 사진첩 ──────────────────────────────────────────
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text,
  uploader_name text not null default '익명',
  created_at timestamptz not null default now()
);

alter table public.photos enable row level security;

drop policy if exists "photos_select_all" on public.photos;
create policy "photos_select_all" on public.photos for select using (true);

-- 로그인 없이 누구나 업로드 가능 (요청하신 정책)
drop policy if exists "photos_insert_all" on public.photos;
create policy "photos_insert_all" on public.photos for insert with check (true);

-- 스토리지 버킷: 이미지 형식/5MB 용량 제한
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-photos',
  'activity-photos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "activity_photos_public_read" on storage.objects;
create policy "activity_photos_public_read" on storage.objects for select
  using (bucket_id = 'activity-photos');

drop policy if exists "activity_photos_public_insert" on storage.objects;
create policy "activity_photos_public_insert" on storage.objects for insert
  with check (bucket_id = 'activity-photos');
