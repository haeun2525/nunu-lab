"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";

/**
 * 화면 오른쪽 아래 구석의 운영자 입구.
 *
 * 평소엔 거의 안 보이는 점 하나다. 눌러서 PIN 을 넣으면 운영자 모드가 켜지고,
 * 그때부터 저장소 상세 페이지에 ✎ 버튼이 뜬다.
 */
export default function AdminDock() {
  const { on, setOn } = useAdmin();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "들어가지 못했습니다.");
      setOn(true);
      setPin("");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "들어가지 못했습니다.");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin", { method: "DELETE" });
    } catch {
      /* 통신이 안 돼도 화면에서는 끈다 */
    }
    setOn(false);
    setBusy(false);
    setOpen(false);
  };

  return (
    <>
      <button
        className="adm-dot"
        data-on={on ? "1" : "0"}
        onClick={() => {
          setErr(null);
          setPin("");
          setOpen(true);
        }}
        aria-label="운영자 모드"
        title="운영자 모드"
      >
        <span />
      </button>

      {open && (
        <div
          className="gate-back"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form className="gate adm-form" onSubmit={on ? (e) => e.preventDefault() : unlock}>
            <button
              type="button"
              className="gate-x"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>

            {on ? (
              <>
                <h3>운영자 모드</h3>
                <p className="adm-sub">
                  저장소에서 프로젝트를 열면 제목 옆에 ✎ 가 보입니다.
                  <br />
                  거기서 제목·소개글을 바로 고칠 수 있어요.
                </p>
                <div className="adm-actions">
                  <button
                    type="button"
                    className="adm-ghost"
                    onClick={leave}
                    disabled={busy}
                  >
                    나가기
                  </button>
                  <button
                    type="button"
                    className="send"
                    onClick={() => setOpen(false)}
                  >
                    계속하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>운영자 모드</h3>
                <p className="adm-sub">PIN 을 넣으면 문구를 고칠 수 있습니다.</p>
                <input
                  className="adm-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  maxLength={12}
                  onChange={(e) => setPin(e.target.value.replace(/\s/g, ""))}
                  placeholder="••••"
                  autoFocus
                />
                {err && <p className="nb-err">{err}</p>}
                <div className="adm-actions adm-actions-1">
                  <button className="send" type="submit" disabled={busy || !pin}>
                    {busy ? "확인 중…" : "들어가기"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
