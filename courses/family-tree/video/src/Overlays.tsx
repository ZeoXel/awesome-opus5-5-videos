import React from 'react';
import {Figure} from './Person';
import {Look, PEOPLE, prefixTone} from './family';
import {C, FONT, toneColor} from './theme';
import {Slot, TL} from './timeline';
import {clamp01, easeInOut, easeOut, easeOutBack, hash, pop, prog, rand, win} from './anim';
import {Photo} from './World';

const Svg: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}} fontFamily={FONT}>
    {children}
  </svg>
);

/** Renders caption markup: 「堂」 in the 堂 colour, 『表』 in the 表 colour. */
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
const plainLen = (text: string) => text.replace(/[「」『』]/g, '').length;

const Panel: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <rect x={x} y={y} width={w} height={h} rx={28} fill={C.panel} stroke={C.panelEdge} strokeWidth={3} />
);

// ------------------------------------------------------------ word card ----
export const WordCard: React.FC<{t: number; t0: number; t1: number; slots: Slot[]; merge: number | null; cx: number; top: number}> = ({t, t0, t1, slots, merge, cx, top}) => {
  const a = win(t, t0, t1, 0.35);
  if (a <= 0) return null;
  const mk = merge != null ? easeInOut(prog(t, merge, 0.5)) : 0;
  const gap = 210 - 40 * mk;
  const slotX = (i: number) => cx + (i - 0.5) * gap;
  const pyY = top + 82, chY = top + 226, lineY = top + 250;
  return (
    <g opacity={a}>
      <Panel x={cx - 270} y={top} w={540} h={290} />
      {[0, 1].map((i) => {
        const filled = slots.some((s) => s.i === i && t >= s.t && !(s.wrong && t > s.wrong + 0.6));
        return (
          <line key={i} x1={slotX(i) - 78} x2={slotX(i) + 78} y1={lineY} y2={lineY}
            stroke={filled ? C.line : C.cardEdge} strokeWidth={3} strokeDasharray={filled ? undefined : '10 8'} />
        );
      })}
      {slots.map((s, j) => {
        if (t < s.t) return null;
        const later = slots.find((o) => o.i === s.i && o.t > s.t && t >= o.t);
        if (later && !s.wrong) return null;
        const k = easeOutBack(prog(t, s.t, 0.45));
        let dy = (1 - k) * -90, rot = 0, op = clamp01((t - s.t) / 0.15);
        let cross = 0;
        if (s.wrong && t >= s.wrong) {
          cross = easeOut(prog(t, s.wrong, 0.3));
          const f = easeOut(prog(t, s.wrong + 0.7, 0.8));
          dy += f * 320; rot = f * 35; op *= 1 - f;
          if (op <= 0) return null;
        }
        const x = slotX(s.i);
        const col = toneColor(s.color);
        return (
          <g key={j} transform={`translate(${x},${dy}) rotate(${rot} 0 ${chY - 50})`} opacity={op} textAnchor="middle">
            <text y={pyY} fontSize={44} fill={s.color === 'ink' ? C.py : col}>{s.py}</text>
            <text y={chY} fontSize={140} fontWeight={700} fill={col}>{s.ch}</text>
            {cross > 0 && (
              <g stroke={C.wrong} strokeWidth={14} strokeLinecap="round">
                <line x1={-60} y1={chY - 120} x2={-60 + 120 * cross} y2={chY - 120 + 120 * cross} />
                <line x1={60} y1={chY - 120} x2={60 - 120 * Math.min(1, cross * 1.3)} y2={chY - 120 + 120 * Math.min(1, cross * 1.3)} />
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

// ------------------------------------------------------------- compare -----
export const Compare: React.FC<{
  t: number; t0: number; t1: number; label: number; bigger: boolean;
  a: Look; b: Look; bName: string; cx: number; top: number; seed?: number;
}> = ({t, t0, t1, label, bigger, a, b, bName, cx, top, seed = 0}) => {
  const al = win(t, t0, t1, 0.35);
  if (al <= 0) return null;
  const S = 1.32;
  const floor = top + 455;
  const ax = cx - 105, bx = cx + 105;
  const rise = easeOutBack(prog(t, t0 + 0.4, 0.6));
  const headA = floor - a.H * S;
  const headB = floor - b.H * S;
  const kLine = easeOut(prog(t, label - 0.9, 0.6));
  const kLab = pop(t, label, 1.3);
  const up = bigger;
  return (
    <g opacity={al}>
      <Panel x={cx - 270} y={top} w={540} h={505} />
      {/* ruler */}
      <g>
        <rect x={cx + 222} y={top + 120} width={22} height={floor - top - 120} rx={4} fill="#F2D9A8" />
        {Array.from({length: 13}).map((_, i) => (
          <line key={i} x1={cx + 222} x2={cx + 222 + (i % 2 ? 9 : 16)} y1={floor - i * 26} y2={floor - i * 26} stroke="#B7935A" strokeWidth={2} />
        ))}
      </g>
      <line x1={cx - 250} x2={cx + 215} y1={floor} y2={floor} stroke={C.line} strokeWidth={4} />
      <g transform={`translate(${ax},${floor}) scale(${S})`}>
        <Figure look={a} t={t} seed={1} />
      </g>
      <g transform={`translate(${bx},${floor + (1 - rise) * 80}) scale(${S})`} opacity={clamp01(rise * 2)}>
        <Figure look={b} t={t} seed={seed} />
      </g>
      {kLine > 0 && (
        <line x1={cx - 250} x2={cx - 250 + 465 * kLine} y1={headA} y2={headA} stroke={C.tang} strokeWidth={3} strokeDasharray="12 8" />
      )}
      {kLab > 0 && (
        <g>
          <g transform={`translate(${bx + 82},${(headA + headB) / 2})`} opacity={clamp01(kLab)}>
            <path d={`M 0 ${(headA - headB) / 2} L 0 ${(headB - headA) / 2}`} stroke={up ? C.tang : C.biao} strokeWidth={5} />
            <path d={up ? `M -10 ${(headB - headA) / 2 + 12} L 0 ${(headB - headA) / 2} L 10 ${(headB - headA) / 2 + 12}` : `M -10 ${(headB - headA) / 2 - 12} L 0 ${(headB - headA) / 2} L 10 ${(headB - headA) / 2 - 12}`}
              stroke={up ? C.tang : C.biao} strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
          <g transform={`translate(${cx - 20},${top + 62}) scale(${kLab})`}>
            <rect x={-110} y={-34} width={220} height={68} rx={34} fill={up ? '#FCE6CF' : '#DDEFF1'} />
            <text y={14} fontSize={40} fontWeight={700} textAnchor="middle" fill={up ? '#A85B17' : '#1E6F7A'}>
              {up ? '▲ 比我大' : '▼ 比我小'}
            </text>
          </g>
        </g>
      )}
      <g textAnchor="middle" fontSize={34} fontWeight={700} fill={C.ink}>
        <text x={ax} y={floor + 40}>我</text>
        <text x={bx} y={floor + 40} fill={bName === '？' ? C.sub : C.ink}>{bName}</text>
      </g>
    </g>
  );
};

// ----------------------------------------------------------- countdown -----
export const Countdown: React.FC<{t: number; t0: number; dur: number; cx: number; cy: number}> = ({t, t0, dur, cx, cy}) => {
  if (t < t0 || t > t0 + dur + 0.3) return null;
  const k = prog(t, t0, dur);
  const n = Math.max(1, Math.ceil(dur - (t - t0)));
  const beat = (t - t0) % 1;
  const sc = 1 + 0.25 * Math.exp(-beat * 6);
  const R = 120;
  const ang = 2 * Math.PI * (1 - k);
  const ex = cx + R * Math.sin(ang), ey = cy - R * Math.cos(ang);
  const out = 1 - prog(t, t0 + dur, 0.3);
  return (
    <g opacity={out}>
      <circle cx={cx} cy={cy} r={R + 30} fill={C.panel} stroke={C.panelEdge} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#EFE4D4" strokeWidth={22} />
      {k < 1 && (
        <path d={`M ${cx} ${cy - R} A ${R} ${R} 0 ${ang > Math.PI ? 1 : 0} 1 ${ex} ${ey}`} stroke={C.tang} strokeWidth={22} fill="none" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 55} fontSize={160 * sc} fontWeight={700} textAnchor="middle" fill={C.ink}>{n}</text>
    </g>
  );
};

const StopBadge: React.FC<{t: number; t0: number; t1: number; cx: number; cy: number}> = ({t, t0, t1, cx, cy}) => {
  const a = win(t, t0, t1, 0.3);
  if (a <= 0) return null;
  const sc = pop(t, t0, 1.2) * (1 + 0.04 * Math.sin(t * 6));
  return (
    <g transform={`translate(${cx},${cy}) scale(${sc})`} opacity={a}>
      <rect x={-210} y={-62} width={420} height={124} rx={62} fill={C.tang} />
      {/* a small raised hand */}
      <g transform="translate(-140,4) scale(1.1)" fill="#fff">
        <rect x={-22} y={-6} width={44} height={36} rx={14} />
        {[-17, -6, 5, 16].map((x, i) => <rect key={i} x={x - 4.5} y={-34 + (i === 0 || i === 3 ? 6 : 0)} width={9} height={34} rx={4.5} />)}
        <rect x={16} y={4} width={20} height={9} rx={4.5} transform="rotate(-35 16 8)" />
      </g>
      <text x={30} y={22} fontSize={64} fontWeight={700} textAnchor="middle" fill="#fff">停一停！</text>
    </g>
  );
};

// ------------------------------------------------------- per-act overlays --
const RIGHT_CX = 1610;

export const ActOverlays: React.FC<{t: number}> = ({t}) => {
  const titleChars = Array.from(TL.title.text);
  // punctuation takes half a cell so the title doesn't look gappy
  const adv = titleChars.map((ch) => ('“”，'.includes(ch) ? 52 : 108));
  const total = adv.reduce((a, b) => a + b, 0);
  const titleX = adv.map((w, i) => adv.slice(0, i).reduce((a, b) => a + b, 0) + w / 2 - total / 2);
  const ta = 1 - prog(t, TL.title.t1 - 0.6, 0.6);
  return (
    <Svg>
      {/* title */}
      {t >= TL.title.t0 && ta > 0 && (
        <g opacity={ta} textAnchor="middle">
          {titleChars.map((ch, i) => {
            const t0 = TL.title.t0 + i * 0.16;
            const k = easeOutBack(prog(t, t0, 0.5));
            if (t < t0) return null;
            const x = 960 + titleX[i];
            return (
              <text key={i} x={x} y={170 - (1 - k) * 120} fontSize={104} fontWeight={700}
                fill={ch === '我' ? C.tang : C.ink} opacity={clamp01((t - t0) / 0.15)}>{ch}</text>
            );
          })}
          <text x={960} y={232} fontSize={34} fill={C.sub} opacity={prog(t, TL.title.t0 + 1.8, 0.6)}>幼小衔接 · 认识家人的称呼</text>
        </g>
      )}
      {TL.words.map((w, i) => (
        <WordCard key={i} t={t} t0={w.t0} t1={w.t1} slots={w.slots} merge={w.merge} cx={RIGHT_CX} top={100} />
      ))}
      {TL.compares.map((c, i) => {
        const n = TL.nodes[c.b];
        const known = n.reveal !== undefined && t >= n.reveal;
        return (
          <Compare key={i} t={t} t0={c.t0} t1={c.t1} label={c.label} bigger={c.bigger}
            a={PEOPLE.me.look} b={PEOPLE[c.b].look} bName={known ? PEOPLE[c.b].name : '？'}
            cx={RIGHT_CX} top={410} seed={hash(c.b)} />
        );
      })}
      {TL.pauses.map((p, i) => {
        const cd = TL.countdowns.find((c) => c.t0 >= p.t0 && c.t0 <= p.t1)!;
        return (
          <g key={i}>
            <StopBadge t={t} t0={p.t0} t1={cd.t0 + cd.dur} cx={RIGHT_CX} cy={230} />
            <Countdown t={t} t0={cd.t0} dur={cd.dur} cx={RIGHT_CX} cy={640} />
          </g>
        );
      })}
      <Chant t={t} />
    </Svg>
  );
};

// ---------------------------------------------------------------- chant ----
const chantChars = (text: string, t0: number, beat: number) => {
  // each phrase (split by ，) starts on a new half-line; one syllable per half beat
  const out: {ch: string; t: number; tone: string}[] = [];
  let tone = 'ink';
  let phrase = 0, j = 0;
  for (const ch of Array.from(text)) {
    if (ch === '「') { tone = 'tang'; continue; }
    if (ch === '『') { tone = 'biao'; continue; }
    if (ch === '」' || ch === '』') { tone = 'ink'; continue; }
    const punct = '，；。'.includes(ch);
    out.push({ch, t: t0 + (phrase * 4 + Math.max(0, j - (punct ? 1 : 0)) * 0.5) * beat, tone});
    if (punct) { phrase++; j = 0; } else j++;
  }
  return out;
};

const Chant: React.FC<{t: number}> = ({t}) => {
  const c = TL.chant;
  const a = win(t, c.t0 - 0.5, c.t1, 0.5);
  if (a <= 0) return null;
  const beat = 60 / c.bpm;
  const cur = [...c.lines].reverse().find((l) => t >= l.t - 0.05);
  const idx = cur ? c.lines.indexOf(cur) : -1;
  const sinceBeat = t < c.t0 ? 1 : ((t - c.t0) / beat) % 1;
  const clap = 1 + 0.3 * Math.exp(-sinceBeat * 7);
  const counting = t < c.lines[0].t;
  return (
    <g opacity={a}>
      <rect x={110} y={725} width={1700} height={230} rx={36} fill={C.panel} stroke={C.panelEdge} strokeWidth={3} />
      <g transform={`translate(230,840) scale(${clap})`}>
        <circle r={62} fill="#FCE6CF" />
        <g fill={C.tang}>
          <rect x={-34} y={-30} width={30} height={58} rx={14} transform="rotate(-18)" />
          <rect x={4} y={-30} width={30} height={58} rx={14} transform="rotate(18)" />
        </g>
        <text y={98} fontSize={30} textAnchor="middle" fill={C.sub}>拍拍手</text>
      </g>
      {counting && (
        <text x={1010} y={872} fontSize={80} fontWeight={700} textAnchor="middle" fill={C.tang}>
          {['一起', '拍手', '唱一', '唱！'].slice(0, Math.min(4, Math.floor((t - c.t0) / beat) + 1)).join('')}
        </text>
      )}
      {idx >= 0 && (() => {
        const chars = chantChars(c.lines[idx].text, c.lines[idx].t, beat);
        const w = 92;
        const x0 = 1010 - ((chars.length - 1) * w) / 2;
        return (
          <g textAnchor="middle">
            {chars.map((ch, i) => {
              if (t < ch.t) return null;
              const k = pop(t, ch.t, 1.5);
              return (
                <text key={i} x={x0 + i * w} y={880 - Math.max(0, (1 - k)) * 40 - Math.max(0, k - 1) * 30} fontSize={86} fontWeight={700}
                  fill={toneColor(ch.tone)} opacity={clamp01((t - ch.t) / 0.1)}>{ch.ch}</text>
              );
            })}
          </g>
        );
      })()}
      {/* dots showing which line we are on */}
      {c.lines.map((_, i) => (
        <circle key={i} cx={1010 - 45 + i * 30} cy={930} r={8} fill={i <= idx ? C.tang : C.cardEdge} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------ captions -----
export const Captions: React.FC<{t: number}> = ({t}) => {
  const cur = TL.captions.filter((c) => !c.chant && t >= c.t0 && t < c.t1);
  if (!cur.length) return null;
  const c = cur[cur.length - 1];
  const a = win(t, c.t0, c.t1, 0.18);
  const w = Math.min(1820, plainLen(c.text) * 48 + 120);
  return (
    <Svg opacity={a}>
      <rect x={960 - w / 2} y={958} width={w} height={96} rx={22} fill={C.capBg} opacity={0.96} />
      <text x={960} y={1022} fontSize={48} textAnchor="middle" fill={C.ink}>
        <Rich text={c.text} />
      </text>
    </Svg>
  );
};

// ------------------------------------------------------- quiz / stage ------
const QUIZ_X = [240, 540, 840];
const KID_X = 1150;
const ROW_Y = 290;

const MiniCard: React.FC<{id: string; look: Look; x: number; t: number; t0: number; name: string; py: string; tone?: string}> = ({id, look, x, t, t0, name, py, tone}) => {
  if (t < t0) return null;
  const sc = pop(t, t0, 1.2);
  const toneOf = tone ?? prefixTone(name);
  return (
    <g transform={`translate(${x},${ROW_Y}) scale(${sc})`} textAnchor="middle">
      <Photo id={id} look={look} t={t} />
      {py && <text y={106} fontSize={24} fill={C.py}>{py}</text>}
      <text y={150} fontSize={50} fontWeight={700} fill={name === '？' ? C.sub : C.ink}>
        {toneOf !== 'ink' && name !== '？' ? (
          <><tspan fill={toneColor(toneOf)}>{name[0]}</tspan><tspan>{name.slice(1)}</tspan></>
        ) : name}
      </text>
    </g>
  );
};

const Arrow: React.FC<{x0: number; x1: number; k: number; color: string}> = ({x0, x1, k, color}) => (
  <g>
    <line x1={x0} x2={x1} y1={ROW_Y} y2={ROW_Y} stroke={C.cardEdge} strokeWidth={8} strokeLinecap="round" />
    {k > 0 && <line x1={x0} x2={x0 + (x1 - x0) * k} y1={ROW_Y} y2={ROW_Y} stroke={color} strokeWidth={10} strokeLinecap="round" />}
    <path d={`M ${x1 - 6} ${ROW_Y - 16} L ${x1 + 10} ${ROW_Y} L ${x1 - 6} ${ROW_Y + 16}`} stroke={k >= 1 ? color : C.cardEdge} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Star: React.FC<{filled: boolean; size: number}> = ({filled, size}) => (
  <path transform={`scale(${size / 50})`} d="M0,-48 L13,-16 L47,-15 L20,6 L30,40 L0,20 L-30,40 L-20,6 L-47,-15 L-13,-16 Z"
    fill={filled ? '#F2B632' : 'none'} stroke={filled ? '#E09A1C' : C.cardEdge} strokeWidth={5} strokeLinejoin="round" />
);

const QuizScene: React.FC<{t: number}> = ({t}) => (
  <>
    {TL.quiz.map((q) => {
      const a = win(t, q.t0 - 0.2, q.t1, 0.4);
      if (a <= 0) return null;
      const col = toneColor(q.color);
      const kidLook: Look = {hair: q.kid.look, hairColor: '#3A2A20', shirt: q.kid.shirt, pants: q.kid.look === 'boy' ? '#5D6170' : q.kid.shirt, H: q.kid.H, kid: true, dress: q.kid.look !== 'boy'};
      const reveal = q.t0 + 11;
      const known = t >= reveal + 0.25;
      const flip = Math.abs(Math.cos(Math.PI * prog(t, reveal, 0.5)));
      const ans = q.answer.map((x) => x.ch).join('');
      const [who, cmp] = q.q.split('，');
      return (
        <g key={q.n} opacity={a}>
          <g transform={`translate(960,95) scale(${pop(t, q.t0, 1.2)})`}>
            <rect x={-130} y={-48} width={260} height={96} rx={48} fill={C.ink} />
            <text y={20} fontSize={56} fontWeight={700} textAnchor="middle" fill="#fff">第 {q.n} 关</text>
          </g>
          {q.chain.map((id, i) => (
            <MiniCard key={id} id={`q${q.n}-${id}`} look={PEOPLE[id].look} x={QUIZ_X[i]} t={t} t0={q.t0 + 0.8 + i * 0.6}
              name={PEOPLE[id].name} py={PEOPLE[id].py} />
          ))}
          {[0, 1, 2].map((i) => {
            const x0 = (i < 2 ? QUIZ_X[i] : QUIZ_X[2]) + 112;
            const x1 = (i < 2 ? QUIZ_X[i + 1] : KID_X) - 118;
            const k = easeInOut(prog(t, q.t0 + 3.6 + i * 0.7, 0.7));
            return t >= q.t0 + 0.8 + (i + 1) * 0.6 ? <Arrow key={i} x0={x0} x1={x1} k={k} color={col} /> : null;
          })}
          <g transform={`translate(${KID_X},0) scale(${known ? flip : 1},1) translate(${-KID_X},0)`}>
            <MiniCard id={`q${q.n}-kid`} look={kidLook} x={KID_X} t={t} t0={q.t0 + 2.6}
              name={known ? ans : '？'} py={known ? q.answer.map((x) => x.py).join(' ') : ''} tone={q.color} />
          </g>
          {/* the question, in words */}
          <g textAnchor="middle" opacity={prog(t, q.t0 + 1, 0.4)}>
            <text x={690} y={680} fontSize={84} fontWeight={700} fill={C.ink}>{who}</text>
            <g transform={`translate(690,800) scale(${pop(t, q.t0 + 1.6, 1.2)})`}>
              <rect x={-150} y={-46} width={300} height={92} rx={46} fill={q.bigger ? '#FCE6CF' : '#DDEFF1'} />
              <text y={20} fontSize={56} fontWeight={700} fill={q.bigger ? '#A85B17' : '#1E6F7A'}>{q.bigger ? '▲ ' : '▼ '}{cmp}</text>
            </g>
          </g>
          <Countdown t={t} t0={q.t0 + 6} dur={5} cx={RIGHT_CX} cy={520} />
          {t >= reveal && (
            <>
              <WordCard t={t} t0={reveal} t1={q.t1} merge={reveal + 0.5} cx={RIGHT_CX} top={140}
                slots={q.answer.map((x, i) => ({i, ch: x.ch, py: x.py, color: i === 0 ? q.color : 'ink', t: reveal + i * 0.2}))} />
              <Compare t={t} t0={reveal + 0.3} t1={q.t1} label={reveal + 1.6} bigger={q.bigger}
                a={PEOPLE.me.look} b={kidLook} bName={ans} cx={RIGHT_CX} top={444} seed={q.n * 13} />
            </>
          )}
          {/* progress stars */}
          <g transform="translate(1610,95)">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${(i - 1) * 74},0)`}>
                <Star filled={i < q.n - 1 || (i === q.n - 1 && t >= reveal + 0.5)} size={30} />
              </g>
            ))}
          </g>
        </g>
      );
    })}
  </>
);

const Celebrate: React.FC<{t: number}> = ({t}) => {
  const s = TL.stars;
  const a = win(t, s.t0, s.t1, 0.4);
  if (a <= 0) return null;
  return (
    <g opacity={a}>
      {Array.from({length: 70}).map((_, i) => {
        const k = prog(t, s.t0 + 0.3, 3);
        const ang = rand(i) * Math.PI * 2;
        const v = 300 + rand(i + 99) * 700;
        const x = 960 + Math.cos(ang) * v * k;
        const y = 470 + Math.sin(ang) * v * k * 0.7 + 600 * k * k;
        const cols = [C.tang, C.biao, '#F2C94C', '#E59AAE', '#78A86A'];
        return <rect key={i} x={x} y={y} width={16} height={10} fill={cols[i % 5]} transform={`rotate(${t * 300 + i * 40} ${x} ${y})`} opacity={1 - k} />;
      })}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${960 + (i - 1) * 230},${450 - (i === 1 ? 40 : 0)}) scale(${pop(t, s.t0 + 0.3 + i * 0.3, 1.1)})`}>
          <Star filled size={110} />
        </g>
      ))}
      <text x={960} y={720} fontSize={110} fontWeight={700} textAnchor="middle" fill={C.ink} opacity={prog(t, s.t0 + 1.2, 0.4)}>闯关成功！</text>
    </g>
  );
};

const Review: React.FC<{t: number}> = ({t}) => {
  const r = TL.review;
  const a = win(t, r.t0, r.t1, 0.4);
  if (a <= 0) return null;
  const pos = [[760, 290], [1160, 290], [480, 680], [800, 680], [1120, 680], [1440, 680]];
  return (
    <g opacity={a} textAnchor="middle">
      {r.cards.map((c, i) => {
        const [x, y] = pos[i];
        const sc = pop(t, r.t0 + 0.2 + i * 0.12, 1.2);
        const hi = win(t, c.t, c.t + 1.5, 0.25);
        const col = toneColor(c.color);
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${sc * (1 + 0.14 * hi)})`}>
            <rect x={-125} y={-160} width={250} height={320} rx={28} fill={C.panel}
              stroke={hi > 0.01 ? (c.color === 'ink' ? '#F2B632' : col) : C.panelEdge} strokeWidth={3 + 7 * hi} />
            <text y={-80} fontSize={48} fill={c.color === 'ink' ? C.py : col}>{c.py}</text>
            <text y={90} fontSize={170} fontWeight={700} fill={col}>{c.ch}</text>
            <line x1={-80} x2={80} y1={118} y2={118} stroke={C.line} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

const Ending: React.FC<{t: number}> = ({t}) => {
  const e = TL.ending;
  const a = win(t, e.t0, e.t1 + 1, 0.5);
  if (a <= 0) return null;
  const k = (d: number) => easeOut(prog(t, e.t0 + d, 0.8));
  const blank = (x: number, y: number, d: number) => (
    <g transform={`translate(${x},${y}) scale(${0.8 * pop(t, e.t0 + d, 1.2)})`}>
      <rect x={-100} y={-75} width={200} height={150} rx={12} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="14 10" />
      <text y={22} fontSize={64} textAnchor="middle" fill={C.line}>？</text>
      <line x1={-60} x2={60} y1={128} y2={128} stroke={C.line} strokeWidth={3} strokeDasharray="8 8" />
    </g>
  );
  const ln = (pts: [number, number][], d: number) => {
    const kk = k(d);
    return <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} stroke={C.line} strokeWidth={4} fill="none"
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kk} />;
  };
  const meLook = PEOPLE.me.look;
  const wave = win(t, e.t0 + 0.6, e.t1 - 1, 0.4);
  return (
    <g opacity={a}>
      <text x={960} y={100} fontSize={72} fontWeight={700} textAnchor="middle" fill={C.ink} opacity={k(0)}>我的家庭树</text>
      <g fontSize={36} fontWeight={700} textAnchor="middle" opacity={k(1.6)}>
        <text x={480} y={170} fill="#B98A5E">爸爸这边</text>
        <text x={1440} y={170} fill="#C07A86">妈妈这边</text>
      </g>
      {ln([[440, 260], [520, 260]], 0.6)}
      {ln([[480, 260], [480, 426]], 0.6)}
      {ln([[1400, 260], [1480, 260]], 0.6)}
      {ln([[1440, 260], [1440, 426]], 0.6)}
      {ln([[480, 600], [480, 668], [960, 668], [960, 712]], 1.2)}
      {ln([[1440, 600], [1440, 668], [960, 668]], 1.2)}
      {blank(360, 260, 0.2)}{blank(600, 260, 0.3)}{blank(1320, 260, 0.4)}{blank(1560, 260, 0.5)}
      {blank(480, 486, 0.7)}{blank(1440, 486, 0.8)}
      <g transform={`translate(960,780) scale(${0.9 * pop(t, e.t0 + 1, 1.2)})`} textAnchor="middle">
        <Photo id="end-me" look={meLook} t={t} wave={wave} />
        <text y={136} fontSize={52} fontWeight={700} fill={C.tang}>我</text>
      </g>
    </g>
  );
};

export const Stage: React.FC<{t: number}> = ({t}) => {
  const start = TL.quiz[0].t0 - 1.0;
  const bg = win(t, start, 1e9, 0.8);
  if (bg <= 0) return null;
  const fadeOut = prog(t, TL.duration - 0.8, 0.8);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: bg}} />
      <Svg>
        <QuizScene t={t} />
        <Celebrate t={t} />
        <Review t={t} />
        <Ending t={t} />
      </Svg>
      <div style={{position: 'absolute', inset: 0, background: C.paper, opacity: fadeOut}} />
    </>
  );
};
