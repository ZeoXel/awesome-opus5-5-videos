import raw from './timeline.json';
import {Move, XYS} from './anim';
import {Hair} from './family';

export type Walk = {route: string[]; t0: number; t1: number; color: string; fade: number};
export type Slot = {i: number; ch: string; py: string; color: string; t: number; wrong?: number};
export type Caption = {t0: number; t1: number; text: string; chant?: boolean};
export type QuizItem = {
  t0: number; t1: number; n: number; chain: string[]; q: string; color: string; bigger: boolean;
  kid: {look: Hair; H: number; shirt: string};
  answer: {ch: string; py: string}[]; why: string;
};

export type Timeline = {
  fps: number;
  duration: number;
  acts: {id: string; name: string; t0: number; t1: number}[];
  camera: {init: XYS; moves: Move[]};
  nodes: Record<string, {x: number; y: number; s: number; appear: number; unknown: boolean;
    moves: Move[]; ghost: number | null; reveal?: number}>;
  edges: {parents: string[]; children: string[]; t0: number; dur: number; hidden: [number, number][]}[];
  walks: Walk[];
  words: {t0: number; t1: number; slots: Slot[]; merge: number | null}[];
  compares: {a: string; b: string; t0: number; t1: number; bigger: boolean; label: number}[];
  cakes: {t0: number; t1: number; a: string; b: string; na: number; nb: number}[];
  tags: {node: string; t0: number; t1: number; text: string}[];
  countdowns: {t0: number; dur: number}[];
  captions: Caption[];
  sfx: {t: number; name: string; gain: number}[];
  shakes: {t0: number; dur: number}[];
  waves: {node: string; t0: number; t1: number; raise?: boolean}[];
  glows: {node: string; t0: number; t1: number}[];
  nods?: {t0: number; nodes: string[]}[];
  pauses: {t0: number; t1: number}[];
  silhouettes: {t0: number; t1: number};
  question: {node: string; t0: number; t1: number};
  title: {t0: number; t1: number; text: string};
  sideLabels: {t0: number; t1: number};
  bothLabels: {t0: number; t1: number};
  chant: {t0: number; t1: number; bpm: number; lines: {t: number; text: string}[]};
  quiz: QuizItem[];
  stars: {t0: number; t1: number};
  review: {t0: number; t1: number; cards: {ch: string; py: string; color: string; t: number}[]};
  ending: {t0: number; t1: number};
};

export const TL = raw as unknown as Timeline;
