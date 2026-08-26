"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 방문·열람·체류시간을 서버에 알린다.
 *
 * 하루 한 번만 방문으로 세는 판정은 서버 쿠키가 하고, 여기 localStorage 는
 * 그 전에 요청 자체를 줄이는 용도다. 둘 다 한국시간 기준이어야 한다 —
 * UTC 로 세면 한국시간 00~09시에 같은 사람이 두 번 잡힌다.
 *
 * 유입원은 서버가 알 수 없다. VisitPing 이 사이트 안에서 부르는 요청이라
 * referer 가 늘 우리 도메인이기 때문이다. 그래서 브라우저가 기억하는
 * document.referrer 와 주소창의 utm_* 를 여기서 실어 보낸다.
 *
 * 떠날 때(pagehide·탭 숨김) 머문 시간을 sendBeacon 으로 한 번 더 보낸다.
 * fetch 로 보내면 페이지가 닫히며 취소되는 일이 잦다.
 */
export default function VisitPing() {
  const path = usePathname();
  const since = useRef(0);
  const sent = useRef(false);

  useEffect(() => {
    const kst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    const seen = localStorage.getItem("nunu-visit") === kst;

    const q = new URLSearchParams(location.search);
    const utm = {
      source: q.get("utm_source") ?? "",
      medium: q.get("utm_medium") ?? "",
      campaign: q.get("utm_campaign") ?? "",
      content: q.get("utm_content") ?? "",
    };
    const ref = document.referrer;

    since.current = Date.now();
    sent.current = false;

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, ref, utm }),
      keepalive: true,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.counted && !seen) localStorage.setItem("nunu-visit", kst);
      })
      .catch(() => {});

    const leave = () => {
      if (sent.current) return;
      sent.current = true;
      const ms = Date.now() - since.current;
      if (ms < 300) return;
      const body = JSON.stringify({ leave: true, ms, path, ref, utm });
      try {
        navigator.sendBeacon("/api/visit", new Blob([body], { type: "application/json" }));
      } catch {
        /* 지원 안 하면 체류시간만 빠진다 */
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") leave();
    };

    addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      leave(); // 사이트 안에서 다른 페이지로 넘어갈 때
      removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [path]);

  return null;
}
