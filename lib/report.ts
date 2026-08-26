/**
 * 하루치 집계를 한 덩어리로 뽑는다.
 *
 * 화면(대시보드)과 매일 가는 Teams 리포트가 **같은 함수**를 쓴다.
 * 두 군데서 따로 세면 숫자가 어긋나고, 어긋나면 둘 다 못 믿게 된다.
 *
 * 사람 수는 IP 해시로 센다. 같은 집·같은 회사에서 오면 한 사람으로 뭉치고,
 * 통신사 IP 가 바뀌면 두 사람이 된다 — 정확한 인원수가 아니라 추세 지표다.
 */

import { kstDate } from "./db";

export type Ev = {
  kind: "view" | "visit" | "click" | "leave";
  target: string;
  medium: string;
  ref_host: string;
  device: string;
  source: string;
  campaign: string;
  content: string;
  path: string;
  session: string;
  ip_hash: string;
  country: string;
  region: string;
  city: string;
  ms: number;
  created_at: string;
};

export type Journey = {
  visitor: string;
  session: string;
  start: string;
  end: string;
  seconds: number;
  device: string;
  place: string;
  source: string;
  utm: string;
  steps: string[];
  clicks: string[];
  returning: boolean;
};

export type DayReport = {
  day: string;
  people: number;
  newPeople: number;
  returningPeople: number;
  sessions: number;
  views: number;
  clicks: number;
  medianSeconds: number;
  bounceRate: number;
  sources: [string, number][];
  contents: [string, number][];
  places: [string, number][];
  devices: [string, number][];
  pages: [string, number][];
  clickTargets: [string, number][];
  hours: number[];
  journeys: Journey[];
  gaps: string[];
};

const KST = 9 * 3600e3;

/** 한국시간 하루의 UTC 경계. day 는 'YYYY-MM-DD'. */
export function kstRange(day: string) {
  const from = new Date(`${day}T00:00:00.000Z`).getTime() - KST;
  return { from: new Date(from).toISOString(), to: new Date(from + 86400e3).toISOString() };
}

export const yesterdayKst = () => kstDate(new Date(Date.now() - 86400e3));

const at = (iso: string) => new Date(new Date(iso).getTime() + KST);
const hhmm = (iso: string) =>
  `${String(at(iso).getUTCHours()).padStart(2, "0")}:${String(at(iso).getUTCMinutes()).padStart(2, "0")}`;

function top(rows: Ev[], pick: (e: Ev) => string, limit = 12): [string, number][] {
  const c = new Map<string, number>();
  for (const e of rows) {
    const k = pick(e);
    if (!k) continue;
    c.set(k, (c.get(k) ?? 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

const placeOf = (e: Ev) =>
  [e.city, e.region, e.country].filter(Boolean).join(" · ") || "";

/**
 * @param rows  그날 하루치 이벤트
 * @param before 그 전날까지 나온 방문자 해시 (재방문 판정용)
 */
export function buildReport(day: string, rows: Ev[], before: Set<string>): DayReport {
  const people = new Set(rows.map((e) => e.ip_hash).filter(Boolean));
  const newPeople = [...people].filter((p) => !before.has(p));

  const bySession = new Map<string, Ev[]>();
  for (const e of rows) {
    const k = e.session || `(없음)${e.ip_hash}`;
    if (!bySession.has(k)) bySession.set(k, []);
    bySession.get(k)!.push(e);
  }

  const journeys: Journey[] = [];
  for (const [session, evs] of bySession) {
    const views = evs.filter((e) => e.kind === "view");
    const dwell = evs.filter((e) => e.kind === "leave").reduce((a, e) => a + e.ms, 0);
    const span = new Date(evs[evs.length - 1].created_at).getTime() - new Date(evs[0].created_at).getTime();
    const visitor = evs.find((e) => e.ip_hash)?.ip_hash ?? "";
    const utm = evs.find((e) => e.medium || e.content || e.campaign);
    journeys.push({
      visitor: visitor ? visitor.slice(0, 6) : "(모름)",
      session: session.slice(0, 6),
      start: hhmm(evs[0].created_at),
      end: hhmm(evs[evs.length - 1].created_at),
      // 체류시간은 페이지별 머문 시간의 합이 정확하다. 그게 없으면 처음~끝 간격으로 대신한다.
      seconds: Math.round((dwell || span) / 1000),
      device: evs.find((e) => e.device)?.device ?? "",
      place: placeOf(evs.find((e) => placeOf(e)) ?? evs[0]),
      source: evs.find((e) => e.source)?.source || "(모름)",
      utm: utm ? [utm.source, utm.medium, utm.content].filter(Boolean).join(" / ") : "",
      steps: views.map((e) => e.path),
      clicks: evs.filter((e) => e.kind === "click").map((e) => `${e.target}(${e.medium})`),
      returning: Boolean(visitor && before.has(visitor)),
    });
  }
  journeys.sort((a, b) => b.seconds - a.seconds);

  const secs = journeys.map((j) => j.seconds).sort((a, b) => a - b);
  const median = secs.length ? secs[Math.floor(secs.length / 2)] : 0;
  const oneStep = journeys.filter((j) => j.steps.length <= 1 && !j.clicks.length).length;

  const hours = Array(24).fill(0) as number[];
  for (const e of rows) hours[at(e.created_at).getUTCHours()]++;

  const gaps: string[] = [];
  if (!rows.some((e) => e.ip_hash)) gaps.push("IP 해시가 하나도 없다 — ANALYTICS_SALT 가 안 걸렸다");
  if (!rows.some((e) => e.country)) gaps.push("지역이 비어 있다 — Vercel 위치 헤더가 안 온다");
  if (!rows.some((e) => e.kind === "leave")) gaps.push("체류시간이 안 들어온다 — 떠날 때 신호(sendBeacon)를 확인할 것");
  const noSource = rows.filter((e) => e.kind === "view" && !e.source).length;
  if (noSource > rows.length * 0.3) gaps.push(`유입원 모름이 ${noSource}건 — 인앱 브라우저가 referrer 를 떼거나 직접 접속`);
  const bioOnly = new Set(rows.map((e) => e.content).filter(Boolean));
  if (bioOnly.size <= 1) gaps.push("utm_content 가 한 종류뿐 — 릴스별로 갈리려면 /ig/<태그> 를 게시물마다 바꿔야 한다");

  return {
    day,
    people: people.size,
    newPeople: newPeople.length,
    returningPeople: people.size - newPeople.length,
    sessions: bySession.size,
    views: rows.filter((e) => e.kind === "view").length,
    clicks: rows.filter((e) => e.kind === "click").length,
    medianSeconds: median,
    bounceRate: journeys.length ? Math.round((oneStep / journeys.length) * 100) : 0,
    sources: top(rows, (e) => e.source),
    contents: top(rows, (e) => e.content),
    places: top(rows, placeOf),
    devices: top(rows, (e) => e.device, 4),
    pages: top(rows.filter((e) => e.kind === "view"), (e) => e.path),
    clickTargets: top(rows.filter((e) => e.kind === "click"), (e) => `${e.target} (${e.medium})`),
    hours,
    journeys,
    gaps,
  };
}
