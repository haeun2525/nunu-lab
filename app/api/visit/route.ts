import { cookies } from "next/headers";
import {
  bumpVisit,
  deviceOf,
  externalRefHost,
  kstDate,
  logEvent,
  safePath,
  sessionId,
  shouldCount,
  tag,
} from "@/lib/db";

export const dynamic = "force-dynamic";

const COOKIE = "nunu_v";

/**
 * 페이지를 열 때마다 부른다.
 *
 *  - view  : 볼 때마다 남는다. 한 번 들른 동안 어디를 어떤 순서로 봤는지 보려고.
 *  - visit : 하루 한 번만. 판정은 쿠키에 박아 둔 날짜로 한다.
 *
 * 유입원은 클라이언트가 보내 준다 — 서버가 받는 referer 헤더는 우리 도메인이라
 * (VisitPing 이 사이트 안에서 부르므로) 밖에서 온 경로를 알 수 없다.
 */
export async function POST(req: Request) {
  // 로컬·프리뷰 배포는 세지 않는다
  if (!shouldCount(req)) return Response.json({ counted: false, skipped: true });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* 본문 없이 와도 방문 집계는 한다 */
  }

  const utm = (body.utm ?? {}) as Record<string, unknown>;
  const refHost = externalRefHost(String(body.ref ?? ""), req);
  const ctx = {
    // utm 이 있으면 그걸 믿는다. 없으면 밖에서 온 도메인, 그것도 없으면 빈 값.
    source: tag(utm.source) || refHost,
    campaign: tag(utm.campaign),
    content: tag(utm.content),
    medium: tag(utm.medium),
    path: safePath(body.path),
    refHost,
    device: deviceOf(req.headers.get("user-agent")),
    session: await sessionId(),
  };

  const jar = await cookies();
  const today = kstDate(); // DB 와 같은 한국시간 기준이어야 한다
  const firstToday = jar.get(COOKIE)?.value !== today;

  try {
    await Promise.all([
      logEvent({ kind: "view", ...ctx }),
      ...(firstToday ? [bumpVisit(), logEvent({ kind: "visit", ...ctx })] : []),
    ]);
  } catch (e) {
    console.error("[visit] 기록 실패", e);
    return Response.json({ counted: false }, { status: 200 });
  }

  if (!firstToday) return Response.json({ counted: false });

  jar.set(COOKIE, today, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 36,
    path: "/",
  });

  return Response.json({ counted: true });
}
