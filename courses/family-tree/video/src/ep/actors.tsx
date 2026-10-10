import React from 'react';
import {Figure} from '../Person';
import {PEOPLE} from '../family';
import {easeInOut, hash, lerp, prog, win} from '../anim';
import {Actor, Costume, Episode} from './types';
import {Prop, Skateboard} from './props';

export type ActorState = {
  x: number; y: number; s: number; flip: boolean; moving: boolean;
  yoff: number; rot: number; xoff: number;
  fig: {wave: number; raise: number; nod: number; armsUp: number; tiptoe: number; old: number};
  costume: Costume; skating: boolean;
};

export const poseW = (a: Actor, t: number, kind: string, fade = 0.25) =>
  Math.max(0, ...a.poses.filter((p) => p[2] === kind).map(([t0, t1]) => win(t, t0, t1, fade)));

export const actorState = (ep: Episode, a: Actor, t: number): ActorState => {
  // position from keyframes
  let [, x, y, s, flip] = a.keys[0];
  let moving = false;
  for (let i = 1; i < a.keys.length; i++) {
    const [tk, xk, yk, sk, fk] = a.keys[i];
    const [tp] = a.keys[i - 1];
    if (t >= tk) { x = xk; y = yk; s = sk; flip = fk; continue; }
    if (t > tp) {
      const k = easeInOut(prog(t, tp, tk - tp));
      moving = Math.abs(xk - x) > 2;
      x = lerp(x, xk, k); y = lerp(y, yk, k); s = lerp(s, sk, k);
    }
    break;
  }
  const seed = hash(a.id);
  let yoff = 0, rot = 0, xoff = 0;
  const skating = a.skate.some(([t0, t1]) => t >= t0 && t <= t1);
  if (moving && !skating) yoff -= Math.abs(Math.sin(t * 13 + seed)) * 14 * s / 1.55;
  if (skating) yoff -= 18 * s / 1.55;
  for (const [t0, t1, kind] of a.poses) {
    if (t < t0 || t > t1) continue;
    const k = prog(t, t0, t1 - t0);
    if (kind === 'jump') yoff -= Math.sin(Math.PI * k) * 110 * s / 1.55;
    if (kind === 'laugh') yoff -= Math.abs(Math.sin(t * 15 + seed)) * 10;
    if (kind === 'shake') rot += Math.sin(t * 22) * 5;
    if (kind === 'fly') rot += Math.sin(t * 6) * 6;
  }
  const dance = poseW(a, t, 'dance', 0.1) + poseW(a, t, 'holdHands', 0.1);
  if (dance > 0) {
    const beat = (t * 108) / 60;
    yoff -= Math.abs(Math.sin(Math.PI * beat)) * 24 * dance;
    rot += Math.sin(Math.PI * beat + seed) * 5 * poseW(a, t, 'dance', 0.1);
  }
  // 拍糊啦 — everybody jolts at the sneeze
  const chaos = ep.fx.find((f) => f.kind === 'chaos' && t >= f.t0 && t <= f.t1);
  if (chaos) {
    const k = win(t, chaos.t0, chaos.t1, 0.2);
    xoff += Math.sin(t * 31 + seed) * 18 * k;
    yoff += Math.sin(t * 27 + seed * 2) * 14 * k;
    rot += Math.sin(t * 19 + seed) * 14 * k;
  }
  let costume: Costume = {};
  for (const [tc, c] of a.costume) if (t >= tc) costume = {...costume, ...c};
  const old = a.poses.some(([t0, t1, k]) => k === 'old' && t >= t0 && t <= t1) ? 1 : 0;
  return {
    x, y, s, flip, moving, yoff, rot, xoff, skating, costume,
    fig: {
      wave: poseW(a, t, 'wave'),
      raise: poseW(a, t, 'scratch') * 0.62,
      nod: poseW(a, t, 'scratch') * 9,
      armsUp: Math.max(poseW(a, t, 'armsUp'), poseW(a, t, 'fly'), poseW(a, t, 'holdHands', 0.1) * 0.55,
        poseW(a, t, 'dance', 0.1) * (0.35 + 0.3 * Math.sin(t * Math.PI * 1.8))),
      tiptoe: poseW(a, t, 'tiptoe', 0.18),
      old,
    },
  };
};

/** Top of the head in screen space — speech bubbles hang above it. */
export const headTop = (ep: Episode, id: string, t: number) => {
  const a = ep.actors.find((x) => x.id === id);
  if (!a) return null;
  const st = actorState(ep, a, t);
  const H = PEOPLE[a.who].look.H;
  const lift = st.fig.tiptoe * (PEOPLE[a.who].look.kid ? 16 : 20);
  return {x: st.x + st.xoff, y: st.y + st.yoff - (H + lift + (a.hat ? 16 : 6)) * st.s, s: st.s};
};

export const ActorView: React.FC<{ep: Episode; a: Actor; t: number}> = ({ep, a, t}) => {
  const st = actorState(ep, a, t);
  const p = PEOPLE[a.who];
  const talking = ep.bubbles.some((b) => (b.who === a.id || b.who === 'all') && t >= b.t0 && t <= b.t1)
    || poseW(a, t, 'laugh') > 0.5;
  const appear = Math.min(1, (t - a.show[0]) / 0.2);
  const jersey = st.costume.jersey ?? undefined;
  const look = st.costume.shirt ? {...p.look, shirt: st.costume.shirt, pants: p.look.dress ? st.costume.shirt : p.look.pants} : p.look;
  return (
    <g transform={`translate(${st.x + st.xoff},${st.y + st.yoff}) rotate(${st.rot}) scale(${st.s})`}
      opacity={appear}>
      <ellipse cx={0} cy={2 - st.yoff / st.s} rx={p.look.kid ? 46 : 58} ry={10} fill="rgba(60,40,20,0.18)" />
      {st.skating && <g transform="translate(0,4)"><Skateboard /></g>}
      <Figure look={look} t={t} seed={hash(a.id)} {...st.fig} jersey={jersey} hat={a.hat} talk={talking}
        rightHand={a.hold?.right ? <Prop kind={a.hold.right} t={t} /> : undefined}
        leftHand={a.hold?.left ? <Prop kind={a.hold.left} t={t} /> : undefined} />
    </g>
  );
};
