import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 운영자 인증. 공지 배너와 저장소 페이지 수정이 이 자물쇠 하나를 같이 쓴다.
 *
 * PIN 은 ADMIN_PASSWORD 환경변수에만 있다. 한 번 맞히면 그 해시를 httpOnly
 * 쿠키로 심어 두고 다음부터는 쿠키만으로 통과시킨다. 쿠키 값이 PIN 에서
 * 파생되므로 PIN 을 모르면 위조할 수 없고, PIN 을 바꾸면 기존 쿠키가 한꺼번에 무효가 된다.
 */

export const adminCookieName = "nunu_admin";

const MAX_AGE = 60 * 60 * 24 * 90;

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

/** 쿠키만으로 통과되는지. (PIN 입력 화면을 건너뛸지 판단할 때 쓴다) */
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

/** PIN 이 맞은 직후에 부른다. 다음부터는 안 물어본다. */
export async function setAdminCookie() {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return;
  const jar = await cookies();
  jar.set(adminCookieName, tokenOf(real), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/** 운영자 모드 나가기. */
export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(adminCookieName, "", { path: "/", maxAge: 0 });
}
