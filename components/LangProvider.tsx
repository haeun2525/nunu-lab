"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { T, type Dict, type Lang } from "@/lib/i18n";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void };

const LangCtx = createContext<Ctx>({ lang: "ko", t: T.ko, setLang: () => {} });

const KEY = "nunu-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  // 서버와 첫 클라이언트 렌더가 어긋나면 안 되므로 항상 ko 로 시작하고,
  // 저장된 값은 마운트 후에 반영한다.
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "en" || saved === "ko") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }, []);

  return (
    <LangCtx.Provider value={{ lang, t: T[lang], setLang }}>
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => useContext(LangCtx);
