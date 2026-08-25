-- 005 — 유입원(UTM·referrer) · 페이지 이동 기록
--
-- 002 의 events 표에 칸을 더한다. 지금까지는 "언제·무엇을" 만 알았고
-- "어디서 와서 · 어느 페이지를 · 어떤 순서로" 를 몰랐다.
--
-- 개인정보 선은 그대로다 — IP·전체 UA·전체 referrer 는 여전히 저장하지 않는다.
-- session 은 30분짜리 임시 난수다. 사람을 알아보는 값이 아니고, 30분 지나면
-- 같은 사람이 와도 다른 값이 되며 날짜를 넘겨 이어 붙일 수 없다.
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

alter table public.events
  add column if not exists source   text not null default '',  -- utm_source 또는 유입 도메인
  add column if not exists campaign text not null default '',  -- utm_campaign
  add column if not exists content  text not null default '',  -- utm_content (릴스 구분용)
  add column if not exists path     text not null default '',  -- 어느 페이지인지. 쿼리스트링은 뗀다
  add column if not exists session  text not null default '';  -- 30분짜리 임시 난수

-- 페이지 이동 기록(view)을 kind 에 추가한다
alter table public.events drop constraint if exists events_kind_check;
alter table public.events
  add constraint events_kind_check check (kind in ('click', 'visit', 'view'));

create index if not exists events_session on public.events (session, created_at);

comment on column public.events.session is
  '30분 임시 난수. 한 번 들른 동안의 이동을 이어 보기 위한 값이고 개인 식별자가 아니다.';
