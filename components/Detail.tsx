"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import { useAdmin } from "./AdminProvider";
import Comments from "./Comments";
import FollowGate from "./FollowGate";
import ProjectEditor from "./ProjectEditor";
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

function TryMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M10 8.6 16 12l-6 3.4V8.6Z" fill="currentColor" />
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
  const { on: admin } = useAdmin();
  const router = useRouter();

  // 저장 직후에는 새로 받은 내용을 바로 보여주고, 서버 렌더도 다시 받아 온다.
  const [p, setP] = useState(project);
  const [editing, setEditing] = useState(false);
  useEffect(() => setP(project), [project]);

  return (
    <main className="shell detail">
      <Link className="back" href="/repo">
        {t.backToRepo}
      </Link>

      <div className="detail-grid">
        {/* 왼쪽: 사진만. 스크롤해도 따라온다 */}
        <aside className="detail-media">
          {(p.images.length ? p.images : [p.thumb]).map((src) => (
            <Image
              key={src}
              src={src}
              alt={p.title[lang]}
              width={720}
              height={960}
              sizes="(max-width: 900px) 100vw, 420px"
              priority
            />
          ))}
        </aside>

        {/* 오른쪽: 제목부터 후기까지 전부 */}
        <div className="detail-body">
          <h1 className="detail-h1">
            {p.title[lang]}
            {admin && (
              <button
                type="button"
                className="pe-open"
                onClick={() => setEditing(true)}
                aria-label="이 페이지 고치기"
                title="이 페이지 고치기"
              >
                ✎
              </button>
            )}
          </h1>
          <p className="lead">{p.tagline[lang]}</p>

          <div className="meta-row">
            {/* 브라우저에서 바로 되는 게 있으면 그게 먼저다. 코드는 그다음 */}
            {p.liveUrl && (
              <FollowGate
                className="btn btn-live"
                goHref={`/go/${p.slug}?to=live&from=detail`}
                goLabel={t.gateGoLive}
              >
                <TryMark />
                {t.openLive}
              </FollowGate>
            )}
            {p.videoUrl && (
              // 인스타로 나가는 것도 /go 를 거쳐야 몇 명이 영상을 보러 갔는지 잡힌다
              <a
                className="btn btn-ig"
                href={`/go/${p.slug}?to=video&from=detail`}
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
              goHref={`/go/${p.slug}?from=detail`}
            >
              <GithubMark />
              {t.openGithub}
              <span className="btn-n">↗ {clicks.toLocaleString()}</span>
            </FollowGate>
          </div>

          <div className="meta-row">
            {p.postedAt && (
              <span className="cbox" style={{ padding: "9px 16px" }}>
                {t.posted}
                <b style={{ fontSize: 13 }}>{p.postedAt}</b>
              </span>
            )}
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {p.tags.map((tag) => (
                <span className="tg" key={tag}>
                  {tag}
                </span>
              ))}
            </span>
          </div>

          <div className="prose">
            {p.body.map((para, i) => (
              <p key={i}>{para[lang]}</p>
            ))}
          </div>

          <section className="sect">
            <h2>{t.reviews}</h2>
            <p className="sect-lead">{t.reviewsLead}</p>
            <Comments scope="project" slug={p.slug} />
          </section>
        </div>
      </div>

      <footer className="foot">{t.footNote}</footer>

      {editing && (
        <ProjectEditor
          project={p}
          onSaved={(next) => {
            setP(next);
            router.refresh(); // 갤러리·홈에도 바뀐 문구가 나가게 한다
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </main>
  );
}
