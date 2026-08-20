"use client";

import { useEffect, useRef } from "react";

/**
 * 배경을 망점(하프톤)으로 깨진 이미지로 깔고, 마우스가 지나가면 그 주변 점들이
 * 부서지듯 흩어진다.
 *
 * 성능 요령: 흐트러지지 않은 상태를 오프스크린 캔버스에 한 번 구워 두고(base),
 * 매 프레임 그걸 통째로 blit 한 뒤 마우스 반경 안쪽만 지우고 다시 그린다.
 * 셀이 수만 개여도 매 프레임 다시 그리는 건 수백 개뿐이다.
 */

const CELL = 8; // 망점 격자 간격(px)
const LIFT = 0.12; // 이 밝기 이상은 비운다. 소스가 반전본이라 낮게 잡는다
const RADIUS = 230; // 마우스 영향 반경(px)
const PUSH = 30; // 바깥으로 밀리는 최대 거리(px)
const STREAK = 46; // 행 단위 수평 흐름의 최대 폭(px)
const EASE = 0.09; // 커서 추적 감쇠 — 낮을수록 부드럽다

export default function RasterHero({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0,
      H = 0,
      COLS = 0,
      ROWS = 0,
      DPR = 1;
    let dark: Float32Array | null = null;
    let base: HTMLCanvasElement | null = null;
    let raf = 0;
    let mx = -9999,
      my = -9999,
      tmx = -9999,
      tmy = -9999;

    const img = new Image();

    const color = (k: number) => {
      const a = 0.04 + k * 0.42;
      return `rgba(${Math.round(180 + 60 * k)},${Math.round(196 + 52 * k)},255,${a})`;
    };

    type Disturb = (
      c: number,
      r: number,
      x: number,
      y: number,
      k: number,
    ) => [number, number, number];

    const paint = (
      g: CanvasRenderingContext2D,
      c0: number,
      r0: number,
      c1: number,
      r1: number,
      dis: Disturb | null,
    ) => {
      if (!dark) return;
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          let k = dark[r * COLS + c];
          if (k === undefined) continue;
          let x = c * CELL;
          let y = r * CELL;
          if (dis) [x, y, k] = dis(c, r, x, y, k);
          if (k <= 0.012) continue;
          g.fillStyle = color(k);
          const s = Math.max(0.9, Math.sqrt(k) * (CELL - 1.2));
          g.fillRect(x + (CELL - s) / 2, y + (CELL - s) / 2, s, s);
        }
      }
    };

    const bake = () => {
      base = document.createElement("canvas");
      base.width = cv.width;
      base.height = cv.height;
      const b = base.getContext("2d");
      if (!b) return;
      b.setTransform(DPR, 0, 0, DPR, 0, 0);
      b.fillStyle = "#05060d";
      b.fillRect(0, 0, W, H);
      paint(b, 0, 0, COLS, ROWS, null);
    };

    const build = () => {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth;
      H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      COLS = Math.ceil(W / CELL) + 1;
      ROWS = Math.ceil(H / CELL) + 1;

      const off = document.createElement("canvas");
      off.width = COLS;
      off.height = ROWS;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.fillStyle = "#fff"; // 흰색 = 비어 있음
      o.fillRect(0, 0, COLS, ROWS);
      if (img.complete && img.naturalWidth) {
        const s =
          Math.max(COLS / img.naturalWidth, ROWS / img.naturalHeight) * 0.98;
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        o.drawImage(img, (COLS - w) / 2, (ROWS - h) / 2, w, h);
      }
      // 같은 오리진 이미지라 캔버스가 오염되지 않지만, 실패해도 페이지는 살아야 한다.
      let d: Uint8ClampedArray;
      try {
        d = o.getImageData(0, 0, COLS, ROWS).data;
      } catch {
        return;
      }
      dark = new Float32Array(COLS * ROWS);
      for (let i = 0, n = COLS * ROWS; i < n; i++) {
        const v =
          (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
        const k = (1 - v - LIFT) / (1 - LIFT);
        dark[i] = k > 0 ? Math.pow(k, 0.95) : 0;
      }
      bake();
    };

    const jit = new Float32Array(8192);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!base || !dark) return;
      mx += (tmx - mx) * EASE;
      my += (tmy - my) * EASE;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (tmx < -9000 || reduce) return;

      const pad = RADIUS + 90;
      const c0 = Math.max(0, ((mx - pad) / CELL) | 0);
      const c1 = Math.min(COLS, Math.ceil((mx + pad) / CELL));
      const r0 = Math.max(0, ((my - pad) / CELL) | 0);
      const r1 = Math.min(ROWS, Math.ceil((my + pad) / CELL));
      ctx.fillStyle = "#05060d";
      ctx.fillRect(c0 * CELL, r0 * CELL, (c1 - c0) * CELL, (r1 - r0) * CELL);

      const t = performance.now() * 0.00035;
      for (let r = r0; r < r1; r++) {
        // 행마다 고정된 위상 + 아주 느린 드리프트 → 프레임 간에 값이 튀지 않는다
        const phase = (Math.sin(r * 12.9898) * 43758.5453) % 1;
        jit[r & 8191] = Math.sin(t + phase * Math.PI * 2);
      }

      paint(ctx, c0, r0, c1, r1, (_c, r, x, y, k) => {
        const dx = x + CELL / 2 - mx;
        const dy = y + CELL / 2 - my;
        const dist = Math.hypot(dx, dy);
        if (dist > RADIUS) return [x, y, k];
        const f = 1 - dist / RADIUS;
        // smoothstep — 가장자리에서 뚝 끊기지 않고 서서히 풀린다
        const ff = f * f * (3 - 2 * f);
        const ux = dx / (dist || 1);
        const uy = dy / (dist || 1);
        // 행 단위 수평 흐름이 '깨짐'을 만든다 (jit 는 -1..1)
        const streak = jit[r & 8191] * ff * STREAK;
        return [
          x + ux * ff * PUSH + streak,
          y + uy * ff * PUSH * 0.45,
          Math.min(1, k + ff * 0.28),
        ];
      });
    };

    const onMove = (e: PointerEvent) => {
      tmx = e.clientX;
      tmy = e.clientY;
    };
    const onLeave = () => {
      tmx = -9999;
      tmy = -9999;
    };

    img.onload = build;
    img.src = src;
    build();
    frame();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", build);
    };
  }, [src]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        display: "block",
      }}
    />
  );
}
