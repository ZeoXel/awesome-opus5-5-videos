import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import glyphs from '../glyphs.json';
import film from './film.json';
import {PaperFigure, SPEC, Who, geometry} from './PaperFigure';
import {CutText, Line, P, PaperDefs, RicePaper, Scissors, Strip, Tag} from './materials';
import {clamp01, easeIn, easeInOut, easeOut, easeOutBack, lerp, prog, rand, win} from '../anim';

type Film = {
  duration: number;
  world: {S: number; SP: number; GY: number; CY: number; KY: number; pos: Record<string, [number, number]>; kids: Record<string, string>};
  lines: {id: string; who: 'T' | 'C'; text: string; t0: number; dur: number; show: number}[];
  ev: Record<string, number>;
  cam: [number, number, number, number][];
};
const F = film as unknown as Film;
const W = F.world;
const E = F.ev;
const S = W.S;

const NAMES: Record<string, string> = {
  yeye: '爷爷', nainai: '奶奶', bobo: '伯伯', baba: '爸爸', shushu: '叔叔', gugu: '姑姑',
  waigong: '外公', waipo: '外婆', mama: '妈妈', jiujiu: '舅舅', yima: '姨妈',
  me: '我', tangge: '堂哥', biaomei: '表妹', biaojie: '表姐', biaodi: '表弟',
};
const paperOf = (w: string) => (w.startsWith('tang') ? P.gold : w.startsWith('biao') ? P.teal : P.red);
const accentOf = (w: string) => (w.startsWith('tang') ? '#B07A1A' : w.startsWith('biao') ? P.teal : undefined);
const pos = (w: string) => W.pos[w];
const handY = (w: Who) => {
  const g = geometry(w);
  return g.shoulderY + 53;
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = staticFile('fonts/fonts.css');
    link.onload = () => {
      Promise.all([
        document.fonts.load(`400 40px "LXGW WenKai"`, glyphs.chars),
        document.fonts.load(`700 40px "LXGW WenKai"`, glyphs.chars),
      ]).then(() => continueRender(handle));
    };
    document.head.appendChild(link);
  }, [handle]);
};

const camAt = (t: number) => {
  const c = F.cam;
  if (t <= c[0][0]) return {x: c[0][1], y: c[0][2], z: c[0][3]};
  for (let i = 1; i < c.length; i++) {
    if (t < c[i][0]) {
      const [t0, x0, y0, z0] = c[i - 1];
      const [t1, x1, y1, z1] = c[i];
      // each move takes at most 1.4 s, then the camera rests
      const k = easeInOut(prog(t, Math.max(t0, t1 - 1.4), Math.min(1.4, t1 - t0)));
      return {x: lerp(x0, x1, k), y: lerp(y0, y1, k), z: Math.exp(lerp(Math.log(z0), Math.log(z1), k))};
    }
  }
  const l = c[c.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};

// ------------------------------------------------------- figure states ---
type Appear = {kind: 'lift' | 'unfold' | 'drop'; t: number; join?: number};
const APPEAR: Record<string, Appear> = {
  baba: {kind: 'lift', t: E.baba},
  yeye: {kind: 'lift', t: E.yeye},
  nainai: {kind: 'unfold', t: E.nainai, join: (pos('yeye')[0] + pos('nainai')[0]) / 2},
  bobo: {kind: 'unfold', t: E.bobo, join: pos('baba')[0] - W.SP / 2},
  shushu: {kind: 'unfold', t: E.shushu, join: pos('baba')[0] + W.SP / 2},
  gugu: {kind: 'unfold', t: E.gugu, join: pos('shushu')[0] + W.SP / 2},
  mama: {kind: 'lift', t: E.mama},
  waigong: {kind: 'lift', t: E.waigong},
  waipo: {kind: 'unfold', t: E.waipo, join: (pos('waigong')[0] + pos('waipo')[0]) / 2},
  jiujiu: {kind: 'unfold', t: E.jiujiu, join: pos('mama')[0] + W.SP / 2},
  yima: {kind: 'unfold', t: E.yima, join: pos('jiujiu')[0] + W.SP / 2},
  tangge: {kind: 'lift', t: E.tangge},
  biaomei: {kind: 'lift', t: E.biaomei},
  biaojie: {kind: 'lift', t: E.biaojie},
  biaodi: {kind: 'lift', t: E.biaodi},
  me: {kind: 'drop', t: E.me_drop},
};
const GRAND = ['yeye', 'nainai', 'waigong', 'waipo'];
const CHAIN = ['bobo', 'baba', 'shushu', 'gugu', 'mama', 'jiujiu', 'yima'];
const BIGGER = new Set(['tangge', 'biaojie']);
const RIGHT_SIDE = new Set(['waigong', 'waipo', 'mama', 'jiujiu', 'yima', 'biaojie', 'biaodi']);

const Person: React.FC<{who: string; t: number; backlit?: boolean; idp: string}> = ({who, t, backlit, idp}) => {
  const ap = APPEAR[who];
  const [x, y] = pos(who);
  const unfoldT = 0.55;
  if (!backlit && t < ap.t - (ap.kind === 'unfold' ? unfoldT : 0.05)) return null;
  const arms = GRAND.includes(who) || CHAIN.includes(who) ? 'out' : 'down';
  const reach = GRAND.includes(who) ? (W.SP * 0.95) / 2 / S : W.SP / 2 / S;
  let tr = `translate(${x},${y}) scale(${S})`;
  let op = 1;
  if (!backlit) {
    if (ap.kind === 'lift') {
      const k = easeOutBack(prog(t, ap.t, 0.45));
      op = clamp01((t - ap.t) / 0.12);
      tr = `translate(${x},${y - (1 - k) * 18}) scale(${S * (1.08 - 0.08 * k)})`;
    } else if (ap.kind === 'unfold') {
      // accordion: the panel swings out around the hand it shares with its neighbour
      const k = easeInOut(prog(t, ap.t - unfoldT, unfoldT));
      const kx = -1 + 2 * k;
      tr = `translate(${ap.join!},0) scale(${kx},1) translate(${-ap.join!},0) translate(${x},${y}) scale(${S})`;
    } else if (ap.kind === 'drop') {
      const k = prog(t, ap.t, 0.75);
      const fall = easeIn(Math.min(1, k / 0.85));
      const squash = k > 0.85 ? 1 - 0.08 * Math.sin(Math.PI * (k - 0.85) / 0.15) : 1;
      tr = `translate(${x},${y - (1 - fall) * 520}) rotate(${(1 - fall) * 18 * Math.sin(t * 6)}) scale(${S * (2 - squash)},${S * squash})`;
      op = clamp01((t - ap.t) / 0.1);
    }
  } else if (who === 'me') {
    tr = `translate(${x},${y}) scale(${S})`;
  }
  if (who === 'me' && !backlit && t > ap.t + 0.75) tr = `translate(${x},${y}) scale(${S})`;
  // the final wave: 我 hops
  if (who === 'me' && t > E.wave) {
    const h = Math.abs(Math.sin((t - E.wave) * 5)) * 22 * (1 - prog(t, E.wave, 3));
    tr = `translate(${x},${y - h}) scale(${S})`;
  }
  const folded = t < ap.t && ap.kind === 'unfold';
  return (
    <g transform={tr} opacity={op}>
      <PaperFigure who={who as Who} id={`${idp}-${who}`} color={folded ? P.redDark : paperOf(who)} arms={arms} reach={reach} backlit={backlit} />
    </g>
  );
};

const NameTag: React.FC<{who: string; t: number; t0: number}> = ({who, t, t0}) => {
  if (t < t0) return null;
  const [x, y] = pos(who);
  const k = easeOutBack(prog(t, t0, 0.35));
  const size = who === 'me' ? 46 : 40;
  return (
    <g opacity={clamp01((t - t0) / 0.1)} transform={`translate(0,${(1 - k) * -26})`}>
      <Tag x={x} y={y + (who === 'me' ? 46 : 44)} text={NAMES[who]} size={size} accent={accentOf(who)} rot={(rand(x * 0.01) - 0.5) * 6} />
    </g>
  );
};

// ------------------------------------------------------------ strips ---
const polyLen = (pts: number[][]) => pts.slice(1).reduce((L, p, i) => L + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const cutPoly = (pts: number[][], k: number) => {
  const L = polyLen(pts) * clamp01(k);
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= L) {
      const f = seg ? (L - acc) / seg : 0;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]);
      return out;
    }
    acc += seg;
    out.push(pts[i]);
  }
  return out;
};
const D = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

const STRIPS: {id: string; t: number; color: string; pts: number[][]}[] = (() => {
  const L: {id: string; t: number; color: string; pts: number[][]}[] = [];
  const me = pos('me');
  const meFoot = me[1] + 14;
  const bottom = W.KY + 200;
  const bx = pos('baba')[0], mx = pos('mama')[0];
  L.push({id: 'baba-me', t: E.baba_strip, color: P.red, pts: [[bx, W.CY + 85], [bx, bottom], [me[0] - 4, bottom], [me[0] - 4, meFoot]]});
  L.push({id: 'mama-me', t: E.mama_strip, color: P.red, pts: [[mx, W.CY + 85], [mx, bottom], [me[0] + 4, bottom], [me[0] + 4, meFoot]]});
  const ghL = W.GY + handY('yeye') * S, chH = W.CY + handY('baba') * S;
  L.push({id: 'grand-L', t: E.grand_strip_L, color: P.red, pts: [[(pos('yeye')[0] + pos('nainai')[0]) / 2, ghL], [(pos('yeye')[0] + pos('nainai')[0]) / 2, chH]]});
  const gxR = (pos('waigong')[0] + pos('waipo')[0]) / 2, jR = pos('mama')[0] + W.SP / 2;
  L.push({id: 'grand-R', t: E.grand_strip_R, color: P.red, pts: [[gxR, ghL], [gxR, (ghL + chH) / 2], [jR, (ghL + chH) / 2], [jR, chH]]});
  for (const [kid, parent] of Object.entries(W.kids)) {
    const px = pos(parent)[0];
    L.push({id: kid, t: E[kid] - 0.35, color: paperOf(kid), pts: [[px, W.CY + 85], [px, W.KY - SPEC[kid as Who].H * S - 12]]});
  }
  return L;
})();

const glowOf = (id: string, t: number) => {
  if (['tangge'].includes(id)) return win(t, E.glow_tang - 0.2, E.fold, 0.4);
  if (['biaomei', 'biaojie', 'biaodi'].includes(id)) return win(t, E.glow_biao - 0.2, E.fold, 0.4);
  return 0;
};

const Strips: React.FC<{t: number; backlit?: boolean; right: boolean}> = ({t, backlit, right}) => (
  <>
    {STRIPS.filter((s) => right === (s.id === 'grand-R' || s.id === 'mama-me' || RIGHT_SIDE.has(s.id))).map((s) => {
      if (!backlit && t < s.t) return null;
      const k = backlit ? 1 : easeInOut(prog(t, s.t, 0.7));
      const pts = cutPoly(s.pts, k);
      const g = backlit ? 0 : glowOf(s.id, t);
      return (
        <g key={s.id}>
          {g > 0 && <path d={D(pts)} stroke={s.color} strokeWidth={34} strokeOpacity={0.35 * g} fill="none" filter="url(#glow)" />}
          <Strip d={D(pts)} color={backlit ? '#8E1A22' : s.color} w={backlit ? 12 : 12} />
        </g>
      );
    })}
  </>
);

/** Light running down both parents' strips into 我 (the native move's payoff). */
const Flow: React.FC<{t: number}> = ({t}) => {
  const k = prog(t, E.flow, 1.2);
  if (k <= 0 || t > E.window + 1) return null;
  return (
    <g>
      {STRIPS.filter((s) => s.id === 'baba-me' || s.id === 'mama-me').map((s) => {
        const pts = cutPoly(s.pts, easeInOut(k));
        const end = pts[pts.length - 1];
        return (
          <g key={s.id}>
            <path d={D(pts)} stroke="#FFE7A0" strokeWidth={30} strokeOpacity={0.55} fill="none" filter="url(#glow)" />
            <path d={D(pts)} stroke="#FFF4CF" strokeWidth={7} fill="none" />
            {k < 1 && <circle cx={end[0]} cy={end[1]} r={22} fill="#FFF4CF" filter="url(#glow)" />}
          </g>
        );
      })}
      {k >= 1 && (
        <circle cx={pos('me')[0]} cy={pos('me')[1] - 100} r={180 + 20 * Math.sin(t * 4)} fill="#FFE7A0" opacity={0.45 * win(t, E.flow + 1.2, E.window + 1, 0.4)} filter="url(#glow)" />
      )}
    </g>
  );
};

// --------------------------------------------------- scissors & scraps ---
const CUTS: {t: number; who: string}[] = [
  {t: E.baba - 0.75, who: 'baba'}, {t: E.yeye_cut, who: 'yeye'}, {t: E.mama - 0.65, who: 'mama'}, {t: E.waigong_cut, who: 'waigong'},
  {t: E.tangge_cut, who: 'tangge'}, {t: E.biaomei_cut, who: 'biaomei'}, {t: E.biaojie_cut, who: 'biaojie'}, {t: E.biaodi_cut, who: 'biaodi'},
];

const Cutting: React.FC<{t: number}> = ({t}) => (
  <>
    {CUTS.map((c, i) => {
      const dur = 0.9;
      const a = win(t, c.t - 0.15, c.t + dur + 0.2, 0.15);
      if (a <= 0) return null;
      const [x, y] = pos(c.who);
      const H = SPEC[c.who as Who].H * S;
      const k = prog(t, c.t, dur);
      const ang = -Math.PI / 2 + k * Math.PI * 2;
      const R = H * 0.62;
      const sx = x + Math.cos(ang) * R * 0.75, sy = y - H / 2 + Math.sin(ang) * R;
      const open = 0.5 + 0.5 * Math.sin(t * 40);
      // the dashed outline the scissors follow
      return (
        <g key={i} opacity={a}>
          <ellipse cx={x} cy={y - H / 2} rx={R * 0.75} ry={R} fill="none" stroke={P.ink} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="10 9" />
          <g transform={`translate(${sx},${sy}) rotate(${(ang * 180) / Math.PI + 90}) scale(0.55)`}><Scissors open={open} /></g>
        </g>
      );
    })}
    {CUTS.map((c, i) => {
      const t0 = c.t + 0.9;
      const k = prog(t, t0, 0.9);
      if (k <= 0 || k >= 1) return null;
      const [x, y] = pos(c.who);
      return (
        <g key={`s${i}`} opacity={1 - k}>
          {Array.from({length: 8}).map((_, j) => {
            const dx = (rand(i * 9 + j) - 0.5) * 360, dy = -rand(i * 7 + j) * 120;
            return <path key={j} transform={`translate(${x + dx * easeOut(k)},${y - 160 + dy * easeOut(k) + 240 * k * k}) rotate(${rand(j + i) * 360 + k * 300})`}
              d="M 0 0 L 20 6 L 7 18 Z" fill={paperOf(c.who)} />;
          })}
        </g>
      );
    })}
  </>
);

// --------------------------------------------------------- comparison ---
const Compare: React.FC<{t: number}> = ({t}) => (
  <>
    {Object.keys(W.kids).map((kid) => {
      const a = win(t, E[`${kid}_cmp`], E[`${kid}_end`], 0.3);
      if (a <= 0) return null;
      const [kx, ky] = pos(kid);
      const [mx, my] = pos('me');
      const meTop = my - SPEC.me.H * S;
      const kidTop = ky - SPEC[kid as Who].H * S;
      // the fact decides the label; the paper heights are drawn to agree with it
      const bigger = BIGGER.has(kid);
      const k = easeOut(prog(t, E[`${kid}_cmp`], 0.6));
      const x1 = lerp(mx, kx, k);
      return (
        <g key={kid} opacity={a}>
          <line x1={mx} x2={x1} y1={meTop - 6} y2={meTop - 6} stroke={P.ink} strokeWidth={4} strokeDasharray="14 10" />
          <g transform={`translate(${kx},${Math.min(kidTop, meTop) - 70}) scale(${easeOutBack(prog(t, E[`${kid}_cmp`] + 0.3, 0.4))})`}>
            <CutText x={0} y={0} text={bigger ? '比我大' : '比我小'} size={58} color={bigger ? '#B07A1A' : P.teal} />
          </g>
          <path d={bigger ? `M ${kx + 90} ${meTop - 6} L ${kx + 90} ${kidTop + 6}` : `M ${kx + 90} ${kidTop} L ${kx + 90} ${meTop - 6}`}
            stroke={bigger ? '#B07A1A' : P.teal} strokeWidth={6} />
        </g>
      );
    })}
  </>
);

const Badges: React.FC<{t: number}> = ({t}) => {
  const a = win(t, E.badges, E.fold, 0.3);
  if (a <= 0) return null;
  return (
    <g opacity={a}>
      {Object.keys(W.kids).map((kid, i) => {
        const [kx, ky] = pos(kid);
        const bigger = BIGGER.has(kid);
        const sc = easeOutBack(prog(t, E.badges + i * 0.15, 0.4));
        return (
          <g key={kid} transform={`translate(${kx},${ky - SPEC[kid as Who].H * S - 60}) scale(${sc})`}>
            <CutText x={0} y={0} text={bigger ? '▲大' : '▼小'} size={56} color={bigger ? '#B07A1A' : P.teal} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------- world ---
const Page: React.FC<{t: number; side: 'L' | 'R'; backlit?: boolean; idp: string}> = ({t, side, backlit, idp}) => {
  const who = Object.keys(APPEAR).filter((w) => w !== 'me' && (side === 'R') === RIGHT_SIDE.has(w));
  const titleT = side === 'L' ? E.baba : E.mama;
  return (
    <g>
      {(backlit || t >= titleT) && (
        <g opacity={backlit ? 0 : clamp01((t - titleT) / 0.4)}>
          <CutText x={side === 'L' ? -900 : 900} y={-820} text={side === 'L' ? '爸爸这边' : '妈妈这边'} size={96} color={P.red} />
        </g>
      )}
      <Strips t={t} backlit={backlit} right={side === 'R'} />
      {who.map((w) => <Person key={w} who={w} t={t} backlit={backlit} idp={idp} />)}
      {!backlit && who.map((w) => <NameTag key={w} who={w} t={t} t0={APPEAR[w].t + (W.kids[w] ? E[`${w}_tag`] - APPEAR[w].t : 0.25)} />)}
    </g>
  );
};

/** How open the right half of the sheet is: 0 folded under, 1 open, −1 folded over the left half. */
const sheetK = (t: number) => {
  if (t < E.flip) return 0;
  if (t < E.fold) return easeInOut(prog(t, E.flip, 1.4));
  if (t < E.unfold_sheet) return 1 - 2 * easeInOut(prog(t, E.fold, 1.2));
  return -1 + 2 * easeInOut(prog(t, E.unfold_sheet, 1.2));
};

const TableScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const k = sheetK(t);
  return (
    <g transform={`translate(960,540) scale(${c.z}) translate(${-c.x},${-c.y})`}>
      <rect x={-5000} y={-4000} width={10000} height={8000} fill={P.wood} />
      {Array.from({length: 60}).map((_, i) => (
        <path key={i} d={`M -5000 ${i * 140 - 4000} C -1500 ${i * 140 - 3980}, 1500 ${i * 140 - 3960 + 30 * Math.sin(i)}, 5000 ${i * 140 - 4000}`} stroke="#9A6A40" strokeWidth={4} fill="none" opacity={0.5} />
      ))}
      {/* left half of the sheet */}
      <rect x={-1792} y={-992} width={1800} height={2000} fill="#3A1A10" opacity={0.25} transform="translate(10,12)" />
      <RicePaper x={-1800} y={-1000} w={1800} h={2000} seed={2} />
      <Page t={t} side="L" idp="tL" />
      {/* right half, hinged on the fold */}
      {Math.abs(k) > 0.01 && (
        <g transform={`scale(${k},1)`}>
          <rect x={0} y={-992} width={1800} height={2000} fill="#3A1A10" opacity={0.25 * Math.abs(k)} transform="translate(10,12)" />
          {k > 0 ? (
            <g>
              <RicePaper x={0} y={-1000} w={1800} h={2000} seed={9} />
              <rect x={0} y={-1000} width={1800} height={2000} fill="#000" opacity={0.25 * (1 - k)} />
            </g>
          ) : (
            <g>
              <rect x={0} y={-1000} width={1800} height={2000} fill={P.riceDark} />
              <rect x={0} y={-1000} width={1800} height={2000} fill="url(#paperGrain)" opacity={0.25} />
            </g>
          )}
        </g>
      )}
      {k > 0.98 && <Page t={t} side="R" idp="tR" />}
      <line x1={0} y1={-1000} x2={0} y2={1000} stroke="#CDBFA6" strokeWidth={4} strokeDasharray="18 14" />
      <Compare t={t} />
      <Badges t={t} />
      <Flow t={t} />
      <Person who="me" t={t} idp="t" />
      <NameTag who="me" t={t} t0={E.me_drop + 0.9} />
      <Cutting t={t} />
    </g>
  );
};

/** The finished sheet pressed onto a window at dusk: a backlit 窗花. */
const WindowScene: React.FC<{t: number}> = ({t}) => {
  const z = 0.5, cx = 0, cy = -120;
  return (
    <g>
      <defs>
        <radialGradient id="duskF" cx="50%" cy="58%" r="70%">
          <stop offset="0" stopColor="#FFE3A0" />
          <stop offset="0.45" stopColor="#F6A65A" />
          <stop offset="1" stopColor="#3B2350" />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={P.night} />
      <rect x={110} y={40} width={1700} height={1000} fill="url(#duskF)" />
      {Array.from({length: 110}).map((_, i) => {
        const x = 110 + ((rand(i) * 1700 + t * 25 * (0.4 + rand(i + 3))) % 1700);
        const y = 40 + ((rand(i + 50) * 1000 + t * 60 * (0.5 + rand(i + 7))) % 1000);
        return <circle key={i} cx={x} cy={y} r={1.5 + rand(i + 9) * 3.5} fill="#FFFFFF" opacity={0.7} />;
      })}
      <g transform={`translate(960,540) scale(${z}) translate(${-cx},${-cy})`}>
        <Page t={t} side="L" backlit idp="wL" />
        <Page t={t} side="R" backlit idp="wR" />
        <circle cx={0} cy={pos('me')[1] - 90} r={170} fill="#FFF2C8" opacity={0.6} filter="url(#glow)" />
        <Person who="me" t={t} backlit idp="w" />
      </g>
      <g fill="none" stroke="#5A3420" strokeWidth={26}>
        <rect x={110} y={40} width={1700} height={1000} />
        <line x1={960} y1={40} x2={960} y2={1040} strokeWidth={20} />
      </g>
      {[[110, 40], [1810, 40], [110, 1040], [1810, 1040]].map(([x, y], i) => (
        <path key={i} transform={`translate(${x},${y}) scale(${x > 960 ? -1 : 1},${y > 540 ? -1 : 1})`}
          d="M 0 0 L 120 0 L 120 20 L 20 20 L 20 120 L 0 120 Z M 40 40 L 90 40 L 90 54 L 54 54 L 54 90 L 40 90 Z" fill="#5A3420" />
      ))}
    </g>
  );
};

const Caption: React.FC<{t: number}> = ({t}) => {
  const cur = F.lines.filter((l) => t >= l.t0 && t < l.t0 + l.show);
  if (!cur.length) return null;
  const l = cur[cur.length - 1];
  const a = win(t, l.t0, l.t0 + l.show, 0.15);
  return (
    <g opacity={a} transform={`translate(0,${(1 - easeOut(prog(t, l.t0, 0.25))) * 20})`}>
      <Line who={l.who === 'T' ? '问' : '答'} text={l.text.replace(/[“”]/g, '')} />
    </g>
  );
};

export const PaperFilm: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const wa = easeInOut(prog(t, E.window, 1.8));
  const fadeIn = clamp01((t - E.fadein) / 0.9);
  const fadeOut = prog(t, F.duration - 1.2, 1.2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1920} height={1080}>
        <PaperDefs />
        {wa < 1 && <g opacity={1}><TableScene t={t} /></g>}
        {wa > 0 && (
          <g opacity={wa} transform={`translate(960,540) scale(${lerp(1.15, 1, wa)}) translate(-960,-540)`}>
            <WindowScene t={t} />
          </g>
        )}
        <Caption t={t} />
        <rect width={1920} height={1080} fill="#000" opacity={Math.max(1 - fadeIn, fadeOut)} />
      </svg>
      {withAudio && <Audio src={staticFile('audio/paper/mix.wav')} />}
    </AbsoluteFill>
  );
};

export const PAPER_DURATION = F.duration;
