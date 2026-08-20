-- nunu-lab 스키마.
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 실행하면 된다.
-- 서버(라우트 핸들러)에서만 service_role 키로 접근하므로 RLS 는 전부 잠가 둔다.

-- ── 깃허브/스토어 이동 클릭수 ────────────────────────────────
create table if not exists public.link_clicks (
  target text primary key,          -- 프로젝트 slug 또는 'store'
  count  bigint not null default 0
);

create or replace function public.bump_click(p_target text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.link_clicks (target, count)
  values (p_target, 1)
  on conflict (target) do update set count = link_clicks.count + 1;
$$;

-- ── 일별 방문자수 ────────────────────────────────────────────
create table if not exists public.visits_daily (
  day   date primary key,
  count bigint not null default 0
);

create or replace function public.bump_visit()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visits_daily (day, count)
  values ((now() at time zone 'Asia/Seoul')::date, 1)
  on conflict (day) do update set count = visits_daily.count + 1;
$$;

-- ── 댓글 / 방명록 ────────────────────────────────────────────
-- scope='guestbook' 이면 slug='guestbook', scope='project' 면 slug=프로젝트 slug.
create table if not exists public.comments (
  id         uuid primary key,
  scope      text not null check (scope in ('project','guestbook')),
  slug       text not null,
  name       text not null default '',
  anonymous  boolean not null default false,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_scope_slug_created
  on public.comments (scope, slug, created_at desc);

-- RLS: 익명 키로는 아무것도 못 하게 잠근다. 서버가 service_role 로만 붙는다.
alter table public.link_clicks  enable row level security;
alter table public.visits_daily enable row level security;
alter table public.comments     enable row level security;
