-- NovelRealms Supabase schema
-- Paste this file into Supabase SQL Editor and run it once for a new project.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'publication_status') then
    create type public.publication_status as enum ('Draft', 'Published');
  end if;

  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('reader', 'admin');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role public.app_role not null default 'reader',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text not null,
  synopsis text not null,
  content text not null,
  cover_image text not null default '',
  status public.publication_status not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  title text not null,
  number integer not null check (number > 0),
  content text not null,
  image text not null default '',
  status public.publication_status not null default 'Draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (novel_id, number)
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, novel_id)
);

create table if not exists public.reader_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  last_read_chapter_id uuid references public.chapters(id) on delete set null,
  progress integer not null default 0 check (progress between 0 and 100),
  last_read_at timestamptz not null default now(),
  primary key (user_id, novel_id)
);

create index if not exists novels_status_idx on public.novels(status);
create index if not exists novels_created_at_idx on public.novels(created_at desc);
create index if not exists chapters_novel_number_idx on public.chapters(novel_id, number);
create index if not exists chapters_status_idx on public.chapters(status);
create index if not exists reader_activity_last_read_at_idx on public.reader_activity(last_read_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_novels_updated_at on public.novels;
create trigger set_novels_updated_at
before update on public.novels
for each row execute function public.set_updated_at();

drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'reader'),
    'reader'
  );
  return new;
end;
$$;

drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

alter table public.profiles enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reader_activity enable row level security;

drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read published novels" on public.novels;
create policy "Anyone can read published novels"
on public.novels for select
using (status = 'Published' or public.is_admin());

drop policy if exists "Admins can manage novels" on public.novels;
create policy "Admins can manage novels"
on public.novels for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read published chapters" on public.chapters;
create policy "Anyone can read published chapters"
on public.chapters for select
using (
  public.is_admin()
  or (
    status = 'Published'
    and exists (
      select 1
      from public.novels
      where novels.id = chapters.novel_id
        and novels.status = 'Published'
    )
  )
);

drop policy if exists "Admins can manage chapters" on public.chapters;
create policy "Admins can manage chapters"
on public.chapters for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
create policy "Users can read own bookmarks"
on public.bookmarks for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can add own bookmarks" on public.bookmarks;
create policy "Users can add own bookmarks"
on public.bookmarks for insert
with check (user_id = auth.uid());

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
on public.bookmarks for delete
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can read own activity" on public.reader_activity;
create policy "Users can read own activity"
on public.reader_activity for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can save own activity" on public.reader_activity;
create policy "Users can save own activity"
on public.reader_activity for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own activity" on public.reader_activity;
create policy "Users can update own activity"
on public.reader_activity for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own activity" on public.reader_activity;
create policy "Users can delete own activity"
on public.reader_activity for delete
using (user_id = auth.uid() or public.is_admin());

-- After creating your first user in Supabase Auth, make them an admin with:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_ID';
