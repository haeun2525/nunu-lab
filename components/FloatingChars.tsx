"use client";

import { useEffect, useRef } from "react";

/**
 * 프사의 픽셀 캐릭터가 우주에 둥둥 떠다닌다.
 * 마우스가 가까이 가면 부딪힌 것처럼 밀려났다가, 용수철처럼 살짝 넘실대며 제자리로 돌아온다.
 *
 * 표류(drift)와 밀림(push)을 한 transform 에 합쳐야 해서 CSS 애니메이션을 쓰지 않고
 * 전부 JS 로 계산한다. React 리렌더 없이 style.transform 만 직접 건드린다.
 */

type Spec = { x: number; y: number; size: number; speed: number; opacity: number };

// x, y 는 화면 대비 비율. 가운데(문구 자리)는 비워 두고 가장자리에 흩뿌린다.
const CHARS: Spec[] = [
  { x: 0.06, y: 0.22, size: 52, speed: 0.9, opacity: 0.62 },
  { x: 0.9, y: 0.3, size: 38, speed: 0.72, opacity: 0.5 },
  { x: 0.13, y: 0.72, size: 30, speed: 0.6, opacity: 0.4 },
  { x: 0.84, y: 0.74, size: 58, speed: 0.8, opacity: 0.55 },
  { x: 0.64, y: 0.11, size: 26, speed: 0.54, opacity: 0.34 },
  { x: 0.3, y: 0.88, size: 34, speed: 0.67, opacity: 0.44 },
  { x: 0.21, y: 0.13, size: 30, speed: 0.85, opacity: 0.42 },
  { x: 0.95, y: 0.56, size: 24, speed: 0.63, opacity: 0.36 },
  { x: 0.04, y: 0.52, size: 42, speed: 0.75, opacity: 0.5 },
  { x: 0.7, y: 0.92, size: 28, speed: 0.58, opacity: 0.38 },
  { x: 0.46, y: 0.05, size: 22, speed: 0.92, opacity: 0.3 },
  { x: 0.55, y: 0.83, size: 44, speed: 0.7, opacity: 0.46 },
];

const RADIUS = 170; // 이 거리 안으로 들어오면 밀린다(px)
const FORCE = 0.6; // 밀려나는 세기 — 최대 약 120px 밀렸다 1.2초에 걸쳐 돌아온다
const STIFF = 0.055; // 제자리로 당기는 힘 — 낮을수록 느긋하다
const DAMP = 0.86; // 감쇠 — 낮을수록 빨리 멈춘다

export default function FloatingChars() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(wrap.querySelectorAll<HTMLImageElement>(".floater"));
    const state = CHARS.map((c, i) => ({
      spec: c,
      phase: i * 1.7,
      bx: 0,
      by: 0,
      ox: 0,
      oy: 0, // 현재 밀린 정도
      vx: 0,
      vy: 0, // 속도 (용수철)
    }));

    let W = 0;
    let H = 0;
    const layout = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      state.forEach((s) => {
        s.bx = s.spec.x * W;
        s.by = s.spec.y * H;
      });
    };
    layout();

    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = performance.now() * 0.001;

      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        // 느긋한 표류 — 두 주기를 겹쳐 궤적이 반복돼 보이지 않게
        const dx = Math.sin(t * 0.24 * s.spec.speed + s.phase) * 16;
        const dy =
          Math.cos(t * 0.19 * s.spec.speed + s.phase * 1.3) * 26 +
          Math.sin(t * 0.11 * s.spec.speed + s.phase) * 10;
        const rot = Math.sin(t * 0.21 * s.spec.speed + s.phase) * 6;

        // 마우스가 가까우면 밀어낼 목표 지점을 잡는다
        let tx = 0;
        let ty = 0;
        const px = s.bx + dx;
        const py = s.by + dy;
        const ddx = px - mx;
        const ddy = py - my;
        const dist = Math.hypot(ddx, ddy);
        if (dist < RADIUS) {
          const f = 1 - dist / RADIUS;
          const ease = f * f * (3 - 2 * f); // smoothstep — 경계에서 튀지 않는다
          const ux = ddx / (dist || 1);
          const uy = ddy / (dist || 1);
          tx = ux * ease * RADIUS * FORCE;
          ty = uy * ease * RADIUS * FORCE;
        }

        // 용수철로 목표를 따라간다. 살짝 넘실대다 멈춘다.
        s.vx = (s.vx + (tx - s.ox) * STIFF) * DAMP;
        s.vy = (s.vy + (ty - s.oy) * STIFF) * DAMP;
        s.ox += s.vx;
        s.oy += s.vy;

        nodes[i].style.transform =
          `translate3d(${dx + s.ox}px, ${dy + s.oy}px, 0) rotate(${rot}deg)`;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", layout);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", layout);
    };
  }, []);

  return (
    <div className="floaters" ref={wrapRef} aria-hidden>
      {CHARS.map((c, i) => (
        <img
          key={i}
          src="/icons/avatar.png"
          alt=""
          className="floater"
          style={{
            left: `${c.x * 100}%`,
            top: `${c.y * 100}%`,
            width: c.size,
            opacity: c.opacity,
          }}
        />
      ))}
    </div>
  );
}
