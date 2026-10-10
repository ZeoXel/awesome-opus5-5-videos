import React from 'react';

/** Things characters hold. Drawn in the hand's local frame (y down = along the arm). */
export const Prop: React.FC<{kind: string; t: number}> = ({kind, t}) => {
  switch (kind) {
    case 'rod': {
      const swing = Math.sin(t * 5) * 10;
      return (
        <g>
          <line x1={0} y1={0} x2={-70} y2={-150} stroke="#7A5230" strokeWidth={5} strokeLinecap="round" />
          <path d={`M -70 -150 Q ${-100 + swing} -60 ${-96 + swing} 10`} stroke="#9A9A9A" strokeWidth={1.5} fill="none" />
          <g transform={`translate(${-96 + swing},22) rotate(${Math.sin(t * 14) * 25})`}>
            <ellipse rx={18} ry={9} fill="#F08A4B" />
            <path d="M 16 0 L 28 -9 L 28 9 Z" fill="#F08A4B" />
            <circle cx={-9} cy={-2} r={2.4} fill="#2B211C" />
          </g>
        </g>
      );
    }
    case 'plate':
      return (
        <g transform="translate(-8,-6)">
          <ellipse cx={-30} cy={0} rx={56} ry={13} fill="#FFFFFF" stroke="#D9CFC2" strokeWidth={2} />
          {[-60, -38, -16, -50, -26].map((x, i) => (
            <path key={i} transform={`translate(${x},${i < 3 ? -8 : -18})`} d="M -12 4 Q 0 -14 12 4 Q 0 8 -12 4 Z" fill="#FBF3E4" stroke="#E2D2B8" strokeWidth={1.5} />
          ))}
          {[0, 1, 2].map((i) => {
            const k = ((t * 0.6 + i / 3) % 1);
            return (
              <path key={i} transform={`translate(${-50 + i * 22},${-30 - k * 70}) scale(${0.6 + k * 0.4})`} opacity={1 - k}
                d="M0,4 C-9,-4 -6,-12 0,-7 C6,-12 9,-4 0,4 Z" fill="#F28B9A" />
            );
          })}
        </g>
      );
    case 'camera':
      return (
        <g transform="translate(-26,-14)">
          <rect x={-30} y={-20} width={60} height={40} rx={8} fill="#3C3F46" />
          <circle cx={0} cy={0} r={13} fill="#5D6470" stroke="#9AA3AE" strokeWidth={3} />
          <rect x={14} y={-27} width={12} height={8} rx={2} fill="#3C3F46" />
        </g>
      );
    case 'ball':
      return <Ball r={26} spin={t * 200} />;
    case 'rabbit':
      return (
        <g transform="translate(18,-12)">
          <ellipse cx={-10} cy={-48} rx={7} ry={22} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} transform={`rotate(${-10 + Math.sin(t * 3) * 6} -10 -30)`} />
          <ellipse cx={10} cy={-48} rx={7} ry={22} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} transform="rotate(12 10 -30)" />
          <circle cx={0} cy={-20} r={20} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} />
          <ellipse cx={0} cy={10} rx={18} ry={20} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} />
          <circle cx={-7} cy={-22} r={2.4} fill="#2B211C" />
          <circle cx={7} cy={-22} r={2.4} fill="#2B211C" />
          <circle cx={0} cy={-15} r={2.6} fill="#F2A0B0" />
        </g>
      );
    case 'candyBag':
      return (
        <g transform="translate(-10,6)">
          <path d="M -32 0 L 32 0 L 40 70 Q 0 82 -40 70 Z" fill="#E8574F" />
          <path d="M -18 0 Q 0 -26 18 0" stroke="#B83A2E" strokeWidth={5} fill="none" />
          <text y={52} fontSize={34} textAnchor="middle" fill="#FCE6CF" fontWeight={700}>糖</text>
        </g>
      );
    case 'board':
      return (
        <g transform="translate(26,-50)">
          <rect x={-46} y={-56} width={92} height={112} rx={6} fill="#FFFFFF" stroke="#C9B79A" strokeWidth={4} />
          <circle cx={0} cy={-12} r={22} fill="none" stroke="#D64541" strokeWidth={3} />
          <circle cx={-8} cy={-16} r={2.5} fill="#2B211C" />
          <circle cx={8} cy={-16} r={2.5} fill="#2B211C" />
          <path d="M -9 -4 Q 0 4 9 -4" stroke="#2B211C" strokeWidth={2.5} fill="none" />
          <path d="M -22 -26 Q 0 -44 22 -26" stroke="#D64541" strokeWidth={8} fill="none" />
          <path d="M -18 20 L 18 20 L 22 46 L -22 46 Z" fill="#D64541" />
        </g>
      );
  }
  return null;
};

export const Ball: React.FC<{r: number; spin?: number}> = ({r, spin = 0}) => (
  <g transform={`rotate(${spin})`}>
    <circle r={r} fill="#FFFFFF" stroke="#2B2622" strokeWidth={2.5} />
    <path d={`M 0 ${-r * 0.35} L ${r * 0.33} ${-r * 0.1} L ${r * 0.2} ${r * 0.3} L ${-r * 0.2} ${r * 0.3} L ${-r * 0.33} ${-r * 0.1} Z`} fill="#2B2622" />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} transform={`rotate(${a})`} d={`M 0 ${-r * 0.35} L 0 ${-r * 0.75} M ${-r * 0.3} ${-r * 0.92} L 0 ${-r * 0.75} L ${r * 0.3} ${-r * 0.92}`}
        stroke="#2B2622" strokeWidth={2} fill="none" />
    ))}
  </g>
);

export const Skateboard: React.FC = () => (
  <g>
    <rect x={-70} y={-14} width={140} height={14} rx={7} fill="#E8574F" />
    <circle cx={-46} cy={4} r={9} fill="#3C3F46" />
    <circle cx={46} cy={4} r={9} fill="#3C3F46" />
  </g>
);

/** A small jersey shape (icons, the falling jersey gag). Centre = chest. */
export const JerseyShape: React.FC<{color: string; size?: number; num?: string}> = ({color, size = 1, num}) => (
  <g transform={`scale(${size})`}>
    <path d="M -38 -46 L -14 -54 Q 0 -42 14 -54 L 38 -46 L 62 -16 L 44 -2 L 34 -14 L 34 54 L -34 54 L -34 -14 L -44 -2 L -62 -16 Z"
      fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={2} strokeLinejoin="round" />
    <path d="M -14 -54 Q 0 -36 14 -54" stroke="#fff" strokeWidth={5} fill="none" />
    {num ? <text y={26} fontSize={44} fontWeight={700} textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif">{num}</text>
      : <path transform="translate(0,6) scale(1.3)" d="M0,-14 L4,-4 L14,-4 L6,3 L9,13 L0,7 L-9,13 L-6,3 L-14,-4 L-4,-4 Z" fill="#fff" />}
  </g>
);

export const CoatShape: React.FC<{color: string; size?: number}> = ({color, size = 1}) => (
  <g transform={`scale(${size})`}>
    <path d="M -36 -48 L -12 -54 L 0 -36 L 12 -54 L 36 -48 L 60 -10 L 44 2 L 34 -12 L 36 56 L -36 56 L -34 -12 L -44 2 L -60 -10 Z"
      fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={2} strokeLinejoin="round" />
    <line x1={0} y1={-36} x2={0} y2={56} stroke="rgba(0,0,0,0.18)" strokeWidth={3} />
    {[-14, 8, 30].map((y) => <circle key={y} cx={7} cy={y} r={4} fill="#fff" />)}
  </g>
);
