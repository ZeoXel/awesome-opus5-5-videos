import React from 'react';
import {Composition, Sequence} from 'remotion';
import {Main} from './Main';
import {TL} from './timeline';

const FPS = TL.fps;

/** One act cut out of the full film, so teachers can play a single segment. */
const ActCut: React.FC<{from: number; withAudio?: boolean}> = ({from, withAudio}) => (
  <Sequence from={-from}>
    <Main withAudio={withAudio} />
  </Sequence>
);

export const Root: React.FC = () => (
  <>
    <Composition id="Full" component={Main} durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS} width={1920} height={1080} defaultProps={{withAudio: true}} />
    {TL.acts.map((a) => (
      <Composition key={a.id} id={a.id} component={ActCut}
        durationInFrames={Math.round((a.t1 - a.t0) * FPS)} fps={FPS} width={1920} height={1080}
        defaultProps={{from: Math.round(a.t0 * FPS), withAudio: true}} />
    ))}
  </>
);
