 -- 003 — 홈 공지 배너
--
-- 항상 한 줄만 쓴다. id 를 1 로 고정해 두고 그 행을 갈아 끼운다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

create table if not exists public.notice (
  id         smallint primary key default 1 check (id = 1),
  text       text        not null default '',
  -- 배너를 눌렀을 때 어디로 갈지: none(이동 안 함) / url(외부) / internal(사이트 안)
  link_kind  text        not null default 'none'
             check (link_kind in ('none','url','internal')),
  link_url   text        not null default '',   -- link_kind='url' 일 때 쓴다
  link_path  text        not null default '',   -- link_kind='internal' 일 때 쓴다 (예: /repo/together)
  updated_at timestamptz not null default now()
);

-- 빈 배너 한 줄을 미리 넣어 둔다. 텍스트가 비면 화면에 안 뜬다.
insert into public.notice (id) values (1) on conflict (id) do nothing;

alter table public.notice enable row level security;

comment on table public.notice is '홈 공지 배너. 한 줄만 존재한다.';
