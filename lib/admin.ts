import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

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

/** 글자 비교만 한다. **밖으로 안 내보낸다** — 이걸 직접 부르면 아래 시도 제한을
 *  건너뛰게 된다. PIN 확인은 반드시 tryPin() 을 거칠 것. */
const checkPassword = (given: string, real: string) => sameString(given, real);

// ── PIN 시도 제한 ──────────────────────────────────────────────────
//
// PIN 은 네 자리라 만 번이면 다 훑을 수 있다. 그래서 두 겹을 둔다.
//   1) **틀렸을 때만** 잠깐 기다린다 — 맞은 요청은 안 느려진다
//   2) 같은 IP 가 연달아 열 번 틀리면 10분 잠근다
//
// 잠기면 **맞는 PIN 도 안 받는다.** 그래야 잠근 의미가 있다. 내가 잠겼으면
// 10분 기다리거나, 급하면 Vercel 에서 재배포하면 기록이 통째로 날아가 풀린다.
//
// **한계를 적어 둔다. 이 기록은 서버 인스턴스 메모리에 있다.**
// Vercel 은 요청이 몰리면 인스턴스를 늘리므로 잠금이 인스턴스마다 따로 논다.
// 배포하면 초기화되기도 한다. 한 대를 붙잡고 늘어지는 걸 막는 정도로 보면 되고,
// 확실히 하려면 표(DB)로 옮겨야 한다. 지금은 표를 늘리지 않는 쪽을 골랐다.
//
// 그래도 **PIN 을 길게 잡는 게 가장 크게 먹는다.** 자릿수를 하나 늘릴 때마다
// 훑어야 하는 경우의 수가 열 배가 된다.

const TRY_LIMIT = 10;
const LOCK_MS = 10 * 60_000;
const FORGET_MS = 60 * 60_000;
const SLOW_MS = 700;

type Strike = { n: number; last: number };
const strikes = new Map<string, Strike>();

/** 누가 시도했나. 프록시 뒤라서 x-forwarded-for 의 맨 앞을 쓴다. */
async function whoTried(): Promise<string> {
  const h = await headers();
  const first = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  return first || h.get("x-real-ip") || "unknown";
}

/** 기록이 무한히 쌓이지 않게 오래된 것을 치운다. */
function sweep(now: number) {
  if (strikes.size < 500) return;
  for (const [k, v] of strikes) if (now - v.last > FORGET_MS) strikes.delete(k);
}

/** 지금 잠겨 있으면 남은 초, 아니면 0. */
export async function lockedFor(): Promise<number> {
  const rec = strikes.get(await whoTried());
  if (!rec || rec.n < TRY_LIMIT) return 0;
  const left = rec.last + LOCK_MS - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

export type PinTry = { ok: true } | { ok: false; locked: number };

/**
 * PIN 을 한 번 시도한다. **PIN 을 받는 곳은 전부 이걸 거칠 것** —
 * checkPassword 를 직접 부르면 시도 제한을 건너뛰게 된다.
 */
export async function tryPin(given: string): Promise<PinTry> {
  const real = process.env.ADMIN_PASSWORD;
  const key = await whoTried();
  const now = Date.now();
  sweep(now);

  const rec = strikes.get(key);
  if (rec && rec.n >= TRY_LIMIT) {
    const left = rec.last + LOCK_MS - now;
    if (left > 0) return { ok: false, locked: Math.ceil(left / 1000) };
    strikes.delete(key); // 잠금이 풀렸으면 처음부터 다시 센다
  }

  if (real && checkPassword(given, real)) {
    strikes.delete(key);
    return { ok: true };
  }

  await new Promise((r) => setTimeout(r, SLOW_MS));
  const next = strikes.get(key) ?? { n: 0, last: now };
  next.n += 1;
  next.last = Date.now();
  strikes.set(key, next);
  return { ok: false, locked: next.n >= TRY_LIMIT ? Math.ceil(LOCK_MS / 1000) : 0 };
}

/** 잠겼을 때 화면에 뜨는 문구. */
export const lockedMessage = (sec: number) =>
  `시도가 너무 많습니다. ${Math.ceil(sec / 60)}분 뒤에 다시 해주세요.`;

export type AuthState = "ok" | "bad" | "unset" | "locked";

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
  if (!password) return "bad";
  const r = await tryPin(password);
  if (r.ok) return "ok";
  return r.locked ? "locked" : "bad";
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
