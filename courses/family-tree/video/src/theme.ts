export const C = {
  paper: '#FBF7F0',
  card: '#F3E7D9',
  cardEdge: '#E6D6C2',
  line: '#C4AA8A',
  ink: '#2B2622',
  sub: '#8C8077',
  py: '#A08466',
  tang: '#D9822B',
  biao: '#2B97A6',
  wrong: '#D64F4A',
  panel: '#FFFCF6',
  panelEdge: '#E9DDCC',
  capBg: '#F1E6D8',
  skin: '#F6D5B6',
  skinShade: '#EDBF9A',
  blush: '#F2A08C',
};

export const FONT = '"LXGW WenKai", "Noto Serif SC", serif';

export type Tone = 'tang' | 'biao' | 'ink';
export const toneColor = (t: Tone | string) =>
  t === 'tang' ? C.tang : t === 'biao' ? C.biao : C.ink;
