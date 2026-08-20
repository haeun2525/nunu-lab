import { cookies } from "next/headers";
import { bumpVisit } from "@/lib/db";

export const dynamic = "force-dynamic";

const COOKIE = "nunu_v";

/** 하루 한 번만 센다. 판정은 쿠키에 박아 둔 날짜로 한다. */
export async function POST() {
  const jar = await cookies();
  const today = new Date().toISOString().slice(0, 10);

  if (jar.get(COOKIE)?.value === today) {
    return Response.json({ counted: false });
  }

  try {
    await bumpVisit();
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
