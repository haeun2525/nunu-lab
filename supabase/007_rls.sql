-- ─────────────────────────────────────────────────────────────
--  RLS(행 수준 보안) 켜기 — 누누랩 쪽 표
--  SQL Editor 에 붙여넣고 한 번 실행하면 끝. 여러 번 실행해도 안전하다.
-- ─────────────────────────────────────────────────────────────
--
--  왜 켜도 사이트가 안 깨지나
--    이 프로젝트에 붙는 앱 셋(누누랩 · howcanisayit · nunu-insight)은 전부
--    서버에서 service_role 키로만 붙는다. service_role 은 RLS 를 통과한다.
--    브라우저에서 Supabase 를 직접 부르는 코드는 한 줄도 없다 (anon 키 사용 0건).
--
--  그럼 무엇이 달라지나
--    정책을 하나도 안 만들었으므로 anon(공개 키)으로는 아무것도 못 읽고 못 쓴다.
--    지금은 anon 키가 어디에도 안 나가 있지만, **언젠가 한 번 새면 그때는 표가
--    통째로 열린다.** 그걸 미리 막는 것이다. 잠금장치를 하나 더 거는 셈.
--
--  나중에 브라우저에서 직접 읽는 화면을 만들 거라면
--    그때 표마다 `create policy` 를 따로 써 줘야 한다. 지금은 일부러 안 만든다.

alter table public.comments      enable row level security;
alter table public.events        enable row level security;
alter table public.link_clicks   enable row level security;
alter table public.notice        enable row level security;
alter table public.project_edits enable row level security;
alter table public.visits_daily  enable row level security;

-- 확인용 — 여섯 줄 전부 rowsecurity 가 true 여야 한다
--   select relname, relrowsecurity from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r'
--   order by relname;
