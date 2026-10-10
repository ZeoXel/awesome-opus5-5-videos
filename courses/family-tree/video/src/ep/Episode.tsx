import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import glyphs from '../glyphs.json';
import {easeInOut, prog} from '../anim';
import {Episode as Ep} from './types';
import {Background} from './backgrounds';
import {ActorView, headTop} from './actors';
import {BACK, EpisodeTitle, Fx} from './fx';
import {AlbumSpread, AlbumWidget, Bubbles, Captions, Chips, WordCards} from './ui';

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

export const EpisodeView: React.FC<{ep: Ep; withAudio?: boolean}> = ({ep, withAudio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const shot = [...ep.shots].reverse().find((s) => t >= s.t0) ?? ep.shots[0];
  const inShot = (t0: number, t1: number) => t0 < shot.t1 && t1 > shot.t0;
  const actors = ep.actors
    .filter((a) => t >= a.show[0] && t < a.show[1] && inShot(a.show[0], a.show[1]))
    .sort((a, b) => a.keys[0][2] - b.keys[0][2]);
  const fxs = ep.fx.filter((f) => t >= f.t0 - 0.01 && t <= f.t1 + 0.6 && (inShot(f.t0, f.t1) || ['flash'].includes(f.kind)));
  // the family photo turns into a framed print
  const pol = shot.p.polaroid != null ? easeInOut(prog(t, shot.p.polaroid, 0.9)) : 0;
  const cut = ep.shots.indexOf(shot) > 0 ? Math.max(0, 1 - (t - shot.t0) / 0.3) : 0;
  const end = prog(t, ep.duration - 0.8, 0.8);
  return (
    <AbsoluteFill style={{background: '#FBF7F0'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {pol > 0 && <Background bg="album" t={t} t0={shot.t0} p={{}} />}
        <g transform={pol > 0 ? `translate(960,500) rotate(${-2.5 * pol}) scale(${1 - 0.22 * pol}) translate(-960,-540)` : undefined}>
          {pol > 0 && <rect x={-40} y={-40} width={2000} height={1200} fill="#FFFFFF" />}
          <Background bg={shot.bg} t={t} t0={shot.t0} p={shot.p} />
          {shot.bg === 'album' && <AlbumSpread t={t} pages={shot.p.pages} full={shot.p.full} merge={shot.p.merge} />}
          {fxs.filter((f) => BACK.has(f.kind)).map((f, i) => <Fx key={`b${i}`} ep={ep} f={f} t={t} />)}
          {actors.map((a) => <ActorView key={a.id} ep={ep} a={a} t={t} />)}
          {fxs.filter((f) => !BACK.has(f.kind)).map((f, i) => <Fx key={`f${i}`} ep={ep} f={f} t={t} />)}
        </g>
        <Chips ep={ep} t={t} />
        <WordCards ep={ep} t={t} />
        <Bubbles ep={ep} t={t} />
        <AlbumWidget ep={ep} t={t} srcPos={(id, tt) => headTop(ep, id, tt)} />
        <EpisodeTitle text={ep.title} t={t} />
        <Captions ep={ep} t={t} />
        {cut > 0 && <rect width={1920} height={1080} fill="#FFFCF6" opacity={cut * 0.9} />}
        {end > 0 && <rect width={1920} height={1080} fill="#FBF7F0" opacity={end} />}
      </svg>
      {withAudio && <Audio src={staticFile(`audio/${ep.id}.wav`)} />}
    </AbsoluteFill>
  );
};
