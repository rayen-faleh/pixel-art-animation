import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../ns2-timing.json';
import heroA from '../../public/sprites/hero.json';
import civA from '../../public/sprites/civilians.json';
import crawlA from '../../public/sprites/crawler.json';
import fgA from '../../public/sprites/fg_props.json';
import {FPS, color} from '../kit/theme';
import {World, camAt, useKitFonts, ramp, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Darken, Flash, Vignette, Rings, Tint} from '../kit/effects';
import {WordCaption, Hud, phrasesFrom, Word} from '../kit/overlay';
import {CctvOverlay, CctvFilter, NoiseMeter} from './ns-ui';
import {RuleCard} from './ah-ui';
import {Store, Ext, ES, crawlFrame, SHUT_JAM} from './NightShift';
import {HookHeadline, BeatChips, BigCount, NumberedChoice, NextDayCard, Chip} from './reels-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), civ = A(civA), crawl = A(crawlA), fgp = A(fgA);

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'S21'), 0.5);

// key moments (mirrored in scripts/build_ns2_cues.py)
const E = {
  detail: wf('S06', 3), battery: wf('S06', 10), dying: wf('S07', 8), t410: wf('S08', 0), skip: wf('S08', 4), t430: wf('S09', 0), drag: wf('S09', 5),
  t451: wf('S10', 0), stops: wf('S10', 3), turns: wf('S11', 5), click: wf('S13', 4), cooler: wf('S14', 1), every: wf('S14', 8), hums: wf('S15', 1),
  h1: wf('S16', 2), h2: wf('S16', 9), h3: wf('S16', 12), humStop: wf('S17', 2), out: wf('S17', 9), next: wf('S18', 2), plug: wf('S19', 2), tenFeet: wf('S19', 6),
  shoes: wf('S20', 3), go: wf('S20', 11),
};
const CHOICE = wf('S21', 0) - 2;
export const NS2_END = we('S21') + 30;
export const NS2_FRAMES = NS2_END + 120;
const LATE = 1e7;                 // Store() state after Part 1: lights off, shutter jammed at knee height
const musicOn = (g: number) => g < E.stops;
const coolerOn = (g: number) => g >= E.click && g < E.humStop;

// ---------- CCTV of the pumps: the car, its music, the crawlers ----------
const SPOTS = [[100, 133, 0], [136, 137, 5], [82, 150, 9], [150, 156, 13], [116, 160, 2], [66, 140, 7]];
const Pumps: React.FC<{from: number; cam: CamKey[]; clock: string}> = ({from, cam, clock}) => {
  const f = useCurrentFrame(); const g = f + from;
  const slow = g >= E.t430 ? 14 : 8;                                   // music drags: the rings slow down
  const turned = g >= E.turns;
  return <><CctvFilter><World cam={camAt(g, cam)}>
    <Ext shuttered>
      <ES atlas={fgp} f="car_side" x={118} y={152} />
      {SPOTS.map(([x, y, o], i) => turned
        ? <ES key={i} atlas={crawl} f="frozen" x={x} y={y} flip={x < 80} />
        : <ES key={i} atlas={crawl} f={musicOn(g) ? crawlFrame(g, o) : 'crawl0'} x={x + (musicOn(g) ? Math.sin((g + o * 7) / 9) * 2 : 0)} y={y} flip={i % 2 === 1} />)}
      {musicOn(g) && !(g >= E.skip && g < E.skip + 8) && <Rings x={118} y={140} at={from % slow} count={60} every={slow} life={20} maxR={18} width={0.5} color="rgba(255,255,255,0.5)" />}
      {coolerOn(g) && <Rings x={82} y={118} at={E.click - from} count={40} every={10} life={24} maxR={30} width={0.4} color="rgba(120,200,255,0.6)" />}
    </Ext>
  </World></CctvFilter><CctvOverlay cam="CAM 02 · PUMPS" clock={clock} /></>;
};

// ---------- behind the counter: you, Dev, the gap under the shutter ----------
const HANDS = [{left: 100, at: () => E.h1}, {left: 116, at: () => E.h2}, {left: 132, at: () => E.h3}];
const Counter: React.FC<{from: number; cam: CamKey[]; devUp?: boolean; heroPose?: string}> = ({from, cam, devUp, heroPose = 'down.scared'}) => {
  const f = useCurrentFrame(); const g = f + from;
  const up = devUp ? ramp(g, E.shoes, 20, Easing.out(Easing.quad)) : 0;
  return <World cam={camAt(g, cam)}>
    <Store g={LATE}>
      {HANDS.map((h, i) => {
        const p = ramp(g, h.at(), 30, Easing.out(Easing.quad)) * (1 - ramp(g, E.out + i * 6, 24, Easing.in(Easing.quad)));
        return p > 0 && <div key={i} style={{position: 'absolute', left: h.left, top: SHUT_JAM - 2, width: 60, height: 20, overflow: 'hidden'}}>
          <PixelSprite atlas={crawl} frame="under_door" x={60 - 37 * p} y={15} breathe={false} squash={false} />
        </div>;
      })}
      <PixelSprite atlas={hero} x={72} y={214} keys={[{at: -999, pose: heroPose}]} />
      <PixelSprite atlas={civ} frame={up > 0.5 ? 'driver.34l' : 'driver.front'} x={90} y={212 - up * 3} breathe={false} squash={false} />
    </Store>
    {HANDS.map((h, i) => g >= h.at() && g < E.out + 30 && <Glow key={i} x={h.left + 22} y={198} r={3} rx={6} color={color.ghost} intensity={0.8} />)}
    {coolerOn(g) && <Glow x={30} y={150} r={60} color="rgba(120,200,255,1)" intensity={0.25} flicker={0.1} seed="cool" />}
  </World>;
};

// ---------- the beer cooler insert (code-drawn in art px) ----------
const Cooler: React.FC<{from: number; plug?: boolean}> = ({from, plug}) => {
  const f = useCurrentFrame(); const g = f + from;
  const on = coolerOn(g);
  const vib = on ? Math.sin(g * 2.3) * 0.25 : 0;
  const cans = ['#c8202c', '#2f6ad0', '#e0b030', '#3a9a5a', '#d0d0d0'];
  return <World cam={camAt(g, plug ? [{at: from, x: 100, y: 180, zoom: 2.2}, {at: from + 120, x: 104, y: 186, zoom: 2.6}] : [{at: from, x: 67, y: 120, zoom: 1.15}, {at: from + 150, x: 67, y: 110, zoom: 1.35}])}
    shake={on && g < E.click + 6 ? 0.5 : 0}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 135, height: 240, background: 'linear-gradient(180deg, #161b2b, #1a2032 70%, #12151f)'}} />
    <div style={{position: 'absolute', left: 0, top: 205, width: 135, height: 35, background: '#232838'}} />
    <div style={{position: 'absolute', left: 14 + vib, top: 40, width: 104, height: 168, background: '#2b3040', border: '1px solid #0b0c11'}}>
      {/* compressor grille on top */}
      <div style={{position: 'absolute', left: 4, top: 3, width: 96, height: 12, background: 'repeating-linear-gradient(90deg, #14161e 0 1px, #3a3f50 1px 3px)'}} />
      <div style={{position: 'absolute', left: 88, top: 6, width: 3, height: 3, background: on ? '#5fd38a' : '#203026'}} />
      {[0, 1, 2].map((d) => <div key={d} style={{position: 'absolute', left: 4 + d * 33, top: 20, width: 30, height: 142, background: on ? '#1d3346' : '#141b26', border: '1px solid #4a5062'}}>
        {[0, 1, 2, 3, 4].map((r) => <div key={r} style={{position: 'absolute', left: 2, top: 6 + r * 27, width: 26, height: 20}}>
          {[0, 1, 2, 3].map((c) => <div key={c} style={{position: 'absolute', left: 1 + c * 6.5, top: 8, width: 5, height: 11, background: cans[(d * 7 + r * 3 + c) % 5], opacity: 0.8}} />)}
          <div style={{position: 'absolute', left: 0, top: 19, width: 26, height: 1, background: '#4a5062'}} />
        </div>)}
        <div style={{position: 'absolute', left: 24, top: 60, width: 2, height: 18, background: '#8a8fa0'}} />
      </div>)}
      <div style={{position: 'absolute', left: 30, top: 4, fontFamily: 'Silkscreen, monospace', fontSize: 5, color: '#c9ccd6'}}>COLD BEER</div>
    </div>
    {plug && <>{/* the plug behind the cooler, and the open floor to it */}
      <div style={{position: 'absolute', left: 120, top: 186, width: 6, height: 8, background: '#d8d8d0', border: '1px solid #0b0c11'}} />
      <div style={{position: 'absolute', left: 117, top: 194, width: 1, height: 14, background: '#0b0c11'}} />
      <Glow x={123} y={190} r={4} color={color.keyYellow} intensity={0.6} />
    </>}
    <Darken amount={0.3} />
    {on && <><Glow x={66} y={110} r={70} color="rgba(120,200,255,1)" intensity={0.55} flicker={0.06} seed="cl" />
      <Rings x={66} y={46} at={E.click - from} count={60} every={10} life={26} maxR={40} width={0.3} color="rgba(120,200,255,0.7)" /></>}
  </World>;
};

// ---------- HUD + NOISE ----------
const CLOCK: [number, string][] = [[0, '3:52'], [E.t410, '4:10'], [E.t430, '4:30'], [E.t451, '4:51'], [cut('S13'), '4:52'], [cut('S18'), '4:57']];
const noiseAt = (g: number) => {
  let lv = musicOn(g) ? (g >= E.t430 ? 0.32 : 0.4) : 0.04;
  if (coolerOn(g)) lv = Math.max(lv, g < E.hums ? 0.7 : 0.6);
  if (g >= E.stops && g < E.stops + 40) lv = 0.01;
  return Math.max(0, lv + Math.sin(g * 1.7) * 0.03 * (lv > 0.1 ? 1 : 0));
};
const CHIPS: Chip[] = [
  {at: wf('S02', 0), text: '3:52 AM'}, {at: wf('S02', 7), text: 'DAWN 6:50', tone: 'ok'},
  {at: wf('S03', 8), text: 'DEV', sub: 'THE DRIVER'}, {at: wf('S04', 3), text: 'RADIO = DECOY', tone: 'ok'}, {at: wf('S04', 8), text: 'ALL ON THE CAR'},
  {at: wf('S05', 0), text: 'STORE IGNORED', tone: 'ok'}, {at: E.detail, text: 'ONE DETAIL…', tone: 'bad'}, {at: E.battery, text: 'RUNS ON BATTERY'},
  {at: E.dying, text: "BATTERY'S DYING", tone: 'bad'},
  {at: E.t410, text: 'BATTERY 30%'}, {at: E.t430, text: 'BATTERY 10%', tone: 'bad'}, {at: E.stops, text: 'BATTERY DEAD', tone: 'bad'},
  {at: E.turns, text: 'EVERY HEAD → STORE', tone: 'bad'},
  {at: E.cooler, text: 'BEER COOLER'}, {at: E.every, text: 'AUTO · EVERY 20 MIN', tone: 'bad'}, {at: wf('S15', 2), text: '5 MIN OF HUM', tone: 'bad'},
  {at: E.humStop, text: 'HUM STOPS', tone: 'ok'}, {at: E.next, text: 'NEXT CYCLE 5:12', tone: 'bad'}, {at: wf('S18', 3), text: 'DAWN IN 1H 38M'},
  {at: E.plug, text: 'THE PLUG'}, {at: E.tenFeet, text: '10 FT OPEN FLOOR', tone: 'bad'}, {at: E.shoes, text: 'DEV WILL GO'}, {at: CHOICE, text: ''},
];

export const NightShift2: React.FC = () => {
  useKitFonts();
  const g = useCurrentFrame();
  let clock = CLOCK[0][1]; for (const [at, c] of CLOCK) if (g >= at) clock = c;

  const shots: [number, (s: number) => React.ReactNode][] = [
    // frame 0 = the cover: the swarm on the car, music still playing
    [0, (s) => <Pumps from={s} clock="03:52:04" cam={[{at: 0, x: 108, y: 130, zoom: 1.5}, {at: cut('S02'), x: 110, y: 132, zoom: 1.65}]} />],
    [cut('S02'), (s) => <Counter from={s} cam={[{at: s, x: 82, y: 188, zoom: 1.8}, {at: cut('S03'), x: 82, y: 190, zoom: 2.0}]} />],
    [cut('S03', 5), (s) => <Counter from={s} cam={[{at: s, x: 90, y: 196, zoom: 4.0}, {at: s + 120, x: 90, y: 196, zoom: 4.4}]} />],
    [cut('S04'), (s) => <Pumps from={s} clock="03:53:40" cam={[{at: s, x: 112, y: 140, zoom: 1.9}, {at: s + 150, x: 114, y: 141, zoom: 2.1}]} />],
    [cut('S06'), (s) => <Pumps from={s} clock="03:54:02" cam={[{at: s, x: 118, y: 146, zoom: 2.4}, {at: E.battery, x: 118, y: 146, zoom: 2.6}, {at: E.battery + 2, x: 118, y: 144, zoom: 4.0, ease: Easing.out(Easing.cubic)}]} />],
    [cut('S07'), (s) => <Counter from={s} cam={[{at: s, x: 88, y: 196, zoom: 3.6}, {at: E.dying, x: 90, y: 196, zoom: 4.6}]} />],
    [cut('S08'), (s) => <Pumps from={s} clock="04:10:11" cam={[{at: s, x: 110, y: 136, zoom: 1.8}]} />],
    [cut('S09'), (s) => <Pumps from={s} clock="04:30:48" cam={[{at: s, x: 110, y: 136, zoom: 1.9}]} />],
    [cut('S10'), (s) => <Pumps from={s} clock="04:51:20" cam={[{at: s, x: 110, y: 136, zoom: 2.0}]} />],
    [cut('S11'), (s) => <Pumps from={s} clock="04:51:31" cam={[{at: s, x: 110, y: 136, zoom: 1.6}, {at: E.turns, x: 110, y: 136, zoom: 1.6}, {at: E.turns + 2, x: 100, y: 138, zoom: 2.6, ease: Easing.out(Easing.cubic)}]} />],
    [cut('S12'), (s) => <><Counter from={s} cam={[{at: s, x: 82, y: 190, zoom: 2.0}]} /><AbsoluteFill style={{background: '#05060a', opacity: 0.45}} />
      <RuleCard at={wf('S12', 0) - s} n={1} title="NOTHING MAKES A SOUND" sub="NOT EVEN THE STORE." y={560} /></>],
    [cut('S13'), (s) => <Counter from={s} heroPose="down.shock" cam={[{at: s, x: 82, y: 190, zoom: 2.2}, {at: E.click, x: 82, y: 190, zoom: 2.2}, {at: E.click + 2, x: 76, y: 192, zoom: 2.8, ease: Easing.out(Easing.cubic)}]} />],
    [cut('S14'), (s) => <Cooler from={s} />],
    [cut('S15', 5), (s) => <Pumps from={s} clock="04:53:02" cam={[{at: s, x: 100, y: 128, zoom: 1.6}]} />],
    [cut('S16'), (s) => <Counter from={s} heroPose="down.shock" cam={[{at: s, x: 118, y: 196, zoom: 2.2}, {at: s + 160, x: 120, y: 197, zoom: 2.5}]} />],
    [cut('S18'), (s) => <Counter from={s} cam={[{at: s, x: 82, y: 190, zoom: 2.0}]} />],
    [cut('S19'), (s) => <Cooler from={s} plug />],
    [cut('S20'), (s) => <Counter from={s} devUp cam={[{at: s, x: 86, y: 194, zoom: 2.8}, {at: s + 120, x: 88, y: 194, zoom: 3.2}]} />],
    [CHOICE, (s) => <><Counter from={s} devUp cam={[{at: s, x: 86, y: 194, zoom: 2.4}]} /><AbsoluteFill style={{background: 'rgba(5,6,10,0.6)'}} />
      <NumberedChoice at={2} l1="WHO CROSSES" l2="THE FLOOR?" a="LET DEV GO" b="GO YOURSELF" /></>],
    [NS2_END, () => <NextDayCard at={4} series="NIGHT SHIFT" next="PART 3" clock="4:58 AM" />],
  ];

  return <AbsoluteFill style={{background: color.night}}>
    {shots.map(([from, render], i) => {
      const to = i + 1 < shots.length ? shots[i + 1][0] : NS2_FRAMES;
      return <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>{render(from)}</Sequence>;
    })}
    <Flash at={E.detail} color="#ff2d3d" dur={3} peak={0.25} />
    <Flash at={E.stops} color="#000000" dur={8} peak={0.7} />
    <Flash at={E.turns} color="#ff2d3d" dur={3} peak={0.4} />
    <Flash at={E.click} color="#ffffff" dur={2} peak={0.25} />
    <Flash at={E.h1} color="#ffffff" dur={2} peak={0.2} />
    <Tint color="rgba(80,170,255,1)" from={E.click} to={E.humStop} peak={0.1} pulse={24} />
    {g < NS2_END && <Vignette strength={0.82} />}

    <HookHeadline l1="THE MUSIC SAVED YOU." l2="THEN IT STOPPED." l2At={-12} sign="PART 1 · ON MY PAGE" until={we('S01') + 40} y={640} />
    {g < CHOICE && <Hud series="NIGHT SHIFT" part="PART 2" status={`NIGHT 1 · ${clock} AM`} />}
    {g < CHOICE && <NoiseMeter level={noiseAt(g)} />}
    {g > we('S01') + 40 && g < CHOICE && <BeatChips chips={CHIPS} y={380} />}
    <BigCount steps={[{at: E.t410, text: '4:10'}, {at: E.t430, text: '4:30'}, {at: E.t451, text: '4:51', red: true}]} y={520} until={cut('S11')} />
    <BigCount steps={[{at: E.h1, text: '1'}, {at: E.h2, text: '2'}, {at: E.h3, text: '3', red: true}]} y={520} until={E.humStop} />
    {g < CHOICE && <WordCaption phrases={PHRASES} />}
    <Audio src={staticFile('audio/ns2-mix.wav')} />
  </AbsoluteFill>;
};
