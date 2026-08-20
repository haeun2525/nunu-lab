import {
  checkPassword,
  clearAdminCookie,
  hasAdminCookie,
  setAdminCookie,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

/** 지금 이 브라우저가 운영자 모드인지. (구석 버튼이 뜰 때 한 번 물어본다) */
export async function GET() {
  const unset = !process.env.ADMIN_PASSWORD;
  const on = unset ? false : await hasAdminCookie().catch(() => false);
  return Response.json({ on, unset });
}

/** PIN 확인 → 통과하면 쿠키를 심는다. */
export async function POST(req: Request) {
  let payload: { pin?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    return Response.json(
      { error: "ADMIN_PASSWORD 가 설정돼 있지 않습니다." },
      { status: 503 },
    );
  }

  const pin = typeof payload.pin === "string" ? payload.pin : "";
  if (!checkPassword(pin, real)) {
    return Response.json({ error: "PIN 이 다릅니다." }, { status: 401 });
  }

  await setAdminCookie();
  return Response.json({ on: true });
}

/** 운영자 모드 나가기. */
export async function DELETE() {
  await clearAdminCookie();
  return Response.json({ on: false });
}
