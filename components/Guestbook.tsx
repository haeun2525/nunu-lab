"use client";

import { useLang } from "./LangProvider";
import Comments from "./Comments";

export default function Guestbook() {
  const { t } = useLang();
  return (
    <main className="shell detail">
      <div className="gal-head">
        <div>
          <h2>{t.guestTitle}</h2>
          <p>{t.guestLead}</p>
        </div>
      </div>
      <Comments scope="guestbook" slug="guestbook" />
      <footer className="foot">{t.footNote}</footer>
    </main>
  );
}
