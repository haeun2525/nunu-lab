/**
 * 하루치 합본을 만드는 한 곳.
 *
 * 대시보드 · RSS · 메일이 전부 이 함수를 부른다. 채널마다 따로 세면
 * 숫자가 어긋나고, 어긋나면 셋 다 못 믿게 된다.
 */

import { SITES, eventsBetween, visitorsBefore } from "./db";
import { buildReport, combine, kstRange, type Combined, type SiteReport } from "./report";

export async function dailyCombined(day: string): Promise<Combined> {
  const { from, to } = kstRange(day);

  const sites: SiteReport[] = await Promise.all(
    SITES.map(async (s) => {
      const [rows, before] = await Promise.all([
        eventsBetween(from, to, s.table),
        visitorsBefore(from, s.table),
      ]);
      return {
        key: s.key,
        name: s.name,
        host: s.host,
        report: buildReport(day, rows, before),
      };
    }),
  );

  return combine(day, sites);
}
