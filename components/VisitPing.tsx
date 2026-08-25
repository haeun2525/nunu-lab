"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 페이지를 열 때마다 서버에 알린다.
 *
 * 방문자 수는 서버가 쿠키로 하루 한 번만 센다. 여기서 매번 보내는 건 이동 기록용이다.
 *
 * 유입원(어디서 왔는지)은 여기서 같이 보낸다 — 서버가 받는 referer 는 우리 도메인이라
 * 쓸모가 없다. 주소창의 utm 값과 document.referrer 를 붙여 보내야 밖에서 온 길이 남는다.
 *
 * 첫 화면에서만 utm 이 붙어 있다. 그다음 이동에는 비어 있는 게 정상이다.
 */
export default function VisitPing() {
  const path = usePathname();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === path) return; // 같은 페이지를 두 번 세지 않는다
    sent.current = path;

    const q = new URLSearchParams(window.location.search);
    const utm = {
      source: q.get("utm_source") ?? "",
      medium: q.get("utm_medium") ?? "",
      campaign: q.get("utm_campaign") ?? "",
      content: q.get("utm_content") ?? "",
    };

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path,
        // 전체 주소가 아니라 서버가 도메인만 잘라 쓴다
        ref: document.referrer || "",
        utm,
      }),
    }).catch(() => {});
  }, [path]);

  return null;
}
