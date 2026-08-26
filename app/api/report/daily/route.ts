import { hasAdminCookie } from "@/lib/admin";
import { eventsBetween, visitorsBefore } from "@/lib/db";
import { buildReport, kstRange, yesterdayKst, type DayReport } from "@/lib/report";

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
  const { from, to } = kstRange(day);

  const [rows, before] = await Promise.all([
    eventsBetween(from, to),
    visitorsBefore(from),
  ]);
  const report = buildReport(day, rows, before);

  if (url.searchParams.get("dry")) return Response.json(report);

  const hook = process.env.TEAMS_WEBHOOK_URL;
  if (!hook) {
    return Response.json(
      { sent: false, why: "TEAMS_WEBHOOK_URL 이 없다", report },
      { status: 200 },
    );
  }

  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(teamsCard(report, url.origin)),
  });
  const text = await res.text();

  return Response.json({ sent: res.ok, status: res.status, body: text.slice(0, 300), day });
}

const mmss = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;

const list = (rows: [string, number][], n = 5) =>
  rows.slice(0, n).map(([k, v]) => `${k} ${v}`).join(" · ") || "없음";

/** Teams 워크플로(Power Automate)가 받는 어댑티브 카드 모양. */
function teamsCard(r: DayReport, origin: string) {
  const facts = [
    { title: "사람", value: `${r.people}명 (새 ${r.newPeople} · 다시 온 ${r.returningPeople})` },
    { title: "방문", value: `${r.sessions}번 · 페이지 ${r.views}장` },
    { title: "머문 시간", value: `중앙값 ${mmss(r.medianSeconds)}` },
    { title: "한 장만 보고 나감", value: `${r.bounceRate}%` },
    { title: "밖으로 나간 클릭", value: `${r.clicks}건 — ${list(r.clickTargets, 3)}` },
    { title: "유입", value: list(r.sources) },
    { title: "지역", value: list(r.places, 4) },
    { title: "기기", value: list(r.devices) },
    { title: "많이 본 페이지", value: list(r.pages, 5) },
  ];

  const deep = r.journeys
    .filter((j) => j.steps.length > 1 || j.clicks.length)
    .slice(0, 3)
    .map((j) => {
      const path = [...j.steps, ...j.clicks.map((c) => `→${c}`)].join(" › ");
      return `**${j.visitor}** ${j.start} · ${mmss(j.seconds)} · ${j.device}${j.place ? " · " + j.place : ""}${j.returning ? " · 재방문" : ""}\n\n${path}`;
    });

  const body: unknown[] = [
    { type: "TextBlock", size: "Large", weight: "Bolder", text: `📊 ${r.day} 방문 리포트` },
    { type: "TextBlock", isSubtle: true, wrap: true, text: "nunu-lab.vercel.app" },
    { type: "FactSet", facts },
  ];

  if (deep.length) {
    body.push({ type: "TextBlock", weight: "Bolder", text: "눈여겨볼 여정", separator: true });
    for (const d of deep) body.push({ type: "TextBlock", wrap: true, text: d });
  }
  if (r.gaps.length) {
    body.push({ type: "TextBlock", weight: "Bolder", text: "확인이 필요한 것", separator: true });
    body.push({ type: "TextBlock", wrap: true, text: r.gaps.map((g) => `• ${g}`).join("\n\n") });
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
          actions: [
            { type: "Action.OpenUrl", title: "대시보드 열기", url: `${origin}/insight` },
          ],
        },
      },
    ],
  };
}
