import React from 'react';
import {Look} from './family';
import {C} from './theme';

type Props = {
  look: Look;
  t: number;
  seed?: number;
  /** 0..1 — right arm waves hello */
  wave?: number;
  /** 0..1 — right arm raised straight up (抢答) */
  raise?: number;
  /** head tilt in degrees */
  nod?: number;
  /** football-team jersey drawn over the shirt */
  jersey?: {color: string; num?: string};
  /** knitted festival hat colour */
  hat?: string;
  /** 0..1 — the "叫错成爷爷" gag: white hair, beard, cane, a stoop */
  old?: number;
  /** 0..1 — both arms up (lifting someone, cheering) */
  armsUp?: number;
  /** 0..1 — standing on tiptoe */
  tiptoe?: number;
  /** mouth moves while this character's speech bubble is up */
  talk?: boolean;
  /** props held in the hands, drawn in the hand's local frame */
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `rgb(${r},${g},${b})`;
};

/** Full-body storybook figure. Origin = between the feet, y grows downward. */
export const Figure: React.FC<Props> = ({look: look0, t, seed = 0, wave = 0, raise = 0, nod = 0,
  jersey, hat, old = 0, armsUp = 0, tiptoe = 0, talk = false, rightHand, leftHand}) => {
  const isOld = old > 0.5;
  const look = {
    ...look0,
    shirt: jersey ? jersey.color : look0.shirt,
    inner: jersey ? undefined : look0.inner,
    buttons: jersey ? false : look0.buttons,
    hairColor: isOld ? '#EDEAE4' : look0.hairColor,
    hair: isOld && look0.kid !== true && look0.hair !== 'grandma' ? ('grandpa' as const) : look0.hair,
  };
  const {H, kid} = look;
  const lift = tiptoe * (kid ? 16 : 20);
  const r = kid ? 29 + H * 0.04 : 33;
  const breath = Math.sin((t + seed * 0.37) * Math.PI * 2 / 3.4) * 1.4;
  const top = -H + breath * 0.4;
  const cy = top + r;
  const shoulderY = top + 2 * r + 6;
  const body = H - 2 * r - 6;
  const torso = body * (kid ? 0.46 : 0.45);
  const hipY = shoulderY + torso;
  const sw = kid ? r * 0.98 : 47;
  const waist = sw * 0.84;
  const lw = kid ? 18 : 24;
  const legX = kid ? 12 : 15;
  const aw = kid ? 15 : 18;
  const armL = torso + (kid ? 6 : 12);
  const dark = shade(look.shirt, 0.82);
  const hairDark = shade(look.hairColor, 0.8);

  const blinkPhase = (t + seed * 0.71) % 3.9;
  const blink = blinkPhase < 0.12 ? 0.12 : 1;

  // right arm angle (screen-left is the figure's right hand)
  const baseA = 9;
  const waveA = 140 + Math.sin(t * Math.PI * 2 * 2.2) * 22;
  const raiseA = 166;
  let rightA = baseA + (waveA - baseA) * wave + (raiseA - baseA) * raise * (1 - wave);
  rightA += (160 - rightA) * armsUp;
  const leftA = baseA + (160 - baseA) * armsUp;

  const arm = (side: -1 | 1, angle: number) => (
    <g transform={`translate(${side * (sw - 7)},${shoulderY + 9}) rotate(${-side * angle})`}>
      <rect x={-aw / 2} y={-6} width={aw} height={armL} rx={aw / 2} fill={dark} />
      <circle cx={0} cy={armL - 4} r={aw * 0.55} fill={C.skin} />
      {(side === -1 ? rightHand : leftHand) && (
        <g transform={`translate(0,${armL - 4}) rotate(${side * angle})`}>{side === -1 ? rightHand : leftHand}</g>
      )}
    </g>
  );

  const cap = (d: number, color = look.hairColor) => (
    <path
      d={`M ${-r * 1.04} ${cy + r * 0.12}
          C ${-r * 1.12} ${cy - r * 1.45}, ${r * 1.12} ${cy - r * 1.45}, ${r * 1.04} ${cy + r * 0.12}
          L ${r * 0.9} ${cy - r * 0.12}
          Q ${r * 0.55} ${cy - d * r}, 0 ${cy - d * r * 0.92}
          Q ${-r * 0.55} ${cy - d * r}, ${-r * 0.9} ${cy - r * 0.12} Z`}
      fill={color}
    />
  );

  let backHair: React.ReactNode = null;
  let frontHair: React.ReactNode = null;
  let overHair: React.ReactNode = null;
  switch (look.hair) {
    case 'short':
      frontHair = cap(0.48);
      break;
    case 'side':
      frontHair = (
        <g>
          {cap(0.5)}
          <path d={`M ${-r * 0.2} ${cy - r * 0.95} Q ${r * 0.6} ${cy - r * 0.9} ${r * 0.95} ${cy - r * 0.2}
                    L ${r * 0.7} ${cy - r * 0.45} Q ${r * 0.2} ${cy - r * 0.62} ${-r * 0.2} ${cy - r * 0.95} Z`}
            fill={hairDark} opacity={0.5} />
        </g>
      );
      break;
    case 'boy':
      frontHair = (
        <g>
          {cap(0.42)}
          {[-0.5, -0.1, 0.3].map((k, i) => (
            <path key={i} d={`M ${r * (k - 0.2)} ${cy - r * 0.98} L ${r * (k + 0.05)} ${cy - r * 1.22} L ${r * (k + 0.25)} ${cy - r * 0.96} Z`}
              fill={look.hairColor} />
          ))}
        </g>
      );
      break;
    case 'grandpa':
      frontHair = (
        <g>
          {cap(0.78)}
          <ellipse cx={-r * 0.98} cy={cy - r * 0.05} rx={r * 0.2} ry={r * 0.32} fill={look.hairColor} />
          <ellipse cx={r * 0.98} cy={cy - r * 0.05} rx={r * 0.2} ry={r * 0.32} fill={look.hairColor} />
        </g>
      );
      break;
    case 'grandma': {
      backHair = <circle cx={0} cy={cy - r * 1.02} r={r * 0.42} fill={hairDark} />;
      const curls = [-170, -140, -110, -80, -50, -20, 10, 190].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return <circle key={i} cx={Math.cos(a) * r * 0.92} cy={cy + Math.sin(a) * r * 0.92 - 2} r={r * 0.32} fill={look.hairColor} />;
      });
      frontHair = <g>{curls}{cap(0.55)}</g>;
      break;
    }
    case 'long':
      backHair = <rect x={-r * 1.15} y={cy - r * 0.7} width={r * 2.3} height={r * 2.5} rx={r * 0.9} fill={hairDark} />;
      frontHair = (
        <g>
          {cap(0.4)}
          <path d={`M 0 ${cy - r * 0.98} Q ${-r * 0.1} ${cy - r * 0.6} ${-r * 0.05} ${cy - r * 0.4}`} stroke={hairDark} strokeWidth={2} fill="none" />
        </g>
      );
      overHair = (
        <g>
          <rect x={-r * 1.18} y={cy - r * 0.2} width={r * 0.42} height={r * 1.85} rx={r * 0.21} fill={look.hairColor} />
          <rect x={r * 0.76} y={cy - r * 0.2} width={r * 0.42} height={r * 1.85} rx={r * 0.21} fill={look.hairColor} />
        </g>
      );
      break;
    case 'bob':
      backHair = <rect x={-r * 1.2} y={cy - r * 0.9} width={r * 2.4} height={r * 1.95} rx={r * 0.7} fill={look.hairColor} />;
      frontHair = cap(0.3);
      break;
    case 'ponytail':
      backHair = (
        <g transform={`rotate(-18 ${r * 0.9} ${cy - r * 0.6})`}>
          <ellipse cx={r * 1.15} cy={cy + r * 0.1} rx={r * 0.32} ry={r * 0.85} fill={look.hairColor} />
        </g>
      );
      frontHair = (
        <g>
          {cap(0.38)}
          <circle cx={r * 0.95} cy={cy - r * 0.62} r={r * 0.14} fill="#E06C8C" />
        </g>
      );
      break;
    case 'pigtails':
      backHair = (
        <g>
          <ellipse cx={-r * 1.12} cy={cy + r * 0.05} rx={r * 0.3} ry={r * 0.52} fill={look.hairColor} />
          <ellipse cx={r * 1.12} cy={cy + r * 0.05} rx={r * 0.3} ry={r * 0.52} fill={look.hairColor} />
        </g>
      );
      frontHair = (
        <g>
          {cap(0.34)}
          <circle cx={-r * 0.98} cy={cy - r * 0.42} r={r * 0.15} fill="#E8574F" />
          <circle cx={r * 0.98} cy={cy - r * 0.42} r={r * 0.15} fill="#E8574F" />
        </g>
      );
      break;
    case 'braid':
      backHair = <rect x={-r * 1.1} y={cy - r * 0.8} width={r * 2.2} height={r * 1.4} rx={r * 0.7} fill={hairDark} />;
      frontHair = cap(0.42);
      overHair = (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={r * (0.78 - i * 0.05)} cy={cy + r * (0.55 + i * 0.36)} rx={r * 0.2} ry={r * 0.24} fill={look.hairColor} stroke={hairDark} strokeWidth={1.2} />
          ))}
        </g>
      );
      break;
  }

  const legTop = hipY - 6;
  const skirtBottom = hipY + (-8 - hipY) * 0.5;

  const stoop = isOld ? 10 : 0;
  return (
    <g transform={`translate(0,${-lift})`}>
      {isOld && <line x1={-(sw + 26)} y1={shoulderY + armL - 4} x2={-(sw + 34)} y2={lift} stroke="#8A5A32" strokeWidth={7} strokeLinecap="round" />}
      <g transform={`rotate(${stoop} 0 ${hipY})`}>
      {backHair}
      {/* legs + shoes */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * legX - lw / 2} y={legTop} width={lw} height={-8 - legTop} rx={lw * 0.4}
            fill={look.dress ? C.skin : look.pants} />
          <ellipse cx={s * (legX + 2)} cy={-5} rx={lw * 0.68} ry={7} fill="#4A3B33" />
        </g>
      ))}
      {look.dress && (
        <path d={`M ${-waist} ${hipY - torso * 0.25} L ${waist} ${hipY - torso * 0.25}
                  L ${waist * 1.45} ${skirtBottom} Q 0 ${skirtBottom + 8} ${-waist * 1.45} ${skirtBottom} Z`}
          fill={look.shirt} />
      )}
      {/* left arm (behind torso edge) */}
      {arm(1, leftA)}
      {/* torso */}
      <path
        d={`M ${-sw + 9} ${shoulderY} Q ${-sw} ${shoulderY} ${-sw} ${shoulderY + 14}
            L ${-waist} ${hipY} L ${waist} ${hipY} L ${sw} ${shoulderY + 14}
            Q ${sw} ${shoulderY} ${sw - 9} ${shoulderY} Z`}
        fill={look.shirt}
        stroke={look.shirt === '#F5F1EA' || look.shirt === '#EDE0CC' ? '#D9CBB8' : 'none'}
        strokeWidth={1.5}
      />
      {jersey && (
        <g>
          <path d={`M -14 ${shoulderY} L 0 ${shoulderY + 16} L 14 ${shoulderY}`} stroke="#fff" strokeWidth={5} fill="none" strokeLinejoin="round" />
          <rect x={-sw + 2} y={shoulderY + 12} width={6} height={torso - 16} fill="#fff" opacity={0.85} />
          <rect x={sw - 8} y={shoulderY + 12} width={6} height={torso - 16} fill="#fff" opacity={0.85} />
          {jersey.num ? (
            <text x={0} y={shoulderY + torso * 0.72} fontSize={torso * 0.55} fontWeight={700} textAnchor="middle" fill="#fff"
              fontFamily="Arial, sans-serif">{jersey.num}</text>
          ) : (
            <path transform={`translate(0,${shoulderY + torso * 0.5}) scale(${torso / 90})`} d="M0,-14 L4,-4 L14,-4 L6,3 L9,13 L0,7 L-9,13 L-6,3 L-14,-4 L-4,-4 Z" fill="#fff" />
          )}
        </g>
      )}
      {look.inner && (
        <path d={`M -11 ${shoulderY} L 11 ${shoulderY} L 5 ${hipY} L -5 ${hipY} Z`} fill={look.inner} />
      )}
      {look.buttons && [0.25, 0.5, 0.75].map((k) => (
        <circle key={k} cx={0} cy={shoulderY + torso * k} r={2.6} fill={shade(look.shirt, 0.6)} />
      ))}
      {look.overalls && (
        <g>
          <rect x={-waist * 0.75} y={shoulderY + torso * 0.42} width={waist * 1.5} height={torso * 0.6} rx={5} fill={look.overalls} />
          <rect x={-waist * 0.7} y={shoulderY + 2} width={5} height={torso * 0.45} fill={look.overalls} />
          <rect x={waist * 0.7 - 5} y={shoulderY + 2} width={5} height={torso * 0.45} fill={look.overalls} />
        </g>
      )}
      {/* right arm (waves / raises) */}
      {arm(-1, rightA)}
      {/* neck + head */}
      <g transform={`rotate(${nod} 0 ${shoulderY})`}>
        <rect x={-8} y={cy + r * 0.6} width={16} height={shoulderY - cy - r * 0.6 + 4} fill={C.skinShade} />
        <circle cx={-r * 0.98} cy={cy + 4} r={7} fill={C.skin} />
        <circle cx={r * 0.98} cy={cy + 4} r={7} fill={C.skin} />
        <circle cx={0} cy={cy} r={r} fill={C.skin} />
        {/* face */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={s * r * 0.36} cy={cy + r * 0.1} rx={r * 0.09} ry={r * 0.12 * blink} fill="#2B211C" />
            {blink === 1 && <circle cx={s * r * 0.36 + r * 0.03} cy={cy + r * 0.05} r={r * 0.035} fill="#fff" />}
            {!kid && (
              <path d={`M ${s * r * 0.22} ${cy - r * 0.16} Q ${s * r * 0.36} ${cy - r * 0.24} ${s * r * 0.5} ${cy - r * 0.15}`}
                stroke={hairDark} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            )}
            <ellipse cx={s * r * 0.56} cy={cy + r * 0.4} rx={r * 0.16} ry={r * 0.1} fill={C.blush} opacity={0.5} />
          </g>
        ))}
        {talk ? (
          <ellipse cx={0} cy={cy + r * 0.48} rx={r * 0.17} ry={r * (0.06 + 0.13 * Math.abs(Math.sin(t * 13 + seed)))} fill="#B24A40" />
        ) : kid ? (
          <path d={`M ${-r * 0.22} ${cy + r * 0.38} Q 0 ${cy + r * 0.72} ${r * 0.22} ${cy + r * 0.38} Z`} fill="#C0564A" />
        ) : (
          <path d={`M ${-r * 0.2} ${cy + r * 0.42} Q 0 ${cy + r * 0.6} ${r * 0.2} ${cy + r * 0.42}`}
            stroke="#8A4A3A" strokeWidth={2.8} fill="none" strokeLinecap="round" />
        )}
        {look.glasses && (
          <g stroke="#6B5A50" strokeWidth={2.4} fill="none">
            <circle cx={-r * 0.36} cy={cy + r * 0.1} r={r * 0.22} />
            <circle cx={r * 0.36} cy={cy + r * 0.1} r={r * 0.22} />
            <path d={`M ${-r * 0.14} ${cy + r * 0.08} L ${r * 0.14} ${cy + r * 0.08}`} />
          </g>
        )}
        {frontHair}
        {look.mustache && !isOld && (
          <path d={`M 0 ${cy + r * 0.3} C ${-r * 0.15} ${cy + r * 0.2}, ${-r * 0.5} ${cy + r * 0.22}, ${-r * 0.55} ${cy + r * 0.42}
                    C ${-r * 0.35} ${cy + r * 0.36}, ${-r * 0.12} ${cy + r * 0.42}, 0 ${cy + r * 0.36}
                    C ${r * 0.12} ${cy + r * 0.42}, ${r * 0.35} ${cy + r * 0.36}, ${r * 0.55} ${cy + r * 0.42}
                    C ${r * 0.5} ${cy + r * 0.22}, ${r * 0.15} ${cy + r * 0.2}, 0 ${cy + r * 0.3} Z`} fill={hairDark} />
        )}
        {look.cap && !isOld && (
          <g>
            <path d={`M ${-r * 1.04} ${cy - r * 0.2} C ${-r * 1.08} ${cy - r * 1.42}, ${r * 1.08} ${cy - r * 1.42}, ${r * 1.04} ${cy - r * 0.2} Z`} fill={look.cap} />
            <path d={`M ${r * 0.55} ${cy - r * 0.45} Q ${r * 1.5} ${cy - r * 0.5} ${r * 1.55} ${cy - r * 0.2} L ${r * 0.9} ${cy - r * 0.2} Z`} fill={shade(look.cap, 0.75)} />
            <circle cx={0} cy={cy - r * 1.04} r={r * 0.1} fill={shade(look.cap, 0.75)} />
          </g>
        )}
        {hat && (
          <g>
            <path d={`M ${-r * 1.05} ${cy - r * 0.25} C ${-r * 1.1} ${cy - r * 1.55}, ${r * 1.1} ${cy - r * 1.55}, ${r * 1.05} ${cy - r * 0.25} Z`} fill={hat} />
            <rect x={-r * 1.1} y={cy - r * 0.42} width={r * 2.2} height={r * 0.32} rx={r * 0.16} fill="#F6EFE6" />
            <circle cx={0} cy={cy - r * 1.32} r={r * 0.24} fill="#F6EFE6" />
          </g>
        )}
        {isOld && (
          <path d={`M ${-r * 0.75} ${cy + r * 0.3} Q 0 ${cy + r * 0.55} ${r * 0.75} ${cy + r * 0.3}
                    Q ${r * 0.55} ${cy + r * 1.6} 0 ${cy + r * 1.75} Q ${-r * 0.55} ${cy + r * 1.6} ${-r * 0.75} ${cy + r * 0.3} Z`}
            fill="#F4F2EE" stroke="#DAD6CE" strokeWidth={1.5} />
        )}
      </g>
      {overHair}
      </g>
    </g>
  );
};
