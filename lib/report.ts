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

// ── 보낼 모양 만들기 (이메일 · RSS) ────────────────────────────
//
// 카드(Teams)든 이메일이든 RSS 든 **같은 DayReport 하나**에서 나온다.
// 채널마다 따로 세면 숫자가 어긋나고, 어긋나면 셋 다 못 믿게 된다.

export const mmss = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;

export const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rows = (list: [string, number][], n = 6) =>
  list.slice(0, n).map(([k, v]) => `${esc(k)} <b>${v}</b>`).join(" · ") || "없음";

/** 아웃룩에서도 안 깨지게 표와 인라인 스타일만 쓴다. flex·grid 는 못 쓴다. */
export function reportHtml(r: DayReport, site: string, origin: string) {
  const num = (label: string, value: string, sub = "") => `
    <td style="padding:10px 14px;border:1px solid #e6e6e6;border-radius:8px;vertical-align:top">
      <div style="font:11px -apple-system,sans-serif;color:#888">${label}</div>
      <div style="font:700 22px -apple-system,sans-serif;color:#111;padding-top:2px">${value}</div>
      <div style="font:11px -apple-system,sans-serif;color:#888">${sub}</div>
    </td>`;

  const line = (t: string, v: string) => `
    <tr>
      <td style="padding:7px 0;font:12px -apple-system,sans-serif;color:#888;white-space:nowrap;vertical-align:top">${t}</td>
      <td style="padding:7px 0 7px 14px;font:13px -apple-system,sans-serif;color:#222">${v}</td>
    </tr>`;

  const journeys = r.journeys
    .filter((j) => j.steps.length > 1 || j.clicks.length)
    .slice(0, 8)
    .map((j) => {
      const path = [...j.steps, ...j.clicks.map((c) => `→ ${c}`)].map(esc).join(" › ");
      const meta = [j.device, j.place, j.source, j.utm].filter(Boolean).map(esc).join(" · ");
      return `
      <tr><td style="padding:10px 0;border-top:1px solid #eee">
        <div style="font:600 13px -apple-system,sans-serif;color:#111">
          ${esc(j.visitor)} · ${j.start}~${j.end} · ${mmss(j.seconds)}${j.returning ? ' <span style="color:#7a5af8">재방문</span>' : ""}
        </div>
        <div style="font:12px ui-monospace,monospace;color:#444;padding-top:4px;word-break:break-all">${path}</div>
        <div style="font:11px -apple-system,sans-serif;color:#999;padding-top:3px">${meta}</div>
      </td></tr>`;
    })
    .join("");

  return `<div style="max-width:640px;margin:0 auto;padding:22px 18px;background:#fff">
  <div style="font:700 19px -apple-system,sans-serif;color:#111">📊 ${r.day} 방문 리포트</div>
  <div style="font:12px -apple-system,sans-serif;color:#888;padding-top:4px">${esc(site)}</div>

  <table role="presentation" cellspacing="6" style="border-collapse:separate;margin-top:16px">
    <tr>
      ${num("사람", `${r.people}명`, `새 ${r.newPeople} · 다시 ${r.returningPeople}`)}
      ${num("방문", `${r.sessions}번`, `페이지 ${r.views}장`)}
      ${num("머문 시간", mmss(r.medianSeconds), "중앙값")}
      ${num("나간 클릭", `${r.clicks}건`, `한 장만 보고 나감 ${r.bounceRate}%`)}
    </tr>
  </table>

  <table role="presentation" style="width:100%;margin-top:18px;border-collapse:collapse">
    ${line("어디서", rows(r.sources))}
    ${line("어느 링크", rows(r.contents))}
    ${line("지역", rows(r.places, 5))}
    ${line("기기", rows(r.devices))}
    ${line("많이 본 페이지", rows(r.pages))}
    ${line("나간 클릭", rows(r.clickTargets))}
  </table>

  ${journeys ? `<div style="font:700 13px -apple-system,sans-serif;color:#111;margin-top:22px">눈여겨볼 여정</div>
  <table role="presentation" style="width:100%;border-collapse:collapse">${journeys}</table>` : ""}

  ${r.gaps.length ? `<div style="margin-top:20px;padding:12px 14px;background:#fff8e6;border-left:3px solid #f0a500">
    <div style="font:700 12px -apple-system,sans-serif;color:#8a5b00">확인이 필요한 것</div>
    ${r.gaps.map((g) => `<div style="font:12px -apple-system,sans-serif;color:#5c4300;padding-top:5px">• ${esc(g)}</div>`).join("")}
  </div>` : ""}

  <div style="margin-top:22px">
    <a href="${origin}/insight?day=${r.day}" style="font:600 13px -apple-system,sans-serif;color:#111">대시보드에서 전부 보기 →</a>
  </div>
  <div style="font:11px -apple-system,sans-serif;color:#aaa;margin-top:14px;line-height:1.7">
    사람 수는 IP 해시로 셉니다. 같은 집·회사에서 오면 한 사람으로 뭉치고 통신사 IP 가 바뀌면 둘로 갈립니다 —
    정확한 인원이 아니라 추세로 보세요. IP 원문은 저장하지 않습니다.
  </div>
</div>`;
}

export const reportSubject = (r: DayReport, site: string) =>
  `[${site}] ${r.day} · 사람 ${r.people} · 방문 ${r.sessions} · 클릭 ${r.clicks}`;

// ── 두 사이트를 한 장으로 ──────────────────────────────────────

export type SiteReport = { key: string; name: string; host: string; report: DayReport };

export type Combined = {
  day: string;
  sites: SiteReport[];
  people: number;      // 두 사이트를 오간 사람은 한 번만 센다
  bothSites: number;   // 두 사이트를 다 본 사람
  sessions: number;
  views: number;
  clicks: number;
  medianSeconds: number;
  places: [string, number][];
  devices: [string, number][];
  sources: [string, number][];
  findings: string[];
};

/**
 * 사람 수는 두 사이트를 합쳐서 셀 때 주의가 필요하다.
 * **소금값이 사이트마다 달라서 같은 사람이라도 해시가 다르다** — 일부러 그렇게 해 뒀다.
 * 그래서 합계는 "겹칠 수 있는 값" 이고, 여기서는 사이트별 합으로 두되 그 사실을 화면에 밝힌다.
 */
export function combine(day: string, sites: SiteReport[]): Combined {
  const all = sites.flatMap((s) => s.report);
  const merge = (pick: (r: DayReport) => [string, number][]): [string, number][] => {
    const m = new Map<string, number>();
    for (const r of all) for (const [k, v] of pick(r)) m.set(k, (m.get(k) ?? 0) + v);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  };
  const secs = sites
    .flatMap((s) => s.report.journeys.map((j) => j.seconds))
    .sort((a, b) => a - b);

  return {
    day,
    sites,
    people: all.reduce((a, r) => a + r.people, 0),
    bothSites: 0, // 소금값이 달라 사이트 간 대조는 불가능하다
    sessions: all.reduce((a, r) => a + r.sessions, 0),
    views: all.reduce((a, r) => a + r.views, 0),
    clicks: all.reduce((a, r) => a + r.clicks, 0),
    medianSeconds: secs.length ? secs[Math.floor(secs.length / 2)] : 0,
    places: merge((r) => r.places),
    devices: merge((r) => r.devices),
    sources: merge((r) => r.sources),
    findings: diagnose(sites),
  };
}

/**
 * 눈에 보이는 것만 가지고 하는 자동 점검. **AI 도, API 키도 안 쓴다.**
 * 여기 뜨는 건 전부 "숫자 모양이 이상하다" 는 사실 진술이고, 해석은 사람이 한다.
 */
function diagnose(sites: SiteReport[]): string[] {
  const out: string[] = [];
  for (const { name, report: r } of sites) {
    // 어제 실제로 겪은 사고 — view 는 쌓이는데 visit 이 0 이면 집계 코드가 중간에 죽은 것이다
    if (r.views > 0 && r.sessions > 0 && r.people === 0)
      out.push(`[${name}] 페이지 열람은 ${r.views}건인데 사람이 0명 — 방문자 해시가 안 붙고 있다 (ANALYTICS_SALT 확인)`);
    if (r.views > 0 && !r.journeys.some((j) => j.seconds > 0))
      out.push(`[${name}] 체류시간이 전부 0 — 떠날 때 신호(sendBeacon)가 안 오고 있다`);
    if (r.sessions > 4 && r.bounceRate >= 80)
      out.push(`[${name}] 한 장만 보고 나간 비율 ${r.bounceRate}% — 첫 화면에서 다음으로 갈 길이 잘 안 보인다는 뜻일 수 있다`);
    if (r.people > 0 && r.clicks === 0)
      out.push(`[${name}] ${r.people}명이 왔는데 밖으로 나간 클릭이 0건 — 링크가 눈에 안 띄거나 눌리지 않는지 확인`);
    const contents = r.contents.filter(([k]) => k && k !== "bio");
    if (r.people > 3 && contents.length === 0)
      out.push(`[${name}] 어느 콘텐츠가 데려왔는지 못 가른다 — 릴스마다 바이오를 /ig/<태그> 로 바꿔 걸어야 갈린다`);
    const short = r.journeys.filter((j) => j.seconds <= 1 && j.steps.length <= 1).length;
    if (r.sessions > 5 && short > r.sessions * 0.5)
      out.push(`[${name}] 1초 이내에 끝난 방문이 ${short}건 — 봇이거나 미리 불러오기일 수 있다`);
    for (const g of r.gaps) out.push(`[${name}] ${g}`);
  }
  if (!out.length) out.push("숫자 모양에 이상한 곳은 없다.");
  return out;
}

/** 합본 메일/RSS 본문. 두 사이트를 위아래로 잇는다. */
export function combinedHtml(c: Combined, origin: string) {
  const head = `
  <div style="font:700 19px -apple-system,sans-serif;color:#111">📊 ${c.day} 방문 리포트</div>
  <div style="font:12px -apple-system,sans-serif;color:#888;padding-top:4px">
    ${c.sites.map((s) => esc(s.name)).join(" + ")} 합본
  </div>
  <table role="presentation" cellspacing="6" style="border-collapse:separate;margin-top:14px"><tr>
    ${[
      ["사람", `${c.people}명`, "두 사이트 합"],
      ["방문", `${c.sessions}번`, `페이지 ${c.views}장`],
      ["머문 시간", mmss(c.medianSeconds), "중앙값"],
      ["나간 클릭", `${c.clicks}건`, ""],
    ]
      .map(
        ([l, v, s]) => `<td style="padding:10px 14px;border:1px solid #e6e6e6;border-radius:8px">
          <div style="font:11px -apple-system,sans-serif;color:#888">${l}</div>
          <div style="font:700 22px -apple-system,sans-serif;color:#111">${v}</div>
          <div style="font:11px -apple-system,sans-serif;color:#888">${s}</div></td>`,
      )
      .join("")}
  </tr></table>

  ${c.findings.length ? `<div style="margin-top:18px;padding:12px 14px;background:#fff8e6;border-left:3px solid #f0a500">
    <div style="font:700 12px -apple-system,sans-serif;color:#8a5b00">자동 점검</div>
    ${c.findings.map((f) => `<div style="font:12px -apple-system,sans-serif;color:#5c4300;padding-top:5px">• ${esc(f)}</div>`).join("")}
  </div>` : ""}`;

  const per = c.sites
    .map(
      (s) => `<div style="margin-top:26px;padding-top:18px;border-top:2px solid #111">
      <div style="font:700 15px -apple-system,sans-serif;color:#111">${esc(s.name)}</div>
      ${reportHtml(s.report, s.host, `https://${s.host}`)}
    </div>`,
    )
    .join("");

  return `<div style="max-width:680px;margin:0 auto;padding:22px 18px;background:#fff">
    ${head}
    <div style="margin-top:14px"><a href="${origin}/insight?day=${c.day}" style="font:600 13px -apple-system,sans-serif;color:#111">대시보드에서 전부 보기 →</a></div>
    ${per}
  </div>`;
}

export const combinedSubject = (c: Combined) =>
  `[방문 리포트] ${c.day} · 사람 ${c.people} · 방문 ${c.sessions} · 클릭 ${c.clicks}`;
