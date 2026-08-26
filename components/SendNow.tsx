"use client";

import { useState } from "react";

/** 대시보드에서 그날 리포트를 Teams 로 바로 쏴 보는 버튼. 크론을 기다리지 않고 확인할 때 쓴다. */
export default function SendNow({ day }: { day: string }) {
  const [state, setState] = useState("");

  return (
    <button
      className="btn"
      onClick={async () => {
        setState("보내는 중…");
        try {
          const r = await fetch(`/api/report/daily?day=${day}`);
          const d = await r.json();
          setState(d.sent ? "보냈습니다" : `실패: ${d.why ?? d.status ?? "?"}`);
        } catch {
          setState("실패");
        }
      }}
    >
      {state || "Teams 로 지금 보내기"}
    </button>
  );
}
