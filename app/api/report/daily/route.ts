import { hasAdminCookie } from "@/lib/admin";
import { dailyCombined } from "@/lib/daily";
import {
  combinedHtml,
  combinedSubject,
  mmss,
  yesterdayKst,
  type Combined,
} from "@/lib/report";

const SITE = "nunu-lab.vercel.app";

export const dynamic = "force-dynamic";

/**
 * 매일 한 번 Vercel Cron 이 부른다 (vercel.json). 어제 하루치를 Teams 로 보낸다.
 *
 * 인증 둘 중 하나:
 *  - Vercel Cron 이 붙여 주는 `Authorization: Bearer $CRON_SECRET`
 *  - 운영자 쿠키 (대시보드에서 "지금 보내기" 를 눌렀을 때)
 *
 * `?day=2026-08-25` 로 날짜를 지정할 수 있고, `?dry=1` 이면 보내지 않고 내용만 돌려준다.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const admin = await hasAdminCookie().catch(() => false);
  if (!(secret && bearer) && !admin) {
    return Response.json({ error: "권한 없음" }, { status: 401 });
  }

  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day") ?? "")
    ? url.searchParams.get("day")!
    : yesterdayKst();
  const report = await dailyCombined(day);

  if (url.searchParams.get("dry")) return Response.json(report);

  // 보낼 곳은 둘 다 선택이다. 하나만 설정해도 되고 둘 다 설정하면 둘 다 간다.
  const [teams, email] = await Promise.all([
    sendTeams(report, url.origin),
    sendEmail(report, url.origin),
  ]);

  const ok = teams.sent || email.sent;
  return Response.json({ sent: ok, day, teams, email }, { status: ok ? 200 : 200 });
}

/** Teams 채널 웹훅(Power Automate 워크플로). 없으면 조용히 건너뛴다. */
async function sendTeams(report: Combined, origin: string) {
  const hook = process.env.TEAMS_WEBHOOK_URL;
  if (!hook) return { sent: false, why: "TEAMS_WEBHOOK_URL 없음" };
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamsCard(report, origin)),
    });
    const text = await res.text();
    return { sent: res.ok, status: res.status, body: text.slice(0, 200) };
  } catch (e) {
    return { sent: false, why: String(e).slice(0, 200) };
  }
}

/**
 * 이메일(Resend). 도메인을 안 붙였으면 보내는 주소는 onboarding@resend.dev 로 두고
 * 받는 주소는 Resend 계정에 등록된 그 주소여야 한다. 도메인을 붙이면 REPORT_EMAIL_FROM 을 바꾸면 된다.
 */
async function sendEmail(report: Combined, origin: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  if (!key || !to) return { sent: false, why: "RESEND_API_KEY / REPORT_EMAIL_TO 없음" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.REPORT_EMAIL_FROM || "리포트 <onboarding@resend.dev>",
        to: to.split(",").map((x) => x.trim()).filter(Boolean),
        subject: combinedSubject(report),
        html: combinedHtml(report, origin),
      }),
    });
    const text = await res.text();
    return { sent: res.ok, status: res.status, body: text.slice(0, 200) };
  } catch (e) {
    return { sent: false, why: String(e).slice(0, 200) };
  }
}

const list = (rows: [string, number][], n = 5) =>
  rows.slice(0, n).map(([k, v]) => `${k} ${v}`).join(" · ") || "없음";

/** Teams 워크플로(Power Automate)가 받는 어댑티브 카드 모양. 두 사이트 합본. */
function teamsCard(c: Combined, origin: string) {
  const list = (rows: [string, number][], n = 5) =>
    rows.slice(0, n).map(([k, v]) => `${k} ${v}`).join(" · ") || "없음";

  const facts = [
    { title: "사람", value: `${c.people}명 (${c.sites.map((s) => `${s.name} ${s.report.people}`).join(" · ")})` },
    { title: "방문", value: `${c.sessions}번 · 페이지 ${c.views}장` },
    { title: "머문 시간", value: `중앙값 ${mmss(c.medianSeconds)}` },
    { title: "밖으로 나간 클릭", value: `${c.clicks}건` },
    { title: "유입", value: list(c.sources) },
    { title: "지역", value: list(c.places, 4) },
    { title: "기기", value: list(c.devices) },
  ];

  const body: unknown[] = [
    { type: "TextBlock", size: "Large", weight: "Bolder", text: `📊 ${c.day} 방문 리포트` },
    { type: "TextBlock", isSubtle: true, wrap: true, text: c.sites.map((s) => s.host).join(" + ") },
    { type: "FactSet", facts },
  ];

  for (const s of c.sites) {
    const deep = s.report.journeys
      .filter((j) => j.steps.length > 1 || j.clicks.length)
      .slice(0, 2)
      .map((j) => `**${j.visitor}** ${j.start} · ${mmss(j.seconds)} · ${j.device}${j.place ? " · " + j.place : ""}\n\n${[...j.steps, ...j.clicks.map((x) => `→${x}`)].join(" › ")}`);
    body.push({ type: "TextBlock", weight: "Bolder", separator: true, text: `${s.name} — 사람 ${s.report.people} · 방문 ${s.report.sessions} · 클릭 ${s.report.clicks}` });
    for (const d of deep) body.push({ type: "TextBlock", wrap: true, text: d });
  }

  if (c.findings.length) {
    body.push({ type: "TextBlock", weight: "Bolder", text: "자동 점검", separator: true });
    body.push({ type: "TextBlock", wrap: true, text: c.findings.map((f) => `• ${f}`).join("\n\n") });
  }

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body,
          actions: [{ type: "Action.OpenUrl", title: "대시보드 열기", url: `${origin}/insight?day=${c.day}` }],
        },
      },
    ],
  };
}
