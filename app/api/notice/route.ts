import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getNotice, setNotice, type LinkKind } from "@/lib/db";
import { publicProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

const COOKIE = "nunu_admin";

/**
 * 운영자 인증.
 *
 * 비밀번호는 ADMIN_PASSWORD 환경변수에만 있다. 한 번 맞히면 그 해시를 httpOnly
 * 쿠키로 심어 두고, 다음부터는 쿠키만으로 통과시킨다. 쿠키 값이 비밀번호에서
 * 파생되므로 비밀번호를 모르면 위조할 수 없다.
 */
const tokenOf = (pw: string) =>
  createHash("sha256").update(`nunu-lab:${pw}`).digest("hex");

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

async function authorized(password?: string): Promise<"ok" | "bad" | "unset"> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return "unset"; // 비밀번호를 안 정해 두면 수정 자체를 막는다

  const jar = await cookies();
  const cookie = jar.get(COOKIE)?.value;
  if (cookie && sameString(cookie, tokenOf(real))) return "ok";
  if (password && sameString(password, real)) return "ok";
  return "bad";
}

export async function GET() {
  try {
    const notice = await getNotice();
    return Response.json({ notice });
  } catch (e) {
    console.error("[notice] 조회 실패", e);
    return Response.json({ notice: null });
  }
}

export async function PUT(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const auth = await authorized(
    typeof payload.password === "string" ? payload.password : undefined,
  );
  if (auth === "unset") {
    return Response.json(
      { error: "ADMIN_PASSWORD 가 설정돼 있지 않습니다." },
      { status: 503 },
    );
  }
  if (auth === "bad") {
    return Response.json({ error: "비밀번호가 다릅니다." }, { status: 401 });
  }

  const text = String(payload.text ?? "").trim().slice(0, 200);
  const kind = String(payload.link_kind ?? "none") as LinkKind;
  if (!["none", "url", "internal"].includes(kind)) {
    return Response.json({ error: "bad link kind" }, { status: 400 });
  }

  // 외부 URL 은 http(s) 만 허용한다 (javascript: 같은 걸 막는다)
  let link_url = "";
  if (kind === "url") {
    const raw = String(payload.link_url ?? "").trim();
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      link_url = u.toString();
    } catch {
      return Response.json(
        { error: "http:// 또는 https:// 로 시작하는 주소를 넣어주세요." },
        { status: 400 },
      );
    }
  }

  // 내부 경로는 실제로 있는 페이지만 허용한다
  let link_path = "";
  if (kind === "internal") {
    const raw = String(payload.link_path ?? "").trim();
    const allowed = new Set([
      "/",
      "/repo",
      "/guestbook",
      ...publicProjects().map((p) => `/repo/${p.slug}`),
    ]);
    if (!allowed.has(raw)) {
      return Response.json({ error: "없는 페이지입니다." }, { status: 400 });
    }
    link_path = raw;
  }

  try {
    const notice = await setNotice({ text, link_kind: kind, link_url, link_path });

    // 비밀번호로 통과한 경우 쿠키를 심어 다음부터는 안 물어본다
    const real = process.env.ADMIN_PASSWORD!;
    const jar = await cookies();
    jar.set(COOKIE, tokenOf(real), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });

    return Response.json({ notice });
  } catch (e) {
    console.error("[notice] 저장 실패", e);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
