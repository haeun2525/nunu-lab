import { NextResponse } from "next/server";
import { findProject, STORE_URL } from "@/lib/projects";
import {
  bumpClick,
  deviceOf,
  geoOf,
  isOwnVisit,
  logEvent,
  refHostOf,
  sessionId,
  shouldCount,
  visitorHash,
} from "@/lib/db";

export const dynamic = "force-dynamic";

/** UTM 을 붙인 최종 목적지.
 *  slug 가 'store' 면 스토어, 아니면 깃허브 레포.
 *  ?to=live 면 브라우저에서 바로 써 보는 주소로 간다 (그런 게 있는 프로젝트만). */
function destination(slug: string, live: boolean): string | null {
  // 카카오 오픈채팅. 주소는 환경변수에만 둔다 — 방을 새로 파도 배포 없이 바꾸려고.
  if (slug === "openchat") return process.env.OPENCHAT_URL || null;
  if (slug === "store") return STORE_URL;
  const p = findProject(slug);
  if (!p) return null;
  if (live) return p.liveUrl || null;
  return `https://github.com/${p.repo}`;
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
  const q = new URL(req.url).searchParams;
  const live = q.get("to") === "live";
  const base = destination(slug, live);
  if (!base) return new NextResponse("Not found", { status: 404 });

  const from = q.get("from") ?? "site";
  // 집계에서 "무엇을 눌렀는지"까지 갈리게 이름을 붙여 둔다 (face-mirror:live 처럼)
  const target = live ? `${slug}:live` : slug;

  // 카카오는 우리 UTM 을 읽지도, 알려주지도 않는다. 붙여 봐야 주소만 지저분해진다 —
  // **세는 건 여기서 끝난다.** 아래 logEvent 가 이 클릭의 전부다.
  if (slug === "openchat") {
    try {
      if (shouldCount(req) && !(await isOwnVisit(req))) {
        await Promise.all([
          bumpClick("openchat"),
          logEvent({
            kind: "click",
            target: "openchat",
            medium: from,
            refHost: refHostOf(req.headers.get("referer")),
            device: deviceOf(req.headers.get("user-agent")),
            ipHash: visitorHash(req),
            ...geoOf(req),
            path: "/go/openchat",
            session: await sessionId(),
          }),
        ]);
      }
    } catch (e) {
      console.error("[go] 오픈채팅 클릭 집계 실패", e);
    }
    return NextResponse.redirect(base, 302);
  }

  const url = new URL(base);
  url.searchParams.set("utm_source", "nunu-lab");
  url.searchParams.set("utm_medium", from);
  url.searchParams.set("utm_campaign", slug);
  url.searchParams.set(
    "utm_content",
    slug === "store" ? "store-button" : live ? "live-link" : "repo-link",
  );

  // 집계 실패가 이동을 막으면 안 된다. 로컬 테스트는 아예 세지 않는다.
  try {
    if (!shouldCount(req) || (await isOwnVisit(req)))
      return NextResponse.redirect(url.toString(), 302);
    await Promise.all([
      bumpClick(target),
      logEvent({
        kind: "click",
        target,
        medium: from,
        refHost: refHostOf(req.headers.get("referer")),
        device: deviceOf(req.headers.get("user-agent")),
        ipHash: visitorHash(req),
        ...geoOf(req),
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
