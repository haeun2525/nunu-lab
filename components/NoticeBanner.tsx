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
  // 비밀번호 화면과 수정 화면을 분리한다. 쿠키가 이미 있으면 바로 edit 으로 간다.
  const [step, setStep] = useState<"pw" | "edit">("pw");
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

  // 예전에 한 번 통과했으면 비밀번호를 다시 묻지 않는다
  const openEditor = async () => {
    setErr(null);
    setPw("");
    setOpen(true);
    setStep("pw");
    try {
      const r = await fetch("/api/notice", { cache: "no-store" });
      const j = await r.json();
      if (j.canEdit) setStep("edit");
      if (j.notice) {
        setNotice(j.notice);
        setDraft({
          text: j.notice.text,
          link_kind: j.notice.link_kind,
          link_url: j.notice.link_url,
          link_path: j.notice.link_path || pages[0]?.path || "/repo",
        });
      }
    } catch {
      /* 확인 실패하면 그냥 비밀번호를 묻는다 */
    }
  };

  // 1단계 — 비밀번호만 확인한다
  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/notice/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "인증 실패");
      setPw("");
      setStep("edit");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "인증 실패");
    } finally {
      setBusy(false);
    }
  };

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
        body: JSON.stringify(draft),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장 실패");
      setNotice(j.notice);
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
      <button className="nb-edit" onClick={openEditor} aria-label={t.noticeEdit}>
        ✎
      </button>

      {open && (
        <div
          className="gate-back"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            className="gate nb-form"
            onSubmit={step === "pw" ? unlock : save}
          >
            <button
              type="button"
              className="gate-x"
              onClick={() => setOpen(false)}
              aria-label={t.close}
            >
              ✕
            </button>

            {step === "pw" ? (
              <>
                <h3>{t.noticeLocked}</h3>
                <p className="nb-sub">{t.noticeLockedSub}</p>
                {/* key 를 다르게 준 이유 — 아래 공지 칸과 이 칸은 form 안에서 같은 자리라,
                    key 가 없으면 React 가 **같은 DOM 요소를 재활용**하고 type 만
                    password → text 로 바꾼다. 그러면 맥이 그 칸을 계속 비밀번호 칸으로
                    보고 (secure input) **한글 IME 를 안 붙인다** — 한/영 키를 눌러도
                    안 바뀌고 숫자·영문만 들어간다. key 를 주면 새 칸이 만들어진다.
                    howcanisayit 은 두 단계가 form/div 로 갈려 있어 이 문제가 없다. */}
                <input
                  key="notice-pin"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  autoFocus
                />
                {err && <p className="nb-err">{err}</p>}
                <div className="nb-actions">
                  <button className="send" type="submit" disabled={busy || !pw}>
                    {busy ? t.sending : t.noticeUnlock}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{t.noticeEdit}</h3>

                <label className="nb-l">{t.noticeText}</label>
                <input
                  key="notice-text"
                  type="text"
                  value={draft.text}
                  maxLength={200}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  placeholder={t.noticePlaceholder}
                  autoFocus
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
                      {k === "none"
                        ? t.linkNone
                        : k === "url"
                          ? t.linkUrl
                          : t.linkInternal}
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
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
