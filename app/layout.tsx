import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { LangProvider } from "@/components/LangProvider";
import VisitPing from "@/components/VisitPing";

export const metadata: Metadata = {
  title: "누누 | 바이브코딩과 피지컬 AI가 만났을 때",
  description:
    "직장인 문과생이 바이브코딩으로 전자제품을 만드는 도전기. 만든 것들의 코드는 전부 열려 있습니다.",
  openGraph: {
    title: "누누 | 바이브코딩과 피지컬 AI가 만났을 때",
    description: "NU40DK 보드로 만든 것들. 코드는 전부 열려 있습니다.",
    type: "website",
  },
  icons: { icon: "/icons/avatar.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <LangProvider>
          <div className="space-bg" aria-hidden>
            <span className="blob b1" />
            <span className="blob b2" />
            <span className="blob b3" />
          </div>
          <VisitPing />
          <Nav />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
