import React from 'react';
import {Composition} from 'remotion';
import {Film, FILM_FRAMES} from './film/Film';
import {LightsOut, LIGHTS_FRAMES} from './film/LightsOut';
import {AssetTest} from './film/AssetTest';
import {NightShift, NS_FRAMES} from './film/NightShift';
import {SoulForSale, SOUL_FRAMES} from './film/SoulForSale';
import {AfterHours, AH_FRAMES} from './film/AfterHours';
import {NightRoad, NR_FRAMES, NightRoadThumb} from './film/NightRoad';
import {DontReply, DR_FRAMES} from './film/DontReply';
import {AfterHours2, AH2_FRAMES} from './film/AfterHours2';
import {NightShift2, NS2_FRAMES} from './film/NightShift2';
import {W, H, FPS} from './kit/theme';
export const Root: React.FC = () => <>
  <Composition id="LightsOut" component={LightsOut} durationInFrames={LIGHTS_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="NightShift" component={NightShift} durationInFrames={NS_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="SoulForSale" component={SoulForSale} durationInFrames={SOUL_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="AfterHours" component={AfterHours} durationInFrames={AH_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="NightShift2" component={NightShift2} durationInFrames={NS2_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="AfterHours2" component={AfterHours2} durationInFrames={AH2_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="DontReply" component={DontReply} durationInFrames={DR_FRAMES} fps={FPS} width={W} height={H} />
  <Composition id="NightRoad" component={NightRoad} durationInFrames={NR_FRAMES} fps={FPS} width={1920} height={1080} />
  <Composition id="NightRoadThumb" component={NightRoadThumb} durationInFrames={1} fps={FPS} width={1920} height={1080} />
  <Composition id="AssetTest" component={AssetTest} durationInFrames={4} fps={FPS} width={W} height={H} />
  <Composition id="PixelDreadSample" component={Film} durationInFrames={FILM_FRAMES} fps={FPS} width={W} height={H} />
</>;
