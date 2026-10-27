import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timing from '../timing.json';
import heroA from '../../public/sprites/hero.json';
import ghostOlive from '../../public/sprites/ghost_olive.json';
import ghostMaroon from '../../public/sprites/ghost_maroon.json';
import ghostNavy from '../../public/sprites/ghost_navy.json';
import propsA from '../../public/sprites/props.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, ramp, CamKey} from '../kit/world';
import {Atlas, PixelSprite, PixelText, turnKeys} from '../kit/sprite';
import {Glow, Beam, Darken, Tint, Flash, Vignette, Rings, useHits, Dust} from '../kit/effects';
import {WordCaption, Hud, AlertCard, Choice, phrasesFrom, Word} from '../kit/overlay';

const hero = heroA as unknown as Atlas;
const gO = ghostOlive as unknown as Atlas, gM = ghostMaroon as unknown as Atlas, gN = ghostNavy as unknown as Atlas;
const props = propsA as unknown as Atlas;
const WORDS = timing.words as Word[];
const at = (i: number) => Math.round(WORDS[i].s * FPS);
export const FILM_FRAMES = 450;
const PHRASES = phrasesFrom(WORDS).slice(0, -1); // "Your call." is shown by <Choice>

// Shot boundaries (global frames): hard cuts like the reference.
const S1 = 0, S2 = at(13) - 3, S3 = at(17) - 3, S4 = at(27) - 2;

// ---------------- Shot 1: bedroom, phone, alert ----------------
const Bedroom: React.FC = () => {
  const f = useCurrentFrame();
  const buzz = useHits([at(5), at(5) + 6], 0.8, 5);
  const cam = camAt(f, [
    {at: 0, x: 37, y: 166, zoom: 2.0},
    {at: at(6) - 1, x: 38, y: 165, zoom: 2.15},
    {at: at(6), x: 42, y: 166, zoom: 2.55},           // snap-in on the alert (cut-zoom)
    {at: S2, x: 44, y: 164, zoom: 2.85},
  ]);
  const alert = f >= at(6);
  return <World cam={cam} shake={alert && f < at(6) + 10 ? 0.4 : 0}>
    <SetLayer src="sets/bedroom_bg.png" />
    <Beam x={68} y={95} w0={50} w1={110} h={120} color={color.moon} intensity={0.8} />
    <PixelText text="3:07" x={6} y={166} color="#ff3b3b" glow="#ff3b3b" blinkColon />
    <Glow x={13} y={168} r={10} color="rgba(255,60,60,1)" intensity={0.7} />
    <PixelSprite atlas={hero} x={44 + buzz * 0.4} y={189} keys={[
      {at: 0, pose: 'phone.worried'}, {at: at(5), pose: 'phone.shock'}, {at: at(6), pose: 'phone.scared'},
      {at: at(12), pose: 'phone.lookup'},
    ]} />
    <SetLayer src="sets/bedroom_fg.png" />
    {/* phone light on the face; turns red with the alert */}
    <Glow x={44 + buzz * 0.4} y={166} r={20} color={alert ? 'rgba(255,70,80,1)' : color.phone} intensity={alert ? 1.1 : 0.9} flicker={0.08} seed="ph" />
    <Darken amount={0.25} />
  </World>;
};

// ---------------- Shot 2: hallway, three knocks ----------------
const Hall: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const knocks = [231, 238, 245].map((k) => k - from);
  const dx = useHits(knocks, 1.1, 6);
  const cam = camAt(f, [
    {at: 0, x: 62, y: 172, zoom: 1.55},
    {at: at(15) - from, x: 64, y: 168, zoom: 1.7},
    {at: at(16) - from + 20, x: 67, y: 160, zoom: 2.2},
  ]);
  return <World cam={cam} shake={knocks.some((k) => f >= k && f < k + 4) ? 0.35 : 0}>
    <SetLayer src="sets/hall_bg.png" />
    <PixelSprite atlas={props} frame="blinds4" x={116} y={104 - 2 + 139} breathe={false} />
    {/* porch light leaking through the door window and under the door */}
    <Glow x={67 + dx} y={131} r={14} rx={12} color={color.warm} intensity={0.9} flicker={0.12} seed="dw" />
    <Glow x={67} y={199} r={4} rx={26} color={color.warm} intensity={1} flicker={0.15} seed="ud" />
    <PixelSprite atlas={props} frame="door" x={67 + dx} y={199} breathe={false} squash={false} />
    {knocks.map((k, i) => <React.Fragment key={i}><Rings x={67} y={150} at={k} count={1} life={14} maxR={20} width={0.35} color="rgba(255,255,255,0.45)" /><Dust x={67} y={118} at={k} n={5} spread={30} /></React.Fragment>)}
    <PixelSprite atlas={hero} x={38} y={230} keys={[
      {at: 0, pose: 'turn0.worried'}, {at: knocks[0], pose: 'turn0.scared'},
    ]} blink={false} />
    <Darken amount={0.3} />
    <Glow x={38} y={207} r={30} color={color.warm} intensity={0.25} />
    {g < 0 && null}
  </World>;
};

// ---------------- Shot 3: porch reveal, pull-back to SOLD + watchers ----------------
const Porch: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const L = (i: number) => at(i) - from;
  const turnAt = L(19) - 2;
  const cam = camAt(f, [
    {at: 0, x: 67, y: 182, zoom: 2.5},
    {at: turnAt, x: 67, y: 181, zoom: 2.6},
    {at: turnAt + 8, x: 67, y: 179, zoom: 3.1},                 // snap push on the face
    {at: L(20), x: 67, y: 180, zoom: 3.15},
    {at: L(23), x: 95, y: 196, zoom: 1.6},                       // pull back: SOLD sign
    {at: L(26) + 25, x: 67.5, y: 150, zoom: 1.0},
  ]);
  const watchers = ramp(f, L(25), 14);
  const eyeY = 202 - 39 + 10;
  return <World cam={cam}>
    <SetLayer src="sets/porch_bg.png" />
    <Glow x={87} y={160} r={26} color={color.warm} intensity={1} flicker={0.12} seed="pl" />
    <PixelSprite atlas={gO} x={67} y={202} keys={[{at: 0, pose: 'turn0.creepy'}, ...turnKeys(turnAt, 'creepy', 3)]} blink={false} />
    {f >= turnAt + 6 && <Glow x={67} y={eyeY} r={9} rx={12} color={color.ghost} intensity={1.3} flicker={0.1} seed="ey" />}
    <SetLayer src="sets/porch_fg.png" />
    {/* the watchers on the sidewalk fade up from the dark */}
    <div style={{opacity: watchers}}>
      <PixelSprite atlas={gM} x={18} y={236} frame="down.creepy.b0" />
      <PixelSprite atlas={gN} x={98} y={238} frame="down.creepy.b1" />
      <Glow x={18} y={207} r={7} color={color.ghost} intensity={watchers} />
      <Glow x={98} y={209} r={7} color={color.ghost} intensity={watchers} />
    </div>
    <Rings x={122} y={201} at={L(23)} count={2} every={5} life={20} maxR={18} color="rgba(255,80,80,0.9)" width={0.5} />
    <Glow x={122} y={201} r={14} color="rgba(255,60,60,1)" intensity={f >= L(23) ? 0.8 : 0} />
    <Darken amount={0.28} />
  </World>;
};

const End: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  return <>
    <World cam={{x: 67.5, y: 150, zoom: 1.0}}>
      <SetLayer src="sets/porch_bg.png" />
      <PixelSprite atlas={gO} x={67} y={202} frame="down.creepy.b0" />
      <PixelSprite atlas={gM} x={18} y={236} frame="down.creepy.b0" />
      <PixelSprite atlas={gN} x={98} y={238} frame="down.creepy.b1" />
      <SetLayer src="sets/porch_fg.png" />
    </World>
    <AbsoluteFill style={{background: '#05060a', opacity: 0.55 + 0.25 * ramp(f, 0, 10)}} />
    <Choice at={at(27) - from} title="YOUR CALL." a="OPEN" b="HIDE" aAt={at(28) - at(27) + 6} bAt={at(28) - at(27) + 14} y={700} />
  </>;
};

export const Film: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: color.night}}>
    <Sequence from={S1} durationInFrames={S2 - S1}><Bedroom /></Sequence>
    <Sequence from={S2} durationInFrames={S3 - S2}><Hall from={S2} /></Sequence>
    <Sequence from={S3} durationInFrames={S4 - S3}><Porch from={S3} /></Sequence>
    <Sequence from={S4} durationInFrames={FILM_FRAMES - S4}><End from={S4} /></Sequence>
    {/* alert: red wash pulses until the cut; flashes on reveals */}
    <Tint color="#ff1e2e" from={at(6)} to={S2 - 8} peak={0.32} pulse={18} />
    <Flash at={at(6)} color="#ff2d3d" dur={4} peak={0.55} />
    <Flash at={at(19)} color="#ffffff" dur={3} peak={0.35} />
    <Flash at={at(23)} color="#ff2d3d" dur={4} peak={0.4} />
    <Vignette strength={0.8} />
    <Sequence from={at(6)} durationInFrames={S2 - at(6)}>
      <AlertCard at={2} title="EMERGENCY ALERT" body="Do not open your door." sub="Stay away from all entrances." y={1420} />
    </Sequence>
    <Hud series="THE KNOCK" part="PART 1" status={f < S3 ? 'NIGHT 1 · 03:07 AM' : 'NIGHT 1 · 03:09 AM'} statusChangedAt={S3}
      chips={[
        {label: 'PHONE', value: '12%', tone: 'bad'},
        {label: 'SIGNAL', value: '✕', tone: 'bad', from: at(6) + 4, changedAt: at(6) + 4},
        {label: 'DOOR', value: 'LOCKED', tone: 'ok', from: S2 + 6, changedAt: S2 + 6},
      ]} />
    <WordCaption phrases={PHRASES} />
    <Audio src={staticFile('audio/mix.wav')} />
  </AbsoluteFill>;
};
