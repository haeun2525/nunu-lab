import { getNotice, setNotice, type LinkKind } from "@/lib/db";
import { publicProjects } from "@/lib/projects";
import { authorize, hasAdminCookie, setAdminCookie } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  // canEdit 이 true 면 비밀번호 화면을 건너뛴다
  const canEdit = await hasAdminCookie().catch(() => false);
  try {
    const notice = await getNotice();
    return Response.json({ notice, canEdit });
  } catch (e) {
    console.error("[notice] 조회 실패", e);
    return Response.json({ notice: null, canEdit });
  }
}

export async function PUT(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const auth = await authorize(
    typeof payload.password === "string" ? payload.password : undefined,
  );
  if (auth === "unset") {
    return Response.json(
      { error: "ADMIN_PASSWORD 가 설정돼 있지 않습니다." },
      { status: 503 },
    );
  }
  if (auth === "bad") {
    return Response.json({ error: "PIN 이 다릅니다." }, { status: 401 });
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

    // PIN 으로 통과한 경우 쿠키를 심어 다음부터는 안 물어본다
    await setAdminCookie();

    return Response.json({ notice });
  } catch (e) {
    console.error("[notice] 저장 실패", e);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
