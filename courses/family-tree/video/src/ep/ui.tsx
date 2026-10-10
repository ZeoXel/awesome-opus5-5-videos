import React from 'react';
import {Figure} from '../Person';
import {PEOPLE} from '../family';
import {C, FONT, toneColor} from '../theme';
import {clamp01, easeInOut, easeOut, easeOutBack, hash, lerp, pop, prog, win} from '../anim';
import {Episode, Slot} from './types';
import {headTop} from './actors';

const ORANGE = '#EE8A2E';
const TEAL = '#3FA3A6';
const WAI = '#C0607A';

/** Caption markup: 「堂」 in the 堂 colour, 『表』 in the 表 colour. */
export const Rich: React.FC<{text: string}> = ({text}) => {
  const parts: React.ReactNode[] = [];
  const re = /「([^」]*)」|『([^』]*)』/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<tspan key={k++}>{text.slice(last, m.index)}</tspan>);
    parts.push(<tspan key={k++} fill={m[1] !== undefined ? C.tang : C.biao} fontWeight={700}>{m[1] ?? m[2]}</tspan>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<tspan key={k++}>{text.slice(last)}</tspan>);
  return <>{parts}</>;
};
const plainLen = (s: string) => Array.from(s.replace(/[「」『』]/g, '')).length;

// ---------------------------------------------------------------- bubbles --
export const Bubbles: React.FC<{ep: Episode; t: number}> = ({ep, t}) => (
  <>
    {ep.bubbles.map((b, i) => {
      if (t < b.t0 - 0.05 || t > b.t1 + 0.2) return null;
      const a = win(t, b.t0, b.t1, 0.18);
      const sc = 0.6 + 0.4 * easeOutBack(prog(t, b.t0, 0.3));
      const lines = b.text.split('\n');
      const fs = 50;
      const w = Math.max(...lines.map(plainLen)) * fs + 70;
      const h = lines.length * (fs + 14) + 40;
      let ax: number, ay: number;
      if (b.at) [ax, ay] = b.at;
      else {
        const hd = headTop(ep, b.who, t);
        if (!hd) return null;
        ax = hd.x; ay = hd.y - 18;
        if (ep.fx.some((f) => f.kind === 'nameplate' && f.at === b.who && t >= f.t0 && t <= f.t1)) ay -= 82;
      }
      const cx = Math.max(w / 2 + 24, Math.min(1920 - w / 2 - 24, ax));
      const top = Math.max(20, ay - h - 26);
      const tailX = Math.max(cx - w / 2 + 40, Math.min(cx + w / 2 - 40, ax));
      return (
        <g key={i} opacity={a} transform={`translate(${cx},${top + h}) scale(${sc}) translate(${-cx},${-(top + h)})`} fontFamily={FONT}>
          <path d={`M ${tailX - 22} ${top + h - 4} L ${tailX + (ax - tailX) * 0.6} ${top + h + 24} L ${tailX + 22} ${top + h - 4} Z`}
            fill="#FFFFFF" stroke="#2B2622" strokeWidth={4} strokeLinejoin="round" />
          <rect x={cx - w / 2} y={top} width={w} height={h} rx={34} fill="#FFFFFF" stroke="#2B2622" strokeWidth={4} />
          <rect x={tailX - 20} y={top + h - 8} width={40} height={8} fill="#FFFFFF" />
          {lines.map((ln, j) => (
            <text key={j} x={cx} y={top + 20 + (j + 1) * (fs + 14) - 12} fontSize={fs} fontWeight={700} textAnchor="middle" fill={C.ink}>
              <Rich text={ln} />
            </text>
          ))}
        </g>
      );
    })}
  </>
);

// --------------------------------------------------------------- captions --
export const Captions: React.FC<{ep: Episode; t: number}> = ({ep, t}) => {
  const c = [...ep.captions].reverse().find((x) => t >= x.t0 && t < x.t1);
  if (!c) return null;
  const a = win(t, c.t0, c.t1, 0.2);
  const w = Math.min(1820, plainLen(c.text) * 50 + 120);
  return (
    <g opacity={a} fontFamily={FONT}>
      <rect x={960 - w / 2} y={962} width={w} height={96} rx={24} fill="#2B2622" opacity={0.82} />
      <text x={960} y={1026} fontSize={50} textAnchor="middle" fill="#FFFFFF" style={{}}>
        <Rich text={c.text.replace(/「/g, '「').replace(/』/g, '』')} />
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ chips --
const NameText: React.FC<{name: string; size: number}> = ({name, size}) => {
  const first = name[0];
  const col = first === '堂' ? C.tang : first === '表' ? C.biao : first === '外' ? WAI : null;
  return (
    <text fontSize={size} fontWeight={700} textAnchor="middle" fill={C.ink}>
      {col ? <><tspan fill={col}>{first}</tspan><tspan>{name.slice(1)}</tspan></> : name}
    </text>
  );
};

export const Chips: React.FC<{ep: Episode; t: number}> = ({ep, t}) => (
  <>
    {ep.chips.map((c, i) => {
      const a = win(t, c.t0, c.t1, 0.25);
      if (a <= 0) return null;
      const p = PEOPLE[c.who];
      const sc = pop(t, c.t0, 1.3);
      return (
        <g key={i} transform={`translate(${c.x},${c.y}) scale(${sc})`} opacity={a} fontFamily={FONT}>
          <rect x={-130} y={-100} width={260} height={c.tag ? 236 : 176} rx={30} fill="#FFFCF6" stroke="#E2CFB4" strokeWidth={4} />
          <text y={-52} fontSize={36} textAnchor="middle" fill={C.py}>{p.py}</text>
          <g transform="translate(0,46)"><NameText name={p.name} size={92} /></g>
          {c.tag && (
            <g transform="translate(0,100)">
              <rect x={-112} y={-26} width={224} height={52} rx={26} fill={c.tag.includes('大') ? '#FCE6CF' : '#DDEFF1'} />
              <text y={11} fontSize={30} fontWeight={700} textAnchor="middle" fill={c.tag.includes('大') ? '#A85B17' : '#1E6F7A'}>{c.tag}</text>
            </g>
          )}
        </g>
      );
    })}
  </>
);

// -------------------------------------------------------------- word card --
export const WordCards: React.FC<{ep: Episode; t: number}> = ({ep, t}) => (
  <>{ep.words.map((w, i) => <WordCard key={i} t={t} t0={w.t0} t1={w.t1} slots={w.slots} merge={w.merge} cx={1610} top={90} />)}</>
);

const WordCard: React.FC<{t: number; t0: number; t1: number; slots: Slot[]; merge: number | null; cx: number; top: number}> = ({t, t0, t1, slots, merge, cx, top}) => {
  const a = win(t, t0, t1, 0.35);
  if (a <= 0) return null;
  const mk = merge != null ? easeInOut(prog(t, merge, 0.5)) : 0;
  const gap = 210 - 40 * mk;
  const slotX = (i: number) => cx + (i - 0.5) * gap;
  const pyY = top + 82, chY = top + 226, lineY = top + 250;
  return (
    <g opacity={a} fontFamily={FONT}>
      <rect x={cx - 270} y={top} width={540} height={290} rx={28} fill="#FFFCF6" stroke="#E2CFB4" strokeWidth={4} />
      {[0, 1].map((i) => {
        const filled = slots.some((s) => s.i === i && t >= s.t);
        return <line key={i} x1={slotX(i) - 78} x2={slotX(i) + 78} y1={lineY} y2={lineY}
          stroke={filled ? C.line : C.cardEdge} strokeWidth={3} strokeDasharray={filled ? undefined : '10 8'} />;
      })}
      {slots.map((s, j) => {
        if (t < s.t) return null;
        const k = easeOutBack(prog(t, s.t, 0.45));
        const col = toneColor(s.color);
        return (
          <g key={j} transform={`translate(${slotX(s.i)},${(1 - k) * -90})`} opacity={clamp01((t - s.t) / 0.15)} textAnchor="middle">
            <text y={pyY} fontSize={44} fill={s.color === 'ink' ? C.py : col}>{s.py}</text>
            <text y={chY} fontSize={140} fontWeight={700} fill={col}>{s.ch}</text>
            {s.i === 0 && (
              <g transform={`translate(${-92},${chY - 150}) scale(0.32)`}>
                {s.color === 'tang' ? <MiniJersey color={ORANGE} /> : <MiniCoat color={TEAL} />}
              </g>
            )}
          </g>
        );
      })}
      {merge != null && t >= merge && (
        <g opacity={1 - prog(t, merge + 0.6, 0.6)}>
          {Array.from({length: 12}).map((_, i) => {
            const ang = (i / 12) * Math.PI * 2;
            const rr = 60 + 170 * easeOut(prog(t, merge, 0.8));
            return <circle key={i} cx={cx + Math.cos(ang) * rr * 1.3} cy={top + 165 + Math.sin(ang) * rr * 0.6} r={7} fill={i % 2 ? C.tang : '#F2C94C'} />;
          })}
        </g>
      )}
    </g>
  );
};

const MiniJersey: React.FC<{color: string}> = ({color}) => (
  <path d="M -38 -46 L -14 -54 Q 0 -42 14 -54 L 38 -46 L 62 -16 L 44 -2 L 34 -14 L 34 54 L -34 54 L -34 -14 L -44 -2 L -62 -16 Z" fill={color} />
);
const MiniCoat: React.FC<{color: string}> = ({color}) => (
  <path d="M -36 -48 L -12 -54 L 0 -36 L 12 -54 L 36 -48 L 60 -10 L 44 2 L 34 -12 L 36 56 L -36 56 L -34 -12 L -44 2 L -60 -10 Z" fill={color} />
);

// ---------------------------------------------------------------- album ----
export const PAGE_L = ['yeye', 'nainai', 'bobo', 'baba', 'shushu', 'gugu', 'tangge', 'biaomei'];
export const PAGE_R = ['waigong', 'waipo', 'jiujiu', 'yima', 'biaojie', 'biaodi'];
const WIDGET = {x: 34, y: 26};
const WS = 1.35; // corner album scale
const slotPos = (who: string): [number, number] => {
  const iL = PAGE_L.indexOf(who), iR = PAGE_R.indexOf(who);
  if (iL >= 0) return [WIDGET.x + 30 + (iL % 4) * 40, WIDGET.y + 56 + Math.floor(iL / 4) * 44];
  return [WIDGET.x + 210 + (iR % 3) * 40, WIDGET.y + 56 + Math.floor(iR / 3) * 44];
};

const Face: React.FC<{who: string; r: number}> = ({who, r}) => {
  const look = PEOPLE[who].look;
  return (
    <g>
      <circle r={r} fill={look.shirt} />
      <circle cy={-r * 0.1} r={r * 0.55} fill={C.skin} />
      <path d={`M ${-r * 0.55} ${-r * 0.15} Q 0 ${-r * 0.95} ${r * 0.55} ${-r * 0.15}`} fill={look.hairColor} />
    </g>
  );
};

export const AlbumWidget: React.FC<{ep: Episode; t: number; srcPos: (id: string, t: number) => {x: number; y: number} | null}> = ({ep, t, srcPos}) => {
  const al = ep.album;
  if (!al) return null;
  const a = win(t, al.t0, al.t1, 0.4);
  if (a <= 0) return null;
  const done = new Set<string>(ep.stickers.filter((s) => t >= s.t + 0.75).map((s) => s.who));
  if (al.prefilled?.includes('L')) PAGE_L.forEach((w) => done.add(w));
  const pages = al.pages.includes('R') ? 2 : 1;
  const width = pages === 2 ? 340 : 200;
  return (
    <g opacity={a} fontFamily={FONT}>
      <g transform={`translate(${WIDGET.x},${WIDGET.y}) scale(${WS}) translate(${-WIDGET.x},${-WIDGET.y})`}>
      <g transform={`translate(${WIDGET.x},${WIDGET.y})`}>
        <rect x={0} y={0} width={width} height={150} rx={16} fill="#B5543F" />
        <rect x={8} y={30} width={180} height={112} rx={8} fill="#FFFCF6" />
        {pages === 2 && <rect x={192} y={30} width={140} height={112} rx={8} fill="#FFFCF6" />}
        <text x={width / 2} y={23} fontSize={20} fontWeight={700} textAnchor="middle" fill="#FFF3DC">全家福相册</text>
      </g>
      {[...PAGE_L, ...(pages === 2 ? PAGE_R : [])].map((who) => {
        const [x, y] = slotPos(who);
        return done.has(who)
          ? <g key={who} transform={`translate(${x},${y}) scale(${pop(t, (ep.stickers.find((s) => s.who === who)?.t ?? -9) + 0.75, 1.4) || 1})`}><Face who={who} r={17} /></g>
          : <circle key={who} cx={x} cy={y} r={16} fill="none" stroke="#D9C4A6" strokeWidth={2.5} strokeDasharray="5 4" />;
      })}
      </g>
      {ep.stickers.map((s, i) => {
        if (t < s.t || t > s.t + 0.8) return null;
        const src = srcPos(s.from, s.t);
        if (!src) return null;
        const k = easeInOut(prog(t, s.t, 0.75));
        const [sx, sy] = slotPos(s.who);
        const tx = WIDGET.x + (sx - WIDGET.x) * WS, ty = WIDGET.y + (sy - WIDGET.y) * WS;
        const x = lerp(src.x, tx, k), y = lerp(src.y, ty, k) - Math.sin(Math.PI * k) * 160;
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${lerp(2.6, WS, k)}) rotate(${(1 - k) * 360})`}>
            <rect x={-22} y={-22} width={44} height={44} rx={8} fill="#FFFFFF" stroke="#F2C94C" strokeWidth={3} />
            <Face who={s.who} r={17} />
          </g>
        );
      })}
    </g>
  );
};

// one photo card in the big album (same look as the reference picture)
export const PhotoCard: React.FC<{who: string; t: number; x: number; y: number; s: number; name?: string; glow?: number; blank?: boolean}> = ({who, t, x, y, s, name, glow = 0, blank}) => {
  const look = PEOPLE[who].look;
  const ps = look.kid ? 0.76 : 0.95;
  const feet = look.kid ? 104 : -60 + look.H * ps;
  const id = `pc-${who}-${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fontFamily={FONT}>
      {glow > 0 && <rect x={-122} y={-97} width={244} height={194} rx={22} fill="none" stroke="#F2B632" strokeWidth={12} opacity={glow} />}
      <clipPath id={id}><rect x={-100} y={-75} width={200} height={150} rx={10} /></clipPath>
      {blank ? (
        <>
          <rect x={-100} y={-75} width={200} height={150} rx={10} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="12 10" />
          <text y={24} fontSize={70} textAnchor="middle" fill={C.line}>？</text>
        </>
      ) : (
        <>
          <rect x={-100} y={-75} width={200} height={150} rx={10} fill={C.card} stroke={C.cardEdge} strokeWidth={2} />
          <g clipPath={`url(#${id})`}>
            <g transform={`translate(0,${feet}) scale(${ps})`}>
              <Figure look={look} t={t} seed={hash(who)} jersey={['bobo', 'baba', 'shushu'].includes(who) ? undefined : undefined} hat={who === 'me' ? '#D64541' : undefined} />
            </g>
          </g>
          <g transform="translate(0,140)"><NameText name={name ?? PEOPLE[who].name} size={52} /></g>
        </>
      )}
    </g>
  );
};

const LAYOUT_L: [string, number, number][] = [
  ['yeye', -115, -250], ['nainai', 115, -250],
  ['bobo', -300, 0], ['baba', -100, 0], ['shushu', 100, 0], ['gugu', 300, 0],
  ['me', -100, 250], ['tangge', 100, 250], ['biaomei', 300, 250],
];
const LAYOUT_R: [string, number, number][] = [
  ['waigong', -115, -250], ['waipo', 115, -250],
  ['mama', -230, 0], ['jiujiu', 0, 0], ['yima', 230, 0],
  ['me', -230, 250], ['biaojie', 0, 250], ['biaodi', 230, 250],
];
const EDGES_L = 'M -15 -250 L 15 -250 M 0 -250 L 0 -125 M -300 -125 L 300 -125 M -300 -125 L -300 -55 M -100 -125 L -100 -55 M 100 -125 L 100 -55 M 300 -125 L 300 -55 M -100 115 L -100 195 M 100 115 L 100 195 M 300 115 L 300 195';
const EDGES_R = 'M -15 -250 L 15 -250 M 0 -250 L 0 -125 M -230 -125 L 230 -125 M -230 -125 L -230 -55 M 0 -125 L 0 -55 M 230 -125 L 230 -55 M -230 115 L -230 195 M 0 115 L 0 195 M 230 115 L 230 195';

const Page: React.FC<{side: 'L' | 'R'; t: number; full: number; blank: boolean; meGlow: number; meShift?: {x: number; y: number; s: number}}> = ({side, t, full, blank, meGlow, meShift}) => {
  const layout = side === 'L' ? LAYOUT_L : LAYOUT_R;
  return (
    <g fontFamily={FONT}>
      <text y={-370} fontSize={46} fontWeight={700} textAnchor="middle" fill={side === 'L' ? '#B98A5E' : WAI}>
        {side === 'L' ? '从爸爸这边找家人' : '从妈妈这边找家人'}
      </text>
      <path d={side === 'L' ? EDGES_L : EDGES_R} stroke={C.line} strokeWidth={4} fill="none" opacity={blank ? 0.5 : 1} />
      {layout.map(([who, x, y], i) => {
        if (who === 'me' && meShift) return null;
        const sc = blank && who !== 'me' ? 0.72 : 0.72 * (who === 'me' ? 1 : Math.min(1, pop(t, full + i * 0.18, 1.3) || 0) || 0);
        return <PhotoCard key={who} who={who} t={t} x={x} y={y} s={blank ? 0.72 : sc} blank={blank && who !== 'me'}
          glow={who === 'me' ? meGlow : win(t, full + i * 0.18, full + i * 0.18 + 1, 0.3)} />;
      })}
    </g>
  );
};

export const AlbumSpread: React.FC<{t: number; pages: string; full: number; merge?: number}> = ({t, pages, full, merge}) => {
  const open = easeOutBack(prog(t, full - 0.4, 0.6));
  const mk = merge != null ? easeInOut(prog(t, merge, 1.4)) : 0;
  const meGlow = merge != null ? win(t, merge - 1.2, merge + 0.4, 0.3) : 0;
  return (
    <g transform={`translate(960,520) scale(${0.85 + 0.15 * open})`} opacity={clamp01(open * 1.5)}>
      <rect x={-890} y={-470} width={1780} height={940} rx={30} fill="#8E3B2E" />
      <g>
        <rect x={-870} y={-450} width={860} height={900} rx={14} fill="#FFFCF6" />
        <rect x={10} y={-450} width={860} height={900} rx={14} fill="#FFFCF6" />
        <rect x={-12} y={-450} width={24} height={900} fill="#E6D6C2" />
        <g transform="translate(-440,40)"><Page side="L" t={t} full={full} blank={false} meGlow={meGlow} meShift={mk > 0 ? {x: 0, y: 0, s: 1} : undefined} /></g>
        <g transform="translate(440,40)"><Page side="R" t={t} full={pages.includes('R') ? full : 1e9} blank={!pages.includes('R')} meGlow={meGlow} meShift={mk > 0 ? {x: 0, y: 0, s: 1} : undefined} /></g>
      </g>
      {mk > 0 && <rect x={-870} y={-450} width={1740} height={900} rx={14} fill="#FFFCF6" opacity={mk * 0.9} />}
      {mk > 0 && (
        <g>
          {/* the two 我 cards fly together and become one */}
          {[[-540, 290], [210, 290]].map(([x, y], i) => (
            <g key={i} opacity={1 - prog(t, merge! + 1.2, 0.3)}>
              <PhotoCard who="me" t={t} x={lerp(x, 0, mk)} y={lerp(y, 60, mk)} s={lerp(0.72, 1.6, mk)} />
            </g>
          ))}
          {t >= merge! + 1.2 && (
            <g>
              {Array.from({length: 14}).map((_, j) => {
                const ang = (j / 14) * Math.PI * 2 + t * 0.6;
                const rr = 300 + 20 * Math.sin(t * 4 + j);
                return <path key={j} transform={`translate(${Math.cos(ang) * rr},${60 + Math.sin(ang) * rr * 0.6}) scale(1.4)`}
                  d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill="#F2B632" />;
              })}
              <PhotoCard who="me" t={t} x={0} y={60} s={1.6 * (1 + 0.03 * Math.sin(t * 5))} glow={1} name="同一个我" />
              <text x={-560} y={-300} fontSize={60} fontWeight={700} textAnchor="middle" fill="#B98A5E" fontFamily={FONT}>爸爸这边</text>
              <text x={560} y={-300} fontSize={60} fontWeight={700} textAnchor="middle" fill={WAI} fontFamily={FONT}>妈妈这边</text>
              <path d="M -420 -260 Q -250 -60 -180 20" stroke="#B98A5E" strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="4 18" />
              <path d="M 420 -260 Q 250 -60 180 20" stroke={WAI} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="4 18" />
            </g>
          )}
        </g>
      )}
    </g>
  );
};
