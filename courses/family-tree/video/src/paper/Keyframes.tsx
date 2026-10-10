import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import glyphs from '../glyphs.json';
import {PaperFigure, SPEC, Who} from './PaperFigure';
import {CutText, Line, P, PaperDefs, RicePaper, Scissors, Strip, Table, Tag} from './materials';
import {rand} from '../anim';

const NAMES: Record<Who, string> = {
  yeye: '爷爷', nainai: '奶奶', bobo: '伯伯', baba: '爸爸', shushu: '叔叔', gugu: '姑姑',
  waigong: '外公', waipo: '外婆', mama: '妈妈', jiujiu: '舅舅', yima: '姨妈',
  me: '我', tangge: '堂哥', biaomei: '表妹', biaojie: '表姐', biaodi: '表弟',
};
const paperOf = (who: Who) => (who.startsWith('tang') ? P.gold : who.startsWith('biao') ? P.teal : P.red);
const accentOf = (who: Who) => (who.startsWith('tang') ? '#B07A1A' : who.startsWith('biao') ? P.teal : undefined);

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

const Fig: React.FC<{who: Who; x: number; y: number; s: number; id: string; arms?: 'down' | 'out'; reach?: number; backlit?: boolean; color?: string}> = ({who, x, y, s, id, arms, reach, backlit, color}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <PaperFigure who={who} id={id} color={color ?? paperOf(who)} arms={arms} reach={reach} backlit={backlit} />
  </g>
);

type Side = {grand: Who[]; chain: Who[]; parent: Who; kids: {who: Who; under: Who}[]; title: string};
const LEFT: Side = {grand: ['yeye', 'nainai'], chain: ['bobo', 'baba', 'shushu', 'gugu'], parent: 'baba',
  kids: [{who: 'tangge', under: 'shushu'}, {who: 'biaomei', under: 'gugu'}], title: '爸爸这边'};
const RIGHT: Side = {grand: ['waigong', 'waipo'], chain: ['mama', 'jiujiu', 'yima'], parent: 'mama',
  kids: [{who: 'biaojie', under: 'jiujiu'}, {who: 'biaodi', under: 'yima'}], title: '妈妈这边'};

/** One page of the family: grandparents, the sibling paper-doll chain, the children below. */
const Tree: React.FC<{side: Side; cx: number; top: number; s: number; vy?: number; backlit?: boolean; me?: {x: number; y: number}; tags?: boolean; key2: string}> = ({side, cx, top, s, vy = 1, backlit, me, tags = true, key2}) => {
  const sp = 200 * (s / 0.62);
  const k = (s / 0.62) * vy;
  const gy = top + 330 * k, cy = top + 650 * k, ky = top + 920 * k;
  const chainX = (i: number) => cx + (i - (side.chain.length - 1) / 2) * sp;
  const xOf = (w: Who) => chainX(side.chain.indexOf(w));
  const reach = sp / 2 / s;
  const strip = (c: string) => (backlit ? '#8E1A22' : c);
  const ts = 38 * (s / 0.62);
  return (
    <g>
      {/* paper strips first, figures on top */}
      {/* grandparents hold hands; their strip drops to the hands of the sibling chain */}
      <Strip d={`M ${cx} ${gy - 150 * s} L ${cx} ${cy - 170 * s}`} color={strip(P.red)} w={9 * s / 0.62} />
      {side.kids.map((k) => (
        <Strip key={k.who} d={`M ${xOf(k.under)} ${cy + 100 * s} L ${xOf(k.under)} ${ky - SPEC[k.who].H * s - 40 * s}`}
          color={strip(paperOf(k.who))} w={9 * s / 0.62} />
      ))}
      {me && <Strip d={`M ${xOf(side.parent)} ${cy + 100 * s} L ${xOf(side.parent)} ${me.y - 150 * s} L ${me.x} ${me.y - 150 * s} L ${me.x} ${me.y - 240 * s}`}
        color={strip(P.red)} w={9 * s / 0.62} />}
      {side.grand.map((w, i) => (
        <Fig key={w} who={w} x={cx + (i - 0.5) * sp * 0.95} y={gy} s={s} id={`${key2}-${w}`} backlit={backlit} arms="out" reach={sp * 0.95 / 2 / s} />
      ))}
      {side.chain.map((w, i) => (
        <Fig key={w} who={w} x={chainX(i)} y={cy} s={s} id={`${key2}-${w}`} arms="out" reach={reach} backlit={backlit} />
      ))}
      {side.kids.map((k) => (
        <Fig key={k.who} who={k.who} x={xOf(k.under)} y={ky} s={s} id={`${key2}-${k.who}`} backlit={backlit} />
      ))}
      {tags && (
        <g>
          {side.grand.map((w, i) => <Tag key={w} x={cx + (i - 0.5) * sp * 0.95} y={gy + 40 * s / 0.62} text={NAMES[w]} size={ts} rot={(rand(i + 3) - 0.5) * 6} />)}
          {side.chain.map((w, i) => <Tag key={w} x={chainX(i)} y={cy + 40 * s / 0.62} text={NAMES[w]} size={ts} rot={(rand(i + 9) - 0.5) * 6} />)}
          {side.kids.map((k, i) => <Tag key={k.who} x={xOf(k.under)} y={ky + 40 * s / 0.62} text={NAMES[k.who]} size={ts} accent={accentOf(k.who)} rot={(rand(i + 17) - 0.5) * 6} />)}
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------ keyframes ---
/** ① S2 — the sibling paper-doll chain being pulled open on the table. */
const KF1: React.FC = () => {
  const s = 1.1;
  const reach = 112;
  const step = reach * 2 * s;
  const x0 = 460;
  return (
    <svg width={1920} height={1080}>
      <PaperDefs />
      <Table />
      <g transform="rotate(-1.2 960 540)">
        <rect x={130} y={70} width={1660} height={930} fill="#3A1A10" opacity={0.25} transform="translate(8,10)" />
        <RicePaper x={130} y={70} w={1660} h={930} seed={3} />
      </g>
      {/* still folded: 叔叔 and 姑姑 lie stacked under the third panel */}
      {[3, 2].map((k) => (
        <g key={k} transform={`translate(${k * 7},${-k * 5})`} opacity={0.9}>
          <Fig who="shushu" x={x0 + step * 2} y={820} s={s} id={`kf1-stack${k}`} arms="out" reach={reach} color={k === 3 ? '#7E0A1C' : P.redDark} />
        </g>
      ))}
      {(['bobo', 'baba', 'shushu'] as Who[]).map((w, i) => (
        <Fig key={w} who={w} x={x0 + step * i} y={820} s={s} id={`kf1-${w}`} arms="out" reach={reach} />
      ))}
      <Tag x={x0} y={870} text="伯伯" rot={-3} />
      <Tag x={x0 + step} y={870} text="爸爸" rot={2} />
      <g transform="translate(1480,360) rotate(-24)"><Scissors open={0.5} /></g>
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} transform={`translate(${1250 + rand(i) * 420},${600 + rand(i + 4) * 260}) rotate(${rand(i + 8) * 360})`}
          d="M 0 0 L 22 6 L 8 20 Z" fill={P.red} opacity={0.9} />
      ))}
      <Line who="答" text="爸爸的哥哥，叫伯伯。" />
    </svg>
  );
};

/** ② S2 end — 爸爸这边 laid out like the reference page. */
const KF2: React.FC = () => {
  const s = 0.74, vy = 0.8, top = 70;
  const meX = 960 - 0.5 * 200 * (s / 0.62);
  const meY = top + 920 * (s / 0.62) * vy;
  return (
    <svg width={1920} height={1080}>
      <PaperDefs />
      <RicePaper seed={5} />
      <CutText x={960} y={120} text="爸爸这边" size={92} color={P.red} />
      <Tree side={LEFT} cx={960} top={top} s={s} vy={vy} me={{x: meX, y: meY}} key2="kf2" />
      <g transform={`translate(${meX},${meY}) scale(${s})`}>
        <PaperFigure who="me" id="kf2-me" color={P.red} />
      </g>
      <Tag x={meX} y={meY + 38 * (s / 0.62)} text="我" size={38 * (s / 0.62)} />
    </svg>
  );
};

/** ③ S4 — close-up: 叔叔's son is older than me → 堂哥. */
const KF3: React.FC = () => (
  <svg width={1920} height={1080}>
    <PaperDefs />
    <RicePaper seed={8} />
    <Strip d="M 520 520 L 520 600 L 900 600 L 900 640" color={P.gold} w={14} />
    <Fig who="shushu" x={520} y={520} s={1.0} id="kf3-shushu" />
    <Tag x={520} y={565} text="叔叔" rot={-2} />
    <Fig who="tangge" x={900} y={930} s={1.15} id="kf3-tangge" />
    <Fig who="me" x={1230} y={930} s={1.15} id="kf3-me" />
    {/* 比我大: a paper arrow from my head height up to his */}
    <line x1={780} x2={1360} y1={930 - 210 * 1.15 - 12} y2={930 - 210 * 1.15 - 12} stroke={P.ink} strokeWidth={3} strokeDasharray="12 10" />
    <CutText x={1060} y={600} text="比我大" size={64} color={P.gold} />
    <path d="M 1060 615 L 1060 640" stroke={P.gold} strokeWidth={10} />
    <g transform="translate(1520,300)">
      <rect x={-210} y={-170} width={420} height={250} rx={8} fill="#3A1A10" opacity={0.18} transform="translate(6,8)" />
      <rect x={-210} y={-170} width={420} height={250} rx={8} fill="#FBF6EC" />
      <text x={-95} y={-110} fontSize={40} textAnchor="middle" fill="#B07A1A" fontFamily="LXGW WenKai">táng</text>
      <text x={95} y={-110} fontSize={40} textAnchor="middle" fill="#8C7B6A" fontFamily="LXGW WenKai">gē</text>
      <CutText x={-95} y={40} text="堂" size={150} color={P.gold} />
      <CutText x={95} y={40} text="哥" size={150} color={P.red} />
    </g>
    <Line who="答" text="叔叔的儿子比我大，我叫他堂哥。" />
  </svg>
);

/** ④ S6 — the native move's payoff: the whole family as a backlit 窗花. */
const KF4: React.FC = () => {
  const s = 0.4;
  const meY = 905;
  return (
    <svg width={1920} height={1080}>
      <PaperDefs />
      <defs>
        <radialGradient id="dusk" cx="50%" cy="55%" r="70%">
          <stop offset="0" stopColor="#FFE3A0" />
          <stop offset="0.45" stopColor="#F6A65A" />
          <stop offset="1" stopColor="#3B2350" />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={P.night} />
      <rect x={110} y={40} width={1700} height={1000} fill="url(#dusk)" />
      {Array.from({length: 90}).map((_, i) => (
        <circle key={i} cx={110 + rand(i) * 1700} cy={40 + rand(i + 50) * 1000} r={1.5 + rand(i + 9) * 3.5} fill="#FFFFFF" opacity={0.65} />
      ))}
      <g opacity={0.95}>
        <Tree side={LEFT} cx={560} top={110} s={s} backlit tags={false} me={{x: 960, y: meY}} key2="kf4l" />
        <Tree side={RIGHT} cx={1380} top={110} s={s} backlit tags={false} me={{x: 960, y: meY}} key2="kf4r" />
      </g>
      {/* window lattice — the centre mullion is the fold line, 我 stands on it */}
      <g fill="none" stroke="#5A3420" strokeWidth={26}>
        <rect x={110} y={40} width={1700} height={1000} />
        <line x1={960} y1={40} x2={960} y2={1040} strokeWidth={20} />
        <line x1={110} y1={600} x2={1810} y2={600} strokeWidth={10} opacity={0.7} />
      </g>
      {[[110, 40], [1810, 40], [110, 1040], [1810, 1040]].map(([x, y], i) => (
        <path key={i} transform={`translate(${x},${y}) scale(${x > 960 ? -1 : 1},${y > 540 ? -1 : 1})`}
          d="M 0 0 L 120 0 L 120 20 L 20 20 L 20 120 L 0 120 Z M 40 40 L 90 40 L 90 54 L 54 54 L 54 90 L 40 90 Z" fill="#5A3420" />
      ))}
      <g transform={`translate(960,${meY}) scale(0.62)`}>
        <ellipse cx={0} cy={-120} rx={150} ry={200} fill="#FFF2C8" opacity={0.55} filter="url(#glow)" />
        <PaperFigure who="me" id="kf4-me" color={P.red} backlit />
      </g>
    </svg>
  );
};

export const PaperKeyframes: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: P.rice}}>
      {[<KF1 key={1} />, <KF2 key={2} />, <KF3 key={3} />, <KF4 key={4} />][Math.min(3, f)]}
    </AbsoluteFill>
  );
};
