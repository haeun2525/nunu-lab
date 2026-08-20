import { cookies } from "next/headers";
import { adminCookieName, checkPassword, tokenOf } from "../auth";

export const dynamic = "force-dynamic";

/** 비밀번호만 확인하고 통과시킨다. 맞으면 쿠키를 심어 다음부터 안 물어본다. */
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
  if (!checkPassword(pw, real)) {
    return Response.json({ error: "비밀번호가 다릅니다." }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(adminCookieName, tokenOf(real), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return Response.json({ ok: true });
}
