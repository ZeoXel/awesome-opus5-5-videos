import React from 'react';
import {FONT} from '../theme';
import {rand} from '../anim';

export const P = {
  red: '#C8102E',
  redDark: '#9E0B22',
  gold: '#E3A73A',
  teal: '#2E9AA8',
  rice: '#F4ECDD',
  riceDark: '#E7DCC6',
  ink: '#2A211C',
  wood: '#A9764A',
  night: '#14213F',
};

/** Shared SVG defs: paper grain, soft drop shadow, glow. Render once per frame. */
export const PaperDefs: React.FC = () => (
  <defs>
    <filter id="paperShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={5} />
    </filter>
    <filter id="grainF" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} />
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.25" />
    </filter>
    <pattern id="paperGrain" patternUnits="userSpaceOnUse" width={400} height={400}>
      <rect width={400} height={400} filter="url(#grainF)" />
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={18} />
    </filter>
  </defs>
);

/** 宣纸 background with fibres. */
export const RicePaper: React.FC<{w?: number; h?: number; x?: number; y?: number; seed?: number}> = ({w = 1920, h = 1080, x = 0, y = 0, seed = 1}) => (
  <g transform={`translate(${x},${y})`}>
    <rect width={w} height={h} fill={P.rice} />
    <rect width={w} height={h} fill="url(#paperGrain)" opacity={0.25} />
    {Array.from({length: 140}).map((_, i) => {
      const fx = rand(i * 3 + seed) * w, fy = rand(i * 7 + seed) * h;
      const a = rand(i * 11 + seed) * Math.PI;
      const L = 10 + rand(i * 13 + seed) * 34;
      return <line key={i} x1={fx} y1={fy} x2={fx + Math.cos(a) * L} y2={fy + Math.sin(a) * L} stroke="#C9B898" strokeWidth={1} opacity={0.35} />;
    })}
  </g>
);

export const Table: React.FC = () => (
  <g>
    <rect width={1920} height={1080} fill={P.wood} />
    {Array.from({length: 26}).map((_, i) => (
      <path key={i} d={`M 0 ${i * 44 + 10} C 500 ${i * 44 + 22 * Math.sin(i)}, 1300 ${i * 44 + 30 * Math.cos(i)}, 1920 ${i * 44 + 8}`} stroke="#9A6A40" strokeWidth={2} fill="none" opacity={0.6} />
    ))}
  </g>
);

/** A strip of paper used as a connecting line. */
export const Strip: React.FC<{d: string; color: string; w?: number}> = ({d, color, w = 9}) => (
  <g>
    <path d={d} stroke="#3A1A10" strokeOpacity={0.22} strokeWidth={w} fill="none" transform="translate(3,4)" strokeLinejoin="round" />
    <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinejoin="round" />
  </g>
);

/** Small cream paper name tag with ink handwriting; first char coloured for 堂/表. */
export const Tag: React.FC<{x: number; y: number; text: string; rot?: number; size?: number; accent?: string}> = ({x, y, text, rot = 0, size = 54, accent}) => {
  const w = Array.from(text).length * size + 50;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} fontFamily={FONT}>
      <rect x={-w / 2 + 4} y={-size * 0.62 + 5} width={w} height={size * 1.25} rx={6} fill="#3A1A10" opacity={0.18} />
      <rect x={-w / 2} y={-size * 0.62} width={w} height={size * 1.25} rx={6} fill="#FBF6EC" />
      <text y={size * 0.36} fontSize={size} fontWeight={700} textAnchor="middle" fill={P.ink}>
        {accent ? <><tspan fill={accent}>{text[0]}</tspan><tspan>{text.slice(1)}</tspan></> : text}
      </text>
    </g>
  );
};

/** Cut-paper characters: bold 楷体 in paper colour with a lifted shadow. */
export const CutText: React.FC<{x: number; y: number; text: string; size: number; color: string; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, size, color, anchor = 'middle'}) => (
  <g fontFamily={FONT} fontWeight={700} fontSize={size} textAnchor={anchor}>
    <text x={x + 5} y={y + 7} fill="#3A1A10" opacity={0.28}>{text}</text>
    <text x={x} y={y} fill={color}>{text}</text>
  </g>
);

export const Scissors: React.FC<{open?: number}> = ({open = 0.3}) => {
  const a = 6 + open * 16;
  return (
    <g>
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`rotate(${sd * a})`}>
          <path d="M -10 -7 L 250 -3 Q 262 0 250 4 L -10 8 Z" fill="#CDD2D8" stroke="#8D949C" strokeWidth={2} />
          <path d={`M -10 0 L -60 ${sd * 22}`} stroke={P.red} strokeWidth={14} strokeLinecap="round" />
          <ellipse cx={-98} cy={sd * 34} rx={42} ry={28} fill="none" stroke={P.red} strokeWidth={15} />
        </g>
      ))}
      <circle r={9} fill="#6B7178" />
    </g>
  );
};

/** Caption strip at the bottom: who is speaking + the line. */
export const Line: React.FC<{who: '问' | '答'; text: string; y?: number}> = ({who, text, y = 975}) => {
  const n = Array.from(text).length;
  const w = n * 52 + 170;
  const isQ = who === '问';
  return (
    <g fontFamily={FONT} transform={`translate(960,${y})`}>
      <rect x={-w / 2 + 5} y={-44} width={w} height={92} rx={10} fill="#3A1A10" opacity={0.2} />
      <rect x={-w / 2} y={-50} width={w} height={92} rx={10} fill="#FBF6EC" />
      <g transform={`translate(${-w / 2 + 58},-4)`}>
        <circle r={32} fill={isQ ? P.ink : P.red} />
        <text y={13} fontSize={36} fontWeight={700} textAnchor="middle" fill="#FBF6EC">{who}</text>
      </g>
      <text x={-w / 2 + 110} y={14} fontSize={50} fontWeight={700} fill={P.ink}>{text}</text>
    </g>
  );
};
