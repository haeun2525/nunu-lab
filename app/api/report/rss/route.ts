import { eventsBetween, kstDate, visitorsBefore } from "@/lib/db";
import { buildReport, kstRange, reportHtml, reportSubject } from "@/lib/report";

export const dynamic = "force-dynamic";

const SITE = "nunu-lab.vercel.app";
const DAYS = 7;

/**
 * 최근 며칠치 리포트를 RSS 로 내보낸다.
 *
 * 왜 있냐면 — Teams 안에서 만드는 워크플로 빌더에는 웹훅 트리거가 안 나온다.
 * 그런데 **RSS 트리거와 이메일 보내기는 기본 커넥터**라 유료 없이 쓸 수 있다.
 * 그래서 "RSS 항목이 게시되면 → 채널에 게시 / 메일 보내기" 흐름 하나면
 * 웹훅 없이도 매일 리포트를 받을 수 있다.
 *
 * 열쇠는 걸지 않는다 — 주소를 알아야 볼 수 있고, 담긴 건 집계 숫자뿐이다.
 * (개인을 가리키는 값은 애초에 저장하지 않는다.)
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const today = kstDate();
  const days: string[] = [];
  for (let i = 1; i <= DAYS; i++) {
    days.push(kstDate(new Date(new Date(`${today}T00:00:00Z`).getTime() - i * 86400e3)));
  }
  days.reverse(); // 오래된 날부터 훑어야 '새 방문자' 판정이 맞다

  const oldest = kstRange(days[0]);
  const [all, before] = await Promise.all([
    eventsBetween(oldest.from, kstRange(days[days.length - 1]).to),
    visitorsBefore(oldest.from),
  ]);

  const seen = new Set(before);
  const items: string[] = [];
  for (const day of days) {
    const { from, to } = kstRange(day);
    const rows = all.filter((e) => e.created_at >= from && e.created_at < to);
    const report = buildReport(day, rows, new Set(seen));
    for (const e of rows) if (e.ip_hash) seen.add(e.ip_hash);
    items.push(`
    <item>
      <title>${reportSubject(report, SITE).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>
      <link>${origin}/insight?day=${day}</link>
      <guid isPermaLink="false">${SITE}-${day}</guid>
      <pubDate>${new Date(`${day}T00:00:00.000Z`).toUTCString()}</pubDate>
      <description><![CDATA[${reportHtml(report, SITE, origin)}]]></description>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE} 방문 리포트</title>
    <link>${origin}/insight</link>
    <description>매일 하루치 방문 집계</description>
    <language>ko</language>
    ${items.reverse().join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
