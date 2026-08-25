import { NextResponse } from "next/server";
import { findProject, STORE_URL } from "@/lib/projects";
import {
  bumpClick,
  deviceOf,
  logEvent,
  refHostOf,
  sessionId,
  shouldCount,
} from "@/lib/db";

export const dynamic = "force-dynamic";

/** UTM 을 붙인 최종 목적지. slug 가 'store' 면 스토어, 아니면 깃허브 레포. */
function destination(slug: string): string | null {
  if (slug === "store") return STORE_URL;
  const p = findProject(slug);
  return p ? `https://github.com/${p.repo}` : null;
}

/**
 * 갤러리·상세의 모든 외부 링크는 이 라우트를 거친다.
 * 여기서 클릭을 세고 UTM 을 붙여 302 로 보낸다.
 *
 * 예) /go/music-led?from=gallery
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const base = destination(slug);
  if (!base) return new NextResponse("Not found", { status: 404 });

  const from = new URL(req.url).searchParams.get("from") ?? "site";

  const url = new URL(base);
  url.searchParams.set("utm_source", "nunu-lab");
  url.searchParams.set("utm_medium", from);
  url.searchParams.set("utm_campaign", slug);
  url.searchParams.set("utm_content", slug === "store" ? "store-button" : "repo-link");

  // 집계 실패가 이동을 막으면 안 된다. 로컬 테스트는 아예 세지 않는다.
  try {
    if (!shouldCount(req)) return NextResponse.redirect(url.toString(), 302);
    await Promise.all([
      bumpClick(slug),
      logEvent({
        kind: "click",
        target: slug,
        medium: from,
        refHost: refHostOf(req.headers.get("referer")),
        device: deviceOf(req.headers.get("user-agent")),
        // 이동 기록의 끝. 세션 흐름에서 "여기서 밖으로 나갔다" 로 읽힌다
        path: `/go/${slug}`,
        session: await sessionId(),
      }),
    ]);
  } catch (e) {
    console.error("[go] 클릭 집계 실패", slug, e);
  }

  return NextResponse.redirect(url.toString(), 302);
}
