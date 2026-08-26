import Link from "next/link";
import { hasAdminCookie } from "@/lib/admin";
import { eventsBetween, visitorsBefore } from "@/lib/db";
import { buildReport, kstRange, yesterdayKst } from "@/lib/report";
import { kstDate } from "@/lib/db";
import SendNow from "@/components/SendNow";

export const dynamic = "force-dynamic";

const mmss = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`);

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
  const { from, to } = kstRange(day);
  const [rows, before] = await Promise.all([eventsBetween(from, to), visitorsBefore(from)]);
  const r = buildReport(day, rows, before);

  const prev = kstDate(new Date(new Date(`${day}T00:00:00Z`).getTime() - 86400e3));
  const next = kstDate(new Date(new Date(`${day}T00:00:00Z`).getTime() + 86400e3));
  const today = kstDate();

  return (
    <div className="shell ins-shell">
      <div className="ins-head">
        <h1>INSIGHT</h1>
        <p>
          {day} (한국시간) · 사람 수는 IP 해시로 셉니다. 같은 집·같은 회사에서 오면 한 사람으로
          뭉치고 통신사 IP 가 바뀌면 두 사람이 됩니다 — 정확한 인원이 아니라 추세로 보세요.
        </p>
      </div>

      <div className="ins-nav">
        <Link className="btn" href={`/insight?day=${prev}`}>
          ← {prev}
        </Link>
        {day < today && (
          <Link className="btn" href={`/insight?day=${next}`}>
            {next} →
          </Link>
        )}
        <Link className="btn" href={`/insight?day=${today}`}>
          오늘
        </Link>
        <SendNow day={day} />
      </div>

      <div className="ins-nums">
        {[
          ["사람", `${r.people}`, `새 ${r.newPeople} · 다시 ${r.returningPeople}`],
          ["방문", `${r.sessions}`, `페이지 ${r.views}장`],
          ["머문 시간", mmss(r.medianSeconds), "중앙값"],
          ["한 장만 보고 나감", `${r.bounceRate}%`, "이탈"],
          ["밖으로 나간 클릭", `${r.clicks}`, r.clickTargets[0]?.[0] ?? ""],
        ].map(([t, v, s]) => (
          <div className="ins-num" key={t}>
            <span>{t}</span>
            <b>{v}</b>
            <i>{s}</i>
          </div>
        ))}
      </div>

      {r.gaps.length > 0 && (
        <div className="ins-gap">
          <b>확인 필요</b>
          <div>
            {r.gaps.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </div>
        </div>
      )}

      <div className="ins-grid">
        <section>
          <h2>어디서 왔나</h2>
          <Bars rows={r.sources} />
        </section>
        <section>
          <h2>어느 링크(utm_content)</h2>
          <Bars rows={r.contents} />
        </section>
        <section>
          <h2>지역</h2>
          <Bars rows={r.places} />
        </section>
        <section>
          <h2>기기</h2>
          <Bars rows={r.devices} />
        </section>
        <section>
          <h2>많이 본 페이지</h2>
          <Bars rows={r.pages} />
        </section>
        <section>
          <h2>밖으로 나간 클릭</h2>
          <Bars rows={r.clickTargets} />
        </section>
      </div>

      <h2 className="ins-h2">여정 {r.journeys.length}건 — 머문 시간 순</h2>
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
        {!r.journeys.length && <p className="ins-none">이 날은 기록이 없습니다.</p>}
      </div>
    </div>
  );
}
