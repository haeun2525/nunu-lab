"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useLang } from "./LangProvider";
import { isNew, type Project } from "@/lib/projects";

type Sort = "clicks" | "recent" | "oldest";

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
  const [sort, setSort] = useState<Sort>("recent");

  // 최근/오래된 기준은 인스타 업로드일. 없으면 맨 뒤로 민다.
  const sorted = useMemo(() => {
    const at = (p: Project) => (p.postedAt ? Date.parse(p.postedAt) : 0);
    const list = [...projects];
    if (sort === "clicks") {
      list.sort((a, b) => (clicks[b.slug] ?? 0) - (clicks[a.slug] ?? 0) || at(b) - at(a));
    } else if (sort === "recent") {
      list.sort((a, b) => at(b) - at(a));
    } else {
      list.sort((a, b) => at(a) - at(b));
    }
    return list;
  }, [projects, clicks, sort]);

  const SORTS: { key: Sort; label: string }[] = [
    { key: "clicks", label: t.sortClicks },
    { key: "recent", label: t.sortRecent },
    { key: "oldest", label: t.sortOldest },
  ];

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

      <div className="sorts">
        {SORTS.map((s) => (
          <button
            key={s.key}
            data-on={sort === s.key ? "1" : "0"}
            onClick={() => setSort(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="cards">
        {sorted.map((p) => (
          <Link className="card" key={p.slug} href={`/repo/${p.slug}`}>
            <div className="thumb">
              <Image
                src={p.thumb}
                alt={p.title[lang]}
                width={720}
                height={960}
                sizes="(max-width: 520px) 100vw, (max-width: 1100px) 33vw, 25vw"
              />
              <span className="badge-group">
                {isNew(p) && <span className="badge-new">NEW</span>}
                <span className="badge">{String(p.no).padStart(2, "0")}</span>
              </span>
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
