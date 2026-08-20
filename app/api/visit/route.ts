import { cookies } from "next/headers";
import { bumpVisit, deviceOf, kstDate, logEvent, refHostOf, shouldCount } from "@/lib/db";

export const dynamic = "force-dynamic";

const COOKIE = "nunu_v";

/** 하루 한 번만 센다. 판정은 쿠키에 박아 둔 날짜로 한다. */
export async function POST(req: Request) {
  // 로컬·프리뷰 배포는 세지 않는다
  if (!shouldCount(req)) return Response.json({ counted: false, skipped: true });

  const jar = await cookies();
  const today = kstDate(); // DB 와 같은 한국시간 기준이어야 한다

  if (jar.get(COOKIE)?.value === today) {
    return Response.json({ counted: false });
  }

  try {
    await Promise.all([
      bumpVisit(),
      logEvent({
        kind: "visit",
        refHost: refHostOf(req.headers.get("referer")),
        device: deviceOf(req.headers.get("user-agent")),
      }),
    ]);
  } catch (e) {
    console.error("[visit] bump 실패", e);
    return Response.json({ counted: false }, { status: 200 });
  }

  jar.set(COOKIE, today, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 36,
    path: "/",
  });

  return Response.json({ counted: true });
}
