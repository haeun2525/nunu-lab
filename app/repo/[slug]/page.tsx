import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Detail from "@/components/Detail";
import { findProject, publicProjects } from "@/lib/projects";
import { getClicks } from "@/lib/db";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return publicProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = findProject(slug);
  if (!p) return {};
  return {
    title: `${p.title.ko} | 누누`,
    description: p.tagline.ko,
    openGraph: {
      title: p.title.ko,
      description: p.tagline.ko,
      images: [p.thumb],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  const clicks = await getClicks().catch(() => ({}) as Record<string, number>);
  return <Detail project={project} clicks={clicks[slug] ?? 0} />;
}
