/**
 * 저장소 계층.
 *
 * Supabase 는 PostgREST 로 직접 때린다 — 의존성을 하나도 안 늘리려고 일부러 이렇게 했다.
 * 환경변수가 없으면 프로세스 메모리에 쌓는 폴백으로 떨어진다. 그래서 키 없이도
 * 사이트가 통째로 돌아가고, 나중에 .env 만 채우면 그대로 영속화된다.
 *
 * 폴백은 서버 프로세스가 죽으면 사라진다. 로컬 확인용이지 운영용이 아니다.
 */

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { hasAdminCookie } from "./admin";
import type { Ev } from "./report";

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
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`supabase ${res.status} ${path}: ${text}`);
  }
  // 본문 없는 응답이 여럿이다 — DELETE 는 204, `Prefer: return=minimal` 인 INSERT 는
  // 201 인데 본문이 비어 있다. 204 만 걸러내면 201 에서 JSON.parse 가 터진다.
  return text ? JSON.parse(text) : null;
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

export type EventKind = "click" | "visit" | "view" | "leave";

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
  ipHash?: string;
  country?: string;
  region?: string;
  city?: string;
  ms?: number;
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
    ip_hash: e.ipHash ?? "",
    country: e.country ?? "",
    region: e.region ?? "",
    city: e.city ?? "",
    ms: e.ms ?? 0,
  };

  const post = (body: object) =>
    rest("events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });

  // 새 칸이 없는 DB 여도 집계 전체가 멎으면 안 된다. 새 모양 → 그 전 모양 → 맨 처음 모양 순으로 물러난다.
  const withCtx = { ...full } as Record<string, unknown>;
  for (const k of ["ip_hash", "country", "region", "city", "ms"]) delete withCtx[k];

  try {
    await post(full);
  } catch (err) {
    console.warn("[events] 006_visitor.sql 을 아직 안 돌린 것 같다 — 새 칸 없이 저장한다", err);
    try {
      await post(withCtx);
    } catch (err2) {
      // 005 도 안 돌린 DB. view·leave 는 예전 표가 모르는 값이라 그냥 버린다.
      if (e.kind === "view" || e.kind === "leave") return;
      console.warn("[events] 005_events_context.sql 도 안 돌린 것 같다", err2);
      await post(legacy);
    }
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
/** 사람이 아닌 것. 미리보기 크롤러가 링크를 대신 열어 보는 걸 클릭으로 세면 안 된다.
 *
 *  인스타·카카오는 **링크가 공유될 때마다** 미리보기를 만들려고 주소를 한 번 연다.
 *  바이오에 건 링크는 특히 자주 긁히므로, 안 거르면 아무도 안 눌러도 숫자가 오른다.
 *
 *  **인스타·카카오 '앱 안 브라우저'는 거르면 안 된다** — 그건 진짜 사람이다.
 *  UA 에 Instagram / KAKAOTALK 이 그대로 들어 있어서 이름만 보고 거르면 실제 유입이 통째로 날아간다.
 *  긁는 쪽은 facebookexternalhit · kakaotalk-scrap 처럼 이름이 따로 있다. 그것만 집는다. */
const BOT_UA =
  /bot\b|crawler|spider|facebookexternalhit|facebot|kakaotalk-scrap|Yeti|bingpreview|Slackbot|Twitterbot|Discordbot|TelegramBot|WhatsApp|Applebot|HeadlessChrome|curl\/|wget\/|python-requests|node-fetch|axios\/|okhttp|Go-http-client/i;

export function isBot(ua: string | null): boolean {
  if (!ua) return true; // UA 를 아예 안 보내는 건 사람 브라우저가 아니다
  return BOT_UA.test(ua);
}

export function shouldCount(req: Request): boolean {
  if (process.env.VERCEL_ENV === "preview") return false;
  if (isBot(req.headers.get("user-agent"))) return false;
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

// ── 방문자 구분 (IP 해시) · 지역 ────────────────────────────────
//
// IP 원문은 어디에도 저장하지 않는다. 소금값을 섞어 해시한 앞 16자만 남긴다.
// 목적은 "같은 사람이 또 왔는가" 하나뿐이고, 이 값으로 IP 를 되돌릴 수는 없다.

function ipOf(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "";
}

export function visitorHash(req: Request): string {
  const salt = process.env.ANALYTICS_SALT;
  const ip = ipOf(req);
  // 소금값이 없으면 아예 안 남긴다 — 소금 없는 해시는 IP 를 되맞춰 볼 수 있어서 위험하다
  if (!salt || !ip) return "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

/** Vercel 이 붙여 주는 위치 헤더. 도시까지만 받는다. */
export function geoOf(req: Request) {
  const get = (k: string) => {
    const v = req.headers.get(k);
    if (!v) return "";
    try {
      return decodeURIComponent(v).slice(0, 60);
    } catch {
      return v.slice(0, 60);
    }
  };
  return {
    country: get("x-vercel-ip-country"),
    region: get("x-vercel-ip-country-region"),
    city: get("x-vercel-ip-city"),
  };
}

/** 내 접속인가. 운영자 쿠키 또는 Vercel 대시보드에서 넘어온 것. */
export async function isOwnVisit(req: Request, clientReferrer = ""): Promise<boolean> {
  if (await hasAdminCookie().catch(() => false)) return true;
  const hosts = [refHostOf(req.headers.get("referer")), refHostOf(clientReferrer)];
  return hosts.some((h) => h === "vercel.com" || h.endsWith(".vercel.com"));
}

// ── 하루치 이벤트 읽기 (대시보드 · 매일 리포트) ────────────────

/**
 * 두 사이트가 **같은 Supabase 프로젝트**에 산다. 표 이름만 다르다.
 * 그래서 여기 한 곳에서 둘 다 읽어 하나의 대시보드로 합칠 수 있다.
 */
export const SITES = [
  { key: "nunu", table: "events", name: "누누랩", host: "nunu-lab.vercel.app" },
  { key: "hcis", table: "ax_events", name: "howcanisayit", host: "howcanisayit.vercel.app" },
] as const;

/** 한 구간의 이벤트를 전부. 화면에 쓰는 게 아니라 집계용이라 정렬만 맞춘다. */
export async function eventsBetween(
  fromIso: string,
  toIso: string,
  table = "events",
): Promise<Ev[]> {
  if (!hasDb) return [];
  return (await rest(
    `${table}?select=*&created_at=gte.${fromIso}&created_at=lt.${toIso}&order=created_at&limit=20000`,
  )) as Ev[];
}

/** 그 시각 이전에 이미 나온 방문자 해시들 (재방문 판정용). */
export async function visitorsBefore(
  beforeIso: string,
  table = "events",
): Promise<Set<string>> {
  if (!hasDb) return new Set();
  const rows = (await rest(
    `${table}?select=ip_hash&ip_hash=neq.&created_at=lt.${beforeIso}&limit=20000`,
  )) as { ip_hash: string }[];
  return new Set(rows.map((r) => r.ip_hash));
}
