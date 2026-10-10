export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const prog = (t: number, t0: number, dur: number) => clamp01((t - t0) / dur);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const easeInOut = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k * k;
export const easeOutBack = (k: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

/** Closed-form damped spring 0 → 1 with a small overshoot, starting at t0. */
export const pop = (t: number, t0: number, stiff = 1) => {
  const x = (t - t0) * stiff;
  if (x <= 0) return 0;
  return 1 - Math.exp(-6.5 * x) * Math.cos(11 * x);
};

/** 0 → 1 → 0 window with soft edges. */
export const win = (t: number, t0: number, t1: number, fade = 0.3) =>
  Math.min(prog(t, t0, fade), 1 - prog(t, t1 - fade, fade));

export type Move = {t0: number; t1: number; x: number; y: number; s: number};
export type XYS = {x: number; y: number; s: number};

/** Applies a sequence of eased moves to a start state. */
export const follow = (start: XYS, moves: Move[], t: number): XYS => {
  let cur = {...start};
  for (const m of moves) {
    if (t <= m.t0) break;
    const k = easeInOut(prog(t, m.t0, m.t1 - m.t0));
    cur = {x: lerp(cur.x, m.x, k), y: lerp(cur.y, m.y, k), s: lerp(cur.s, m.s, k)};
  }
  return cur;
};

/** Deterministic pseudo-random in [0,1) for a given seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const hash = (s: string) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return h;
};
