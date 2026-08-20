import { authorize } from "@/lib/admin";
import { clearProjectEdit, setProjectEdit, type ProjectPatch } from "@/lib/db";
import { PROJECTS, type Bilingual } from "@/lib/projects";
import { applyPatch, loadProject } from "@/lib/projects-server";

export const dynamic = "force-dynamic";

/**
 * 저장소 상세 페이지 문구 수정.
 *
 * 원본(lib/projects.ts)은 건드리지 않고 수정분만 DB 에 쌓는다 → lib/projects-server.ts 가 얹어서 내보낸다.
 * DELETE 하면 원래 문구로 돌아간다.
 */

const LIMITS = {
  title: 80,
  tagline: 200,
  para: 2000,
  paras: 12,
  tags: 8,
  tag: 24,
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** {ko, en} 한 쌍. 둘 다 비면 안 고친 것으로 본다. */
function bilingual(v: unknown, max: number): Bilingual | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ko = str(o.ko, max);
  const en = str(o.en, max);
  if (!ko && !en) return null;
  return { ko, en };
}

async function requireAdmin() {
  const auth = await authorize();
  if (auth === "unset") {
    return Response.json(
      { error: "ADMIN_PASSWORD 가 설정돼 있지 않습니다." },
      { status: 503 },
    );
  }
  if (auth !== "ok") {
    return Response.json({ error: "운영자만 고칠 수 있습니다." }, { status: 401 });
  }
  return null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const denied = await requireAdmin();
  if (denied) return denied;

  const base = PROJECTS.find((p) => p.slug === slug && !p.draft);
  if (!base) return Response.json({ error: "없는 프로젝트입니다." }, { status: 404 });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const title = bilingual(payload.title, LIMITS.title);
  if (!title) {
    return Response.json({ error: "제목은 비울 수 없습니다." }, { status: 400 });
  }

  const patch: ProjectPatch = { title };

  const tagline = bilingual(payload.tagline, LIMITS.tagline);
  if (tagline) patch.tagline = tagline;

  // 문단은 빈 것을 버린다. 전부 지우면 소개글 없이 나간다.
  if (Array.isArray(payload.body)) {
    patch.body = payload.body
      .slice(0, LIMITS.paras)
      .map((p) => bilingual(p, LIMITS.para))
      .filter((p): p is Bilingual => Boolean(p));
  }

  if (Array.isArray(payload.tags)) {
    patch.tags = payload.tags
      .slice(0, LIMITS.tags)
      .map((t) => str(t, LIMITS.tag))
      .filter(Boolean);
  }

  // 영상 링크는 http(s) 만 받는다 (javascript: 같은 걸 막는다). 비우면 버튼이 안 뜬다.
  if ("videoUrl" in payload) {
    const raw = str(payload.videoUrl, 500);
    if (!raw) {
      patch.videoUrl = null;
    } else {
      try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
        patch.videoUrl = u.toString();
      } catch {
        return Response.json(
          { error: "영상 링크는 https:// 로 시작해야 합니다." },
          { status: 400 },
        );
      }
    }
  }

  // 업로드일은 YYYY-MM-DD 만. 비우면 상세에서 날짜 칸이 사라진다.
  if ("postedAt" in payload) {
    const raw = str(payload.postedAt, 10);
    if (!raw) {
      patch.postedAt = null;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return Response.json(
        { error: "업로드일은 2026-08-20 처럼 넣어주세요." },
        { status: 400 },
      );
    } else {
      patch.postedAt = raw;
    }
  }

  try {
    const saved = await setProjectEdit(slug, patch);
    return Response.json({ project: applyPatch(base, saved.patch) });
  } catch (e) {
    console.error("[projects] 저장 실패", e);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}

/** 원래 문구(lib/projects.ts)로 되돌린다. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await clearProjectEdit(slug);
    return Response.json({ project: await loadProject(slug) });
  } catch (e) {
    console.error("[projects] 되돌리기 실패", e);
    return Response.json({ error: "되돌리지 못했습니다." }, { status: 500 });
  }
}
