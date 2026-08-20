-- 004 — 저장소 페이지 직접 수정(운영자 모드)
--
-- lib/projects.ts 가 원본이고, 이 표는 그 위에 덮어쓰는 수정분만 담는다.
-- 사이트가 배포된 뒤에는 파일을 못 고치니까(서버 파일시스템이 읽기 전용) DB 로 뺀 것이다.
-- 행이 없으면 원본이 그대로 나온다. 행을 지우면 원본으로 되돌아간다.
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.

create table if not exists public.project_edits (
  slug       text primary key,                      -- lib/projects.ts 의 slug
  patch      jsonb       not null default '{}'::jsonb, -- 바꾼 필드만 들어간다
  updated_at timestamptz not null default now()
);

alter table public.project_edits enable row level security;

comment on table public.project_edits is
  '운영자가 화면에서 고친 프로젝트 문구. lib/projects.ts 원본 위에 덮어쓴다.';
