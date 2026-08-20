"use client";

import { useEffect, useState } from "react";
import type { Bilingual, Lang, Project } from "@/lib/projects";

/**
 * 저장소 상세 문구 편집기. 운영자 모드일 때만 뜬다.
 *
 * 여기서 고친 건 lib/projects.ts 를 덮어쓰는 게 아니라 DB 에 수정분으로 쌓인다.
 * '원래대로'를 누르면 파일에 적힌 원본으로 돌아간다.
 */

const pair = (b: Bilingual): Bilingual => ({ ko: b.ko, en: b.en });

type Draft = {
  title: Bilingual;
  tagline: Bilingual;
  body: Bilingual[];
  tags: string; // 쉼표로 구분해서 한 줄로 다룬다
  videoUrl: string;
  postedAt: string;
};

const draftOf = (p: Project): Draft => ({
  title: pair(p.title),
  tagline: pair(p.tagline),
  body: p.body.map(pair),
  tags: p.tags.join(", "),
  videoUrl: p.videoUrl ?? "",
  postedAt: p.postedAt ?? "",
});

export default function ProjectEditor({
  project,
  onSaved,
  onClose,
}: {
  project: Project;
  onSaved: (p: Project) => void;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Lang>("ko");
  const [d, setD] = useState<Draft>(() => draftOf(project));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [askReset, setAskReset] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setPart = (key: "title" | "tagline", v: string) =>
    setD({ ...d, [key]: { ...d[key], [lang]: v } });

  const setPara = (i: number, v: string) =>
    setD({
      ...d,
      body: d.body.map((p, n) => (n === i ? { ...p, [lang]: v } : p)),
    });

  const addPara = () => setD({ ...d, body: [...d.body, { ko: "", en: "" }] });

  const dropPara = (i: number) =>
    setD({ ...d, body: d.body.filter((_, n) => n !== i) });

  const send = async (method: "PUT" | "DELETE") => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/projects/${project.slug}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body:
          method === "PUT"
            ? JSON.stringify({
                title: d.title,
                tagline: d.tagline,
                body: d.body.filter((p) => p.ko.trim() || p.en.trim()),
                tags: d.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                videoUrl: d.videoUrl,
                postedAt: d.postedAt,
              })
            : undefined,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장에 실패했습니다.");
      if (j.project) {
        onSaved(j.project);
        if (method === "DELETE") setD(draftOf(j.project));
      }
      if (method === "PUT") onClose();
      setAskReset(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const hint =
    lang === "ko"
      ? "한국어로 보이는 문구를 고칩니다."
      : "영어로 볼 때 나오는 문구입니다. 비워 두면 그 자리가 빈 채로 보입니다.";

  return (
    <div
      className="gate-back"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="gate pe"
        onSubmit={(e) => {
          e.preventDefault();
          send("PUT");
        }}
      >
        <button type="button" className="gate-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <h3>페이지 고치기</h3>

        <div className="pe-langs">
          {(["ko", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              data-on={lang === l ? "1" : "0"}
              onClick={() => setLang(l)}
            >
              {l === "ko" ? "한국어" : "English"}
            </button>
          ))}
        </div>
        <p className="pe-hint">{hint}</p>

        <div className="pe-scroll">
          <label className="nb-l">제목</label>
          <input
            type="text"
            value={d.title[lang]}
            maxLength={80}
            onChange={(e) => setPart("title", e.target.value)}
            placeholder="NU40DK 뮤직 LED"
          />

          <label className="nb-l">한 줄 소개 (카드에 뜨는 문장)</label>
          <textarea
            rows={2}
            value={d.tagline[lang]}
            maxLength={200}
            onChange={(e) => setPart("tagline", e.target.value)}
            placeholder="어떤 건지 한 문장으로"
          />

          <label className="nb-l">소개글</label>
          {d.body.map((p, i) => (
            <div className="pe-para" key={i}>
              <textarea
                rows={4}
                value={p[lang]}
                maxLength={2000}
                onChange={(e) => setPara(i, e.target.value)}
                placeholder={`${i + 1}번째 문단`}
              />
              <button
                type="button"
                className="pe-drop"
                onClick={() => dropPara(i)}
                aria-label="이 문단 지우기"
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="pe-add" onClick={addPara}>
            + 문단 추가
          </button>

          <label className="nb-l">태그 (쉼표로 구분)</label>
          <input
            type="text"
            value={d.tags}
            onChange={(e) => setD({ ...d, tags: e.target.value })}
            placeholder="Python, Arduino"
          />

          <label className="nb-l">영상 링크 (비우면 버튼이 안 뜹니다)</label>
          <input
            type="text"
            value={d.videoUrl}
            onChange={(e) => setD({ ...d, videoUrl: e.target.value })}
            placeholder="https://www.instagram.com/p/..."
          />

          <label className="nb-l">인스타 업로드일</label>
          <input
            type="text"
            value={d.postedAt}
            onChange={(e) => setD({ ...d, postedAt: e.target.value })}
            placeholder="2026-08-20"
          />
        </div>

        {err && <p className="nb-err">{err}</p>}

        <div className="pe-actions">
          {askReset ? (
            <>
              <span className="pe-ask">원래 문구로 되돌릴까요?</span>
              <button
                type="button"
                className="adm-ghost"
                onClick={() => setAskReset(false)}
              >
                아니요
              </button>
              <button
                type="button"
                className="pe-danger"
                onClick={() => send("DELETE")}
                disabled={busy}
              >
                되돌리기
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="adm-ghost"
                onClick={() => setAskReset(true)}
                disabled={busy}
              >
                원래대로
              </button>
              <button className="send" type="submit" disabled={busy}>
                {busy ? "저장 중…" : "저장"}
              </button>
            </>
          )}
        </div>
        <p className="pe-note">
          한국어·영어를 각각 저장합니다. 사진은 여기서 못 바꿔요.
        </p>
      </form>
    </div>
  );
}
