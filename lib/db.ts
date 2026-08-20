/**
 * 저장소 계층.
 *
 * Supabase 는 PostgREST 로 직접 때린다 — 의존성을 하나도 안 늘리려고 일부러 이렇게 했다.
 * 환경변수가 없으면 프로세스 메모리에 쌓는 폴백으로 떨어진다. 그래서 키 없이도
 * 사이트가 통째로 돌아가고, 나중에 .env 만 채우면 그대로 영속화된다.
 *
 * 폴백은 서버 프로세스가 죽으면 사라진다. 로컬 확인용이지 운영용이 아니다.
 */

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

export type EventKind = "click" | "visit";

export async function logEvent(e: {
  kind: EventKind;
  target?: string;
  medium?: string;
  refHost?: string;
  device?: string;
}) {
  if (!hasDb) return; // 폴백에선 이벤트 로그를 남기지 않는다
  await rest("events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      kind: e.kind,
      target: e.target ?? "",
      medium: e.medium ?? "",
      ref_host: e.refHost ?? "",
      device: e.device ?? "",
    }),
  });
}

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
