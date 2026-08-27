import { lockedMessage, setAdminCookie, tryPin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** PIN 만 확인하고 통과시킨다. 맞으면 쿠키를 심어 다음부터 안 물어본다. */
export async function POST(req: Request) {
  let payload: { password?: unknown };
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

  const pw = typeof payload.password === "string" ? payload.password : "";
  const r = await tryPin(pw);
  if (!r.ok) {
    if (r.locked) {
      return Response.json({ error: lockedMessage(r.locked) }, { status: 429 });
    }
    return Response.json({ error: "PIN 이 다릅니다." }, { status: 401 });
  }

  await setAdminCookie();
  return Response.json({ ok: true });
}
