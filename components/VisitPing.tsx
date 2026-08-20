"use client";

import { useEffect } from "react";

/**
 * 방문자 1명을 하루에 한 번만 센다.
 *
 * 최종 판정은 서버가 쿠키로 한다. 여기서는 그 앞단에서 한 번 더 걸러 준다 —
 * sessionStorage 는 탭마다 따로라 탭을 여러 개 열면 쿠키가 심어지기 전에
 * 요청이 동시에 나가 버린다. 그래서 localStorage 에 날짜로 표시해 둔다.
 */
export default function VisitPing() {
  useEffect(() => {
    // 서버·DB 와 같은 한국시간 기준. 방문자 현지 시간대를 쓰면 기준일이 어긋난다.
    const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    try {
      if (localStorage.getItem("nunu-visited") === today) return;
      localStorage.setItem("nunu-visited", today);
    } catch {
      /* 저장소를 못 쓰면 서버 쿠키에만 맡긴다 */
    }
    fetch("/api/visit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
