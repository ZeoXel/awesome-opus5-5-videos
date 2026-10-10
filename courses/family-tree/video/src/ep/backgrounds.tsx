import React from 'react';
import {FONT} from '../theme';
import {clamp01, easeInOut, prog} from '../anim';

const W = 1920, H = 1080;
const RED = '#C8372D', GOLD = '#F6C445';

const Lantern: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${Math.sin(t * 1.6 + x) * 4}) scale(${s})`}>
    <line x1={0} y1={-90} x2={0} y2={-46} stroke="#7A3A1E" strokeWidth={3} />
    <rect x={-16} y={-50} width={32} height={10} rx={3} fill={GOLD} />
    <ellipse cx={0} cy={0} rx={50} ry={44} fill={RED} />
    {[-30, -12, 12, 30].map((dx) => <path key={dx} d={`M ${dx} -40 Q ${dx * 1.35} 0 ${dx} 40`} stroke="#A62A22" strokeWidth={2} fill="none" />)}
    <rect x={-16} y={40} width={32} height={10} rx={3} fill={GOLD} />
    {[-8, 0, 8].map((dx) => <line key={dx} x1={dx} y1={50} x2={dx} y2={84} stroke={GOLD} strokeWidth={3} />)}
  </g>
);

const Fu: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-70} y={-70} width={140} height={140} fill={RED} transform="rotate(45)" />
    <text y={36} fontSize={100} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill="#1F1A17" transform="rotate(-45)">福</text>
  </g>
);

const Couplet: React.FC<{x: number; y: number; text: string; vertical?: boolean}> = ({x, y, text, vertical = true}) => {
  const chars = Array.from(text);
  return vertical ? (
    <g transform={`translate(${x},${y})`}>
      <rect x={-34} y={0} width={68} height={chars.length * 72 + 24} fill={RED} />
      {chars.map((c, i) => <text key={i} y={68 + i * 72} fontSize={54} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill={GOLD}>{c}</text>)}
    </g>
  ) : (
    <g transform={`translate(${x},${y})`}>
      <rect x={-chars.length * 36 - 16} y={-38} width={chars.length * 72 + 32} height={76} fill={RED} />
      <text y={18} fontSize={52} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill={GOLD} letterSpacing={12}>{text}</text>
    </g>
  );
};

const Floor: React.FC<{y: number; color: string; line: string}> = ({y, color, line}) => (
  <g>
    <rect x={0} y={y} width={W} height={H - y} fill={color} />
    {Array.from({length: 12}).map((_, i) => (
      <line key={i} x1={i * 180 - 120} y1={H} x2={960 + (i * 180 - 1080) * 0.45} y2={y} stroke={line} strokeWidth={2} opacity={0.5} />
    ))}
  </g>
);

const WindowPaperCut: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#CFE6EE" stroke="#A47A52" strokeWidth={14} />
    <line x1={0} y1={-h / 2} x2={0} y2={h / 2} stroke="#A47A52" strokeWidth={8} />
    <g fill={RED}>
      <circle r={Math.min(w, h) * 0.26} />
      <circle r={Math.min(w, h) * 0.18} fill="#CFE6EE" />
      {Array.from({length: 8}).map((_, i) => (
        <path key={i} transform={`rotate(${i * 45})`} d={`M 0 ${-Math.min(w, h) * 0.12} L 8 0 L 0 ${Math.min(w, h) * 0.12} L -8 0 Z`} />
      ))}
    </g>
  </g>
);

export const Background: React.FC<{bg: string; t: number; t0: number; p: Record<string, any>}> = ({bg, t, t0, p}) => {
  switch (bg) {
    case 'home':
      return (
        <g>
          <rect width={W} height={H} fill="#F7E7D3" />
          {Array.from({length: 60}).map((_, i) => (
            <circle key={i} cx={(i % 12) * 170 + (Math.floor(i / 12) % 2) * 85 + 40} cy={Math.floor(i / 12) * 150 + 60} r={6} fill="#EED6BA" />
          ))}
          <WindowPaperCut x={330} y={380} w={360} h={300} />
          <Fu x={1480} y={330} s={1.1} />
          <Lantern x={760} y={160} t={t} s={1.1} />
          <Lantern x={1180} y={160} t={t + 1} s={1.1} />
          <Floor y={760} color="#E3C59E" line="#C9A578" />
        </g>
      );
    case 'door': {
      const k = p.open != null ? easeInOut(prog(t, p.open, 0.7)) : 0;
      const shake = p.shake ? 0 : 0;
      const dx = 1150, dw = 380, top = 360;
      return (
        <g>
          <rect width={W} height={H} fill="#DCEAF0" />
          <rect x={0} y={250} width={W} height={530} fill="#C9C2B6" />
          {Array.from({length: 9}).map((_, r) =>
            Array.from({length: 17}).map((_, c) => (
              <rect key={`${r}-${c}`} x={c * 120 + (r % 2) * 60 - 60} y={250 + r * 59} width={116} height={55} fill="none" stroke="#B5AD9F" strokeWidth={2} />
            )))}
          <path d={`M 0 250 L ${W} 250 L ${W} 210 L 0 210 Z`} fill="#6E6A66" />
          {Array.from({length: 33}).map((_, i) => <path key={i} d={`M ${i * 60} 210 q 30 -26 60 0`} fill="#5E5A57" />)}
          {/* door frame + panels */}
          <rect x={dx - dw / 2 - 30} y={top - 30} width={dw + 60} height={930 - top + 30} fill="#8C2C22" />
          <rect x={dx - dw / 2} y={top} width={dw} height={930 - top} fill="#3A2A22" />
          {[-1, 1].map((side) => {
            const w = (dw / 2) * (1 - 0.82 * k);
            const x = side < 0 ? dx - dw / 2 : dx + dw / 2 - w;
            return (
              <g key={side}>
                <rect x={x} y={top} width={w} height={930 - top} fill={RED} stroke="#8C2C22" strokeWidth={4} />
                {k < 0.6 && Array.from({length: 4}).map((_, r) => Array.from({length: 3}).map((_, c) => (
                  <circle key={`${r}${c}`} cx={x + w * (0.25 + c * 0.25)} cy={top + 80 + r * 120} r={8 * (1 - k)} fill={GOLD} />
                )))}
                {k < 0.6 && <circle cx={side < 0 ? x + w - 22 : x + 22} cy={top + 300} r={14 * (1 - k)} fill={GOLD} />}
              </g>
            );
          })}
          <Couplet x={dx - dw / 2 - 90} y={top - 10} text="春回大地" />
          <Couplet x={dx + dw / 2 + 90} y={top - 10} text="福满人间" />
          <Couplet x={dx} y={top - 70} text="新春快乐" vertical={false} />
          <Fu x={dx} y={top + 210} s={0.5 * (1 - k)} />
          <Lantern x={dx - 330} y={360} t={t} />
          <Lantern x={dx + 330} y={360} t={t + 1.3} />
          <rect x={0} y={780} width={W} height={H - 780} fill="#B9B3A8" />
          {Array.from({length: 14}).map((_, i) => <line key={i} x1={i * 150} y1={780} x2={i * 150 - 60} y2={H} stroke="#A8A196" strokeWidth={3} />)}
          <rect x={0} y={780} width={W} height={10} fill="#A8A196" />
        </g>
      );
    }
    case 'yard':
      return (
        <g>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BFE3F2" />
              <stop offset="1" stopColor="#EAF5F2" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sky)" />
          {[[300, 150], [1400, 110], [900, 200]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x + Math.sin(t * 0.2 + i) * 30},${y})`} fill="#FFFFFF" opacity={0.9}>
              <circle r={44} /><circle cx={50} cy={10} r={36} /><circle cx={-50} cy={12} r={32} />
            </g>
          ))}
          <rect x={0} y={470} width={W} height={300} fill="#D9D0C2" />
          <rect x={0} y={440} width={W} height={34} fill="#7A736B" />
          {Array.from({length: 33}).map((_, i) => <path key={i} d={`M ${i * 60} 440 q 30 -22 60 0`} fill="#6A645D" />)}
          <g transform="translate(150,770)">
            <rect x={-14} y={-260} width={28} height={260} fill="#8A5A36" />
            <circle cx={0} cy={-300} r={110} fill="#8BBF7A" />
            <circle cx={-70} cy={-250} r={70} fill="#7DB36C" />
            <circle cx={70} cy={-250} r={70} fill="#7DB36C" />
            {[[-40, -320], [40, -280], [0, -240]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} fill={RED} />)}
          </g>
          <rect x={0} y={760} width={W} height={H - 760} fill="#9CCB7E" />
          <rect x={0} y={760} width={W} height={10} fill="#88B86C" />
          {/* little goal */}
          <g transform="translate(1720,760)">
            <rect x={-120} y={-170} width={240} height={170} fill="none" stroke="#FFFFFF" strokeWidth={10} />
            {Array.from({length: 7}).map((_, i) => <line key={i} x1={-120 + i * 40} y1={-170} x2={-120 + i * 40} y2={0} stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />)}
            {Array.from({length: 4}).map((_, i) => <line key={i} x1={-120} y1={-170 + i * 42} x2={120} y2={-170 + i * 42} stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />)}
          </g>
        </g>
      );
    case 'road': {
      const off = (t - t0) * 420;
      return (
        <g>
          <rect width={W} height={H} fill="#CDE9F4" />
          {[0, 1, 2].map((i) => {
            const x = ((i * 900 - off * 0.2) % 2700 + 2700) % 2700 - 400;
            return <path key={i} d={`M ${x} 640 Q ${x + 300} 360 ${x + 700} 640 Z`} fill={i % 2 ? '#A9D39A' : '#BADFA8'} />;
          })}
          <rect x={0} y={630} width={W} height={180} fill="#9CCB7E" />
          {Array.from({length: 10}).map((_, i) => {
            const x = ((i * 260 - off * 0.6) % 2600 + 2600) % 2600 - 200;
            return (
              <g key={i} transform={`translate(${x},700)`}>
                <rect x={-8} y={-70} width={16} height={70} fill="#8A5A36" />
                <circle cy={-100} r={48} fill="#7DB36C" />
              </g>
            );
          })}
          <rect x={0} y={800} width={W} height={150} fill="#7D7A78" />
          {Array.from({length: 12}).map((_, i) => {
            const x = ((i * 220 - off) % 2640 + 2640) % 2640 - 220;
            return <rect key={i} x={x} y={866} width={120} height={14} rx={6} fill="#F2F0EA" />;
          })}
          <rect x={0} y={950} width={W} height={H - 950} fill="#9CCB7E" />
        </g>
      );
    }
    case 'living':
      return (
        <g>
          <rect width={W} height={H} fill="#F4E4D0" />
          <rect x={0} y={0} width={W} height={60} fill="#E9D3B8" />
          <WindowPaperCut x={1560} y={360} w={380} h={320} />
          <Fu x={420} y={250} s={0.8} />
          <g transform="translate(560,760)">
            <rect x={-330} y={-170} width={660} height={120} rx={40} fill="#B4574B" />
            <rect x={-360} y={-90} width={720} height={90} rx={30} fill="#C46658" />
            <rect x={-380} y={-150} width={70} height={150} rx={30} fill="#A84E43" />
            <rect x={310} y={-150} width={70} height={150} rx={30} fill="#A84E43" />
          </g>
          <Lantern x={960} y={140} t={t} s={0.9} />
          <Floor y={760} color="#D6B48C" line="#B9946A" />
        </g>
      );
    case 'studio':
      return (
        <g>
          <defs>
            <radialGradient id="backdrop" cx="50%" cy="40%" r="70%">
              <stop offset="0" stopColor="#E9F0F4" />
              <stop offset="1" stopColor="#B9C8D2" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#backdrop)" />
          <rect x={0} y={880} width={W} height={H - 880} fill="#C7B39A" />
          {[110, 1810].map((x, i) => (
            <g key={i} transform={`translate(${x},880)`}>
              <line x1={0} y1={0} x2={0} y2={-560} stroke="#4A4A50" strokeWidth={8} />
              <path d="M -70 -650 L 70 -650 L 40 -560 L -40 -560 Z" fill="#F5F2EA" stroke="#4A4A50" strokeWidth={5} />
            </g>
          ))}
          <Couplet x={960} y={110} text="全家福" vertical={false} />
        </g>
      );
    case 'doorframe':
      return (
        <g>
          <rect width={W} height={H} fill="#F3E4CF" />
          {Array.from({length: 24}).map((_, i) => <rect key={i} x={i * 84} y={0} width={42} height={H} fill="#EFDDC4" />)}
          <rect x={430} y={60} width={1060} height={60} fill="#B98353" />
          <rect x={430} y={60} width={70} height={900} fill="#B98353" />
          <rect x={1420} y={60} width={70} height={900} fill="#B98353" />
          {/* height ruler painted on the left post */}
          <rect x={500} y={300} width={46} height={630} fill="#F6D58C" />
          {Array.from({length: 22}).map((_, i) => (
            <line key={i} x1={500} x2={500 + (i % 2 ? 18 : 32)} y1={930 - i * 29} y2={930 - i * 29} stroke="#A0703A" strokeWidth={3} />
          ))}
          <rect x={0} y={930} width={W} height={H - 930} fill="#D6B48C" />
        </g>
      );
    case 'stage':
      return (
        <g>
          <rect width={W} height={H} fill="#FFF3DC" />
          <path d={`M 0 0 L 230 0 Q 160 500 210 ${H} L 0 ${H} Z`} fill={RED} />
          <path d={`M ${W} 0 L ${W - 230} 0 Q ${W - 160} 500 ${W - 210} ${H} L ${W} ${H} Z`} fill={RED} />
          {Array.from({length: 22}).map((_, i) => {
            const x = 80 + i * 82;
            const y = 40 + Math.sin(i / 21 * Math.PI) * 50;
            const cols = ['#E8574F', '#F2C94C', '#3FA3A6', '#EE8A2E', '#78A86A'];
            return <path key={i} d={`M ${x - 30} ${y} L ${x + 30} ${y} L ${x} ${y + 56} Z`} fill={cols[i % 5]} />;
          })}
          <rect x={0} y={760} width={W} height={H - 760} fill="#D9A86C" />
          {Array.from({length: 10}).map((_, i) => <rect key={i} x={0} y={760 + i * 34} width={W} height={3} fill="#C49158" />)}
        </g>
      );
    case 'album':
      return (
        <g>
          <rect width={W} height={H} fill="#C99E73" />
          {Array.from({length: 12}).map((_, i) => <rect key={i} x={0} y={i * 92} width={W} height={4} fill="#B98C62" />)}
        </g>
      );
    default:
      return <rect width={W} height={H} fill="#FBF7F0" />;
  }
};

export const fadeIn = (t: number, t0: number, d = 0.4) => clamp01((t - t0) / d);
