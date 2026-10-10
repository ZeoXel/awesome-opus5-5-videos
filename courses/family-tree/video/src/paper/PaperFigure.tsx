import React from 'react';

/**
 * 剪纸人物. One solid paper silhouette; faces and patterns are real holes
 * (an SVG mask), so a backlit window shows light through them.
 * Origin = between the feet, y grows downward.
 */
export type Who =
  | 'yeye' | 'nainai' | 'bobo' | 'baba' | 'shushu' | 'gugu'
  | 'waigong' | 'waipo' | 'mama' | 'jiujiu' | 'yima'
  | 'me' | 'tangge' | 'biaomei' | 'biaojie' | 'biaodi';

type Spec = {H: number; kid?: boolean; hair: string; extra?: string[]; build?: number; outfit: 'robe' | 'jacket' | 'dress'};

// Silhouette is the only way to tell people apart in paper-cut, so every
// relative gets one unmistakable outline feature.
export const SPEC: Record<Who, Spec> = {
  yeye: {H: 300, hair: 'bald', extra: ['glasses', 'cane'], outfit: 'robe'},
  nainai: {H: 288, hair: 'bun', extra: ['flower'], outfit: 'robe'},
  bobo: {H: 322, hair: 'side', extra: ['mustache'], build: 1.1, outfit: 'jacket'},
  baba: {H: 302, hair: 'short', outfit: 'jacket'},
  shushu: {H: 298, hair: 'cap', outfit: 'jacket'},
  gugu: {H: 288, hair: 'braid', outfit: 'dress'},
  waigong: {H: 298, hair: 'skullcap', extra: ['beard'], outfit: 'robe'},
  waipo: {H: 286, hair: 'curls', outfit: 'robe'},
  mama: {H: 290, hair: 'long', outfit: 'dress'},
  jiujiu: {H: 306, hair: 'short', build: 1.22, outfit: 'jacket'},
  yima: {H: 288, hair: 'topbun', extra: ['earrings'], outfit: 'dress'},
  me: {H: 210, kid: true, hair: 'hat', outfit: 'jacket'},
  tangge: {H: 246, kid: true, hair: 'short', extra: ['ball'], outfit: 'jacket'},
  biaomei: {H: 176, kid: true, hair: 'pigtails', outfit: 'dress'},
  biaojie: {H: 238, kid: true, hair: 'ponytail', outfit: 'dress'},
  biaodi: {H: 180, kid: true, hair: 'tuft', outfit: 'jacket'},
};

export const geometry = (who: Who) => {
  const sp = SPEC[who];
  // big heads, like folk paper dolls — faces stay readable when small
  const r = sp.kid ? 36 + sp.H * 0.04 : 41;
  const cy = -sp.H + r;
  const shoulderY = cy + r + 8;
  const sw = (sp.kid ? r * 1.05 : 50) * (sp.build ?? 1);
  return {sp, r, cy, shoulderY, sw, bw: sw * 1.32};
};

type Props = {
  who: Who;
  id: string;
  color: string;
  /** 'down' arms at the sides, 'out' arms held out to hold hands (paper-doll chain) */
  arms?: 'down' | 'out';
  /** half the distance to the neighbour's hand when arms are out */
  reach?: number;
  /** a wobble on the cut edges, 0..1 (line boil while being cut) */
  shadow?: boolean;
  backlit?: boolean;
};

export const PaperFigure: React.FC<Props> = ({who, id, color, arms = 'down', reach = 100, shadow = true, backlit = false}) => {
  const {sp, r, cy, shoulderY, sw, bw} = geometry(who);
  const hemY = -16;
  const jacketY = shoulderY + (hemY - shoulderY) * 0.55;
  const waistY = shoulderY + (hemY - shoulderY) * 0.38;
  const ext = sp.extra ?? [];

  // ---- the paper (white in the mask) ----
  const body = (
    <g fill="#fff">
      {/* clothes: long robe (grandparents), jacket + trousers (men, boys), 袄裙 (women, girls) */}
      {sp.outfit === 'jacket' ? (
        <>
          <path d={`M ${-sw + 14} ${shoulderY} Q ${-sw} ${shoulderY} ${-sw - 2} ${shoulderY + 16}
                    L ${-sw * 1.08} ${jacketY} L ${sw * 1.08} ${jacketY} L ${sw + 2} ${shoulderY + 16}
                    Q ${sw} ${shoulderY} ${sw - 14} ${shoulderY} Z`} />
          <rect x={-sw * 0.78} y={jacketY - 4} width={sw * 0.7} height={-jacketY - 6} rx={6} />
          <rect x={sw * 0.08} y={jacketY - 4} width={sw * 0.7} height={-jacketY - 6} rx={6} />
        </>
      ) : sp.outfit === 'dress' ? (
        <>
          <path d={`M ${-sw + 14} ${shoulderY} Q ${-sw} ${shoulderY} ${-sw - 2} ${shoulderY + 16}
                    L ${-sw * 0.8} ${waistY} L ${-bw * 1.12} ${hemY} Q 0 ${hemY + 14} ${bw * 1.12} ${hemY}
                    L ${sw * 0.8} ${waistY} L ${sw + 2} ${shoulderY + 16} Q ${sw} ${shoulderY} ${sw - 14} ${shoulderY} Z`} />
        </>
      ) : (
        <path d={`M ${-sw + 14} ${shoulderY} Q ${-sw} ${shoulderY} ${-sw - 2} ${shoulderY + 16}
                  L ${-bw} ${hemY} Q 0 ${hemY + 12} ${bw} ${hemY} L ${sw + 2} ${shoulderY + 16}
                  Q ${sw} ${shoulderY} ${sw - 14} ${shoulderY} Z`} />
      )}
      <rect x={-10} y={cy + r * 0.7} width={20} height={shoulderY - cy - r * 0.6} />
      <circle cx={0} cy={cy} r={r} />
      {/* feet */}
      <ellipse cx={-bw * 0.45} cy={-7} rx={sp.kid ? 14 : 18} ry={8} />
      <ellipse cx={bw * 0.45} cy={-7} rx={sp.kid ? 14 : 18} ry={8} />
      {sp.outfit !== 'jacket' && <rect x={-bw * 0.5} y={hemY - 2} width={bw * 0.24} height={12} />}
      {sp.outfit !== 'jacket' && <rect x={bw * 0.26} y={hemY - 2} width={bw * 0.24} height={12} />}
      {/* arms */}
      {arms === 'down' ? (
        [-1, 1].map((s) => (
          <path key={s} d={`M ${s * (sw - 6)} ${shoulderY + 6} Q ${s * (sw + 22)} ${shoulderY + 40} ${s * (sw + 14)} ${shoulderY + (sp.kid ? 70 : 100)}
                            L ${s * (sw - 2)} ${shoulderY + (sp.kid ? 66 : 96)} Q ${s * (sw + 4)} ${shoulderY + 40} ${s * (sw - 14)} ${shoulderY + 14} Z`} />
        ))
      ) : (
        [-1, 1].map((s) => (
          <g key={s}>
            <path d={`M ${s * (sw - 8)} ${shoulderY + 8} Q ${s * (sw + reach * 0.4)} ${shoulderY + 30} ${s * reach} ${shoulderY + 44}
                      L ${s * reach} ${shoulderY + 62} Q ${s * (sw + reach * 0.35)} ${shoulderY + 50} ${s * (sw - 8)} ${shoulderY + 34} Z`} />
            <circle cx={s * reach} cy={shoulderY + 53} r={12} />
          </g>
        ))
      )}
      {/* hair / headwear silhouettes */}
      {sp.hair === 'short' && <path d={`M ${-r * 1.05} ${cy} C ${-r * 1.1} ${cy - r * 1.4}, ${r * 1.1} ${cy - r * 1.4}, ${r * 1.05} ${cy} Z`} />}
      {sp.hair === 'side' && <path d={`M ${-r * 1.08} ${cy + 4} C ${-r * 1.2} ${cy - r * 1.5}, ${r * 1.3} ${cy - r * 1.55}, ${r * 1.1} ${cy - r * 0.1} Z`} />}
      {sp.hair === 'cap' && (
        <>
          <path d={`M ${-r * 1.06} ${cy - r * 0.15} C ${-r * 1.1} ${cy - r * 1.45}, ${r * 1.1} ${cy - r * 1.45}, ${r * 1.06} ${cy - r * 0.15} Z`} />
          <path d={`M ${r * 0.5} ${cy - r * 0.42} Q ${r * 1.7} ${cy - r * 0.52} ${r * 1.8} ${cy - r * 0.18} L ${r * 0.9} ${cy - r * 0.16} Z`} />
        </>
      )}
      {sp.hair === 'bald' && [-1, 1].map((s) => <ellipse key={s} cx={s * r * 0.98} cy={cy - r * 0.1} rx={r * 0.24} ry={r * 0.4} />)}
      {sp.hair === 'skullcap' && (
        <>
          <path d={`M ${-r * 1.02} ${cy - r * 0.35} C ${-r * 1.0} ${cy - r * 1.35}, ${r * 1.0} ${cy - r * 1.35}, ${r * 1.02} ${cy - r * 0.35} Z`} />
          <circle cx={0} cy={cy - r * 1.18} r={r * 0.2} />
        </>
      )}
      {sp.hair === 'bun' && (
        <>
          <path d={`M ${-r * 1.06} ${cy + r * 0.1} C ${-r * 1.15} ${cy - r * 1.4}, ${r * 1.15} ${cy - r * 1.4}, ${r * 1.06} ${cy + r * 0.1} Z`} />
          <circle cx={0} cy={cy - r * 1.15} r={r * 0.5} />
        </>
      )}
      {sp.hair === 'curls' && [-150, -120, -90, -60, -30, 0, 180].map((d, i) => {
        const a = (d * Math.PI) / 180;
        return <circle key={i} cx={Math.cos(a) * r * 0.95} cy={cy + Math.sin(a) * r * 0.95} r={r * 0.36} />;
      })}
      {sp.hair === 'braid' && (
        <>
          <path d={`M ${-r * 1.06} ${cy + r * 0.2} C ${-r * 1.15} ${cy - r * 1.4}, ${r * 1.15} ${cy - r * 1.4}, ${r * 1.06} ${cy + r * 0.2} Z`} />
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={r * (0.95 + i * 0.05)} cy={cy + r * (0.5 + i * 0.42)} rx={r * 0.24} ry={r * 0.28} />)}
        </>
      )}
      {sp.hair === 'long' && <path d={`M ${-r * 1.15} ${cy + r * 1.6} L ${-r * 1.12} ${cy} C ${-r * 1.2} ${cy - r * 1.45}, ${r * 1.2} ${cy - r * 1.45}, ${r * 1.12} ${cy} L ${r * 1.15} ${cy + r * 1.6} Z`} />}
      {sp.hair === 'topbun' && (
        <>
          <path d={`M ${-r * 1.06} ${cy + r * 0.1} C ${-r * 1.15} ${cy - r * 1.4}, ${r * 1.15} ${cy - r * 1.4}, ${r * 1.06} ${cy + r * 0.1} Z`} />
          <circle cx={0} cy={cy - r * 1.35} r={r * 0.42} />
        </>
      )}
      {sp.hair === 'hat' && (
        <>
          <path d={`M ${-r * 1.08} ${cy - r * 0.2} C ${-r * 1.1} ${cy - r * 1.5}, ${r * 1.1} ${cy - r * 1.5}, ${r * 1.08} ${cy - r * 0.2} Z`} />
          <circle cx={0} cy={cy - r * 1.38} r={r * 0.3} />
        </>
      )}
      {sp.hair === 'spiky' && (
        <path d={`M ${-r * 1.05} ${cy} L ${-r * 0.9} ${cy - r * 1.25} L ${-r * 0.45} ${cy - r * 1.05} L ${-r * 0.15} ${cy - r * 1.45}
                  L ${r * 0.2} ${cy - r * 1.1} L ${r * 0.55} ${cy - r * 1.4} L ${r * 0.8} ${cy - r * 1.0} L ${r * 1.05} ${cy} Z`} />
      )}
      {sp.hair === 'pigtails' && (
        <>
          <path d={`M ${-r * 1.06} ${cy} C ${-r * 1.15} ${cy - r * 1.4}, ${r * 1.15} ${cy - r * 1.4}, ${r * 1.06} ${cy} Z`} />
          {[-1, 1].map((s) => <ellipse key={s} cx={s * r * 1.3} cy={cy + r * 0.15} rx={r * 0.34} ry={r * 0.6} />)}
        </>
      )}
      {sp.hair === 'ponytail' && (
        <>
          <path d={`M ${-r * 1.06} ${cy} C ${-r * 1.15} ${cy - r * 1.4}, ${r * 1.15} ${cy - r * 1.4}, ${r * 1.06} ${cy} Z`} />
          <path d={`M ${r * 0.8} ${cy - r * 0.8} Q ${r * 1.9} ${cy - r * 0.5} ${r * 1.5} ${cy + r * 0.9} Q ${r * 1.25} ${cy} ${r * 0.85} ${cy - r * 0.35} Z`} />
        </>
      )}
      {sp.hair === 'tuft' && (
        <>
          <path d={`M ${-r * 1.04} ${cy} C ${-r * 1.1} ${cy - r * 1.3}, ${r * 1.1} ${cy - r * 1.3}, ${r * 1.04} ${cy} Z`} />
          <path d={`M ${-r * 0.12} ${cy - r * 1.0} Q ${-r * 0.2} ${cy - r * 1.7} ${r * 0.25} ${cy - r * 1.75} Q ${r * 0.05} ${cy - r * 1.4} ${r * 0.18} ${cy - r * 1.0} Z`} />
        </>
      )}
      {ext.includes('cane') && <rect x={-sw - 26} y={shoulderY + 90} width={8} height={-shoulderY - 90} rx={4} />}
      {ext.includes('cane') && <path d={`M ${-sw - 22} ${shoulderY + 94} q 0 -22 -20 -22`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />}
      {ext.includes('flower') && [0, 72, 144, 216, 288].map((d) => {
        const a = (d * Math.PI) / 180;
        return <circle key={d} cx={-r * 0.75 + Math.cos(a) * 9} cy={cy - r * 0.95 + Math.sin(a) * 9} r={7} />;
      })}
      {ext.includes('earrings') && [-1, 1].map((s) => <circle key={s} cx={s * r * 1.02} cy={cy + r * 0.55} r={6} />)}
      {ext.includes('ball') && <circle cx={sw + 30} cy={shoulderY + 92} r={30} />}
      {ext.includes('beard') && <path d={`M ${-r * 0.5} ${cy + r * 0.55} Q 0 ${cy + r * 2.0} ${r * 0.5} ${cy + r * 0.55} Z`} />}
    </g>
  );

  // ---- the holes (black in the mask) ----
  const holes = (
    <g>
      {/* eyes: crescents, smile, cheeks */}
      {[-1, 1].map((s) => (
        <path key={`e${s}`} d={`M ${s * r * 0.48} ${cy + r * 0.05} q ${-s * r * 0.14} ${-r * 0.2} ${-s * r * 0.28} 0 q ${s * r * 0.14} ${r * 0.08} ${s * r * 0.28} 0 Z`} fill="#000" />
      ))}
      <path d={`M ${-r * 0.3} ${cy + r * 0.42} Q 0 ${cy + r * 0.72} ${r * 0.3} ${cy + r * 0.42} Q 0 ${cy + r * 0.55} ${-r * 0.3} ${cy + r * 0.42} Z`} fill="#000" />
      {[-1, 1].map((s) => <circle key={`c${s}`} cx={s * r * 0.62} cy={cy + r * 0.32} r={r * 0.09} fill="#000" />)}
      {/* hairline: a thin cut that separates hair from face */}
      {!['bald', 'curls'].includes(sp.hair) && (
        <path d={`M ${-r * 0.92} ${cy - r * 0.18} Q 0 ${cy - r * 0.62} ${r * 0.92} ${cy - r * 0.18}`} stroke="#000" strokeWidth={3} fill="none" />
      )}
      {ext.includes('glasses') && [-1, 1].map((s) => (
        <circle key={`g${s}`} cx={s * r * 0.36} cy={cy} r={r * 0.24} fill="none" stroke="#000" strokeWidth={3.5} />
      ))}
      {ext.includes('mustache') && (
        <path d={`M 0 ${cy + r * 0.26} C ${-r * 0.2} ${cy + r * 0.16}, ${-r * 0.55} ${cy + r * 0.2}, ${-r * 0.6} ${cy + r * 0.38}
                  C ${-r * 0.35} ${cy + r * 0.32}, ${-r * 0.1} ${cy + r * 0.36}, 0 ${cy + r * 0.32}
                  C ${r * 0.1} ${cy + r * 0.36}, ${r * 0.35} ${cy + r * 0.32}, ${r * 0.6} ${cy + r * 0.38}
                  C ${r * 0.55} ${cy + r * 0.2}, ${r * 0.2} ${cy + r * 0.16}, 0 ${cy + r * 0.26} Z`} fill="#000" />
      )}
      {ext.includes('beard') && [0, 1, 2].map((i) => (
        <path key={`b${i}`} d={`M ${(i - 1) * r * 0.22} ${cy + r * 0.9} l 0 ${r * 0.55}`} stroke="#000" strokeWidth={3} />
      ))}
      {/* robe: collar, buttons, zig-zag hem — classic 剪纸 锯齿纹 */}
      <path d={`M ${-r * 0.55} ${shoulderY + 2} Q 0 ${shoulderY + 24} ${r * 0.55} ${shoulderY + 2}`} stroke="#000" strokeWidth={4} fill="none" />
      {(sp.outfit === 'jacket' ? [0.2, 0.33, 0.46] : [0.32, 0.5, 0.68]).map((k) => {
        const y = shoulderY + (hemY - shoulderY) * k;
        return <path key={k} d={`M 0 ${y - 7} L 6 ${y} L 0 ${y + 7} L -6 ${y} Z`} fill="#000" />;
      })}
      <path d={Array.from({length: 13}, (_, i) => {
        const x = -bw * 0.86 + (i * bw * 1.72) / 12;
        const y = sp.outfit === 'jacket' ? jacketY - 16 : hemY - 22;
        const xx = sp.outfit === 'jacket' ? x * 0.82 : x;
        return `${i ? 'L' : 'M'} ${xx} ${y + (i % 2 ? -9 : 0)}`;
      }).join(' ')} stroke="#000" strokeWidth={3.5} fill="none" />
      {sp.outfit === 'dress' && <path d={`M ${-sw * 0.8} ${waistY} Q 0 ${waistY + 12} ${sw * 0.8} ${waistY}`} stroke="#000" strokeWidth={4} fill="none" />}
      {sp.outfit === 'dress' && [-0.5, 0, 0.5].map((k) => (
        <path key={`f${k}`} transform={`translate(${k * bw},${(waistY + hemY) / 2 + 6})`} d="M 0 -12 Q 10 0 0 12 Q -10 0 0 -12 Z" fill="#000" />
      ))}
      {ext.includes('ball') && (
        <g transform={`translate(${sw + 30},${shoulderY + 92})`}>
          <path d="M 0 -10 L 9.5 -3 L 6 8 L -6 8 L -9.5 -3 Z" fill="#000" />
          {[0, 72, 144, 216, 288].map((a) => <path key={a} transform={`rotate(${a})`} d="M 0 -14 L 0 -24" stroke="#000" strokeWidth={3} />)}
        </g>
      )}
      {/* a crescent moon pattern on each sleeve */}
      {sp.kid ? null : [-1, 1].map((s) => (
        <circle key={`m${s}`} cx={s * sw * 0.55} cy={shoulderY + 50} r={7} fill="#000" />
      ))}
    </g>
  );

  const mid = `pm-${id}`;
  return (
    <g>
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-400} y={-600} width={800} height={700}>
          {body}
          {holes}
        </mask>
      </defs>
      {shadow && !backlit && (
        <g transform="translate(7,9)" filter="url(#paperShadow)">
          <rect x={-400} y={-600} width={800} height={700} fill="#3A1A10" opacity={0.32} mask={`url(#${mid})`} />
        </g>
      )}
      <rect x={-400} y={-600} width={800} height={700} fill={backlit ? '#7E1414' : color} mask={`url(#${mid})`} />
      {!backlit && <rect x={-400} y={-600} width={800} height={700} fill="url(#paperGrain)" opacity={0.18} mask={`url(#${mid})`} />}
    </g>
  );
};
