"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "./LangProvider";
import RasterHero from "./RasterHero";
import FloatingChars from "./FloatingChars";
import NoticeBanner from "./NoticeBanner";
import type { Notice } from "@/lib/db";

type Orb = {
  key: string;
  icon: string;
  href: string;
  external?: boolean;
  glow: string;
  /** 원본 비율이 제각각이라 높이만 맞추면 시각적 크기가 어긋난다. 눈으로 맞춘 보정값. */
  scale: number;
};

const ORBS: Orb[] = [
  { key: "repo", icon: "/icons/physical.png", href: "/repo", glow: "var(--c)", scale: 1 },
  { key: "guest", icon: "/icons/vibe.png", href: "/guestbook", glow: "var(--v)", scale: 0.94 },
  {
    key: "store",
    icon: "/icons/store.png",
    href: "/go/store?from=home",
    external: true,
    glow: "var(--p)",
    scale: 1.22,
  },
];

export default function Home({
  visits,
  clicks,
  notice,
  pages,
}: {
  visits: { today: number; total: number };
  clicks: number;
  notice: Notice | null;
  pages: { path: string; label: string }[];
}) {
  const { t } = useLang();

  const labels: Record<string, { title: string; sub: string }> = {
    repo: { title: t.orbRepo, sub: t.orbRepoSub },
    guest: { title: t.orbGuest, sub: t.orbGuestSub },
    store: { title: t.orbStore, sub: t.orbStoreSub },
  };

  return (
    <>
      <RasterHero src="/hero/raster.jpg" />
      <div className="vig" />
      <FloatingChars />

      <main className="home">
        <div className="home-in">
          <NoticeBanner initial={notice} pages={pages} />

          <p className="handle">@physical_nunu · {t.role}</p>

          <h1 className="brand">
            {t.brand && <span className="brand-ko">{t.brand}</span>}
            <span className="brand-en">{t.brandEn}</span>
            <span className="brand-emoji">👾🤖</span>
          </h1>

          <p className="bio">
            <span className="bio-lead">{t.bio1}</span>
            {t.bio2}
            <br />
            {t.bio3}
          </p>

          <div className="counts" style={{ justifyContent: "center", marginTop: 28 }}>
            <div className="cbox">
              {t.visitToday}
              <b>{visits.today.toLocaleString()}</b>
            </div>
            <div className="cbox">
              {t.visitTotal}
              <b>{visits.total.toLocaleString()}</b>
            </div>
            <div className="cbox">
              {t.ghClicks}
              <b>{clicks.toLocaleString()}</b>
            </div>
          </div>

          <div className="orbs">
            {ORBS.map((o) => {
              const l = labels[o.key];
              const inner = (
                <>
                  <span
                    className="sticker"
                    style={{ ["--g" as string]: o.glow, ["--s" as string]: o.scale }}
                  >
                    <Image src={o.icon} alt="" width={190} height={190} priority />
                  </span>
                  <span className="tip">
                    <b>{l.title}</b>
                    <span>{l.sub}</span>
                  </span>
                </>
              );
              return o.external ? (
                <a
                  className="orb"
                  key={o.key}
                  href={o.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <Link className="orb" key={o.key} href={o.href}>
                  {inner}
                </Link>
              );
            })}
          </div>

          <p className="hint">{t.hint}</p>
        </div>
      </main>
    </>
  );
}
