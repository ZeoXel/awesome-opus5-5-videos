import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import glyphs from './glyphs.json';
import {C} from './theme';
import {World} from './World';
import {ActOverlays, Captions, Stage} from './Overlays';

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

/** Faint paper fibres so the background isn't a flat fill. */
const Paper: React.FC = () => (
  <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
    <defs>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#7A5A30" stopOpacity={0.09} />
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.05 0" />
      </filter>
    </defs>
    <rect width={1920} height={1080} filter="url(#grain)" />
    <rect width={1920} height={1080} fill="url(#vig)" />
  </svg>
);

export const Main: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Paper />
      <World t={t} />
      <ActOverlays t={t} />
      <Stage t={t} />
      <Captions t={t} />
      {withAudio && <Audio src={staticFile('audio/soundtrack.wav')} />}
    </AbsoluteFill>
  );
};
