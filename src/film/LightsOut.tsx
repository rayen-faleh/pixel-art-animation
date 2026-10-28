import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timing from '../lights-timing.json';
import heroA from '../../public/sprites/hero.json';
import gOliveA from '../../public/sprites/ghost_olive.json';
import gMaroonA from '../../public/sprites/ghost_maroon.json';
import gNavyA from '../../public/sprites/ghost_navy.json';
import gBrownA from '../../public/sprites/ghost_brown.json';
import gTealA from '../../public/sprites/ghost_teal.json';
import gPlumA from '../../public/sprites/ghost_plum.json';
import propsA from '../../public/sprites/props.json';
import props2A from '../../public/sprites/props2.json';
import itemsA from '../../public/sprites/items.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, ramp, CamKey} from '../kit/world';
import {Atlas, PixelSprite, PixelText, turnKeys} from '../kit/sprite';
import {Glow, Beam, Darken, Tint, Flash, Vignette, Rings, useHits, Dust} from '../kit/effects';
import {WordCaption, Hud, AlertCard, phrasesFrom, Word, Chip} from '../kit/overlay';
import {BrightnessInsert, MessageBanner, Inventory, ChoiceStack, Blackout} from './lights-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), props = A(propsA), props2 = A(props2A), items = A(itemsA);
const G = {olive: A(gOliveA), maroon: A(gMaroonA), navy: A(gNavyA), brown: A(gBrownA), teal: A(gTealA), plum: A(gPlumA)};

// ---------- timing anchors (everything hangs off the narration's word times) ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
/** global frame where word i of line `id` starts (negative i counts from the end) */
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;

export const LIGHTS_FRAMES = Math.ceil(timing.duration * FPS) + 80;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'L27'), 0.5);

// shots (global frames)
const S_BED = 0;
const S_HALL = cut('L04', 4);              // "The hallway light."
const S_BRIGHT = cut('L07');
const S_STREET = cut('L08');
const S_OTS = cut('L15');
const S_EYES = cut('L18');
const S_PRESS = cut('L19');
const S_KITCHEN = cut('L20');
const S_DOOR = cut('L24');
const S_DOORWIN = we('L26') + 14;          // cut to the door window after "four hours away."

// events shared by picture and the SFX cue builder (scripts/build_cues.py mirrors these)
const LAMP_CLICK = wf('L04', 3);
const HALL_CLICK = wf('L04', 6);
const DRAG_END = we('L07');
const LIGHT_OUT = wf('L12', 3);
const TURN = wf('L13', 2);
const FLARE = wf('L17', 2);
const PRESS = wf('L19', 2) + 4;
const KNOCKS = [wf('L24', 2), wf('L24', 3), wf('L24', 3) + 13, wf('L24', 3) + 26];

// ---------- A. bedroom: scrolling, the alert, the lamp ----------
const Bedroom: React.FC = () => {
  const f = useCurrentFrame();
  const scream = wf('L01', 3);
  const buzz = useHits([scream, scream + 6], 0.8, 5);
  const reachFrom = wf('L04', 0), lampOn = f < LAMP_CLICK;
  const cam = camAt(f, [
    {at: 0, x: 32, y: 162, zoom: 2.25},
    {at: scream - 1, x: 33, y: 162, zoom: 2.4},
    {at: scream, x: 37, y: 166, zoom: 2.85},                 // snap in on the scream
    {at: reachFrom - 1, x: 36, y: 165, zoom: 3.05},
    {at: reachFrom + 10, x: 26, y: 160, zoom: 2.4},           // ease back to reveal the lamp
  ]);
  const alert = f >= scream && f < reachFrom;
  const flip = f >= reachFrom && f < LAMP_CLICK + 6;
  return <World cam={cam} shake={f >= scream && f < scream + 10 ? 0.4 : 0}>
    <SetLayer src="sets/bedroom_bg.png" />
    <Beam x={68} y={95} w0={50} w1={110} h={120} color={color.moon} intensity={0.7} />
    <PixelSprite atlas={props2} frame={lampOn ? 'lamp_on' : 'lamp_off'} x={11} y={159} breathe={false} squash={false} />
    <PixelText text="2:14" x={4} y={166} color="#ff3b3b" glow="#ff3b3b" blinkColon />
    <Glow x={11} y={168} r={9} color="rgba(255,60,60,1)" intensity={0.6} />
    <PixelSprite atlas={hero} x={36 + buzz * 0.4} y={189} flip={flip} keys={[
      {at: 0, pose: 'phone.neutral'}, {at: scream, pose: 'phone.shock'}, {at: wf('L02'), pose: 'phone.scared'},
      {at: wf('L03'), pose: 'phone.worried'}, {at: reachFrom, pose: 'reach.worried'}, {at: LAMP_CLICK + 6, pose: 'phone.scared'},
    ]} />
    <SetLayer src="sets/bedroom_fg.png" />
    {lampOn && <Glow x={11} y={118} r={48} color={color.warm} intensity={0.85} flicker={0.04} seed="lamp" />}
    <Glow x={36 + buzz * 0.4} y={166} r={20} color={alert ? 'rgba(255,70,80,1)' : color.phone} intensity={alert ? 1.1 : 0.9} flicker={0.06} seed="ph" />
    <Darken amount={lampOn ? 0.2 : 0.45} />
  </World>;
};

// ---------- B. hall: the ceiling light, alert two ----------
const Hall: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const L = (g: number) => g - from;
  const on = f < L(HALL_CLICK);
  const alert2 = L(wf('L05', 3));
  const cam = camAt(f, [
    {at: 0, x: 82, y: 160, zoom: 1.6},
    {at: L(HALL_CLICK) + 4, x: 84, y: 164, zoom: 1.7},
    {at: alert2 - 1, x: 92, y: 176, zoom: 2.2},
    {at: alert2, x: 97, y: 180, zoom: 2.75},                  // snap on the second alert
    {at: L(S_BRIGHT), x: 98, y: 182, zoom: 2.95},
  ]);
  return <World cam={cam} shake={f >= alert2 && f < alert2 + 8 ? 0.35 : 0}>
    <SetLayer src="sets/hall_bg.png" />
    <div style={{position: 'absolute', left: 94, top: 149, width: 6, height: 9, background: '#181e2e'}} />
    <PixelSprite atlas={props2} frame={on ? 'ceiling_on' : 'ceiling_off'} x={67} y={239} breathe={false} squash={false} />
    <PixelSprite atlas={props} frame="door" x={67} y={199} breathe={false} squash={false} />
    {/* switch under the hero's raised hand */}
    <div style={{position: 'absolute', left: 108, top: 166, width: 5, height: 8, background: '#3a3c48'}} />
    <div style={{position: 'absolute', left: 110, top: on ? 167 : 171, width: 1, height: 2, background: '#c9ccd6'}} />
    <PixelSprite atlas={hero} x={100} y={204} keys={[
      {at: 0, pose: 'up.worried'}, {at: L(HALL_CLICK) + 8, pose: 'phone.worried'}, {at: alert2, pose: 'phone.shock'},
      {at: L(wf('L06')) + 4, pose: 'phone.scared'},
    ]} />
    {on && <Glow x={67} y={112} r={80} color={color.warm} intensity={0.75} flicker={0.05} seed="ceil" />}
    {!on && <Glow x={100} y={181} r={18} color={f >= alert2 ? 'rgba(255,70,80,1)' : color.phone} intensity={0.9} flicker={0.06} seed="ph2" />}
    <Darken amount={on ? 0.22 : 0.5} />
  </World>;
};

// ---------- D. brightness insert ----------
const Bright: React.FC<{from: number}> = ({from}) => (
  <AbsoluteFill style={{background: '#04050a'}}>
    <BrightnessInsert dragAt={wf('L07', 3) - from} dragDur={Math.max(12, DRAG_END - wf('L07', 3))} />
  </AbsoluteFill>
);

// ---------- street cast (Mr. Hale + the crowd), shared by E, F, G, H ----------
type Fig = {a: Atlas; x: number; y: number; d: number};
const CROWD: Fig[] = [
  {a: G.maroon, x: 18, y: 216, d: 4}, {a: G.navy, x: 37, y: 224, d: 0}, {a: G.brown, x: 55, y: 215, d: 7},
  {a: G.teal, x: 74, y: 226, d: 2}, {a: G.plum, x: 93, y: 217, d: 9}, {a: G.olive, x: 112, y: 225, d: 5},
  {a: G.navy, x: 126, y: 214, d: 11},
];
const HALE = {x: 56, y: 156};

/** The street seen from our window. `turned` = crowd already facing us (after L13). */
const StreetWorld: React.FC<{from: number; cam: CamKey | {x: number; y: number; zoom: number}; eyes?: number; turnAt?: number; lit?: boolean;
  dark?: number; phoneWash?: number; children?: React.ReactNode; step?: number}> = ({from, cam, eyes = 0, turnAt, lit = false, dark = 0.5, phoneWash = 0, children, step = 0}) => {
  const f = useCurrentFrame();
  const turnLocal = turnAt !== undefined ? turnAt - from : undefined;
  const keysFor = (d: number) => turnLocal === undefined ? [{at: -999, pose: 'down.creepy'}]
    : [{at: -999, pose: 'turn0.creepy'}, ...turnKeys(turnLocal + d, 'creepy', 3)];
  const eyeOn = (d: number) => (turnLocal === undefined ? 1 : ramp(f, turnLocal + d + 6, 3)) * eyes;
  return <World cam={cam}>
    <SetLayer src="sets/street_bg.png" />
    <PixelSprite atlas={G.olive} x={HALE.x} y={HALE.y} keys={keysFor(1)} breathe={false} blink={false} squash={false} />
    {!lit && <div style={{position: 'absolute', left: 36, top: 104, width: 63, height: 59, background: '#05060a', opacity: 0.93}} />}
    <SetLayer src="sets/street_mid.png" />
    {lit && <><Glow x={67} y={128} r={46} color={color.warm} intensity={1} flicker={0.05} seed="hale" />
      <Beam x={67} y={152} w0={58} w1={135} h={88} color={color.warm} intensity={0.55} /></>}
    {phoneWash > 0 && <Glow x={70} y={222} r={60} rx={90} color={color.phone} intensity={phoneWash} />}
    {CROWD.map((c, i) => <PixelSprite key={i} atlas={c.a} x={c.x} y={c.y + step} keys={keysFor(c.d)} breathe={false} blink={false} squash={false} />)}
    <Darken amount={dark} />
    {/* eyes are the only thing the dark can't swallow */}
    <Glow x={HALE.x} y={HALE.y - 29} r={5} rx={8} color={color.ghost} intensity={1.2 * eyeOn(1)} flicker={0.1} seed="he" />
    {CROWD.map((c, i) => <Glow key={i} x={c.x} y={c.y + step - 29} r={5} rx={8} color={color.ghost} intensity={1.3 * eyeOn(c.d)} flicker={0.12} seed={`e${i}`} />)}
    <SetLayer src="sets/street_fg.png" />
    {children}
  </World>;
};

// ---------- E. street: lit window, Mr. Hale, the crowd, the turn ----------
const Street: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const L = (g: number) => g - from;
  const reveal = L(wf('L10', 4));
  const faceY = (c: Fig) => c.y - 29;
  const cam = camAt(f, [
    {at: 0, x: 67, y: 126, zoom: 1.9},
    {at: L(wf('L09')) , x: 62, y: 128, zoom: 2.1},
    {at: L(we('L09')), x: HALE.x, y: 132, zoom: 3.0},           // creep onto Mr. Hale
    {at: reveal, x: HALE.x, y: 132, zoom: 3.0},
    {at: reveal + 42, x: 67.5, y: 158, zoom: 1.02},             // pull back: the street
    {at: L(TURN) - 1, x: 67.5, y: 160, zoom: 1.05},
    {at: L(TURN), x: 70, y: 198, zoom: 1.55},                   // snap on the turn
    {at: L(wf('L14')) - 1, x: 70, y: 200, zoom: 1.7},
    {at: L(wf('L14')), x: CROWD[2].x, y: faceY(CROWD[2]) + 2, zoom: 4.2},
    {at: L(wf('L14', 2)) - 1, x: CROWD[2].x + 2, y: faceY(CROWD[2]) + 2, zoom: 4.3},
    {at: L(wf('L14', 2)), x: CROWD[3].x, y: faceY(CROWD[3]) + 2, zoom: 4.4},
    {at: L(wf('L14', 5)) - 1, x: CROWD[3].x + 2, y: faceY(CROWD[3]) + 2, zoom: 4.5},
    {at: L(wf('L14', 5)), x: CROWD[4].x, y: faceY(CROWD[4]) + 3, zoom: 4.3},
    {at: L(S_OTS), x: CROWD[4].x - 2, y: faceY(CROWD[4]) + 3, zoom: 4.6},
  ]);
  const lit = f < L(LIGHT_OUT);
  return <StreetWorld from={from} cam={cam} turnAt={TURN} eyes={1} lit={lit} dark={lit ? 0.42 : f < L(TURN) ? 0.82 : 0.62} />;
};

// ---------- F. over the shoulder: alert three, Mom's text ----------
const Ots: React.FC<{from: number; press?: boolean}> = ({from, press}) => {
  const f = useCurrentFrame();
  const L = (g: number) => g - from;
  const flare = press ? 1 : ramp(f, L(FLARE), 2);
  const dying = press ? 1 - ramp(f, L(PRESS), 7) : 1;
  const phone = (0.22 + 0.85 * flare) * dying;
  const cam = camAt(f, [{at: 0, x: 66, y: 186, zoom: 1.45}, {at: 200, x: 64, y: 190, zoom: 1.6}]);
  const alertAt = L(wf('L15', 2));
  return <StreetWorld from={from} cam={cam} eyes={1} dark={0.62}>
    <PixelSprite atlas={hero} x={34} y={250} keys={[
      {at: -999, pose: press ? 'turn0.scared' : 'turn0.worried'},
    ]} blink={false} />
    <Glow x={36} y={232} r={16 + 22 * flare * dying} color={!press && f >= alertAt && f < L(FLARE) ? 'rgba(255,70,80,1)' : color.phone} intensity={phone} flicker={0.05} seed="ots" />
    {/* the glass catches the phone */}
    <Glow x={40} y={200} r={30} rx={40} color={color.phone} intensity={0.35 * flare * dying} />
  </StreetWorld>;
};

// ---------- G. every eye finds your window ----------
const Eyes: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const finds = wf('L18', 4) - from;
  const cam = camAt(f, [
    {at: 0, x: 72, y: 206, zoom: 2.0},
    {at: finds - 1, x: 72, y: 206, zoom: 2.15},
    {at: finds, x: 72, y: 204, zoom: 2.6},
    {at: finds + 30, x: 72, y: 203, zoom: 2.75},
  ]);
  const step = Math.round(ramp(f, finds, 10) * 2);
  return <StreetWorld from={from} cam={cam} eyes={1 + ramp(f, finds, 3)} dark={0.55} phoneWash={0.5} step={step}>
    {CROWD.map((c, i) => <Rings key={i} x={c.x} y={c.y - 29} at={finds + (c.d % 4)} count={1} life={18} maxR={8} width={0.3} color="rgba(225,235,255,0.45)" />)}
  </StreetWorld>;
};

// ---------- I. kitchen inventory ----------
const ITEMS: {frame: string; x: number}[] = [
  {frame: 'water', x: 38}, {frame: 'water', x: 43}, {frame: 'cereal', x: 52}, {frame: 'phone', x: 59},
  {frame: 'flashlight', x: 68}, {frame: 'candles', x: 78},
];
const Kitchen: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const L = (g: number) => g - from;
  const lightAt = L(wf('L23', 5));
  const cam = camAt(f, [{at: 0, x: 64, y: 186, zoom: 2.0}, {at: L(S_DOOR), x: 64, y: 187, zoom: 2.15}]);
  const hot = (x: number, i: number) => <Glow x={x} y={188} r={6} rx={8} color="rgba(255,60,60,1)" intensity={0.9 * ramp(f, lightAt + i * 3, 3)} flicker={0.15} seed={`k${i}`} />;
  return <World cam={cam}>
    <SetLayer src="sets/kitchen_bg.png" />
    <Beam x={81} y={84} w0={26} w1={70} h={120} color={color.moon} intensity={0.75} />
    <PixelSprite atlas={hero} x={86} y={206} keys={[{at: 0, pose: 'down.worried'}, {at: L(wf('L22', 1)), pose: 'down.scared'}, {at: lightAt, pose: 'cover.scared'}]} />
    <SetLayer src="sets/kitchen_fg.png" />
    {ITEMS.map((it, i) => <PixelSprite key={i} atlas={items} frame={it.frame} x={it.x} y={193} breathe={false} squash={false} />)}
    <Darken amount={0.38} />
    {hot(59, 2)}{hot(68, 0)}{hot(78, 1)}
  </World>;
};

// ---------- J. hall: the knock, "Mom", the eyes in the door ----------
const Door: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const L = (g: number) => g - from;
  const knocks = KNOCKS.map(L);
  const dx = useHits(knocks, 1.1, 6);
  const turn = L(wf('L26'));
  const four = L(wf('L26', 2));
  const win = L(S_DOORWIN);
  const cam = camAt(f, [
    {at: 0, x: 60, y: 174, zoom: 1.55},
    {at: L(wf('L25')), x: 62, y: 170, zoom: 1.75},
    {at: four - 1, x: 64, y: 160, zoom: 2.35},                    // creep toward the voice
    {at: four, x: 38, y: 203, zoom: 3.4},                         // snap to your face
    {at: win - 1, x: 38, y: 203, zoom: 3.55},
    {at: win, x: 67, y: 134, zoom: 3.6},                          // cut: the door window
    {at: win + 90, x: 67, y: 133, zoom: 4.0},
  ]);
  const feet = f >= L(wf('L25')) ? 1 : 0;
  const eyes = ramp(f, win + 14, 12);
  return <World cam={cam} shake={knocks.some((k) => f >= k && f < k + 4) ? 0.35 : 0}>
    <SetLayer src="sets/hall_bg.png" />
    <PixelSprite atlas={props} frame="blinds6" x={116} y={241} breathe={false} squash={false} />
    {/* thin moonlight under the door, broken by two feet */}
    <Glow x={67} y={199} r={3} rx={24} color={color.moon} intensity={0.9} />
    <PixelSprite atlas={props} frame="door" x={67 + dx} y={199} breathe={false} squash={false} />
    {feet > 0 && <><div style={{position: 'absolute', left: 60, top: 197, width: 4, height: 2, background: '#050508'}} />
      <div style={{position: 'absolute', left: 70, top: 197, width: 4, height: 2, background: '#050508'}} /></>}
    {knocks.map((k, i) => <React.Fragment key={i}><Rings x={67} y={150} at={k} count={1} life={14} maxR={20} width={0.35} color="rgba(255,255,255,0.45)" /><Dust x={67} y={118} at={k} n={5} spread={30} /></React.Fragment>)}
    <PixelSprite atlas={hero} x={38} y={230} blink={false} keys={[
      {at: 0, pose: 'turn0.worried'}, {at: knocks[0], pose: 'turn0.scared'}, ...turnKeys(turn, 'shock', 3),
    ]} />
    <Darken amount={0.5} />
    {/* eyes at the little door window */}
    <div style={{opacity: eyes}}>
      <div style={{position: 'absolute', left: 62, top: 131, width: 2, height: 1, background: '#fff'}} />
      <div style={{position: 'absolute', left: 70, top: 131, width: 2, height: 1, background: '#fff'}} />
    </div>
    <Glow x={67} y={131} r={4} rx={9} color={color.ghost} intensity={1.1 * eyes} flicker={0.1} seed="de" />
  </World>;
};

// ---------- HUD state ----------
const hudAt = (f: number): {status: string; changed: number; chips: Chip[]} => {
  const status = f < S_STREET ? '02:14' : f < S_OTS ? '02:16' : f < S_KITCHEN ? '02:19' : f < S_DOOR ? '02:31' : '02:47';
  const changed = [S_STREET, S_OTS, S_KITCHEN, S_DOOR].filter((s) => f >= s).pop();
  const lights: Chip = f < LAMP_CLICK ? {label: 'LIGHTS', value: '2 ON', tone: 'bad'}
    : f < HALL_CLICK ? {label: 'LIGHTS', value: '1 ON', tone: 'warn', changedAt: LAMP_CLICK}
    : {label: 'LIGHTS', value: 'OFF', tone: 'ok', changedAt: HALL_CLICK};
  const screen: Chip = f < DRAG_END ? {label: 'SCREEN', value: '100%', tone: 'bad'}
    : f < FLARE ? {label: 'SCREEN', value: '1%', tone: 'warn', changedAt: DRAG_END}
    : f < PRESS ? {label: 'SCREEN', value: '100%', tone: 'bad', changedAt: FLARE}
    : {label: 'SCREEN', value: 'OFF', tone: 'ok', changedAt: PRESS};
  const batt: Chip = f < S_KITCHEN ? {label: 'BATT', value: '11%', tone: 'warn'} : {label: 'BATT', value: '9%', tone: 'bad', changedAt: wf('L22', 3)};
  return {status: `NIGHT 1 · ${status} AM`, changed: changed ?? -99, chips: [lights, screen, batt]};
};

export const LightsOut: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const hud = hudAt(f);
  const scream = wf('L01', 3);
  const choiceAt = wf('L27');
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={to - from}>{el}</Sequence>;
  return <AbsoluteFill style={{background: color.night}}>
    {seq(S_BED, S_HALL, <Bedroom />)}
    {seq(S_HALL, S_BRIGHT, <Hall from={S_HALL} />)}
    {seq(S_BRIGHT, S_STREET, <Bright from={S_BRIGHT} />)}
    {seq(S_STREET, S_OTS, <Street from={S_STREET} />)}
    {seq(S_OTS, S_EYES, <Ots from={S_OTS} />)}
    {seq(S_EYES, S_PRESS, <Eyes from={S_EYES} />)}
    {seq(S_PRESS, S_KITCHEN, <Ots from={S_PRESS} press />)}
    {seq(S_KITCHEN, S_DOOR, <Kitchen from={S_KITCHEN} />)}
    {seq(S_DOOR, LIGHTS_FRAMES, <Door from={S_DOOR} />)}

    {/* alert washes and shock flashes */}
    <Tint color="#ff1e2e" from={scream} to={wf('L04') - 6} peak={0.3} pulse={18} />
    <Flash at={scream} color="#ff2d3d" dur={4} peak={0.55} />
    <Tint color="#ff1e2e" from={wf('L05', 3)} to={S_BRIGHT - 4} peak={0.26} pulse={18} />
    <Flash at={wf('L05', 3)} color="#ff2d3d" dur={4} peak={0.45} />
    <Blackout from={LIGHT_OUT + 2} to={TURN} peak={0.55} />
    <Flash at={TURN} color="#ffffff" dur={3} peak={0.3} />
    <Tint color="#ff1e2e" from={wf('L15', 2)} to={FLARE - 2} peak={0.24} pulse={18} />
    <Flash at={wf('L15', 2)} color="#ff2d3d" dur={4} peak={0.4} />
    <Flash at={FLARE} color="#dff0ff" dur={5} peak={0.6} />
    <Flash at={wf('L18', 4)} color="#ff2d3d" dur={4} peak={0.45} />
    <Flash at={S_DOORWIN} color="#ffffff" dur={2} peak={0.2} />
    <Vignette strength={0.82} />

    {seq(scream, wf('L04') - 4, <AlertCard at={1} title="EMERGENCY ALERT" body="Turn off all lights around you." sub="Remain indoors. Do not ask why." y={1420} />)}
    {seq(wf('L05', 3), S_BRIGHT, <AlertCard at={1} title="EMERGENCY ALERT (2)" body="This includes screens." sub="Power down every device." y={1420} />)}
    {seq(wf('L15', 2), FLARE, <AlertCard at={1} title="EMERGENCY ALERT (3)" body="They follow light." sub="Do not let them see you." y={1420} />)}
    {seq(FLARE, S_EYES, <MessageBanner at={0} from="Mom" text="are you okay??" y={420} />)}
    {seq(S_KITCHEN, S_DOOR, <Inventory lightAt={wf('L23', 5) - S_KITCHEN} items={[
      {at: wf('L21', 0) - S_KITCHEN, label: 'WATER', value: '×2'},
      {at: wf('L21', 4) - S_KITCHEN, label: 'CEREAL', value: '½ BOX'},
      {at: wf('L22', 1) - S_KITCHEN, label: 'FLASHLIGHT', value: '×1', light: true},
      {at: wf('L22', 2) - S_KITCHEN, label: 'CANDLES', value: '×2', light: true},
      {at: wf('L22', 3) - S_KITCHEN, label: 'PHONE', value: '9%', light: true},
    ]} />)}

    {f < choiceAt && <Hud series="LIGHTS OUT" part="PART 1" status={hud.status} statusChangedAt={hud.changed} chips={hud.chips} />}
    {f < choiceAt && <WordCaption phrases={PHRASES} />}
    {seq(choiceAt - 2, LIGHTS_FRAMES, <><AbsoluteFill style={{background: '#05060a', opacity: 0.6}} />
      <ChoiceStack at={2} title="YOUR CALL." a="TURN IT ON" b="STAY DARK" aAt={14} bAt={24} y={600} /></>)}
    <Audio src={staticFile('audio/lights-mix.wav')} />
  </AbsoluteFill>;
};
