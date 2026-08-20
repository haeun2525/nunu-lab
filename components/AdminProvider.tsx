"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * 운영자 모드 상태.
 *
 * 진짜 판정은 서버 쿠키(lib/admin.ts)가 한다. 여기 있는 건 화면에 ✎ 버튼을 띄울지
 * 정하는 표시용 스위치일 뿐이라, 이걸 조작해도 저장은 서버에서 막힌다.
 *
 * localStorage 에 흔적이 있을 때만 서버에 물어본다 — 일반 방문자는 요청이 한 번도 안 나간다.
 */

const KEY = "nunu-admin";

type Admin = { on: boolean; setOn: (v: boolean) => void };

const Ctx = createContext<Admin>({ on: false, setOn: () => {} });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [on, setOnState] = useState(false);

  const setOn = useCallback((v: boolean) => {
    try {
      if (v) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch {
      /* 사파리 프라이빗 모드 등. 이번 세션만 유지된다 */
    }
    setOnState(v);
  }, []);

  useEffect(() => {
    let stale = false;
    try {
      if (localStorage.getItem(KEY) !== "1") return;
    } catch {
      return;
    }
    // 쿠키가 만료됐을 수도 있으니 서버에 한 번 확인한다
    fetch("/api/admin", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (stale) return;
        if (j.on) setOnState(true);
        else setOn(false);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [setOn]);

  return <Ctx.Provider value={{ on, setOn }}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);
