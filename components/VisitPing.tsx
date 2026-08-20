"use client";

import { useEffect } from "react";

/**
 * 방문자 1명을 하루에 한 번만 센다.
 * 판정은 서버가 쿠키로 하고, 여기서는 첫 페이지에서 한 번만 찔러 준다.
 */
export default function VisitPing() {
  useEffect(() => {
    // 같은 탭에서 라우팅할 때마다 부르지 않도록 세션 단위로 막는다.
    if (sessionStorage.getItem("nunu-visited")) return;
    sessionStorage.setItem("nunu-visited", "1");
    fetch("/api/visit", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
