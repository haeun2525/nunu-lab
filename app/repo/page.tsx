import Gallery from "@/components/Gallery";
import { loadProjects } from "@/lib/projects-server";
import { getClicks, getVisits } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [projects, clicks, visits] = await Promise.all([
    loadProjects(),
    getClicks().catch(() => ({}) as Record<string, number>),
    getVisits().catch(() => ({ today: 0, total: 0 })),
  ]);

  return <Gallery projects={projects} clicks={clicks} visits={visits} />;
}
