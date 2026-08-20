"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "./LangProvider";
import Comments from "./Comments";
import FollowGate from "./FollowGate";
import type { Project } from "@/lib/projects";

function InstagramMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2.6"
        y="2.6"
        width="18.8"
        height="18.8"
        rx="5.4"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.6" cy="6.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function Detail({
  project,
  clicks,
}: {
  project: Project;
  clicks: number;
}) {
  const { t, lang } = useLang();

  return (
    <main className="shell detail">
      <Link className="back" href="/repo">
        {t.backToRepo}
      </Link>

      <div className="detail-grid">
        {/* 왼쪽: 사진만. 스크롤해도 따라온다 */}
        <aside className="detail-media">
          {(project.images.length ? project.images : [project.thumb]).map((src) => (
            <Image
              key={src}
              src={src}
              alt={project.title[lang]}
              width={720}
              height={960}
              sizes="(max-width: 900px) 100vw, 420px"
              priority
            />
          ))}
        </aside>

        {/* 오른쪽: 제목부터 후기까지 전부 */}
        <div className="detail-body">
          <h1>{project.title[lang]}</h1>
          <p className="lead">{project.tagline[lang]}</p>

          <div className="meta-row">
            {project.videoUrl && (
              <a
                className="btn btn-ig"
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramMark />
                {t.watchVideo}
              </a>
            )}
            {/* 외부 이동은 /go 를 거쳐야 UTM 이 붙고 클릭이 집계된다.
                넘어가기 직전에 팔로우 팝업이 한 번 잡는다. */}
            <FollowGate
              className="btn btn-gh"
              goHref={`/go/${project.slug}?from=detail`}
            >
              <GithubMark />
              {t.openGithub}
              <span className="btn-n">↗ {clicks.toLocaleString()}</span>
            </FollowGate>
          </div>

          <div className="meta-row">
            {project.postedAt && (
              <span className="cbox" style={{ padding: "9px 16px" }}>
                {t.posted}
                <b style={{ fontSize: 13 }}>{project.postedAt}</b>
              </span>
            )}
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.tags.map((tag) => (
                <span className="tg" key={tag}>
                  {tag}
                </span>
              ))}
            </span>
          </div>

          <div className="prose">
            {project.body.map((para, i) => (
              <p key={i}>{para[lang]}</p>
            ))}
          </div>

          <section className="sect">
            <h2>{t.reviews}</h2>
            <p className="sect-lead">{t.reviewsLead}</p>
            <Comments scope="project" slug={project.slug} />
          </section>
        </div>
      </div>

      <footer className="foot">{t.footNote}</footer>
    </main>
  );
}
