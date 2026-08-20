-- 002 — 시점별 분석용 이벤트 로그
--
-- 기존 link_clicks / visits_daily 는 "총합"만 안다. 언제 들어왔는지 보려면
-- 사건 하나하나에 시각이 찍혀 있어야 한다. 그래서 이 표를 따로 둔다.
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

create table if not exists public.events (
  id         bigserial primary key,
  kind       text        not null check (kind in ('click','visit')),
  target     text        not null default '',   -- 프로젝트 slug 또는 'store' (visit 이면 빈 값)
  medium     text        not null default '',   -- gallery / detail / home 등 어디서 눌렀는지
  ref_host   text        not null default '',   -- 유입 도메인만. 전체 URL 은 저장하지 않는다
  device     text        not null default '',   -- mobile / desktop 정도만
  created_at timestamptz not null default now()
);

create index if not exists events_created on public.events (created_at desc);
create index if not exists events_kind_created on public.events (kind, created_at desc);

alter table public.events enable row level security;

-- 개인정보는 담지 않는다: IP·쿠키·전체 UA·전체 referrer 를 저장하지 않는다.
-- 유입 도메인과 기기 종류까지만 남긴다.
comment on table public.events is
  '클릭/방문 사건 로그. 시점별 집계 전용. 개인 식별 정보 없음.';
