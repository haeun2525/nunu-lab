#!/usr/bin/env node
/**
 * UTM 클릭·방문 집계 리포트.
 *
 *   npm run stats                    최근 30일 요약
 *   npm run stats -- --days 90       기간 지정
 *   npm run stats -- --by season     계절별
 *   npm run stats -- --by month|week|day|hour|weekday|target|medium|ref|device
 *   npm run stats -- --kind click    클릭만 (기본은 클릭+방문 둘 다)
 *
 * 화면에는 안 뜨는 정보다. 터미널에서만 본다.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env.local 을 직접 읽는다 (next 없이 단독 실행하므로)
function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(join(root, f), "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#") || !t.includes("=")) continue;
        const i = t.indexOf("=");
        const k = t.slice(0, i).trim();
        if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
      }
    } catch {
      /* 없으면 넘어간다 */
    }
  }
}
loadEnv();

const URL_ = process.env.SUPABASE_URL?.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없다. .env.local 을 확인할 것.");
  process.exit(1);
}

// ── 인자 ────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const DAYS = Number(arg("days", 30));
const FLOW = argv.includes("--flow");
const BY = arg("by", "");
const KIND = arg("kind", "");

// ── 조회 ────────────────────────────────────────────────
const since = new Date(Date.now() - DAYS * 86400e3).toISOString();

async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

let rows;
try {
  const kindFilter = KIND ? `&kind=eq.${KIND}` : "";
  rows = await rest(
    `events?created_at=gte.${since}${kindFilter}&select=*&order=created_at.asc&limit=100000`,
  );
} catch (e) {
  if (String(e).includes("42P01") || String(e).includes("does not exist")) {
    console.error("events 표가 없다. supabase/002_events.sql 을 SQL Editor 에서 먼저 실행할 것.");
    process.exit(1);
  }
  throw e;
}

// ── 한국 시간 기준으로 본다 ──────────────────────────────
const KST = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3);
const pad = (n) => String(n).padStart(2, "0");

const SEASON = (m) =>
  m <= 1 || m === 11 ? "겨울" : m <= 4 ? "봄" : m <= 7 ? "여름" : "가을";
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

const bucket = (r) => {
  const d = KST(r.created_at);
  switch (BY) {
    case "season":
      return `${d.getUTCFullYear()} ${SEASON(d.getUTCMonth())}`;
    case "month":
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    case "week": {
      const t = new Date(d);
      t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); // 월요일 시작
      return `${t.toISOString().slice(0, 10)} 주`;
    }
    case "day":
      return d.toISOString().slice(0, 10);
    case "hour":
      return `${pad(d.getUTCHours())}시`;
    case "weekday":
      return WEEKDAY[d.getUTCDay()];
    case "target":
      return r.target || "(없음)";
    case "medium":
      return r.medium || "(없음)";
    case "ref":
      return r.ref_host || "(안 남음)";
    case "source":
      return r.source || "(모름)";
    case "campaign":
      return r.campaign || "(없음)";
    case "content":
      return r.content || "(없음)";
    case "path":
      return r.path || "(모름)";
    case "device":
      return r.device || "(모름)";
    default:
      return null;
  }
};

const tally = (list, keyFn) => {
  const m = new Map();
  for (const r of list) {
    const k = keyFn(r);
    if (k == null) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};

const bar = (n, max, w = 26) =>
  "█".repeat(Math.max(n > 0 ? 1 : 0, Math.round((n / (max || 1)) * w)));

function table(title, m, { sortByKey = false } = {}) {
  console.log(`\n${title}`);
  if (m.size === 0) {
    console.log("  (없음)");
    return;
  }
  const entries = [...m.entries()].sort((a, b) =>
    sortByKey ? String(a[0]).localeCompare(String(b[0])) : b[1] - a[1],
  );
  const max = Math.max(...entries.map((e) => e[1]));
  const wk = Math.max(...entries.map((e) => [...e[0]].length));
  for (const [k, v] of entries) {
    console.log(`  ${String(k).padEnd(wk + 2)} ${String(v).padStart(5)}  ${bar(v, max)}`);
  }
}

// ── 출력 ────────────────────────────────────────────────
const clicks = rows.filter((r) => r.kind === "click");
const visits = rows.filter((r) => r.kind === "visit");
const views = rows.filter((r) => r.kind === "view");

console.log("═".repeat(52));
console.log(`  누누랩 집계 — 최근 ${DAYS}일 (KST 기준)`);
console.log(
  `  방문 ${visits.length}  ·  페이지 열람 ${views.length}  ·  외부 이동 ${clicks.length}`,
);
console.log("═".repeat(52));

if (FLOW) {
  // 한 번 들른 동안(30분)의 이동을 한 줄로 잇는다. session 은 30분짜리 임시 난수다.
  const bySession = new Map();
  for (const r of rows) {
    if (!r.session) continue;
    if (!bySession.has(r.session)) bySession.set(r.session, []);
    bySession.get(r.session).push(r);
  }
  if (bySession.size === 0) {
    console.log("\n(이동 기록이 아직 없다. 005_events_context.sql 실행 후 쌓인 것부터 보인다)");
  }
  const sessions = [...bySession.values()].sort(
    (a, b) => new Date(b[0].created_at) - new Date(a[0].created_at),
  );
  for (const evs of sessions.slice(0, 40)) {
    const first = KST(evs[0].created_at);
    const last = KST(evs[evs.length - 1].created_at);
    const secs = Math.round((last - first) / 1000);
    const stay = secs >= 60 ? `${Math.floor(secs / 60)}분 ${secs % 60}초` : `${secs}초`;
    const from = evs.find((e) => e.source)?.source || "(모름)";
    const trail = evs
      .map((e) => (e.kind === "click" ? `→ 나감:${e.target}` : e.path || "?"))
      .filter((v, i, a) => v !== a[i - 1]) // 같은 페이지 연속은 접는다
      .join("  ");
    console.log(
      `\n  ${first.toISOString().slice(5, 16).replace("T", " ")}  ${evs[0].device || "?"}  ` +
        `유입:${from}  머문시간:${stay}`,
    );
    console.log(`    ${trail}`);
  }
  console.log("");
} else if (BY) {
  if (!KIND) {
    table(`■ 방문 — ${BY}별`, tally(visits, bucket), {
      sortByKey: ["season", "month", "week", "day", "hour"].includes(BY),
    });
    table(`■ 외부 이동 — ${BY}별`, tally(clicks, bucket), {
      sortByKey: ["season", "month", "week", "day", "hour"].includes(BY),
    });
  } else {
    table(`■ ${KIND} — ${BY}별`, tally(rows, bucket), {
      sortByKey: ["season", "month", "week", "day", "hour"].includes(BY),
    });
  }
} else {
  // 기본 요약
  const byDay = (r) => KST(r.created_at).toISOString().slice(0, 10);
  table("■ 일별 방문", tally(visits, byDay), { sortByKey: true });
  table("■ 어디로 나갔나 (프로젝트/스토어)", tally(clicks, (r) => r.target || "(없음)"));
  table("■ 어느 화면에서 눌렀나", tally(clicks, (r) => r.medium || "(없음)"));
  table("■ 시간대 (0~23시)", tally(rows, (r) => `${pad(KST(r.created_at).getUTCHours())}시`), {
    sortByKey: true,
  });
  table("■ 요일", tally(rows, (r) => WEEKDAY[KST(r.created_at).getUTCDay()]));
  // 유입원은 utm 이 있으면 그 값, 없으면 밖에서 온 도메인. 둘 다 없으면 모른다.
  // 예전(005 이전) 기록은 이 칸이 통째로 비어 있어서 전부 (모름) 으로 잡힌다.
  table("■ 어디서 왔나", tally(visits, (r) => r.source || "(모름)"));
  table("■ 어느 영상/링크로 왔나", tally(visits, (r) => r.content || r.campaign || "(태그 없음)"));
  table("■ 처음 연 페이지", tally(visits, (r) => r.path || "(모름)"));
  table("■ 많이 본 페이지", tally(views, (r) => r.path || "(모름)"));
  table("■ 기기", tally(rows, (r) => r.device || "(모름)"));

  const conv = visits.length ? ((clicks.length / visits.length) * 100).toFixed(1) : "0.0";
  console.log(`\n■ 방문 대비 외부 이동  ${conv}%`);
  console.log(
    "\n더 볼 것:  npm run stats -- --by source|content|path|day|hour|device   ·   --flow (이동 경로)",
  );
}
console.log("");
