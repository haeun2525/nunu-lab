import { addComment, listComments } from "@/lib/db";
import { findProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

const MAX = 2000;

function validScope(scope: string | null, slug: string | null) {
  if (scope === "guestbook") return slug === "guestbook";
  if (scope === "project") return Boolean(slug && findProject(slug));
  return false;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const scope = q.get("scope");
  const slug = q.get("slug");
  if (!validScope(scope, slug)) {
    return Response.json({ error: "bad scope" }, { status: 400 });
  }
  try {
    const rows = await listComments(scope as "project" | "guestbook", slug!);
    return Response.json({ comments: rows });
  } catch (e) {
    console.error("[comments] 조회 실패", e);
    return Response.json({ comments: [] });
  }
}

export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const scope = String(payload.scope ?? "");
  const slug = String(payload.slug ?? "");
  if (!validScope(scope, slug)) {
    return Response.json({ error: "bad scope" }, { status: 400 });
  }

  const anonymous = Boolean(payload.anonymous);
  const body = String(payload.body ?? "").trim();
  const name = anonymous ? "" : String(payload.name ?? "").trim().slice(0, 40);

  if (!body) return Response.json({ error: "empty" }, { status: 400 });
  if (body.length > MAX) return Response.json({ error: "too long" }, { status: 400 });
  if (!anonymous && !name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  try {
    const saved = await addComment({
      scope: scope as "project" | "guestbook",
      slug,
      name,
      anonymous,
      body,
    });
    return Response.json({ comment: saved }, { status: 201 });
  } catch (e) {
    console.error("[comments] 저장 실패", e);
    return Response.json({ error: "save failed" }, { status: 500 });
  }
}
