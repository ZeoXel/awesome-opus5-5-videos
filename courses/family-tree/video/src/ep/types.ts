export type Key = [number, number, number, number, boolean]; // t, x, y, scale, flip
export type Costume = {jersey?: {color: string; num?: string} | null; shirt?: string};

export type Actor = {
  id: string;
  who: string;
  show: [number, number];
  keys: Key[];
  poses: [number, number, string][];
  costume: [number, Costume][];
  skate: [number, number][];
  hat?: string;
  hold?: {right?: string; left?: string};
};

export type Slot = {i: number; ch: string; py: string; color: string; t: number; wrong?: number};

export type Episode = {
  id: string;
  title: string;
  duration: number;
  shots: {t0: number; t1: number; bg: string; p: Record<string, any>}[];
  actors: Actor[];
  bubbles: {t0: number; t1: number; who: string; text: string; at?: [number, number]}[];
  captions: {t0: number; t1: number; text: string}[];
  chips: {who: string; t0: number; t1: number; x: number; y: number; tag: string | null}[];
  words: {t0: number; t1: number; merge: number | null; slots: Slot[]}[];
  stickers: {t: number; who: string; from: string; page: 'L' | 'R'}[];
  fx: ({kind: string; t0: number; t1: number} & Record<string, any>)[];
  sfx: {t: number; name: string; gain: number}[];
  music: {t0: number; t1: number; style: string}[];
  album?: {t0: number; t1: number; pages: string; prefilled?: string};
  song?: {t0: number; t1: number; bpm: number; bars: {t: number; text: string; notes: {t: number; m: number; d: number}[]}[]};
};
