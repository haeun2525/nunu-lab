"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import type { Notice } from "@/lib/db";

/** 픽셀로 그린 확성기. 8×8 격자를 그대로 키운다. */
function Megaphone() {
  return (
    <svg
      className="nb-horn"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
      fill="currentColor"
    >
      <rect x="2" y="6" width="2" height="4" />
      <rect x="4" y="5" width="2" height="6" />
      <rect x="6" y="3" width="2" height="10" />
      <rect x="8" y="2" width="2" height="12" />
      <rect x="4" y="11" width="2" height="3" />
      <rect x="11" y="5" width="1" height="1" />
      <rect x="12" y="4" width="1" height="1" />
      <rect x="11" y="10" width="1" height="1" />
      <rect x="12" y="11" width="1" height="1" />
      <rect x="12" y="7" width="2" height="2" />
    </svg>
  );
}

type Draft = {
  text: string;
  link_kind: "none" | "url" | "internal";
  link_url: string;
  link_path: string;
};

export default function NoticeBanner({
  initial,
  pages,
}: {
  initial: Notice | null;
  pages: { path: string; label: string }[];
}) {
  const { t } = useLang();
  const [notice, setNotice] = useState<Notice | null>(initial);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    text: initial?.text ?? "",
    link_kind: initial?.link_kind ?? "none",
    link_url: initial?.link_url ?? "",
    link_path: initial?.link_path ?? pages[0]?.path ?? "/repo",
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const stamp = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "";
    const k = new Date(d.getTime() + 9 * 3600e3);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${k.getUTCFullYear()}.${p(k.getUTCMonth() + 1)}.${p(k.getUTCDate())} ${p(
      k.getUTCHours(),
    )}:${p(k.getUTCMinutes())}`;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, password: pw || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장 실패");
      setNotice(j.notice);
      setPw("");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const hasText = Boolean(notice?.text);

  const inner = (
    <>
      <Megaphone />
      <span className="nb-text">{notice?.text}</span>
      {notice?.link_kind !== "none" && <span className="nb-go">›</span>}
      <span className="nb-time">{stamp(notice?.updated_at)}</span>
    </>
  );

  return (
    <div className="nb-wrap">
      {hasText ? (
        notice!.link_kind === "url" ? (
          <a
            className="nb"
            href={notice!.link_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        ) : notice!.link_kind === "internal" ? (
          <Link className="nb" href={notice!.link_path}>
            {inner}
          </Link>
        ) : (
          <div className="nb nb-static">{inner}</div>
        )
      ) : (
        <div className="nb nb-empty">
          <Megaphone />
          <span className="nb-text">{t.noticeEmpty}</span>
        </div>
      )}

      {/* 운영자만 쓰는 자물쇠. 비밀번호를 모르면 저장이 안 된다. */}
      <button className="nb-edit" onClick={() => setOpen(true)} aria-label={t.noticeEdit}>
        ✎
      </button>

      {open && (
        <div
          className="gate-back"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form className="gate nb-form" onSubmit={save}>
            <button
              type="button"
              className="gate-x"
              onClick={() => setOpen(false)}
              aria-label={t.close}
            >
              ✕
            </button>
            <h3>{t.noticeEdit}</h3>

            <label className="nb-l">{t.noticePw}</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <label className="nb-l">{t.noticeText}</label>
            <input
              type="text"
              value={draft.text}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder={t.noticePlaceholder}
            />

            <label className="nb-l">{t.noticeLink}</label>
            <div className="nb-kinds">
              {(["none", "url", "internal"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  data-on={draft.link_kind === k ? "1" : "0"}
                  onClick={() => setDraft({ ...draft, link_kind: k })}
                >
                  {k === "none" ? t.linkNone : k === "url" ? t.linkUrl : t.linkInternal}
                </button>
              ))}
            </div>

            {draft.link_kind === "url" && (
              <input
                type="url"
                value={draft.link_url}
                onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                placeholder="https://..."
              />
            )}

            {draft.link_kind === "internal" && (
              <select
                value={draft.link_path}
                onChange={(e) => setDraft({ ...draft, link_path: e.target.value })}
              >
                {pages.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            {err && <p className="nb-err">{err}</p>}

            <div className="nb-actions">
              <button className="send" type="submit" disabled={busy}>
                {busy ? t.sending : t.noticeSave}
              </button>
            </div>
            <p className="nb-hint">{t.noticeHint}</p>
          </form>
        </div>
      )}
    </div>
  );
}
