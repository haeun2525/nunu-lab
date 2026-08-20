import Home from "@/components/Home";
import { getClicks, getVisits } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [visits, clicks] = await Promise.all([
    getVisits().catch(() => ({ today: 0, total: 0 })),
    getClicks().catch(() => ({}) as Record<string, number>),
  ]);

  const total = Object.values(clicks).reduce((a, b) => a + b, 0);
  return <Home visits={visits} clicks={total} />;
}
