/**
 * 저장소 계층.
 *
 * Supabase 는 PostgREST 로 직접 때린다 — 의존성을 하나도 안 늘리려고 일부러 이렇게 했다.
 * 환경변수가 없으면 프로세스 메모리에 쌓는 폴백으로 떨어진다. 그래서 키 없이도
 * 사이트가 통째로 돌아가고, 나중에 .env 만 채우면 그대로 영속화된다.
 *
 * 폴백은 서버 프로세스가 죽으면 사라진다. 로컬 확인용이지 운영용이 아니다.
 */

import { cookies } from "next/headers";

// 대시보드에서 복사하면 뒤에 /rest/v1/ 이 붙어 오는 경우가 있다. 무엇을 넣든 같게 만든다.
const URL_ = process.env.SUPABASE_URL?.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasDb = Boolean(URL_ && KEY);

type Comment = {
  id: string;
  scope: "project" | "guestbook";
  slug: string;
  name: string;
  anonymous: boolean;
  body: string;
  created_at: string;
};

// ── 폴백 저장소 (환경변수 없을 때만) ─────────────────────────────
const mem = {
  clicks: new Map<string, number>(),
  visits: new Map<string, number>(), // 'YYYY-MM-DD' -> count
  comments: [] as Comment[],
};

async function rest(path: string, init?: RequestInit) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`supabase ${res.status} ${path}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

/**
 * 한국시간 기준 날짜(YYYY-MM-DD).
 *
 * DB 의 bump_visit() 도 Asia/Seoul 로 날을 센다. 쿠키·클라이언트가 UTC 로 세면
 * 한국시간 00~09 시 사이에 기준일이 어긋나서 같은 사람이 두 번 잡힌다.
 */
export const kstDate = (d: Date = new Date()) =>
  new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);

const today = () => kstDate();

// ── 클릭(깃허브/스토어 이동) ────────────────────────────────────

export async function bumpClick(target: string) {
  if (!hasDb) {
    mem.clicks.set(target, (mem.clicks.get(target) ?? 0) + 1);
    return;
  }
  await rest("rpc/bump_click", {
    method: "POST",
    body: JSON.stringify({ p_target: target }),
  });
}

export async function getClicks(): Promise<Record<string, number>> {
  if (!hasDb) return Object.fromEntries(mem.clicks);
  const rows = (await rest("link_clicks?select=target,count")) as {
    target: string;
    count: number;
  }[];
  return Object.fromEntries(rows.map((r) => [r.target, r.count]));
}

// ── 방문자수 ────────────────────────────────────────────────────

/** 하루에 한 번만 부른다 (쿠키로 중복 제거). */
export async function bumpVisit() {
  if (!hasDb) {
    const d = today();
    mem.visits.set(d, (mem.visits.get(d) ?? 0) + 1);
    return;
  }
  await rest("rpc/bump_visit", { method: "POST", body: JSON.stringify({}) });
}

export async function getVisits(): Promise<{ today: number; total: number }> {
  if (!hasDb) {
    const total = [...mem.visits.values()].reduce((a, b) => a + b, 0);
    return { today: mem.visits.get(today()) ?? 0, total };
  }
  const rows = (await rest("visits_daily?select=day,count")) as {
    day: string;
    count: number;
  }[];
  const t = today();
  return {
    today: rows.find((r) => r.day === t)?.count ?? 0,
    total: rows.reduce((a, r) => a + r.count, 0),
  };
}

// ── 댓글 / 방명록 ───────────────────────────────────────────────

export async function listComments(
  scope: Comment["scope"],
  slug: string,
): Promise<Comment[]> {
  if (!hasDb) {
    return mem.comments
      .filter((c) => c.scope === scope && c.slug === slug)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return (await rest(
    `comments?scope=eq.${scope}&slug=eq.${encodeURIComponent(
      slug,
    )}&select=*&order=created_at.desc&limit=200`,
  )) as Comment[];
}

export async function addComment(input: {
  scope: Comment["scope"];
  slug: string;
  name: string;
  anonymous: boolean;
  body: string;
}): Promise<Comment> {
  const row: Comment = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  };
  if (!hasDb) {
    mem.comments.push(row);
    return row;
  }
  const [saved] = (await rest("comments", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  })) as Comment[];
  return saved;
}

// ── 시점별 분석용 이벤트 로그 ──────────────────────────────────
//
// 총합만 보는 link_clicks / visits_daily 와 별개로, 사건마다 시각을 남긴다.
// 화면에는 안 쓰고 `npm run stats` 로만 들여다본다.
//
// 개인정보는 담지 않는다 — IP·쿠키·전체 UA·전체 referrer 를 저장하지 않고
// 유입 도메인과 기기 종류까지만 남긴다.

export type EventKind = "click" | "visit" | "view";

export async function logEvent(e: {
  kind: EventKind;
  target?: string;
  medium?: string;
  refHost?: string;
  device?: string;
  source?: string;
  campaign?: string;
  content?: string;
  path?: string;
  session?: string;
}) {
  if (!hasDb) return; // 폴백에선 이벤트 로그를 남기지 않는다

  const legacy = {
    kind: e.kind,
    target: e.target ?? "",
    medium: e.medium ?? "",
    ref_host: e.refHost ?? "",
    device: e.device ?? "",
  };
  const full = {
    ...legacy,
    kind: e.kind,
    source: e.source ?? "",
    campaign: e.campaign ?? "",
    content: e.content ?? "",
    path: e.path ?? "",
    session: e.session ?? "",
  };

  const post = (body: object) =>
    rest("events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });

  try {
    await post(full);
  } catch (err) {
    // 005_events_context.sql 을 아직 안 돌린 DB. 방문 집계까지 같이 죽으면 안 되니
    // 예전 모양으로 한 번 더 넣는다. view 는 예전 표가 모르는 값이라 그냥 버린다.
    if (e.kind === "view") return;
    console.warn("[events] 새 칸 없이 저장한다 — supabase/005_events_context.sql 을 실행할 것", err);
    await post(legacy);
  }
}

/**
 * 들른 동안의 이동을 이어 보기 위한 30분짜리 임시 난수.
 *
 * 사람을 알아보는 값이 아니다 — 30분 쉬면 같은 사람도 다른 값이 되고,
 * 날짜를 넘겨 이어 붙일 수 없다. IP·UA 같은 건 여전히 저장하지 않는다.
 */
const SESSION_COOKIE = "nunu_s";
const SESSION_MINUTES = 30;

export async function sessionId(): Promise<string> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value?.slice(0, 24) || randomKey();
  // 움직일 때마다 30분을 다시 채운다 (미끄러지는 만료)
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MINUTES * 60,
    path: "/",
  });
  return id;
}

const randomKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(36).padStart(2, "0"),
  ).join("");

/** 사이트 안에서 넘어온 건 유입이 아니다. 밖에서 온 것만 도메인을 남긴다. */
export function externalRefHost(referrer: string, req: Request): string {
  const host = refHostOf(referrer);
  if (!host) return "";
  const self = (req.headers.get("host") ?? "").toLowerCase();
  return host.toLowerCase() === self ? "" : host;
}

/** 경로만 남긴다. 쿼리스트링·해시는 떼고 길이도 자른다. */
export function safePath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "";
  return raw.split(/[?#]/)[0].slice(0, 120);
}

/** UTM 값 다듬기. 없는 건 빈 문자열. */
export const tag = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, 60).replace(/[^\w.:/-]/g, "") : "";

/** referer 헤더에서 도메인만 뽑는다. 전체 URL 은 남기지 않는다. */
export function refHostOf(referer: string | null): string {
  if (!referer) return "";
  try {
    return new URL(referer).host.slice(0, 120);
  } catch {
    return "";
  }
}

/** UA 를 mobile / desktop 두 가지로만 뭉갠다. */
export function deviceOf(ua: string | null): string {
  if (!ua) return "";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}

// ── 홈 공지 배너 ───────────────────────────────────────────────

export type LinkKind = "none" | "url" | "internal";

export type Notice = {
  text: string;
  link_kind: LinkKind;
  link_url: string;
  link_path: string;
  updated_at: string;
};

const EMPTY_NOTICE: Notice = {
  text: "",
  link_kind: "none",
  link_url: "",
  link_path: "",
  updated_at: new Date(0).toISOString(),
};

let memNotice: Notice = { ...EMPTY_NOTICE };

export async function getNotice(): Promise<Notice> {
  if (!hasDb) return memNotice;
  const rows = (await rest(
    "notice?id=eq.1&select=text,link_kind,link_url,link_path,updated_at",
  )) as Notice[];
  return rows[0] ?? EMPTY_NOTICE;
}

export async function setNotice(
  n: Omit<Notice, "updated_at">,
): Promise<Notice> {
  const row = { ...n, updated_at: new Date().toISOString() };
  if (!hasDb) {
    memNotice = row;
    return row;
  }
  const [saved] = (await rest("notice?id=eq.1", {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  })) as Notice[];
  return saved ?? row;
}

// ── 저장소 페이지 수정분 (운영자 모드) ─────────────────────────
//
// 원본은 lib/projects.ts 다. 여기에는 화면에서 고친 필드만 덮어쓰기로 쌓인다.
// 배포된 서버는 파일을 못 고치니(읽기 전용) 수정분만 DB 로 뺐다.
// 행이 없으면 원본이 그대로 나오고, 행을 지우면 원본으로 되돌아간다.

export type Bilingual = { ko: string; en: string };

export type ProjectPatch = {
  title?: Bilingual;
  tagline?: Bilingual;
  body?: Bilingual[];
  tags?: string[];
  videoUrl?: string | null;
  postedAt?: string | null;
};

export type ProjectEdit = {
  slug: string;
  patch: ProjectPatch;
  updated_at: string;
};

const memEdits = new Map<string, ProjectEdit>();

/** slug -> 수정분. 갤러리·상세·홈이 한 번에 받아 간다. */
export async function getProjectEdits(): Promise<Record<string, ProjectEdit>> {
  if (!hasDb) return Object.fromEntries(memEdits);
  const rows = (await rest(
    "project_edits?select=slug,patch,updated_at",
  )) as ProjectEdit[];
  return Object.fromEntries(rows.map((r) => [r.slug, r]));
}

export async function setProjectEdit(
  slug: string,
  patch: ProjectPatch,
): Promise<ProjectEdit> {
  const row: ProjectEdit = {
    slug,
    patch,
    updated_at: new Date().toISOString(),
  };
  if (!hasDb) {
    memEdits.set(slug, row);
    return row;
  }
  const [saved] = (await rest("project_edits", {
    method: "POST",
    // 같은 slug 가 이미 있으면 갈아 끼운다 (upsert)
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  })) as ProjectEdit[];
  return saved ?? row;
}

/** 원래 문구(lib/projects.ts)로 되돌린다. */
export async function clearProjectEdit(slug: string) {
  if (!hasDb) {
    memEdits.delete(slug);
    return;
  }
  await rest(`project_edits?slug=eq.${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

/**
 * 이 요청을 집계에 넣을지.
 *
 * 빼는 것 두 가지:
 *  1. 로컬(개발·스크린샷·curl 테스트)
 *  2. Vercel 프리뷰 배포 — 배포마다 도메인이 새로 생기고 쿠키도 도메인별이라,
 *     배포 확인만 해도 매번 새 방문자로 잡힌다.
 */
export function shouldCount(req: Request): boolean {
  if (process.env.VERCEL_ENV === "preview") return false;
  return !isLocalRequest(req);
}

/** 로컬에서 띄운 것인가. */
export function isLocalRequest(req: Request): boolean {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (!host) return false;
  const name = host.split(":")[0];
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "0.0.0.0" ||
    name === "::1" ||
    name === "[::1]" ||
    name.endsWith(".local")
  );
}

export type { Comment };
