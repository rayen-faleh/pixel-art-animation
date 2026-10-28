import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../ns-timing.json';
import plates from '../../public/sets/plates.json';
import heroA from '../../public/sprites/hero.json';
import heroXA from '../../public/sprites/hero_actions.json';
import civA from '../../public/sprites/civilians.json';
import crawlA from '../../public/sprites/crawler.json';
import fgA from '../../public/sprites/fg_props.json';
import supA from '../../public/sprites/supplies.json';
import nsA from '../../public/sprites/ns_props.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, ramp, clamp} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Darken, Tint, Flash, Vignette, Rings, useHits, Dust} from '../kit/effects';
import {WordCaption, Hud, AlertCard, phrasesFrom, Word, Chip} from '../kit/overlay';
import {Inventory, ChoiceStack, Blackout} from './lights-ui';
import {CctvOverlay, CctvFilter, NoiseMeter} from './ns-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), heroX = A(heroXA), civ = A(civA), crawl = A(crawlA), fgp = A(fgA), sup = A(supA), ns = A(nsA);
const P = plates as Record<string, {w: number}>;

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
export const NS_FRAMES = Math.ceil(timing.duration * FPS) + 80;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'N26'), 0.5);

// shots
const S = {
  ext: 0, details: cut('N02'), counter: cut('N03'), walkie: cut('N05'), lock: cut('N07'), silence: cut('N11'),
  cctv1: cut('N12'), wave: cut('N14'), cctv2: cut('N15'), dive: cut('N16'), hide: cut('N17'), swarm: cut('N22'),
  whisper: cut('N23'), church: cut('N24'), keys: cut('N25'),
};
// events (mirrored in scripts/build_ns_cues.py)
const E = {
  humOff: wf('N07', 1), iceOff: wf('N07', 5), switchHit: wf('N08', 2), rollStart: wf('N09', 0), jam: wf('N10', 1),
  bass: wf('N12', 1), carIn: wf('N12', 2), carStop: wf('N12', 9), headTurn: wf('N13', 8), wave: wf('N14', 4),
  seesYou: wf('N15', 1), seesIt: wf('N15', 5), runs: wf('N15', 8), bang: wf('N16', 6), breath: wf('N18', 0),
  hand: wf('N19', 3), press: wf('N20', 1), away: wf('N21', 1), keys: wf('N25', 1), choice: wf('N26'),
};

// ---------- store interior pieces ----------
export const WALKIE_X = 8;
export const SHUT_TOP = 61, SHUT_JAM = 188, SHUT_X0 = 43, SHUT_X1 = 159;
const shutterBottom = (g: number) => g < E.rollStart ? SHUT_TOP
  : interpolate(g, [E.rollStart, E.jam], [SHUT_TOP, SHUT_JAM + 2], {...clamp, easing: Easing.inOut(Easing.quad)}) - (g >= E.jam && g < E.jam + 3 ? 0 : g >= E.jam ? 2 : 0);

const Shutter: React.FC<{g: number; dx?: number}> = ({g, dx = 0}) => {
  const b = shutterBottom(g);
  if (b <= SHUT_TOP + 0.5) return null;
  return <div style={{position: 'absolute', left: SHUT_X0 + dx, top: SHUT_TOP, width: SHUT_X1 - SHUT_X0, height: b - SHUT_TOP,
    background: 'repeating-linear-gradient(180deg, #6d7282 0 1px, #555a69 1px 2px, #464a57 2px 3px)', borderBottom: '2px solid #2a2d36'}} />;
};

/** The store. `g` = global frame. Lights/ice/sign switch off on their words; shutter rolls & jams. */
export const Store: React.FC<{g: number; children?: React.ReactNode; front?: React.ReactNode; bangDx?: number}> = ({g, children, front, bangDx = 0}) => {
  const lightsOn = g < E.humOff, iceOn = g < E.iceOff;
  const gap = shutterBottom(g) >= SHUT_JAM - 1;
  const flick = lightsOn ? 1 : 0;
  return <>
    <SetLayer src="sets/store_bg.png" width={160} />
    {/* outside canopy light seen through the glass (until the shutter covers it) */}
    <Glow x={86} y={120} r={30} rx={60} color="rgba(220,235,255,1)" intensity={0.55} />
    <PixelSprite atlas={ns} frame={lightsOn ? 'open_on' : 'open_off'} x={64} y={112} breathe={false} squash={false} />
    {lightsOn && <Glow x={64} y={104} r={10} rx={16} color="rgba(255,60,60,1)" intensity={0.9} flicker={0.2} seed="open" />}
    <Shutter g={g} dx={bangDx} />
    {gap && <><Glow x={100} y={199} r={2.5} rx={58} color="rgba(220,235,255,1)" intensity={1.8} flicker={0.05} seed="gap" />
      <Glow x={104} y={204} r={8} rx={60} color="rgba(220,235,255,1)" intensity={0.6} /></>}
    {children}
    <SetLayer src="sets/store_fg.png" width={160} />
    <PixelSprite atlas={ns} frame="register" x={26} y={202} breathe={false} squash={false} />
    <PixelSprite atlas={ns} frame="cctv" x={50} y={202} breathe={false} squash={false} />
    <PixelSprite atlas={ns} frame="walkie" x={WALKIE_X} y={202} breathe={false} squash={false} />
    {front}
    <Darken amount={lightsOn ? 0.18 : 0.55} />
    {flick > 0 && <><Glow x={44} y={34} r={80} color="rgba(225,235,255,1)" intensity={0.55} flicker={0.04} seed="t1" />
      <Glow x={114} y={34} r={80} color="rgba(225,235,255,1)" intensity={0.55} flicker={0.04} seed="t2" /></>}
    <Glow x={50} y={188} r={14} color="rgba(150,220,200,1)" intensity={lightsOn ? 0.3 : 0.75} flicker={0.1} seed="mon" />
    {iceOn && <Glow x={27.5} y={167.5} r={3} color="rgba(90,170,255,1)" intensity={1} />}
  </>;
};

export const Ext: React.FC<{shuttered: boolean; children?: React.ReactNode; s?: number}> = ({shuttered, children}) => <>
  <SetLayer src="sets/gas_station_bg.png" width={P.gas_station.w} />
  <Glow x={55} y={84} r={36} rx={44} color="rgba(225,235,255,1)" intensity={0.9} flicker={0.03} seed="c1" />
  <Glow x={104} y={84} r={36} rx={44} color="rgba(225,235,255,1)" intensity={0.9} flicker={0.03} seed="c2" />
  <Glow x={82} y={142} r={18} rx={78} color="rgba(225,235,255,1)" intensity={0.45} />
  {!shuttered && <Glow x={80} y={116} r={14} rx={52} color={color.warm} intensity={0.8} />}
  {shuttered && <><div style={{position: 'absolute', left: 30, top: 105, width: 104, height: 18,
    background: 'repeating-linear-gradient(180deg, #6d7282 0 1px, #464a57 1px 2px)'}} />
    <Glow x={82} y={124} r={1.5} rx={52} color="rgba(255,240,210,1)" intensity={0.9} /></>}
  <SetLayer src="sets/gas_station_fg.png" width={P.gas_station.w} />
  {children}
</>;
const sc = 0.55;  // sprites at the plate's smaller scale; only ever seen through CCTV
export const ES: React.FC<{atlas: Atlas; f: string; x: number; y: number; flip?: boolean; o?: number}> = ({atlas, f, x, y, flip, o = 1}) =>
  <PixelSprite atlas={atlas} frame={f} x={x} y={y} flip={flip} scale={sc} breathe={false} squash={false} opacity={o} />;
export const crawlFrame = (g: number, off = 0) => `crawl${Math.floor((g + off) / 4) % 4}`;

// ---------- shots ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, [{at: 0, x: 80, y: 120, zoom: 1.0}, {at: S.details, x: 80, y: 112, zoom: 1.25, ease: Easing.linear}]);
  return <World cam={cam}>
    <Ext shuttered={false}>
      {[0, 30, 60, 90, 120].map((d) => <Rings key={d} x={82} y={112} at={d} count={1} life={70} maxR={110} width={0.5} color="rgba(255,255,255,0.35)" />)}
    </Ext>
    <Darken amount={0.2} />
  </World>;
};

const Details: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from;
  const cam = camAt(f, [
    {at: 0, x: 80, y: 120, zoom: 1.2},
    {at: L(wf('N02', 1)) - 1, x: 80, y: 110, zoom: 1.3},
    {at: L(wf('N02', 1)), x: 44, y: 34, zoom: 4.2},
    {at: L(wf('N02', 4)) - 1, x: 46, y: 36, zoom: 4.3},
    {at: L(wf('N02', 4)), x: 17, y: 172, zoom: 3.8},
    {at: L(wf('N02', 8)) - 1, x: 18, y: 172, zoom: 3.9},
    {at: L(wf('N02', 8)), x: 64, y: 104, zoom: 4.4},
    {at: L(S.counter), x: 64, y: 104, zoom: 4.6},
  ]);
  const iceShake = f >= L(wf('N02', 4)) && f < L(wf('N02', 8)) ? Math.sin(f * 3.1) * 0.25 : 0;
  return <World cam={{...cam, x: cam.x + iceShake}}>
    <Store g={f + from} />
    <Rings x={44} y={30} at={L(wf('N02', 1))} count={3} every={8} life={26} maxR={14} width={0.25} />
    <Rings x={17} y={170} at={L(wf('N02', 4))} count={3} every={8} life={26} maxR={14} width={0.25} />
    <Rings x={64} y={104} at={L(wf('N02', 8))} count={3} every={8} life={26} maxR={12} width={0.25} color="rgba(255,120,120,0.8)" />
  </World>;
};

const Counter: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from;
  const cam = camAt(f, [{at: 0, x: 66, y: 178, zoom: 2.2}, {at: L(S.walkie), x: 70, y: 180, zoom: 2.4}]);
  return <World cam={cam}>
    <Store g={f + from}>
      <PixelSprite atlas={hero} x={66} y={214} keys={[{at: 0, pose: 'down.neutral'}, {at: L(wf('N04', 9)), pose: 'down.worried'}]} />
    </Store>
  </World>;
};

const Walkie: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from;
  const crackle = L(wf('N05', 3));
  const cam = camAt(f, [{at: 0, x: 40, y: 186, zoom: 2.6}, {at: crackle - 1, x: 36, y: 188, zoom: 2.8}, {at: crackle, x: 14, y: 194, zoom: 4.2}, {at: L(S.lock), x: 14, y: 194, zoom: 4.5}]);
  return <World cam={cam} shake={f >= crackle && f < crackle + 8 ? 0.3 : 0}>
    <Store g={f + from}>
      <PixelSprite atlas={hero} x={66} y={214} keys={[{at: 0, pose: 'down.worried'}, {at: crackle, pose: 'down.shock'}]} />
    </Store>
    {[0, 1, 2, 3, 4, 5].map((k) => <Rings key={k} x={WALKIE_X} y={194} at={crackle + k * 22} count={2} every={6} life={22} maxR={12} width={0.3} color="rgba(255,90,90,0.85)" />)}
  </World>;
};

const Lock: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from; const g = f + from;
  const jam = L(E.jam);
  const dx = useHits([jam], 1.4, 6);
  const cam = camAt(f, [
    {at: 0, x: 80, y: 150, zoom: 1.3},
    {at: L(E.rollStart), x: 92, y: 140, zoom: 1.45},
    {at: jam - 1, x: 96, y: 160, zoom: 1.55},
    {at: L(wf('N10', 2)) - 1, x: 98, y: 166, zoom: 1.6},
    {at: L(wf('N10', 2)), x: 128, y: 190, zoom: 2.6},                     // "Knee height"
    {at: L(S.cctv1), x: 128, y: 191, zoom: 2.8},
  ]);
  const rolling = g >= E.rollStart && g < E.jam;
  return <World cam={cam} shake={rolling ? 0.12 : f >= jam && f < jam + 6 ? 0.5 : 0}>
    <Store g={g} bangDx={dx * 0.3}>
      <PixelSprite atlas={hero} x={66} y={214} flip={g >= E.switchHit - 4 && g < E.rollStart + 10} keys={[
        {at: 0, pose: 'down.scared'}, {at: L(E.switchHit) - 4, pose: 'reach.scared'}, {at: L(E.rollStart) + 10, pose: 'down.scared'}, {at: jam, pose: 'down.shock'},
      ]} />
    </Store>
    {rolling && <Rings x={100} y={57} at={L(E.rollStart)} count={8} every={9} life={24} maxR={30} width={0.35} color="rgba(255,120,120,0.7)" />}
    <Dust x={100} y={64} at={jam} n={6} spread={60} />
    <Rings x={44} y={34} at={L(E.humOff)} count={1} life={10} maxR={8} width={0.3} />
  </World>;
};

const Silence: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const cam = camAt(f, [{at: 0, x: 92, y: 170, zoom: 1.7}, {at: 80, x: 92, y: 172, zoom: 1.85}]);
  return <World cam={cam}><Store g={f + from}><PixelSprite atlas={hero} x={66} y={214} keys={[{at: 0, pose: 'down.scared'}]} /></Store></World>;
};

const Cctv1: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from; const g = f + from;
  const carX = interpolate(g, [E.carIn, E.carStop], [-40, 118], {...clamp, easing: Easing.out(Easing.cubic)});
  const roof = wf('N13', 3);
  const cam = camAt(f, [
    {at: 0, x: 82, y: 120, zoom: 1.0},
    {at: L(roof) - 1, x: 86, y: 118, zoom: 1.1},
    {at: L(roof), x: 82, y: 72, zoom: 2.6},                               // digital zoom onto the canopy roof
    {at: L(S.wave), x: 82, y: 71, zoom: 2.9},
  ]);
  const turned = g >= E.headTurn;
  return <><CctvFilter><World cam={cam}>
    <Ext shuttered>
      {f >= L(roof) && <ES atlas={crawl} f={turned ? 'frozen' : 'crawl0'} x={80} y={68} />}
      {carX > -39 && <><ES atlas={fgp} f="car_side" x={carX} y={152} />
        <Rings x={carX} y={140} at={L(E.bass)} count={40} every={8} life={20} maxR={18} width={0.5} color="rgba(255,255,255,0.5)" /></>}
      {g >= E.carStop + 15 && <><ES atlas={civ} f="driver.front" x={102} y={150} /><Glow x={102} y={140} r={12} color="rgba(225,235,255,1)" intensity={0.55} /></>}
    </Ext>
  </World></CctvFilter><CctvOverlay cam="CAM 02 · PUMPS" clock="03:31:07" /></>;
};

const Wave: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from; const g = f + from;
  const wv = g >= E.wave ? Math.round(Math.sin(f * 0.9) * 1) : 0;
  const cam = camAt(f, [{at: 0, x: 128, y: 196, zoom: 2.4}, {at: L(S.cctv2), x: 130, y: 197, zoom: 2.6}]);
  return <World cam={cam}><Store g={g} front={<PixelSprite atlas={heroX} frame="prone" x={138 + wv} y={216} breathe={false} squash={false} />} /></World>;
};

const Cctv2: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const runT = ramp(g, E.runs, 26, Easing.in(Easing.quad));
  const dx = 102 + (90 - 102) * runT, dy = 150 + (128 - 150) * runT;
  const drop = ramp(g, E.runs + 6, 24, Easing.in(Easing.quad));
  const crX = g < E.seesIt ? 80 : interpolate(g, [E.seesIt, E.runs + 6], [80, 96], clamp);
  const crY = 68 + (124 - 68) * drop;
  const cam = camAt(f, [{at: 0, x: 84, y: 112, zoom: 1.25}, {at: 120, x: 86, y: 110, zoom: 1.4}]);
  const driver = g < E.seesYou ? 'driver.front' : g < E.seesIt ? 'driver.back' : g < E.runs ? 'driver.34l' : 'driver.back';
  return <><CctvFilter><World cam={cam}>
    <Ext shuttered>
      <ES atlas={fgp} f="car_side" x={118} y={152} />
      <Rings x={118} y={140} at={0} count={20} every={8} life={20} maxR={18} width={0.5} color="rgba(255,255,255,0.5)" />
      {runT < 0.98 && <><ES atlas={civ} f={driver} x={dx} y={dy} flip={g >= E.seesIt && g < E.runs} /><Glow x={dx} y={dy - 10} r={12} color="rgba(225,235,255,1)" intensity={0.55} /></>}
      <ES atlas={crawl} f={g < E.seesIt ? 'frozen' : crawlFrame(g)} x={crX} y={crY} />
    </Ext>
  </World></CctvFilter><CctvOverlay cam="CAM 02 · PUMPS" clock="03:31:19" /></>;
};

const Dive: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from; const g = f + from;
  const bang = L(E.bang);
  const slide = ramp(f, 2, 16, Easing.out(Easing.cubic));
  const dx = useHits([bang], 1.6, 7);
  const cam = camAt(f, [{at: 0, x: 120, y: 196, zoom: 2.6}, {at: bang - 1, x: 118, y: 194, zoom: 2.6}, {at: bang, x: 122, y: 180, zoom: 2.0}, {at: L(S.hide), x: 120, y: 182, zoom: 2.1}]);
  return <World cam={cam} shake={f >= bang && f < bang + 10 ? 0.6 : 0}>
    <Store g={g} bangDx={dx} front={<>
      <div style={{position: 'absolute', left: 150 - 46 * slide, top: 214, transform: 'rotate(-80deg)', transformOrigin: '0 0'}}>
        <PixelSprite atlas={civ} frame="driver.34l" x={0} y={0} breathe={false} squash={false} />
      </div>
      <PixelSprite atlas={hero} x={100} y={214} keys={[{at: 0, pose: 'reach.scared'}, {at: bang, pose: 'down.shock'}]} />
    </>} />
    <Rings x={130} y={170} at={bang} count={3} every={4} life={22} maxR={40} width={0.6} color="rgba(255,90,90,0.9)" />
    <Dust x={110} y={150} at={bang} n={14} spread={100} />
  </World>;
};

const Hide: React.FC<{from: number; keys?: boolean}> = ({from, keys}) => {
  const f = useCurrentFrame(); const L = (g: number) => g - from; const g = f + from;
  const breathing = g >= E.breath && g < E.press;
  const bob = breathing ? Math.round(Math.sin(f * 1.6)) : 0;
  const handIn = keys ? 0 : ramp(g, E.hand, 40, Easing.out(Easing.quad)) * (1 - ramp(g, E.away, 26, Easing.in(Easing.quad)));
  const cam = keys ? camAt(f, [{at: 0, x: 90, y: 192, zoom: 2.0}, {at: 100, x: 90, y: 191, zoom: 2.2}])
    : camAt(f, [
      {at: 0, x: 96, y: 190, zoom: 1.8},
      {at: L(E.hand) - 1, x: 98, y: 192, zoom: 2.0},
      {at: L(E.hand), x: 104, y: 194, zoom: 2.3},
      {at: L(E.press) - 1, x: 104, y: 195, zoom: 2.45},
      {at: L(E.press), x: 88, y: 192, zoom: 2.6},
      {at: L(S.swarm), x: 92, y: 193, zoom: 2.4},
    ]);
  const keyUp = keys ? ramp(g, E.keys, 10, Easing.out(Easing.back(2))) : 0;
  return <World cam={cam}>
    <Store g={g}>
      <PixelSprite atlas={hero} x={72} y={214} keys={[{at: -999, pose: 'down.scared'}, ...(keys ? [] : [{at: L(E.hand), pose: 'down.shock'}, {at: L(E.press), pose: 'reach.scared'}, {at: L(E.away) + 20, pose: 'down.worried'}])]} />
      <PixelSprite atlas={civ} frame="driver.front" x={90} y={212 + bob} breathe={false} squash={false} />
      {/* the hand: crawler 'under_door' sliding out from under the jammed shutter */}
      <div style={{position: 'absolute', left: 105, top: SHUT_JAM - 2, width: 60, height: 20, overflow: 'hidden'}}>
        <PixelSprite atlas={crawl} frame="under_door" x={60 - 37 * handIn} y={15} breathe={false} squash={false} />
      </div>
    </Store>
    {keys && <PixelSprite atlas={sup} frame="car_fob" x={99} y={190 - 6 * keyUp} scale={0.5} breathe={false} squash={false} opacity={keyUp} />}
    {breathing && <Rings x={90} y={186} at={L(E.breath)} count={30} every={9} life={14} maxR={7} width={0.25} color="rgba(255,255,255,0.6)" />}
    {handIn > 0.3 && <Glow x={128} y={198} r={3} rx={6} color={color.ghost} intensity={0.9 * handIn} />}
  </World>;
};

const Swarm: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const cam = camAt(f, [{at: 0, x: 112, y: 140, zoom: 1.9}, {at: 150, x: 114, y: 141, zoom: 2.1}]);
  const spots = [[100, 133, 0], [136, 137, 5], [82, 150, 9], [150, 156, 13], [116, 160, 2]];
  return <><CctvFilter><World cam={cam}>
    <Ext shuttered>
      <ES atlas={fgp} f="car_side" x={118} y={152} />
      {spots.map(([x, y, o], i) => <ES key={i} atlas={crawl} f={crawlFrame(g, o)} x={x + Math.sin((g + o * 7) / 9) * 2} y={y} flip={i % 2 === 1} />)}
      <Rings x={118} y={140} at={0} count={30} every={8} life={20} maxR={18} width={0.5} color="rgba(255,255,255,0.5)" />
    </Ext>
  </World></CctvFilter><CctvOverlay cam="CAM 02 · PUMPS" clock="03:44:52" /></>;
};

const Whisper: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  return <World cam={camAt(f, [{at: 0, x: 14, y: 194, zoom: 4.2}, {at: 60, x: 14, y: 194, zoom: 4.6}])}>
    <Store g={f + from} />
    <Rings x={WALKIE_X} y={194} at={4} count={2} every={10} life={24} maxR={8} width={0.25} color="rgba(255,255,255,0.6)" />
  </World>;
};

const Church: React.FC = () => {
  const f = useCurrentFrame();
  return <World cam={camAt(f, [{at: 0, x: 118, y: 120, zoom: 2.3}, {at: 120, x: 120, y: 118, zoom: 2.6}])}>
    <SetLayer src="sets/town_bg.png" width={P.town.w} />
    <Glow x={130} y={50} r={30} color={color.moon} intensity={0.5} />
    <Glow x={121} y={126} r={6} rx={9} color={color.warm} intensity={1.2} flicker={0.15} seed="ch" />
    <SetLayer src="sets/town_fg.png" width={P.town.w} />
  </World>;
};

// ---------- HUD + noise ----------
const noiseAt = (g: number) => {
  let base = g < E.humOff ? 0.5 : g < E.iceOff ? 0.32 : 0.06;
  if (g >= E.bass) base = Math.max(base, g < S.hide ? 0.3 : 0.18);
  const spikes: [number, number, number][] = [   // [start, end, level]
    [wf('N05', 3), we('N06'), 0.85], [E.rollStart, E.jam, 1.0], [E.bang, E.bang + 20, 1.0],
    [E.breath, E.press, 0.6], [wf('N24'), we('N24'), 0.35],
  ];
  let lv = base;
  for (const [a, b, l] of spikes) if (g >= a && g < b + 12) lv = Math.max(lv, l * (g < b ? 1 : 1 - (g - b) / 12));
  const jitter = Math.sin(g * 1.7) * 0.03 + Math.sin(g * 0.53) * 0.02;
  return Math.max(0, lv + (lv > 0.1 ? jitter : 0));
};
const hudAt = (g: number) => {
  const clock = g < S.cctv1 ? '03:12' : g < S.hide ? '03:31' : g < S.keys ? '03:44' : '03:52';
  const chips: Chip[] = [
    g < E.jam ? {label: 'SHUTTER', value: 'UP', tone: 'ok'} : {label: 'SHUTTER', value: 'JAMMED', tone: 'bad', changedAt: E.jam},
    ...(g >= E.bang ? [{label: 'PEOPLE', value: '2', tone: 'warn' as const, changedAt: E.bang}] : []),
    ...(g >= E.keys ? [{label: 'DAWN', value: '3H', tone: 'warn' as const, changedAt: E.keys}] : []),
  ];
  return {status: `NIGHT 1 · ${clock} AM`, chips, changed: [S.cctv1, S.hide, S.keys].filter((s) => g >= s).pop() ?? -99};
};

export const NightShift: React.FC = () => {
  useKitFonts();
  const g = useCurrentFrame();
  const hud = hudAt(g);
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={to - from}>{el}</Sequence>;
  return <AbsoluteFill style={{background: color.night}}>
    {seq(S.ext, S.details, <Hook />)}
    {seq(S.details, S.counter, <Details from={S.details} />)}
    {seq(S.counter, S.walkie, <Counter from={S.counter} />)}
    {seq(S.walkie, S.lock, <Walkie from={S.walkie} />)}
    {seq(S.lock, S.silence, <Lock from={S.lock} />)}
    {seq(S.silence, S.cctv1, <Silence from={S.silence} />)}
    {seq(S.cctv1, S.wave, <Cctv1 from={S.cctv1} />)}
    {seq(S.wave, S.cctv2, <Wave from={S.wave} />)}
    {seq(S.cctv2, S.dive, <Cctv2 from={S.cctv2} />)}
    {seq(S.dive, S.hide, <Dive from={S.dive} />)}
    {seq(S.hide, S.swarm, <Hide from={S.hide} />)}
    {seq(S.swarm, S.whisper, <Swarm from={S.swarm} />)}
    {seq(S.whisper, S.church, <Whisper from={S.whisper} />)}
    {seq(S.church, S.keys, <Church />)}
    {seq(S.keys, NS_FRAMES, <Hide from={S.keys} keys />)}

    <Tint color="#ff1e2e" from={wf('N05', 3)} to={we('N06')} peak={0.22} pulse={18} />
    <Flash at={wf('N05', 3)} color="#ff2d3d" dur={4} peak={0.4} />
    <Flash at={E.jam} color="#ffffff" dur={2} peak={0.25} />
    <Blackout from={we('N11') - 4} to={S.cctv1} peak={0.35} />
    <Flash at={E.headTurn} color="#ffffff" dur={2} peak={0.3} />
    <Flash at={E.bang} color="#ff2d3d" dur={4} peak={0.5} />
    <Flash at={E.hand} color="#ffffff" dur={2} peak={0.18} />
    <Vignette strength={0.82} />

    {seq(wf('N06'), we('N06') + 20, <AlertCard at={1} title="COUNTY DISPATCH · CH 9" body="They hunt by sound." sub="Go silent. Now." y={1420} />)}
    {seq(S.counter, S.walkie, <Inventory lightAt={99999} y={360} items={[
      {at: wf('N03', 3) - S.counter, label: 'CROWBAR', value: '×1'},
      {at: wf('N03', 5) - S.counter, label: 'WALKIE', value: '×1'},
      {at: wf('N04', 4) - S.counter, label: 'WATER', value: '×200'},
      {at: wf('N04', 6) - S.counter, label: 'SNACKS', value: 'ALL OF THEM'},
      {at: wf('N04', 9) - S.counter, label: 'SHUTTER', value: 'UP'},
    ]} />)}

    {g < E.choice && <Hud series="NIGHT SHIFT" part="PART 1" status={hud.status} statusChangedAt={hud.changed} chips={hud.chips} />}
    {g < E.choice && <NoiseMeter level={noiseAt(g)} />}
    {g < E.choice && <WordCaption phrases={PHRASES} />}
    {seq(E.choice - 2, NS_FRAMES, <><AbsoluteFill style={{background: '#05060a', opacity: 0.6}} />
      <ChoiceStack at={2} title="YOUR CALL." a="RUN FOR THE CAR" b="WAIT FOR DAWN" aAt={14} bAt={24} y={600} /></>)}
    <Audio src={staticFile('audio/ns-mix.wav')} />
  </AbsoluteFill>;
};
