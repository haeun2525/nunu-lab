-- 방문자 구분 · 지역 · 체류시간 (2026-08-26)
--
-- IP 원문은 저장하지 않는다. 소금값을 섞은 해시 앞 16자리만 남긴다 —
-- "같은 사람이 또 왔는지" 는 갈리지만 거기서 IP 를 되돌릴 수는 없다.
-- 소금값(ANALYTICS_SALT)을 바꾸면 이전 해시와 이어지지 않는다. 그게 안전장치다.

alter table public.events add column if not exists ip_hash text not null default '';
alter table public.events add column if not exists country text not null default '';
alter table public.events add column if not exists region  text not null default '';
alter table public.events add column if not exists city    text not null default '';
alter table public.events add column if not exists ms      integer not null default 0;

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add  constraint events_kind_check
  check (kind in ('click','visit','view','leave'));

create index if not exists events_ip_hash on public.events (ip_hash, created_at desc);

comment on column public.events.ip_hash is
  'IP + 소금값의 sha256 앞 16자. 원문 IP 는 저장하지 않으며 이 값으로 IP 를 되돌릴 수 없다.';
