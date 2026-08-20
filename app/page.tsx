import Home from "@/components/Home";
import { getClicks, getNotice, getVisits } from "@/lib/db";
import { publicProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [visits, clicks, notice] = await Promise.all([
    getVisits().catch(() => ({ today: 0, total: 0 })),
    getClicks().catch(() => ({}) as Record<string, number>),
    getNotice().catch(() => null),
  ]);

  // 공지 배너에서 고를 수 있는 사이트 안 페이지들
  const pages = [
    { path: "/repo", label: "저장소" },
    { path: "/guestbook", label: "방명록" },
    ...publicProjects().map((p) => ({
      path: `/repo/${p.slug}`,
      label: `저장소 · ${p.title.ko}`,
    })),
  ];

  const total = Object.values(clicks).reduce((a, b) => a + b, 0);
  return <Home visits={visits} clicks={total} notice={notice} pages={pages} />;
}
