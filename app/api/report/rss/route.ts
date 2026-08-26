import { kstDate } from "@/lib/db";
import { dailyCombined } from "@/lib/daily";
import { combinedHtml, combinedSubject, esc } from "@/lib/report";

export const dynamic = "force-dynamic";

const DAYS = 7;
/** 하루치를 몇 시(한국시간)에 내보낼지. 이 시각이 지나야 어제치가 피드에 뜬다. */
const PUBLISH_HOUR = 9;

/**
 * 두 사이트 합본 리포트를 RSS 로 내보낸다. **이 주소 하나만 구독하면 된다.**
 *
 * 왜 RSS 냐면 — Teams 안에서 만드는 워크플로 빌더에는 웹훅 트리거가 안 나온다.
 * 그런데 RSS 트리거와 이메일 보내기는 기본 커넥터라 유료 없이 쓸 수 있다.
 * "RSS 항목이 게시되면 → 메일 보내기" 하나면 매일 아침 리포트가 온다.
 *
 * 항목이 뜨는 시각이 곧 리포트가 도착하는 시각이다 (아래 PUBLISH_HOUR).
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const kstNow = new Date(Date.now() + 9 * 3600e3);
  const today = kstDate();

  // 어제치는 오늘 09시(KST)가 지나야 내보낸다
  const skipYesterday = kstNow.getUTCHours() < PUBLISH_HOUR;
  const days: string[] = [];
  for (let i = skipYesterday ? 2 : 1; days.length < DAYS; i++) {
    days.push(kstDate(new Date(new Date(`${today}T00:00:00Z`).getTime() - i * 86400e3)));
  }

  /** 그 날짜가 피드에 나타난 시각 = 다음 날 09시(KST). */
  const publishedAt = (day: string) =>
    new Date(new Date(`${day}T00:00:00.000Z`).getTime() + 86400e3 + (PUBLISH_HOUR - 9) * 3600e3);

  const items = await Promise.all(
    days.map(async (day) => {
      const c = await dailyCombined(day);
      return `
    <item>
      <title>${esc(combinedSubject(c))}</title>
      <link>${origin}/insight?day=${day}</link>
      <guid isPermaLink="false">daily-${day}</guid>
      <pubDate>${publishedAt(day).toUTCString()}</pubDate>
      <description><![CDATA[${combinedHtml(c, origin)}]]></description>
    </item>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>누누랩 + howcanisayit 방문 리포트</title>
    <link>${origin}/insight</link>
    <description>두 사이트 하루치 방문 집계 합본</description>
    <language>ko</language>
    ${items.join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
