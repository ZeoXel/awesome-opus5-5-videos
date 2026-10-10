import React from 'react';
import {Figure} from './Person';
import {PEOPLE, prefixTone} from './family';
import {C, FONT, toneColor} from './theme';
import {Timeline, TL, Walk} from './timeline';
import {clamp01, easeInOut, easeOut, follow, hash, pop, prog, rand, win, XYS} from './anim';

// Card geometry (at scale 1): photo is 200×150 centred on (x, y).
export const CW = 100;
export const CH = 75;
const LABEL_BOTTOM = 198;

export const camAt = (t: number): XYS => follow(TL.camera.init, TL.camera.moves, t);

export const nodeAt = (id: string, t: number): XYS => {
  if (id === 'GPF' || id === 'GPM') {
    const [a, b] = id === 'GPF' ? ['yeye', 'nainai'] : ['waigong', 'waipo'];
    const p = nodeAt(a, t), q = nodeAt(b, t);
    return {x: (p.x + q.x) / 2, y: p.y, s: p.s};
  }
  const n = TL.nodes[id];
  return follow({x: n.x, y: n.y, s: n.s}, n.moves, t);
};

type Pt = [number, number];

const polyLen = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};

/** Returns the first k (0..1) of a polyline, and the point where it ends. */
const cutPoly = (pts: Pt[], k: number): {pts: Pt[]; end: Pt} => {
  const L = polyLen(pts) * clamp01(k);
  const out: Pt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (acc + seg >= L) {
      const f = seg === 0 ? 0 : (L - acc) / seg;
      const e: Pt = [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
      out.push(e);
      return {pts: out, end: e};
    }
    acc += seg;
    out.push(pts[i]);
  }
  return {pts: out, end: pts[pts.length - 1]};
};

const d = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const barYFor = (child: XYS) => child.y - CH * child.s - 26 * child.s;

// ------------------------------------------------------------------ edges --
const Edge: React.FC<{e: Timeline['edges'][number]; t: number}> = ({e, t}) => {
  if (t < e.t0) return null;
  const hide = Math.max(0, ...e.hidden.map(([a, b]) => win(t, a, b, 0.6)));
  if (hide >= 1) return null;
  const k = prog(t, e.t0, e.dur);
  const ps = e.parents.map((p) => nodeAt(p, t));
  const cs = e.children.map((c) => nodeAt(c, t));
  const segs: {pts: Pt[]; k: number}[] = [];
  let start: Pt;
  if (ps.length === 2) {
    const [a, b] = ps[0].x < ps[1].x ? ps : [ps[1], ps[0]];
    start = [(a.x + b.x) / 2, a.y];
    segs.push({pts: [[a.x + CW * a.s, a.y], [b.x - CW * b.s, b.y]], k: easeOut(prog(k, 0, 0.25))});
  } else {
    start = [ps[0].x, ps[0].y + LABEL_BOTTOM * ps[0].s];
  }
  const kTrunk = easeOut(clamp01(k / 0.4));
  const kBar = easeOut(clamp01((k - 0.4) / 0.35));
  const kDrop = easeOut(clamp01((k - 0.75) / 0.25));
  for (const c of cs) {
    const by = barYFor(c);
    segs.push({pts: [start, [start[0], by]], k: kTrunk});
    segs.push({pts: [[start[0], by], [c.x, by]], k: kBar});
    segs.push({pts: [[c.x, by], [c.x, c.y - CH * c.s]], k: kDrop});
  }
  return (
    <g opacity={1 - hide}>
      {segs.map((s, i) => s.k > 0 && polyLen(s.pts) > 0.5 && (
        <path key={i} d={d(cutPoly(s.pts, s.k).pts)} stroke={C.line} strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ walks --
const routePts = (route: string[], t: number): Pt[] => {
  const pts: Pt[] = [];
  const at = route.map((id) => nodeAt(id, t));
  pts.push([at[0].x, at[0].y]);
  for (let i = 1; i < at.length; i++) {
    const a = at[i - 1], b = at[i];
    const child = a.y > b.y ? a : b;
    const by = barYFor(child);
    pts.push([a.x, by], [b.x, by], [b.x, b.y]);
  }
  return pts;
};

const WalkTrail: React.FC<{w: Walk; t: number}> = ({w, t}) => {
  if (t < w.t0 || t > w.fade + 0.8) return null;
  const k = easeInOut(prog(t, w.t0, w.t1 - w.t0));
  const alpha = 1 - prog(t, w.fade, 0.8);
  const {pts} = cutPoly(routePts(w.route, t), k);
  const col = toneColor(w.color);
  return (
    <g opacity={alpha}>
      <path d={d(pts)} stroke={col} strokeOpacity={0.25} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(pts)} stroke={col} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

const WalkDot: React.FC<{w: Walk; t: number}> = ({w, t}) => {
  if (t < w.t0 || t > w.t1 + 0.5) return null;
  const k = easeInOut(prog(t, w.t0, w.t1 - w.t0));
  const {end} = cutPoly(routePts(w.route, t), k);
  const col = toneColor(w.color);
  const a = 1 - prog(t, w.t1, 0.5);
  const pulse = 1 + 0.15 * Math.sin(t * 18);
  return (
    <g opacity={a} transform={`translate(${end[0]},${end[1]})`}>
      <circle r={30 * pulse} fill={col} opacity={0.22} />
      <circle r={17} fill={col} stroke="#fff" strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => {
        const ang = t * 4 + (i * Math.PI) / 2;
        return <circle key={i} cx={Math.cos(ang) * 34} cy={Math.sin(ang) * 34} r={4} fill={col} opacity={0.7} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ cards --
const nameLabel = (name: string, size: number) => {
  const tone = prefixTone(name);
  if (tone === 'ink') return <tspan>{name}</tspan>;
  return (
    <>
      <tspan fill={toneColor(tone)}>{name[0]}</tspan>
      <tspan>{name.slice(1)}</tspan>
    </>
  );
};

const activeWave = (id: string, t: number) => {
  let wave = 0, raise = 0;
  for (const w of TL.waves) {
    if (w.node !== id) continue;
    const a = win(t, w.t0, w.t1, 0.35);
    if (w.raise) raise = Math.max(raise, a);
    else wave = Math.max(wave, a);
  }
  return {wave, raise};
};

const nodAt = (id: string, t: number) => {
  for (const n of TL.nods ?? []) {
    if (!n.nodes.includes(id)) continue;
    const i = n.nodes.indexOf(id);
    const k = prog(t, n.t0 + i * 0.12, 1.1);
    if (k > 0 && k < 1) return Math.sin(k * Math.PI * 2) * 7;
  }
  return 0;
};

export const Photo: React.FC<{id: string; look: typeof PEOPLE[string]['look']; t: number; wave?: number; raise?: number; nod?: number}> = ({id, look, t, wave = 0, raise = 0, nod = 0}) => {
  // adults are shown as a bust, children from the knees up — so a taller
  // cousin really does fill more of the photo than a little one
  const ps = look.kid ? 0.76 : 0.95;
  const feet = look.kid ? 104 : -60 + look.H * ps;
  return (
    <g>
      <clipPath id={`clip-${id}`}>
        <rect x={-CW} y={-CH} width={CW * 2} height={CH * 2} rx={10} />
      </clipPath>
      <rect x={-CW} y={-CH} width={CW * 2} height={CH * 2} rx={10} fill={C.card} stroke={C.cardEdge} strokeWidth={2} />
      <g clipPath={`url(#clip-${id})`}>
        <ellipse cx={0} cy={CH + 10} rx={CW * 1.1} ry={40} fill="#EADCC9" opacity={0.6} />
        <g transform={`translate(0,${feet}) scale(${ps})`}>
          <Figure look={look} t={t} seed={hash(id)} wave={wave} raise={raise} nod={nod} />
        </g>
      </g>
    </g>
  );
};

const Card: React.FC<{id: string; t: number}> = ({id, t}) => {
  const n = TL.nodes[id];
  if (t < n.appear) return null;
  const p = PEOPLE[id];
  const {x, y, s} = nodeAt(id, t);
  const sc = pop(t, n.appear, 1.15);
  const {wave, raise} = activeWave(id, t);
  const unknown = n.unknown && (n.reveal === undefined || t < n.reveal + 0.25);
  const flip = n.reveal !== undefined ? Math.abs(Math.cos(Math.PI * prog(t, n.reveal, 0.5))) : 1;
  const labelSc = n.unknown ? flip : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s * sc})`} opacity={clamp01((t - n.appear) / 0.15)}>
      <Photo id={id} look={p.look} t={t} wave={wave} raise={raise} nod={nodAt(id, t)} />
      {/* paper backing: route lines run behind the name, never through it */}
      <rect x={-82} y={80} width={164} height={120} rx={14} fill={C.paper} />
      <g transform={`scale(${labelSc},1)`} fontFamily={FONT} textAnchor="middle">
        {unknown ? (
          <text y={156} fontSize={54} fontWeight={700} fill={C.sub}>？</text>
        ) : (
          <>
            <text y={103} fontSize={24} fill={C.py}>{p.py}</text>
            <text y={156} fontSize={50} fontWeight={700} fill={C.ink}>{nameLabel(p.name, 50)}</text>
            <text y={190} fontSize={24} fill={C.sub}>{p.sub}</text>
          </>
        )}
      </g>
    </g>
  );
};

const Ghost: React.FC<{id: string; t: number}> = ({id, t}) => {
  const n = TL.nodes[id];
  if (n.ghost == null || t < n.ghost || t > n.appear + 0.3) return null;
  const {x, y, s} = nodeAt(id, t);
  const a = Math.min(prog(t, n.ghost, 0.5), 1 - prog(t, n.appear, 0.3));
  const bob = Math.sin((t - n.ghost) * 3) * 3;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s})`} opacity={a}>
      <rect x={-CW} y={-CH} width={CW * 2} height={CH * 2} rx={10} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="12 10" />
      <text y={22} fontSize={70} fontFamily={FONT} textAnchor="middle" fill={C.line}>？</text>
    </g>
  );
};

// ------------------------------------------------------- small decorations --
const Cake: React.FC<{n: number; t: number; t0: number}> = ({n, t, t0}) => {
  const sc = pop(t, t0, 1.3);
  return (
    <g transform={`scale(${sc})`}>
      <rect x={-30} y={-6} width={60} height={30} rx={6} fill="#F6E3C8" stroke="#D9BE98" strokeWidth={2} />
      <path d="M -30 2 Q -22 10 -15 2 Q -7 10 0 2 Q 7 10 15 2 Q 22 10 30 2 L 30 -2 Q 30 -6 26 -6 L -26 -6 Q -30 -6 -30 -2 Z" fill="#F2A3B5" />
      {Array.from({length: n}).map((_, i) => {
        const cx = -24 + (48 * (i + 0.5)) / n;
        const fl = 1 + 0.18 * Math.sin(t * 13 + i * 2);
        return (
          <g key={i}>
            <rect x={cx - 2.5} y={-24} width={5} height={18} rx={2} fill={i % 2 ? '#7FB2DD' : '#F2C94C'} />
            <ellipse cx={cx} cy={-30} rx={3.6} ry={6 * fl} fill="#F39A2E" />
          </g>
        );
      })}
    </g>
  );
};

const Cakes: React.FC<{t: number}> = ({t}) => (
  <>
    {TL.cakes.map((c, i) => {
      const a = win(t, c.t0, c.t1, 0.3);
      if (a <= 0) return null;
      return [[c.a, c.na, c.t0], [c.b, c.nb, c.t0 + 0.25]].map(([id, n, t0]) => {
        const p = nodeAt(id as string, t);
        return (
          <g key={`${i}${id}`} transform={`translate(${p.x + CW * p.s - 26},${p.y - CH * p.s - 2})`} opacity={a}>
            <Cake n={n as number} t={t} t0={t0 as number} />
          </g>
        );
      });
    })}
  </>
);

const Tags: React.FC<{t: number}> = ({t}) => (
  <>
    {TL.tags.map((g, i) => {
      const a = win(t, g.t0, g.t1, 0.3);
      if (a <= 0) return null;
      const p = nodeAt(g.node, t);
      const sc = pop(t, g.t0, 1.3);
      const up = g.text.endsWith('大');
      return (
        <g key={i} transform={`translate(${p.x},${p.y + 226 * p.s}) scale(${sc})`} opacity={a}>
          <rect x={-92} y={-26} width={184} height={52} rx={26} fill={up ? '#FCE6CF' : '#DDEFF1'} />
          <text y={11} fontSize={30} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill={up ? '#A85B17' : '#1E6F7A'}>
            {up ? '▲ ' : '▼ '}{g.text}
          </text>
        </g>
      );
    })}
  </>
);

const Glow: React.FC<{t: number}> = ({t}) => (
  <>
    {TL.glows.map((g, i) => {
      const a = win(t, g.t0, g.t1, 0.5);
      if (a <= 0) return null;
      const p = nodeAt(g.node, t);
      const pulse = 1 + 0.05 * Math.sin((t - g.t0) * 5);
      return (
        <g key={i} transform={`translate(${p.x},${p.y}) scale(${p.s * pulse})`} opacity={a}>
          <rect x={-CW - 18} y={-CH - 18} width={CW * 2 + 36} height={CH * 2 + 36} rx={24} fill="none" stroke="#F2C94C" strokeWidth={10} opacity={0.8} />
          {Array.from({length: 10}).map((_, j) => {
            const ang = (j / 10) * Math.PI * 2 + t * 0.8;
            const rr = 150 + 12 * Math.sin(t * 4 + j);
            return <path key={j} transform={`translate(${Math.cos(ang) * rr},${Math.sin(ang) * rr * 0.75}) scale(${0.8 + 0.4 * rand(j)})`}
              d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#F2B632" />;
          })}
        </g>
      );
    })}
  </>
);

const Question: React.FC<{t: number}> = ({t}) => {
  const q = TL.question;
  const a = win(t, q.t0, q.t1, 0.3);
  if (a <= 0) return null;
  const p = nodeAt(q.node, t);
  return (
    <g opacity={a} fontFamily={FONT} fontWeight={700} fill={C.tang} textAnchor="middle">
      {[-1, 0, 1].map((k, i) => {
        const sc = pop(t, q.t0 + i * 0.25, 1.4);
        const bob = Math.sin(t * 4 + i) * 8;
        return (
          <text key={i} x={p.x + k * 110 * p.s} y={p.y - (CH + 40 + (k === 0 ? 50 : 0)) * p.s + bob}
            fontSize={80 * sc} transform={`rotate(${k * 14} ${p.x + k * 110 * p.s} ${p.y - 150 * p.s})`}>？</text>
        );
      })}
    </g>
  );
};

const SIL_POS: Pt[] = [[1640, 330], [1880, 190], [2440, 190], [2680, 330], [1560, 640], [2760, 640]];
const SIL_LOOKS = ['yeye', 'gugu', 'jiujiu', 'nainai', 'tangge', 'biaomei'];

const Silhouettes: React.FC<{t: number}> = ({t}) => {
  const s = TL.silhouettes;
  if (t < s.t0 || t > s.t1 + 0.5) return null;
  return (
    <g>
      {SIL_POS.map(([x, y], i) => {
        const t0 = s.t0 + i * 0.22;
        const sc = pop(t, t0, 1.2) * (1 - easeInOut(prog(t, s.t1 - 0.4 + i * 0.05, 0.4)));
        if (sc <= 0) return null;
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${sc})`}>
            <rect x={-CW} y={-CH} width={CW * 2} height={CH * 2} rx={10} fill="#FFFCF6" stroke={C.line} strokeWidth={3} strokeDasharray="12 10" />
            <clipPath id={`silc${i}`}><rect x={-CW} y={-CH} width={CW * 2} height={CH * 2} rx={10} /></clipPath>
            <g clipPath={`url(#silc${i})`} filter="url(#silh)">
              <g transform={`translate(0,${-60 + PEOPLE[SIL_LOOKS[i]].look.H * 0.95}) scale(0.95)`}>
                <Figure look={PEOPLE[SIL_LOOKS[i]].look} t={t} seed={i} />
              </g>
            </g>
            <text y={140} fontSize={60} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill={C.line}>？</text>
          </g>
        );
      })}
    </g>
  );
};

const SideChip: React.FC<{x: number; y: number; text: string; dir: -1 | 1; sc: number; color: string}> = ({x, y, text, dir, sc, color}) => (
  <g transform={`translate(${x},${y}) scale(${sc})`} fontFamily={FONT}>
    <rect x={-120} y={-38} width={240} height={76} rx={38} fill={color} />
    <text y={14} fontSize={40} fontWeight={700} textAnchor="middle" fill="#fff">
      {dir < 0 ? `◀ ${text}` : `${text} ▶`}
    </text>
  </g>
);

const SideLabels: React.FC<{t: number}> = ({t}) => {
  const s = TL.sideLabels;
  const a = win(t, s.t0, s.t1, 0.3);
  if (a <= 0) return null;
  const b = nodeAt('baba', t), m = nodeAt('mama', t);
  return (
    <g opacity={a}>
      <SideChip x={b.x - 40} y={b.y - 150} text="爸爸这边" dir={-1} sc={pop(t, s.t0, 1.2)} color="#B98A5E" />
      <SideChip x={m.x + 40} y={m.y - 150} text="妈妈这边" dir={1} sc={pop(t, s.t0 + 0.6, 1.2)} color="#C07A86" />
    </g>
  );
};

const BothLabels: React.FC<{t: number}> = ({t}) => {
  const s = TL.bothLabels;
  const a = win(t, s.t0, s.t1, 0.4);
  if (a <= 0) return null;
  return (
    <g opacity={a} fontFamily={FONT} fontWeight={700} textAnchor="middle" fontSize={96}>
      <text x={695} y={-60} fill="#B98A5E">爸爸这边</text>
      <text x={3040} y={-60} fill="#C07A86">妈妈这边</text>
    </g>
  );
};

// ------------------------------------------------------------------- world --
export const World: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  let sx = 0;
  for (const sh of TL.shakes) {
    const k = prog(t, sh.t0, sh.dur);
    if (k > 0 && k < 1) sx += Math.sin(k * Math.PI * 9) * 16 * (1 - k);
  }
  const ids = Object.keys(TL.nodes);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="silh">
          <feFlood floodColor="#D8C9B6" result="f" />
          <feComposite in="f" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <g transform={`translate(${960 + sx},540) scale(${cam.s}) translate(${-cam.x},${-cam.y})`}>
        <Silhouettes t={t} />
        <SideLabels t={t} />
        <BothLabels t={t} />
        {TL.edges.map((e, i) => <Edge key={i} e={e} t={t} />)}
        {TL.walks.map((w, i) => <WalkTrail key={i} w={w} t={t} />)}
        <Glow t={t} />
        {ids.map((id) => <Ghost key={`g${id}`} id={id} t={t} />)}
        {ids.map((id) => <Card key={id} id={id} t={t} />)}
        <Cakes t={t} />
        <Tags t={t} />
        <Question t={t} />
        {TL.walks.map((w, i) => <WalkDot key={i} w={w} t={t} />)}
      </g>
    </svg>
  );
};
