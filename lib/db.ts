/**
 * 저장소 계층.
 *
 * Supabase 는 PostgREST 로 직접 때린다 — 의존성을 하나도 안 늘리려고 일부러 이렇게 했다.
 * 환경변수가 없으면 프로세스 메모리에 쌓는 폴백으로 떨어진다. 그래서 키 없이도
 * 사이트가 통째로 돌아가고, 나중에 .env 만 채우면 그대로 영속화된다.
 *
 * 폴백은 서버 프로세스가 죽으면 사라진다. 로컬 확인용이지 운영용이 아니다.
 */

const URL_ = process.env.SUPABASE_URL;
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

const today = () => new Date().toISOString().slice(0, 10);

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

export type { Comment };
