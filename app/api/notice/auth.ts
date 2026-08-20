import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 공지 배너 운영자 인증.
 *
 * 비밀번호는 ADMIN_PASSWORD 환경변수에만 있다. 한 번 맞히면 그 해시를 httpOnly
 * 쿠키로 심어 두고 다음부터는 쿠키만으로 통과시킨다. 쿠키 값이 비밀번호에서
 * 파생되므로 비밀번호를 모르면 위조할 수 없다.
 */

export const adminCookieName = "nunu_admin";

export const tokenOf = (pw: string) =>
  createHash("sha256").update(`nunu-lab:${pw}`).digest("hex");

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export const checkPassword = (given: string, real: string) =>
  sameString(given, real);

export type AuthState = "ok" | "bad" | "unset";

/** 쿠키만으로 통과되는지. (비밀번호 입력 화면을 건너뛸지 판단할 때 쓴다) */
export async function hasAdminCookie(): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const jar = await cookies();
  const c = jar.get(adminCookieName)?.value;
  return Boolean(c && sameString(c, tokenOf(real)));
}

export async function authorize(password?: string): Promise<AuthState> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return "unset";
  if (await hasAdminCookie()) return "ok";
  if (password && sameString(password, real)) return "ok";
  return "bad";
}
