import {
  PROJECTS,
  type Project,
  type Bilingual,
} from "./projects";
import { getProjectEdits, type ProjectEdit, type ProjectPatch } from "./db";

/**
 * 화면에 실제로 나가는 프로젝트 목록.
 *
 * lib/projects.ts 가 원본이고, 운영자가 화면에서 고친 것(project_edits)을 그 위에 덮는다.
 * 서버에서만 부른다 — DB 를 읽으므로 클라이언트 컴포넌트에서 부르면 안 된다.
 *
 * DB 조회가 실패해도 원본으로 그냥 나간다. 문구 수정 때문에 페이지가 죽으면 안 되니까.
 */

const isBilingual = (v: unknown): v is Bilingual =>
  Boolean(v) &&
  typeof v === "object" &&
  typeof (v as Bilingual).ko === "string" &&
  typeof (v as Bilingual).en === "string";

/** 원본 위에 수정분을 얹는다. 없는 필드는 원본 그대로 둔다. */
export function applyPatch(base: Project, patch?: ProjectPatch): Project {
  if (!patch) return base;
  const out = { ...base };
  if (isBilingual(patch.title)) out.title = patch.title;
  if (isBilingual(patch.tagline)) out.tagline = patch.tagline;
  if (Array.isArray(patch.body) && patch.body.every(isBilingual)) {
    out.body = patch.body;
  }
  if (Array.isArray(patch.tags) && patch.tags.every((t) => typeof t === "string")) {
    out.tags = patch.tags;
  }
  if (patch.videoUrl === null || typeof patch.videoUrl === "string") {
    out.videoUrl = patch.videoUrl || null;
  }
  if (patch.postedAt === null || typeof patch.postedAt === "string") {
    out.postedAt = patch.postedAt || null;
  }
  return out;
}

/** 공개된 것만, 수정분까지 얹어서. 갤러리·홈이 쓴다. */
export async function loadProjects(): Promise<Project[]> {
  const edits = await getProjectEdits().catch((e) => {
    console.error("[projects] 수정분 조회 실패 — 원본으로 나간다", e);
    return {} as Record<string, ProjectEdit>;
  });
  return PROJECTS.filter((p) => !p.draft).map((p) =>
    applyPatch(p, edits[p.slug]?.patch),
  );
}

export async function loadProject(slug: string): Promise<Project | null> {
  const base = PROJECTS.find((p) => p.slug === slug && !p.draft);
  if (!base) return null;
  const edits = await getProjectEdits().catch(
    () => ({}) as Record<string, ProjectEdit>,
  );
  return applyPatch(base, edits[slug]?.patch);
}
