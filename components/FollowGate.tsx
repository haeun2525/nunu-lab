"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";
import { SOCIAL } from "@/lib/projects";

/**
 * 깃허브로 넘어가기 직전에 한 번 잡아 세워 팔로우를 권하는 팝업.
 *
 * 매번 띄운다. 세션당 한 번만 띄우고 싶으면 ONCE_PER_SESSION 을 true 로 바꾸면 된다.
 */
const ONCE_PER_SESSION = false;
const SEEN_KEY = "nunu-follow-gate";

export default function FollowGate({
  goHref,
  children,
  className,
  goLabel,
}: {
  goHref: string;
  children: React.ReactNode;
  className?: string;
  /** 넘어가기 버튼 문구. 깃허브가 아닌 곳으로 갈 때 바꿔 끼운다 */
  goLabel?: string;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const leave = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  const onClick = (e: React.MouseEvent) => {
    if (ONCE_PER_SESSION && sessionStorage.getItem(SEEN_KEY)) return; // 그냥 통과
    e.preventDefault();
    if (ONCE_PER_SESSION) sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // 팝업 떠 있는 동안 뒤 페이지가 스크롤되지 않게
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <a
        className={className}
        href={goHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>

      {open && (
        <div
          className="gate-back"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="gate" role="dialog" aria-modal="true" aria-label={t.gateTitle}>
            <button
              ref={closeRef}
              className="gate-x"
              onClick={() => setOpen(false)}
              aria-label={t.close}
            >
              ✕
            </button>

            <img className="gate-ava" src="/icons/avatar.png" alt="" />
            <h3>{t.gateTitle}</h3>
            <p>{t.gateBody}</p>

            <div className="gate-btns">
              <button className="gate-b gate-follow" onClick={() => leave(SOCIAL.instagram)}>
                {t.gateFollow}
              </button>
              <button className="gate-b gate-go" onClick={() => leave(goHref)}>
                {goLabel ?? t.gateGo}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
