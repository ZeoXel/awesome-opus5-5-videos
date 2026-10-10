import React from 'react';
import {Figure} from '../Person';
import {PEOPLE} from '../family';
import {C, FONT, toneColor} from '../theme';
import {clamp01, easeIn, easeInOut, easeOut, easeOutBack, lerp, pop, prog, rand, win} from '../anim';
import {Episode} from './types';
import {actorState, headTop} from './actors';
import {Ball, CoatShape, JerseyShape} from './props';
import {Rich} from './ui';

const ORANGE = '#EE8A2E', TEAL = '#3FA3A6';
type F = Episode['fx'][number];

const actorPos = (ep: Episode, id: string, t: number) => {
  const a = ep.actors.find((x) => x.id === id);
  if (!a) return null;
  const st = actorState(ep, a, t);
  const H = PEOPLE[a.who].look.H;
  return {x: st.x + st.xoff, y: st.y + st.yoff, s: st.s, H, kid: !!PEOPLE[a.who].look.kid, st};
};

const Star: React.FC<{r: number; fill: string}> = ({r, fill}) => (
  <path transform={`scale(${r / 12})`} d="M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z" fill={fill} />
);

/** Effects drawn behind the characters. */
export const BACK = new Set(['firecrackers', 'rankArrow', 'banner', 'tripod', 'car', 'songMarks', 'glow']);

export const Fx: React.FC<{ep: Episode; f: F; t: number}> = ({ep, f, t}) => {
  if (t < f.t0 - 0.01 || t > f.t1 + 0.6) return null;
  const a = win(t, f.t0, f.t1, 0.3);
  const k = prog(t, f.t0, f.t1 - f.t0);
  switch (f.kind) {
    case 'firecrackers': {
      const n = 16;
      return (
        <g transform={`translate(${f.x},0)`}>
          <line x1={0} y1={0} x2={0} y2={60 + n * 34} stroke="#7A3A1E" strokeWidth={3} />
          {Array.from({length: n}).map((_, i) => {
            const burst = f.t0 + (n - 1 - i) * 0.2;
            const gone = t > burst;
            const y = 60 + i * 34;
            return gone ? (
              t < burst + 0.35 ? (
                <g key={i} transform={`translate(0,${y})`} opacity={1 - prog(t, burst, 0.35)}>
                  {Array.from({length: 8}).map((_, j) => {
                    const ang = (j / 8) * Math.PI * 2;
                    const r = 20 + 60 * prog(t, burst, 0.35);
                    return <line key={j} x1={Math.cos(ang) * r * 0.4} y1={Math.sin(ang) * r * 0.4} x2={Math.cos(ang) * r} y2={Math.sin(ang) * r} stroke={j % 2 ? '#F6C445' : '#E8574F'} strokeWidth={5} strokeLinecap="round" />;
                  })}
                  <text x={34} y={10} fontSize={34} fontFamily={FONT} fontWeight={700} fill="#E8574F">啪</text>
                </g>
              ) : null
            ) : (
              <rect key={i} x={i % 2 ? 2 : -24} y={y - 12} width={22} height={34} rx={4} fill="#D63A2F" stroke="#F6C445" strokeWidth={2} />
            );
          })}
        </g>
      );
    }
    case 'albumIntro': {
      const open = easeOutBack(prog(t, f.t0, 0.6));
      const fly = easeInOut(prog(t, f.t1 - 0.6, 0.6));
      const x = lerp(f.x, 200, fly), y = lerp(f.y, 100, fly), s = lerp(1, 0.25, fly);
      return (
        <g transform={`translate(${x},${y}) scale(${s * open})`} opacity={1 - prog(t, f.t1 - 0.1, 0.2)} fontFamily={FONT}>
          <rect x={-430} y={-280} width={860} height={560} rx={24} fill="#B5543F" />
          <rect x={-410} y={-250} width={400} height={510} rx={10} fill="#FFFCF6" />
          <rect x={10} y={-250} width={400} height={510} rx={10} fill="#FFFCF6" />
          <text y={-252} dy={-8} fontSize={34} fontWeight={700} textAnchor="middle" fill="#FFF3DC">全家福相册</text>
          {[-1, 1].map((side) => Array.from({length: 9}).map((_, i) => (
            <rect key={`${side}${i}`} x={side * 210 - 150 + (i % 3) * 105} y={-200 + Math.floor(i / 3) * 150} width={84} height={64} rx={6}
              fill="none" stroke={C.line} strokeWidth={3} strokeDasharray="8 7" />
          )))}
        </g>
      );
    }
    case 'banner': {
      const blink = f.blink ? 0.75 + 0.25 * Math.sign(Math.sin(t * 12)) : 1;
      const drop = easeOutBack(prog(t, f.t0, 0.5));
      return (
        <g opacity={a * blink} transform={`translate(960,${-80 + drop * 175})`} fontFamily={FONT}>
          <path d="M -380 -60 L 380 -60 L 340 0 L 380 60 L -380 60 L -340 0 Z" fill={ORANGE} stroke="#B9651A" strokeWidth={4} />
          <text y={24} fontSize={68} fontWeight={700} textAnchor="middle" fill="#fff" letterSpacing={10}>{f.text}</text>
          <g transform="translate(-300,0) scale(0.55)"><Ball r={40} spin={t * 120} /></g>
          <g transform="translate(300,0) scale(0.55)"><Ball r={40} spin={-t * 120} /></g>
        </g>
      );
    }
    case 'rankArrow': {
      // 伯伯 and 叔叔 are introduced relative to 爸爸 in the middle
      const xs: number[] = f.xs;
      const tags: [number, string, boolean, number][] = [[xs[0], '比爸爸大', true, f.t0 + 3.0], [xs[2], '比爸爸小', false, f.t0 + 4.2]];
      const dad = win(t, f.t0 + 0.3, f.t0 + 2.8, 0.25);
      return (
        <g opacity={a} fontFamily={FONT}>
          {dad > 0 && (
            <g opacity={dad}>
              <path d={`M ${xs[1]} 250 L ${xs[1]} 330 M ${xs[1] - 20} 306 L ${xs[1]} 330 L ${xs[1] + 20} 306`} stroke="#D64541" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round"
                transform={`translate(0,${Math.sin(t * 8) * 8})`} />
            </g>
          )}
          {tags.map(([x, text, up, t0]) => {
            const sc = pop(t, t0, 1.3);
            if (sc <= 0) return null;
            return (
              <g key={text} transform={`translate(${x},290) scale(${sc})`}>
                <rect x={-120} y={-34} width={240} height={68} rx={34} fill={up ? '#FCE6CF' : '#DDEFF1'} />
                <text y={14} fontSize={40} fontWeight={700} textAnchor="middle" fill={up ? '#A85B17' : '#1E6F7A'}>{up ? '▲ ' : '▼ '}{text}</text>
              </g>
            );
          })}
        </g>
      );
    }
    case 'nameplate': {
      const p = headTop(ep, f.at, t);
      if (!p) return null;
      const known = f.reveal == null || t >= f.reveal + 0.25;
      const flip = f.reveal != null ? Math.abs(Math.cos(Math.PI * prog(t, f.reveal, 0.5))) : 1;
      const sc = pop(t, f.t0, 1.2);
      const isDad = f.name === '爸爸';
      return (
        <g opacity={a} transform={`translate(${p.x},${p.y - 44}) scale(${sc * flip},${sc})`} fontFamily={FONT}>
          <rect x={-104} y={-34} width={208} height={68} rx={34} fill={isDad ? '#D64541' : '#FFFCF6'} stroke={isDad ? '#B5332B' : ORANGE} strokeWidth={4} />
          <circle cx={-68} cy={0} r={25} fill={ORANGE} stroke="#fff" strokeWidth={3} />
          <text x={-68} y={11} fontSize={32} fontWeight={700} textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif">{f.num}</text>
          <text x={18} y={15} fontSize={42} fontWeight={700} textAnchor="middle" fill={isDad ? '#fff' : known ? C.ink : C.sub}>{known ? f.name : '？'}</text>
        </g>
      );
    }
    case 'spot': {
      const k2 = win(t, f.t0, f.t1, 0.35);
      return (
        <g opacity={k2}>
          <defs>
            <radialGradient id={`spot${f.t0}`} cx={f.x / 1920} cy={0.62} r={0.2}>
              <stop offset="0.7" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.42} />
            </radialGradient>
          </defs>
          <rect width={1920} height={1080} fill={`url(#spot${f.t0})`} />
        </g>
      );
    }
    case 'puff': {
      const p = actorPos(ep, f.at, t);
      if (!p || t > f.t1) return null;
      const kk = prog(t, f.t0, f.t1 - f.t0);
      return (
        <g transform={`translate(${p.x},${p.y - p.H * p.s * 0.55})`} opacity={1 - easeIn(kk)}>
          {Array.from({length: 9}).map((_, i) => {
            const ang = (i / 9) * Math.PI * 2;
            const r = 40 + 130 * easeOut(kk);
            return <circle key={i} cx={Math.cos(ang) * r * 0.8} cy={Math.sin(ang) * r} r={90 * (1 - kk * 0.5)} fill="#F2EEE8" />;
          })}
          <circle r={140 * (1 - kk * 0.4)} fill="#FFFFFF" />
        </g>
      );
    }
    case 'flash':
      return <rect width={1920} height={1080} fill="#FFFFFF" opacity={1 - prog(t, f.t0, f.t1 - f.t0)} />;
    case 'ball': {
      if (t > f.t1 + 0.6) return null;
      const kk = easeOut(prog(t, f.t0, f.t1 - f.t0));
      const x = lerp(f.x0, f.x1, kk);
      const bounce = Math.abs(Math.sin(kk * Math.PI * 3)) * 80 * (1 - kk);
      return <g transform={`translate(${x},${905 - bounce})`} opacity={1 - prog(t, f.t1 + 0.2, 0.4)}><Ball r={30} spin={-kk * 900} /></g>;
    }
    case 'glow': {
      const p = actorPos(ep, f.at, t);
      if (!p) return null;
      return (
        <g opacity={a} transform={`translate(${p.x},${p.y - p.H * p.s * 0.5})`}>
          <ellipse rx={p.H * p.s * 0.42} ry={p.H * p.s * 0.62} fill={f.color} opacity={0.18 + 0.08 * Math.sin(t * 5)} />
          {Array.from({length: 8}).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2 + t * 0.9;
            return <g key={i} transform={`translate(${Math.cos(ang) * p.H * p.s * 0.45},${Math.sin(ang) * p.H * p.s * 0.6})`}><Star r={14} fill={f.color} /></g>;
          })}
        </g>
      );
    }
    case 'bigJersey': {
      const p = actorPos(ep, f.at, t);
      if (!p || t > f.t1) return null;
      const fall = easeIn(prog(t, f.t0, 0.5));
      const away = easeIn(prog(t, f.t1 - 0.6, 0.6));
      const wig = t < f.t1 - 0.6 ? Math.sin(t * 18) * 6 * (t > f.t0 + 0.5 ? 1 : 0) : 0;
      const y = lerp(-300, p.y - p.H * p.s * 0.48, fall) - away * 1100;
      return (
        <g transform={`translate(${p.x + wig},${y}) rotate(${wig * 0.8 + away * 40})`}>
          <JerseyShape color={f.color} size={2.6 * p.s / 1.55} num="?" />
          {t > f.t0 + 0.5 && t < f.t1 - 0.5 && (
            <g transform={`translate(0,${-150 * p.s / 1.55})`}>
              <ellipse cx={-12} cy={-20} rx={9} ry={26} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} transform={`rotate(${Math.sin(t * 9) * 15})`} />
              <ellipse cx={14} cy={-20} rx={9} ry={26} fill="#FFFFFF" stroke="#E5D9D2" strokeWidth={2} transform={`rotate(${12 + Math.sin(t * 7) * 15})`} />
            </g>
          )}
        </g>
      );
    }
    case 'car': {
      const bob = Math.sin(t * 18) * 3;
      const heads: [string, number][] = [['baba', -170], ['mama', -10], ['me', 150]];
      return (
        <g transform={`translate(${f.x},${f.y + bob})`}>
          <path d="M -360 40 L -330 -60 Q -300 -120 -220 -130 L -120 -230 Q -100 -250 -60 -250 L 200 -250 Q 240 -250 260 -220 L 330 -130 Q 380 -120 390 -60 L 400 40 Z" fill="#E8574F" />
          {heads.map(([who, x]) => {
            const look = PEOPLE[who].look;
            return (
              <g key={who}>
                <clipPath id={`car-${who}`}><rect x={x - 70} y={-235} width={140} height={110} rx={14} /></clipPath>
                <rect x={x - 70} y={-235} width={140} height={110} rx={14} fill="#CFE6EE" />
                <g clipPath={`url(#car-${who})`}>
                  <g transform={`translate(${x},${(look.kid ? -20 : 70) + bob}) scale(${look.kid ? 0.75 : 0.85})`}>
                    <Figure look={look} t={t} seed={x} hat={who === 'me' ? '#D64541' : undefined} talk={who === 'me' && t > 23.6 && t < 28.2} />
                  </g>
                </g>
              </g>
            );
          })}
          <rect x={-360} y={-20} width={760} height={18} fill="#C8372D" />
          {[-220, 250].map((x) => (
            <g key={x} transform={`translate(${x},50) rotate(${t * 600})`}>
              <circle r={62} fill="#3C3F46" />
              <circle r={28} fill="#C9CDD3" />
              <rect x={-4} y={-28} width={8} height={56} fill="#9AA3AE" />
            </g>
          ))}
          {Array.from({length: 3}).map((_, i) => {
            const kk = ((t * 1.4 + i / 3) % 1);
            return <circle key={i} cx={-380 - kk * 160} cy={20 - kk * 40} r={16 + kk * 26} fill="#E5E2DC" opacity={1 - kk} />;
          })}
        </g>
      );
    }
    case 'outChar': {
      const jump = easeOutBack(prog(t, f.t0, 1.0));
      const x = lerp(f.x, 1460, easeInOut(prog(t, f.t0, 1.0)));
      const y = lerp(f.y, 330, easeInOut(prog(t, f.t0, 1.0))) - Math.sin(Math.PI * prog(t, f.t0, 1.0)) * 200;
      return (
        <g opacity={a} transform={`translate(${x},${y}) scale(${0.3 + 0.7 * jump}) rotate(${Math.sin(t * 3) * 6})`} fontFamily={FONT}>
          <circle r={150} fill="#FFFCF6" stroke="#C0607A" strokeWidth={10} />
          <text y={70} fontSize={200} fontWeight={700} textAnchor="middle" fill="#C0607A">外</text>
          <text y={-170} fontSize={56} textAnchor="middle" fill="#C0607A">wài</text>
          <g opacity={prog(t, f.t0 + 2.2, 0.5)} textAnchor="middle">
            <rect x={-260} y={175} width={520} height={110} rx={55} fill="#FFFCF6" stroke="#E2CFB4" strokeWidth={4} />
            <text x={-120} y={252} fontSize={70} fontWeight={700} fill={C.ink}><tspan fill="#C0607A">外</tspan>公</text>
            <text x={120} y={252} fontSize={70} fontWeight={700} fill={C.ink}><tspan fill="#C0607A">外</tspan>婆</text>
          </g>
        </g>
      );
    }
    case 'chessTable':
      return (
        <g transform={`translate(${f.x},930)`}>
          <rect x={-200} y={-220} width={400} height={30} rx={8} fill="#A0703A" />
          <rect x={-170} y={-190} width={22} height={190} fill="#8A5A36" />
          <rect x={148} y={-190} width={22} height={190} fill="#8A5A36" />
          <rect x={-150} y={-236} width={300} height={18} fill="#F2D9A8" />
          {Array.from({length: 7}).map((_, i) => (
            <g key={i} transform={`translate(${-120 + i * 40},${-246 - (i === 3 && t < f.t0 + 1.2 ? Math.max(0, 40 - (t - f.t0) * 120) : 0)})`}>
              <ellipse rx={16} ry={8} fill={i % 2 ? '#E8574F' : '#3C3F46'} />
              <ellipse cy={-4} rx={16} ry={8} fill="#F6E3C8" stroke={i % 2 ? '#E8574F' : '#3C3F46'} strokeWidth={2} />
            </g>
          ))}
        </g>
      );
    case 'notes': {
      const p = actorPos(ep, f.at, t);
      if (!p) return null;
      return (
        <g opacity={a} fontFamily={FONT}>
          {Array.from({length: 4}).map((_, i) => {
            const kk = ((t * 0.5 + i / 4) % 1);
            return <text key={i} x={p.x + 90 + Math.sin(kk * 8 + i) * 30} y={p.y - p.H * p.s - 20 - kk * 160} fontSize={56} fill={['#C0607A', '#3FA3A6', '#EE8A2E', '#78A86A'][i]} opacity={1 - kk}>{i % 2 ? '♪' : '♫'}</text>;
          })}
        </g>
      );
    }
    case 'dizzy': {
      const p = headTop(ep, f.at, t);
      if (!p) return null;
      return (
        <g opacity={a}>
          {Array.from({length: 4}).map((_, i) => {
            const ang = t * 5 + (i * Math.PI) / 2;
            return <g key={i} transform={`translate(${p.x + Math.cos(ang) * 70},${p.y + 10 + Math.sin(ang) * 20})`}><Star r={16} fill="#F2B632" /></g>;
          })}
        </g>
      );
    }
    case 'flyJersey': {
      const s = actorPos(ep, f.from_, f.t0), d = actorPos(ep, f.to, f.t1);
      if (!s || !d || t > f.t1) return null;
      const kk = easeInOut(prog(t, f.t0, f.t1 - f.t0));
      return (
        <g transform={`translate(${lerp(s.x, d.x, kk)},${lerp(s.y - 330, d.y - 330, kk) - Math.sin(Math.PI * kk) * 200}) rotate(${kk * 540})`}>
          <JerseyShape color={f.color} num="3" />
        </g>
      );
    }
    case 'candies': {
      const cols = ['#E8574F', '#F2C94C', '#3FA3A6', '#EE8A2E', '#C0607A'];
      return (
        <g opacity={a}>
          {Array.from({length: 14}).map((_, i) => {
            const kk = easeOut(prog(t, f.t0 + i * 0.03, 0.7));
            const x = f.x + (rand(i) - 0.5) * 520 * kk;
            const y = 700 + kk * kk * 210 - Math.sin(Math.PI * kk) * 160;
            return (
              <g key={i} transform={`translate(${x},${y}) rotate(${i * 50 + kk * 300})`}>
                <path d="M -24 -8 L -14 0 L -24 8 Z M 24 -8 L 14 0 L 24 8 Z" fill={cols[i % 5]} />
                <ellipse rx={15} ry={10} fill={cols[i % 5]} />
              </g>
            );
          })}
        </g>
      );
    }
    case 'jerseyRule': {
      const cross = easeOut(prog(t, f.cross, 0.4));
      const lit = pop(t, f.lit, 1.2);
      return (
        <g opacity={a} transform={`translate(${f.x},${f.y})`} fontFamily={FONT}>
          <g transform={`translate(-230,0) scale(${pop(t, f.t0, 1.2) * 1.3})`} opacity={1 - cross * 0.55}>
            <JerseyShape color={cross > 0.5 ? '#B8B2AA' : ORANGE} />
          </g>
          {cross > 0 && (
            <g stroke={C.wrong} strokeWidth={16} strokeLinecap="round">
              <line x1={-320} y1={-90} x2={-320 + 180 * cross} y2={-90 + 180 * cross} />
              <line x1={-140} y1={-90} x2={-140 - 180 * cross} y2={-90 + 180 * cross} />
            </g>
          )}
          {lit > 0 && (
            <g transform={`translate(230,0) scale(${lit * 1.3})`}>
              <CoatShape color={TEAL} />
              <text y={130} fontSize={64} fontWeight={700} textAnchor="middle" fill={C.biao}>表</text>
            </g>
          )}
        </g>
      );
    }
    case 'cheeks': {
      const p = headTop(ep, f.at, t);
      if (!p || t > f.t1) return null;
      const a2 = ep.actors.find((x) => x.id === f.at)!;
      const r = (29 + PEOPLE[a2.who].look.H * 0.04) * p.s;
      const cy = p.y + 6 * p.s + r * 1.35;
      return (
        <g>
          {[-1, 1].map((sd) => <ellipse key={sd} cx={p.x + sd * r * 0.6} cy={cy} rx={r * 0.36} ry={r * 0.3} fill="#F9C9AE" stroke="#E39A7A" strokeWidth={3} />)}
        </g>
      );
    }
    case 'candyDrop': {
      const p = headTop(ep, f.at, f.t0);
      if (!p) return null;
      const kk = easeIn(prog(t, f.t0, f.t1 - f.t0));
      return (
        <g transform={`translate(${p.x + 30 + kk * 60},${p.y + 100 + kk * 500}) rotate(${kk * 400})`} opacity={1 - prog(t, f.t1 - 0.2, 0.3)}>
          <path d="M -24 -8 L -14 0 L -24 8 Z M 24 -8 L 14 0 L 24 8 Z" fill="#E8574F" />
          <ellipse rx={15} ry={10} fill="#E8574F" />
        </g>
      );
    }
    case 'heightMark': {
      const pa = actorPos(ep, f.a, t), pb = actorPos(ep, f.b, t);
      if (!pa || !pb) return null;
      const la = pa.y - (pa.H + pa.st.fig.tiptoe * 16) * pa.s;
      const lb = pb.y - (pb.H + pb.st.fig.tiptoe * 16) * pb.s;
      const kl = easeOut(prog(t, f.t0, 0.7));
      const lab = pop(t, f.label, 1.3);
      const up = f.bigger;
      return (
        <g opacity={a} fontFamily={FONT}>
          <line x1={520} x2={520 + 880 * kl} y1={la - 10} y2={la - 10} stroke={C.tang} strokeWidth={5} strokeDasharray="16 10" />
          <g transform={`translate(${pb.x + 170},${(la + lb) / 2})`}>
            <line x1={0} x2={0} y1={la - lb} y2={0} stroke={lb < la ? C.tang : C.biao} strokeWidth={0} />
          </g>
          {lab > 0 && (
            <g>
              <g transform={`translate(${pb.x + 150},${lb - 10})`} opacity={clamp01(lab)}>
                <path d={up ? 'M 0 50 L 0 -10 M -16 8 L 0 -10 L 16 8' : 'M 0 -60 L 0 0 M -16 -18 L 0 0 L 16 -18'} stroke={up ? C.tang : C.biao} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g transform={`translate(960,200) scale(${lab})`}>
                <rect x={-190} y={-52} width={380} height={104} rx={52} fill={up ? '#FCE6CF' : '#DDEFF1'} />
                <text y={22} fontSize={62} fontWeight={700} textAnchor="middle" fill={up ? '#A85B17' : '#1E6F7A'}>{up ? '▲ 比我大' : '▼ 比我小'}</text>
              </g>
            </g>
          )}
        </g>
      );
    }
    case 'tripod':
      return (
        <g transform={`translate(${f.x},930)`}>
          <line x1={0} y1={-330} x2={-80} y2={0} stroke="#3C3F46" strokeWidth={8} />
          <line x1={0} y1={-330} x2={80} y2={0} stroke="#3C3F46" strokeWidth={8} />
          <line x1={0} y1={-330} x2={0} y2={0} stroke="#3C3F46" strokeWidth={8} />
          <rect x={-90} y={-430} width={180} height={110} rx={16} fill="#3C3F46" />
          <circle cx={30} cy={-375} r={40} fill="#5D6470" stroke="#9AA3AE" strokeWidth={6} />
          <circle cx={-56} cy={-410} r={10} fill={t % 1 < 0.5 ? '#E8574F' : '#7A2A22'} />
        </g>
      );
    case 'digits': {
      const n = 3 - Math.floor((t - f.t0));
      if (t > f.t1) return null;
      const frac = (t - f.t0) % 1;
      return (
        <g transform={`translate(${f.x},${360}) scale(${1 + 0.3 * (1 - frac)})`} fontFamily={FONT}>
          <circle r={70} fill="#FFFCF6" stroke="#E8574F" strokeWidth={8} />
          <text y={36} fontSize={100} fontWeight={700} textAnchor="middle" fill="#E8574F">{Math.max(1, n)}</text>
        </g>
      );
    }
    case 'sneeze': {
      const p = headTop(ep, f.at, f.t0);
      if (!p) return null;
      const kk = easeOut(prog(t, f.t0, f.t1 - f.t0));
      return (
        <g opacity={1 - kk}>
          {Array.from({length: 12}).map((_, i) => {
            const ang = -Math.PI / 2 + (rand(i) - 0.5) * 2.4;
            const r = 40 + 600 * kk * (0.5 + rand(i + 5));
            return <circle key={i} cx={p.x + Math.cos(ang) * r} cy={p.y + 60 + Math.sin(ang) * r * 0.6} r={10 + 8 * rand(i + 2)} fill={['#E8574F', '#F2C94C', '#3FA3A6', '#BFE3F2'][i % 4]} />;
          })}
        </g>
      );
    }
    case 'stamp': {
      const sc = 2.4 - 1.4 * easeOut(prog(t, f.t0, 0.25));
      return (
        <g opacity={a} transform={`translate(960,470) rotate(-12) scale(${sc})`} fontFamily={FONT}>
          <rect x={-300} y={-110} width={600} height={220} rx={24} fill="none" stroke="#D63A2F" strokeWidth={14} />
          <text y={52} fontSize={150} fontWeight={700} textAnchor="middle" fill="#D63A2F">{f.text}</text>
        </g>
      );
    }
    case 'songMarks': {
      const bars: number[] = f.bars;
      const cur = bars.filter((b) => t >= b).length - 1;
      return (
        <g opacity={a}>
          {Array.from({length: 10}).map((_, i) => {
            const kk = ((t * 0.35 + i / 10) % 1);
            return <text key={i} x={260 + i * 150} y={720 - kk * 520} fontSize={50} fill={['#E8574F', '#3FA3A6', '#EE8A2E', '#78A86A', '#C0607A'][i % 5]} opacity={0.6 * (1 - kk)}>{i % 2 ? '♪' : '♫'}</text>;
          })}
          {cur >= 0 && <text x={1720} y={150} fontSize={40} fontFamily={FONT} fill={C.sub} textAnchor="middle">{cur < 8 ? '第一段' : '第二段'}</text>}
        </g>
      );
    }
    case 'lyrics': {
      const song = ep.song!;
      const bi = song.bars.filter((b) => t >= b.t - 0.15).length - 1;
      const pair = Math.max(0, bi - (bi % 2));
      const shown = song.bars.slice(pair, pair + 2);
      return (
        <g opacity={a} fontFamily={FONT}>
          <rect x={160} y={800} width={1600} height={150} rx={40} fill="#FFFCF6" stroke="#E2CFB4" strokeWidth={4} opacity={0.96} />
          <text x={960} y={205} fontSize={36} textAnchor="middle" fill={C.sub}>家人歌 ·《两只老虎》调</text>
          {bi < 0 ? (
            <text x={960} y={898} fontSize={70} fontWeight={700} textAnchor="middle" fill={C.tang}>一起唱！</text>
          ) : (
            <text x={960} y={902} fontSize={78} fontWeight={700} textAnchor="middle">
              {shown.map((b, j) => {
                const chars: {ch: string; tone: string}[] = [];
                let tone = 'ink';
                for (const ch of Array.from(b.text)) {
                  if (ch === '「') { tone = 'tang'; continue; }
                  if (ch === '『') { tone = 'biao'; continue; }
                  if (ch === '」' || ch === '』') { tone = 'ink'; continue; }
                  chars.push({ch, tone});
                }
                return (
                  <tspan key={j}>
                    {j === 1 ? '　' : ''}
                    {chars.map((c, i) => {
                      const nt = b.notes[Math.min(i, b.notes.length - 1)].t;
                      const sung = t >= nt;
                      return <tspan key={i} fill={sung ? (c.tone === 'ink' ? '#D64541' : toneColor(c.tone)) : '#C9BBA8'}>{c.ch}</tspan>;
                    })}
                  </tspan>
                );
              })}
            </text>
          )}
        </g>
      );
    }
    case 'review': {
      const cards: {ch: string; py: string; color: string; t: number}[] = f.cards;
      const pos = [[760, 300], [1160, 300], [480, 690], [800, 690], [1120, 690], [1440, 690]];
      const who: Record<string, string> = {哥: 'tangge', 姐: 'biaojie', 弟: 'biaodi', 妹: 'biaomei'};
      return (
        <g opacity={a} fontFamily={FONT} textAnchor="middle">
          {cards.map((c, i) => {
            const [x, y] = pos[i];
            const sc = pop(t, f.t0 + 0.3 + i * 0.12, 1.2);
            const hi = win(t, c.t, c.t + 1.6, 0.25);
            const col = toneColor(c.color);
            return (
              <g key={i} transform={`translate(${x},${y}) scale(${sc * (1 + 0.14 * hi)})`}>
                <rect x={-140} y={-170} width={280} height={340} rx={30} fill="#FFFCF6" stroke={hi > 0.01 ? '#F2B632' : '#E2CFB4'} strokeWidth={4 + 8 * hi} />
                <text y={-100} fontSize={48} fill={c.color === 'ink' ? C.py : col}>{c.py}</text>
                <text y={50} fontSize={160} fontWeight={700} fill={col}>{c.ch}</text>
                <g transform="translate(86,-110) scale(0.5)">
                  {c.ch === '堂' && <JerseyShape color={ORANGE} />}
                  {c.ch === '表' && <CoatShape color={TEAL} />}
                </g>
                {who[c.ch] && (
                  <g transform={`translate(96,150) scale(0.42)`}>
                    <Figure look={{...PEOPLE[who[c.ch]].look}} t={t} seed={i} wave={hi} />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }
    case 'fireworks':
      return (
        <g>
          {Array.from({length: 8}).map((_, i) => {
            const tb = f.t0 + i * 1.3;
            const kk = prog(t, tb, 1.4);
            if (kk <= 0 || kk >= 1) return null;
            const cx = 260 + rand(i) * 1400, cy = 160 + rand(i + 9) * 260;
            const col = ['#E8574F', '#F2C94C', '#3FA3A6', '#EE8A2E', '#C0607A'][i % 5];
            return (
              <g key={i} opacity={1 - kk}>
                {Array.from({length: 16}).map((_, j) => {
                  const ang = (j / 16) * Math.PI * 2;
                  const r = 30 + 170 * easeOut(kk);
                  return <circle key={j} cx={cx + Math.cos(ang) * r} cy={cy + Math.sin(ang) * r + kk * kk * 60} r={7} fill={col} />;
                })}
              </g>
            );
          })}
        </g>
      );
    case 'title':
      return (
        <g opacity={a} fontFamily={FONT}>
          <rect x={560} y={70} width={800} height={130} rx={65} fill="#D64541" />
          <text x={960} y={160} fontSize={72} fontWeight={700} textAnchor="middle" fill="#FFF3DC">{f.text}</text>
        </g>
      );
    case 'doorShake':
      return (
        <g fontFamily={FONT} fontWeight={700} fill="#8C2C22">
          {[0, 1, 2].map((i) => {
            const tb = f.t0 + i * 0.4;
            const kk = prog(t, tb, 0.5);
            if (kk <= 0 || kk >= 1) return null;
            return <text key={i} x={880 + i * 40} y={520 - kk * 60} fontSize={60} opacity={1 - kk}>咚</text>;
          })}
        </g>
      );
    case 'chaos':
      return null;
  }
  return null;
};

export const EpisodeTitle: React.FC<{text: string; t: number}> = ({text, t}) => {
  const a = win(t, 0.2, 3.2, 0.4);
  if (a <= 0) return null;
  return (
    <g opacity={a} fontFamily={FONT} transform={`translate(960,${150 - (1 - easeOutBack(prog(t, 0.2, 0.6))) * 160})`}>
      <rect x={-420} y={-62} width={840} height={124} rx={62} fill="#D64541" />
      <text y={22} fontSize={60} fontWeight={700} textAnchor="middle" fill="#FFF3DC"><Rich text={`豆豆拜年记 · ${text.replace(/^第 \d 集　/, '')}`} /></text>
    </g>
  );
};
