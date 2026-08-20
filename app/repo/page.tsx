import Gallery from "@/components/Gallery";
import { publicProjects } from "@/lib/projects";
import { getClicks, getVisits } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clicks, visits] = await Promise.all([
    getClicks().catch(() => ({}) as Record<string, number>),
    getVisits().catch(() => ({ today: 0, total: 0 })),
  ]);

  return <Gallery projects={publicProjects()} clicks={clicks} visits={visits} />;
}
