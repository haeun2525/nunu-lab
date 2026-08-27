"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LangProvider";

export default function Nav() {
  const { lang, t, setLang } = useLang();
  const path = usePathname();

  const tabs = [
    { href: "/", label: t.tabHome, on: path === "/" },
    { href: "/repo", label: t.tabRepo, on: path.startsWith("/repo") },
    { href: "/guestbook", label: t.tabGuest, on: path.startsWith("/guestbook") },
  ];

  return (
    <nav className="nav">
      <div className="tabs">
        {tabs.map((x) => (
          <Link key={x.href} href={x.href} data-on={x.on ? "1" : "0"}>
            {x.label}
          </Link>
        ))}
      </div>

      <div className="nav-r">
        <a
          className="pill"
          href="/go/instagram?from=nav"
          target="_blank"
          rel="noopener noreferrer"
        >
          ◎ Instagram
        </a>
        <a
          className="pill"
          href="/go/tiktok?from=nav"
          target="_blank"
          rel="noopener noreferrer"
        >
          ♪ TikTok
        </a>
        <div className="langsw">
          <button data-on={lang === "ko" ? "1" : "0"} onClick={() => setLang("ko")}>
            KO
          </button>
          <button data-on={lang === "en" ? "1" : "0"} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
      </div>
    </nav>
  );
}
