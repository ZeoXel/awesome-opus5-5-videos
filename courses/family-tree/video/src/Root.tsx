import React from 'react';
import {Composition} from 'remotion';
import {EpisodeView} from './ep/Episode';
import {PaperKeyframes} from './paper/Keyframes';
import {Episode} from './ep/types';
import ep1 from './episodes/ep1.json';
import ep2 from './episodes/ep2.json';
import ep3 from './episodes/ep3.json';

const FPS = 30;
const EPISODES = [ep1, ep2, ep3] as unknown as Episode[];

const View: React.FC<{n: number; withAudio?: boolean}> = ({n, withAudio}) => <EpisodeView ep={EPISODES[n]} withAudio={withAudio} />;

export const Root: React.FC = () => (
  <>
    {EPISODES.map((ep, n) => (
      <Composition key={ep.id} id={ep.id} component={View} durationInFrames={Math.round(ep.duration * FPS)}
        fps={FPS} width={1920} height={1080} defaultProps={{n, withAudio: true}} />
    ))}
    {/* 《一张红纸》 style frames, one keyframe per frame */}
    <Composition id="paper-kf" component={PaperKeyframes} durationInFrames={4} fps={FPS} width={1920} height={1080} />
  </>
);
