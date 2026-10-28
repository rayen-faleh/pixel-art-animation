import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import plates from '../../public/sets/plates.json';
import civA from '../../public/sprites/civilians.json';
import chA from '../../public/sprites/changed_poses.json';
import heroXA from '../../public/sprites/hero_actions.json';
import tallA from '../../public/sprites/tall_one.json';
import crowdA from '../../public/sprites/crowd_tiny.json';
import fgA from '../../public/sprites/fg_props.json';
import {color} from '../kit/theme';
import {World, SetLayer, useKitFonts} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Darken, Vignette} from '../kit/effects';

/** One frame per scene: proves ingested plates, fg layers and sprites compose at one pixel density. */
const A = (j: unknown) => j as Atlas;
const civ = A(civA), ch = A(chA), heroX = A(heroXA), tall = A(tallA), crowd = A(crowdA), fg = A(fgA);
const P = plates as Record<string, {w: number}>;
const S: React.FC<{atlas: Atlas; f: string; x: number; y: number; flip?: boolean}> = ({atlas, f, x, y, flip}) =>
  <PixelSprite atlas={atlas} frame={f} x={x} y={y} flip={flip} breathe={false} squash={false} />;
const Plate: React.FC<{name: string; layer: 'bg' | 'fg'}> = ({name, layer}) => <SetLayer src={`sets/${name}_${layer}.png`} width={P[name].w} />;
const eyes = (x: number, y: number, i: number) => <Glow key={i} x={x} y={y} r={4} rx={6} color={color.ghost} intensity={1.2} />;

const Living = () => <World cam={{x: 80, y: 150, zoom: 1.35}}>
  <Plate name="livingroom" layer="bg" />
  <S atlas={ch} f="olive.stand" x={140} y={137} />
  <S atlas={civ} f="mom.34l" x={62} y={190} />
  <Plate name="livingroom" layer="fg" />
  <S atlas={fg} f="armchair_back" x={22} y={236} />
  <Darken amount={0.3} />{eyes(138, 113, 0)}
</World>;

const Street = () => <World cam={{x: 80, y: 175, zoom: 1.3}}>
  <Plate name="street_wide" layer="bg" />
  {['maroon.stand', 'navy.tilt', 'teal.stand', 'plum.longarms', 'brown.stand'].map((f, i) => <S key={i} atlas={ch} f={f} x={62 + i * 18} y={190 + (i % 2) * 6} />)}
  <S atlas={heroX} f="crouch" x={40} y={232} />
  <S atlas={fg} f="car_side" x={44} y={240} />
  <Darken amount={0.35} />
  {[0, 1, 2, 3, 4].map((i) => eyes(62 + i * 18, 190 + (i % 2) * 6 - 27, i))}
</World>;

const Car = () => <World cam={{x: 79, y: 120, zoom: 1.0}}>
  <Plate name="car_pov" layer="bg" />
  <S atlas={tall} f="front" x={86} y={128} />
  <Darken amount={0.3} />{eyes(86, 34, 0)}
  <Plate name="car_pov" layer="fg" />
</World>;

const Town = () => <World cam={{x: 80, y: 150, zoom: 1.2}}>
  <Plate name="town" layer="bg" />
  <Glow x={130} y={50} r={30} color={color.moon} intensity={0.6} />
  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <S key={i} atlas={crowd} f={`c0${i}`} x={30 + i * 13} y={176 + (i % 3)} />)}
  <Plate name="town" layer="fg" />
  <Darken amount={0.25} />
</World>;

export const AssetTest: React.FC = () => {
  useKitFonts();
  return <AbsoluteFill style={{background: color.night}}>
    {[Living, Street, Car, Town].map((C, i) => <Sequence key={i} from={i} durationInFrames={1}><C /><Vignette strength={0.7} /></Sequence>)}
  </AbsoluteFill>;
};
