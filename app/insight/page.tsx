import Link from "next/link";
import { hasAdminCookie } from "@/lib/admin";
import { kstDate } from "@/lib/db";
import { dailyCombined } from "@/lib/daily";
import { mmss, yesterdayKst, type DayReport } from "@/lib/report";
import SendNow from "@/components/SendNow";

export const dynamic = "force-dynamic";

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="ins-none">없음</p>;
  return (
    <ul className="ins-bars">
      {rows.map(([k, v]) => (
        <li key={k}>
          <span className="k">{k}</span>
          <span className="b" style={{ width: `${(v / max) * 100}%` }} />
          <b>{v}</b>
        </li>
      ))}
    </ul>
  );
}

function Journeys({ r }: { r: DayReport }) {
  if (!r.journeys.length) return <p className="ins-none">이 날은 기록이 없습니다.</p>;
  return (
    <div className="ins-list">
      {r.journeys.map((j) => (
        <div className="ins-row" key={j.session + j.start}>
          <div className="ins-who">{j.visitor}</div>
          <div>
            <h3>
              {j.start}~{j.end} · {mmss(j.seconds)}
              {j.returning && <span className="ins-tag">재방문</span>}
            </h3>
            <p className="ins-steps">
              {[...j.steps, ...j.clicks.map((c) => `→ ${c}`)].join("  ›  ") || "(기록 없음)"}
            </p>
            <p className="ins-meta">
              {[j.device, j.place, j.source, j.utm].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  if (!(await hasAdminCookie().catch(() => false))) {
    return (
      <div className="shell ins-shell">
        <div className="ins-head">
          <h1>INSIGHT</h1>
          <p>운영자 모드에서만 열립니다. 화면 오른쪽 아래 흐린 점을 눌러 PIN 을 넣어 주세요.</p>
        </div>
        <Link className="btn" href="/">
          ← 홈으로
        </Link>
      </div>
    );
  }

  const q = await searchParams;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(q.day ?? "") ? q.day! : yesterdayKst();
  const c = await dailyCombined(day);

  const shift = (n: number) =>
    kstDate(new Date(new Date(`${day}T00:00:00Z`).getTime() + n * 86400e3));
  const today = kstDate();

  return (
    <div className="shell ins-shell">
      <div className="ins-head">
        <h1>INSIGHT</h1>
        <p>
          {day} (한국시간) · {c.sites.map((s) => s.name).join(" + ")} 합본 · 사람 수는 IP 해시로
          셉니다. 같은 집·회사에서 오면 한 사람으로 뭉치고 통신사 IP 가 바뀌면 둘로 갈립니다 —
          정확한 인원이 아니라 추세로 보세요. 두 사이트는 소금값이 달라 같은 사람이라도 서로
          이어지지 않으므로, 합계는 겹칠 수 있는 값입니다.
        </p>
      </div>

      <div className="ins-nav">
        <Link className="btn" href={`/insight?day=${shift(-1)}`}>
          ← {shift(-1)}
        </Link>
        {day < today && (
          <Link className="btn" href={`/insight?day=${shift(1)}`}>
            {shift(1)} →
          </Link>
        )}
        <Link className="btn" href={`/insight?day=${today}`}>
          오늘
        </Link>
        <SendNow day={day} />
      </div>

      <div className="ins-nums">
        {[
          ["사람", `${c.people}`, c.sites.map((s) => `${s.name} ${s.report.people}`).join(" · ")],
          ["방문", `${c.sessions}`, `페이지 ${c.views}장`],
          ["머문 시간", mmss(c.medianSeconds), "중앙값"],
          ["나간 클릭", `${c.clicks}`, ""],
        ].map(([t, v, s]) => (
          <div className="ins-num" key={t}>
            <span>{t}</span>
            <b>{v}</b>
            <i>{s}</i>
          </div>
        ))}
      </div>

      <div className="ins-gap">
        <b>자동 점검 — 숫자 모양만 보고 기계가 짚은 것입니다</b>
        {c.findings.map((f) => (
          <p key={f}>{f}</p>
        ))}
      </div>

      <div className="ins-grid">
        <section>
          <h2>어디서 왔나 (합)</h2>
          <Bars rows={c.sources} />
        </section>
        <section>
          <h2>지역 (합)</h2>
          <Bars rows={c.places} />
        </section>
        <section>
          <h2>기기 (합)</h2>
          <Bars rows={c.devices} />
        </section>
      </div>

      {c.sites.map((s) => (
        <div key={s.key} className="ins-site">
          <h2 className="ins-site-h">
            {s.name} <span>{s.host}</span>
          </h2>
          <div className="ins-nums">
            {[
              ["사람", `${s.report.people}`, `새 ${s.report.newPeople} · 다시 ${s.report.returningPeople}`],
              ["방문", `${s.report.sessions}`, `페이지 ${s.report.views}장`],
              ["머문 시간", mmss(s.report.medianSeconds), "중앙값"],
              ["한 장만 보고 나감", `${s.report.bounceRate}%`, ""],
              ["나간 클릭", `${s.report.clicks}`, s.report.clickTargets[0]?.[0] ?? ""],
            ].map(([t, v, sub]) => (
              <div className="ins-num" key={t}>
                <span>{t}</span>
                <b>{v}</b>
                <i>{sub}</i>
              </div>
            ))}
          </div>
          <div className="ins-grid">
            <section>
              <h2>어디서 왔나</h2>
              <Bars rows={s.report.sources} />
            </section>
            <section>
              <h2>어느 링크(utm_content)</h2>
              <Bars rows={s.report.contents} />
            </section>
            <section>
              <h2>많이 본 페이지</h2>
              <Bars rows={s.report.pages} />
            </section>
            <section>
              <h2>밖으로 나간 클릭</h2>
              <Bars rows={s.report.clickTargets} />
            </section>
          </div>
          <h2 className="ins-h2">여정 {s.report.journeys.length}건 — 머문 시간 순</h2>
          <Journeys r={s.report} />
        </div>
      ))}
    </div>
  );
}
