import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './film/Film';
import {W, H, FPS} from './kit/theme';
export const Root: React.FC = () => <Composition id="PixelDreadSample" component={Film} durationInFrames={FILM_FRAMES} fps={FPS} width={W} height={H} />;
