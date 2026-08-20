"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "./LangProvider";
import { isNew, type Project } from "@/lib/projects";

export default function Gallery({
  projects,
  clicks,
  visits,
}: {
  projects: Project[];
  clicks: Record<string, number>;
  visits: { today: number; total: number };
}) {
  const { t, lang } = useLang();
  const ghTotal = Object.values(clicks).reduce((a, b) => a + b, 0);

  return (
    <main className="shell">
      <div className="gal-head">
        <div>
          <h2>{t.repoTitle}</h2>
          <p>{t.repoLead}</p>
        </div>
        <div className="counts">
          <div className="cbox">
            {t.visitToday}
            <b>{visits.today.toLocaleString()}</b>
          </div>
          <div className="cbox">
            {t.visitTotal}
            <b>{visits.total.toLocaleString()}</b>
          </div>
          <div className="cbox">
            {t.ghClicks}
            <b>{ghTotal.toLocaleString()}</b>
          </div>
        </div>
      </div>

      <div className="cards">
        {projects.map((p) => (
          <Link className="card" key={p.slug} href={`/repo/${p.slug}`}>
            <div className="thumb">
              <Image
                src={p.thumb}
                alt={p.title[lang]}
                width={720}
                height={960}
                sizes="(max-width: 520px) 100vw, (max-width: 1100px) 33vw, 25vw"
              />
              <span className="badge">{String(p.no).padStart(2, "0")}</span>
              {isNew(p) && <span className="badge-new">NEW</span>}
              <span className="clicks">↗ {(clicks[p.slug] ?? 0).toLocaleString()}</span>
              <div className="card-t">
                <h3>{p.title[lang]}</h3>
                <p>{p.tagline[lang]}</p>
              </div>
            </div>
            <div className="card-f">
              {p.tags.map((tag) => (
                <span className="tg" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <footer className="foot">{t.footNote}</footer>
    </main>
  );
}
