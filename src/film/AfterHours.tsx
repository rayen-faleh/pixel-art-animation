import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../ah-timing.json';
import heroA from '../../public/sprites/hero.json';
import janA from '../../public/sprites/janitor.json';
import infA from '../../public/sprites/infected.json';
import propA from '../../public/sprites/school_props.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Darken, Flash, Vignette, Rings, useHits} from '../kit/effects';
import {WordCaption, Hud, phrasesFrom, Word} from '../kit/overlay';
import {NoiseMeter} from './ns-ui';
import {Phone} from './soul-ui';
import {RuleCard, SeriesCard, AlertScreen, IncomingCall, Thread, DoorPane, Question} from './ah-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), jan = A(janA), inf = A(infA), prop = A(propA);

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'A18'), 0.5);

// shots (mirrored in scripts/build_ah_cues.py)
const S = {
  lib: 0, alert: cut('A02'), heat: cut('A03'), hall1: cut('A03', 3), freeze: cut('A04'), speaker: cut('A05'), lot: cut('A06'),
  rule1: cut('A07'), window: cut('A08'), call: cut('A09'), rule2: cut('A11'), hall2: cut('A12'), hallwin: cut('A13'),
  drop: we('A14', 4) + 2, rule3: cut('A15'), knock: cut('A16'), text: cut('A17'), choice: wf('A18') - 2, end: we('A18') + 12,
};
export const AH_FRAMES = S.end + 105;
const E = {
  phone: wf('A01', 14), scream: wf('A01', 16), stop: wf('A03', 2), dark: wf('A04', 0) - 1, locker: Math.round(19.95 * FPS),
  crackle: wf('A05', 2), three: wf('A06', 6), streetOff: wf('A08', 6), decline: wf('A10', 0) + 4, textOut: wf('A10', 1) + 6, reply: wf('A10', 5),
  decline2: wf('A11', 5), shout: wf('A12', 5), keys: wf('A12c', 2), gone: we('A12c') + 4, answers: wf('A13', 1), mimic: wf('A13b', 0),
  turns: wf('A14', 1), drop: wf('A14', 6) + 5, face: wf('A14', 9) + 4, faceOff: we('A15') + 6, knock: wf('A16', 1), friend: wf('A16b', 0), lol: wf('A17', 6),
};
const KNOCKS = [E.knock, E.knock + 7, E.knock + 14, we('A16b') + 2, we('A16b') + 9];
const LIGHT_OFF = [wf('A03', 6), wf('A03', 7), wf('A03', 9), we('A03') - 2];   // hall panels, far -> near

// ---------- hallway geometry (kit/sets_school.py) ----------
const VPX = 67, VPY = 112;
const floorY = (z: number) => VPY + 120 / z;
const atX = (wx: number, z: number) => VPX + wx / z;
const PANELS = [3.4, 2.6, 1.9, 1.25];
const panelY = (pz: number) => VPY + (20 - VPY) / (pz + 0.09);

const Hall: React.FC<{g: number; lit?: boolean[]; children?: React.ReactNode; dark?: number}> = ({g, lit = [false, false, false, false], children, dark = 0.35}) => <>
  <SetLayer src="sets/hall_bg.png" />
  {children}
  <Darken amount={dark + lit.filter((l) => !l).length * 0.1} />
  {PANELS.map((pz, i) => lit[i] && <Glow key={i} x={VPX} y={panelY(pz)} r={46 / pz + 8} color="rgba(225,235,255,1)" intensity={0.55} flicker={0.06} seed={`hp${i}`} />)}
  <Glow x={VPX} y={95} r={10} color="rgba(255,60,60,1)" intensity={0.7} flicker={0.05} seed="exit" />
  <Glow x={VPX} y={140} r={22} color="rgba(255,60,60,1)" intensity={0.18} />
</>;

const Library: React.FC<{g: number; lit: boolean; children?: React.ReactNode}> = ({g, lit, children}) => <>
  <SetLayer src="sets/library_bg.png" />
  {children}
  <SetLayer src="sets/library_fg.png" />
  <Darken amount={lit ? 0.15 : 0.62} />
  {lit && <><Glow x={33} y={20} r={60} color="rgba(225,235,255,1)" intensity={0.45} flicker={0.03} seed="l1" />
    <Glow x={101} y={20} r={60} color="rgba(225,235,255,1)" intensity={0.45} flicker={0.03} seed="l2" /></>}
  <Glow x={34} y={100} r={40} color={color.moon} intensity={lit ? 0.15 : 0.3} />
  <Glow x={67} y={174} r={16} color={color.phone} intensity={lit ? 0.3 : 0.75} flicker={0.04} seed="lap" />
</>;

const HX = 67, HY = 196;
const LibShot: React.FC<{from: number; to: number; cam: CamKey[]; keys: {at: number; pose: string}[]; litUntil?: number}> = ({from, cam, keys, litUntil = 1e9}) => {
  const f = useCurrentFrame(); const g = f + from;
  const phone = keys.some((k) => g >= k.at && k.pose.startsWith('phone'));
  return <World cam={camAt(g, cam)}><Library g={g} lit={g < litUntil}>
    <PixelSprite atlas={hero} x={HX} y={HY} keys={keys.map((k) => ({...k, at: k.at - from}))} />
  </Library>{phone && <Glow x={HX} y={HY - 16} r={9} color={color.phone} intensity={0.7} />}</World>;
};

/** Library door from inside. Hallway shows through the window hole; hero beside the door. */
const Door: React.FC<{from: number; hero?: boolean; face?: [number, number]; shadowFrom?: number; dim?: number; zoom?: number}> = ({from, hero: showHero = true, face, shadowFrom, dim = 0.55, zoom}) => {
  const f = useCurrentFrame(); const g = f + from;
  const hit = useHits(KNOCKS.map((k) => k - from), 1.0, 6);
  const dropP = interpolate(g, [E.drop, E.drop + 4], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const faceOn = face && g >= face[0] && g < face[1];
  const faceY = face ? interpolate(g, [face[1] - 8, face[1]], [212, 226], clamp) : 212;
  const z = zoom ?? 1.7 + f * 0.002;
  return <World cam={{x: 62, y: 166, zoom: z}} shake={Math.abs(hit) * 0.6}>
    <div style={{position: 'absolute', left: 61, top: 149, width: 16, height: 24, background: '#120d12'}} />
    <Glow x={68} y={160} r={12} color="rgba(255,60,60,1)" intensity={0.35} />
    {faceOn && <PixelSprite atlas={inf} frame={g >= E.face + 20 ? 'face_open' : 'face'} x={68} y={faceY} breathe={false} squash={false} blink={false} />}
    <SetLayer src="sets/door_bg.png" />
    {/* light strip under the door, and a pair of feet in it */}
    <div style={{position: 'absolute', left: 52, top: 199, width: 35, height: 1, background: 'rgba(255,120,110,0.75)'}} />
    {shadowFrom !== undefined && g >= shadowFrom && <><div style={{position: 'absolute', left: 61, top: 199, width: 6, height: 1, background: '#0b0c11'}} />
      <div style={{position: 'absolute', left: 71, top: 199, width: 6, height: 1, background: '#0b0c11'}} /></>}
    {showHero && <PixelSprite atlas={hero} x={40} y={200 + dropP * 7} keys={[{at: 0, pose: 'down.scared'}, {at: E.drop - from, pose: 'cover.scared'}]} />}
    <div style={{position: 'absolute', left: 18, top: 200, width: 44, height: 40, background: '#262c3c'}} />
    <SetLayer src="sets/door_fg.png" />
    <Darken amount={dim} />
    <Glow x={69} y={199} r={14} color="rgba(255,90,80,1)" intensity={0.3} />
  </World>;
};

const Speaker: React.FC<{from: number; dark?: number}> = ({from, dark = 0.5}) => {
  const f = useCurrentFrame(); const g = f + from;
  return <World cam={{x: 69, y: 118, zoom: 3.4 + f * 0.004}}>
    <SetLayer src="sets/door_bg.png" />
    <Darken amount={dark} />
    <Glow x={69} y={110} r={14} color="rgba(255,200,140,1)" intensity={g >= E.crackle ? 0.35 : 0.1} flicker={0.3} seed="pa" />
    <Rings x={69} y={110} at={E.crackle - from} count={3} every={8} life={26} maxR={22} width={0.4} />
    <Rings x={69} y={110} at={wf('A05b', 0) - from} count={6} every={10} life={30} maxR={26} width={0.35} />
  </World>;
};

const Lot: React.FC<{from: number; wide?: boolean}> = ({from, wide}) => {
  const f = useCurrentFrame(); const g = f + from;
  const lamp = wide && g >= E.streetOff ? (g < E.streetOff + 8 ? [0, 1, 0, 0.6, 0, 0, 1, 0][g - E.streetOff] : 0) : 1;
  const cam = wide ? {x: 67, y: 150, zoom: 1.15 + f * 0.0015}
    : camAt(g, [{at: from, x: 50, y: 186, zoom: 1.7}, {at: E.three, x: 46, y: 190, zoom: 2.5, ease: Easing.out(Easing.cubic)}]);
  return <World cam={cam}>
    <SetLayer src="sets/parking_bg.png" />
    <Darken amount={0.3} />
    <Glow x={101} y={56} r={60} color="rgba(255,200,110,1)" intensity={0.5 * lamp} flicker={0.05} seed="lamp" />
    <Glow x={101} y={200} r={34} color="rgba(255,200,110,1)" intensity={0.18 * lamp} />
  </World>;
};

/** Library window frame over the parking lot (we're inside looking out). */
const WindowFrame: React.FC = () => <AbsoluteFill style={{pointerEvents: 'none'}}>
  <div style={{position: 'absolute', inset: 0, border: '70px solid #2a2a36'}} />
  <div style={{position: 'absolute', left: 520, top: 0, width: 40, height: 1920, background: '#2a2a36'}} />
  <div style={{position: 'absolute', left: 0, top: 860, width: 1080, height: 40, background: '#2a2a36'}} />
  <AbsoluteFill style={{background: 'linear-gradient(150deg, rgba(160,190,255,0.06), transparent 35%)'}} />
</AbsoluteFill>;

const HallJanitor: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const z = 3.0, wx = -14, sc = 3.55 / z;
  const keyY = interpolate(g, [E.keys - 6, E.keys], [floorY(z) - 20, floorY(z)], {...clamp, easing: Easing.in(Easing.quad)});
  const gone = g >= E.gone;
  return <World cam={{x: 66, y: 128, zoom: 1.15 + f * 0.002}}><Hall g={g}>
    <PixelSprite atlas={prop} frame="jan_cart" x={atX(wx + 30, z)} y={floorY(z)} scale={sc} breathe={false} squash={false} />
    {!gone && <PixelSprite atlas={jan} x={atX(wx, z)} y={floorY(z)} scale={sc}
      keys={[{at: 0, pose: 'down.worried'}, {at: E.shout - from, pose: 'open.worried'}, {at: E.keys - from - 6, pose: 'down.shock'}]} />}
    {g >= E.keys - 6 && <PixelSprite atlas={prop} frame="keys" x={atX(wx + 6, z)} y={keyY} scale={sc * 0.6} breathe={false} squash={false} />}
  </Hall>
    {!gone && <Glow x={atX(wx + 8, z)} y={floorY(z) - 22} r={30} color="rgba(255,240,200,1)" intensity={0.45} flicker={0.1} seed="torch" />}
  </World>;
};

const HallFigure: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const z = 4.0, sc = 2.81 / z;
  const fr = g >= E.turns ? 'face' : g >= E.mimic && g < we('A13b') + 4 ? 'face_open' : g >= E.answers ? 'tilt' : 'stand';
  return <><World cam={{x: 67, y: 128, zoom: 2.3 + f * 0.004}}><Hall g={g} dark={0.42}>
    <PixelSprite atlas={prop} frame="jan_cart" x={atX(16, 3.0)} y={floorY(3.0)} scale={3.55 / 3.0} breathe={false} squash={false} />
    <PixelSprite atlas={prop} frame="keys" x={atX(-8, 3.0)} y={floorY(3.0)} scale={0.7} breathe={false} squash={false} />
    <PixelSprite atlas={inf} frame={fr} x={atX(2, z)} y={floorY(z)} scale={sc} breathe={false} squash={false} blink={false} />
  </Hall>
    {g >= E.turns && <Glow x={atX(2, z)} y={floorY(z) - 34} r={2} color="rgba(255,255,255,1)" intensity={0.35} />}
  </World><DoorPane /></>;
};

/** Hero close at the desk, behind a phone insert. */
const Behind: React.FC<{from: number; pose?: string; dark?: number}> = ({from, pose = 'phone.scared', dark = 0.55}) => {
  const f = useCurrentFrame();
  return <><World cam={{x: HX, y: 186, zoom: 3 + f * 0.002}}><Library g={f + from} lit={false}><PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose}]} /></Library>
    <Glow x={HX} y={HY - 16} r={9} color={color.phone} intensity={0.7} /></World>
    <AbsoluteFill style={{background: '#05060a', opacity: dark}} /></>;
};

// ---------- HUD ----------
const CLOCK: [number, string][] = [[0, '4:52 PM'], [S.heat, '4:53 PM'], [S.speaker, '4:55 PM'], [S.window, '4:58 PM'], [S.hall2, '5:01 PM'], [S.knock, '5:04 PM'], [S.text, '5:06 PM']];
const hudAt = (f: number) => {
  let clock = CLOCK[0][1], changed = -99;
  for (const [at, c] of CLOCK) if (f >= at) { clock = c; changed = at; }
  const where = f >= E.stop ? 'NO POWER' : 'LIBRARY';
  if (f >= E.stop && E.stop > changed) changed = E.stop;
  return {status: `${clock} · ${where}`, changed};
};
const SPIKES: [number, number][] = [
  [E.scream, 0.95], [wf('A02', 0), 0.9], [wf('A02', 5), 0.6], [LIGHT_OFF[0], 0.25], [LIGHT_OFF[1], 0.28], [LIGHT_OFF[2], 0.3], [Math.round(18.4 * FPS), 0.2], [E.locker, 0.45],
  [E.crackle, 0.6], [wf('A05b', 0), 0.75], [wf('A05b', 4), 0.7], [Math.round(30.6 * FPS), 0.35], [wf('A08', 2), 0.55],
  [wf('A09', 2), 0.6], [wf('A09', 2) + 36, 0.75], [wf('A09', 2) + 72, 0.9], [wf('A11', 0) + 6, 0.85], [wf('A11', 0) + 42, 0.95],
  [wf('A12b', 0), 0.85], [E.keys, 1.0], [E.mimic, 0.7], [E.drop + 4, 0.4], ...KNOCKS.map((k): [number, number] => [k, 0.9]), [E.friend, 0.65], [wf('A16b', 2), 0.7],
];
const noiseAt = (f: number) => {
  let lv = 0.07 + 0.02 * Math.sin(f * 0.7);
  for (const [at, l] of SPIKES) if (f >= at) lv = Math.max(lv, l * Math.exp(-(f - at) / 22));
  return lv;
};

export const AfterHours: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const hud = hudAt(f);
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={Math.max(1, to - from)}>{el}</Sequence>;
  const L = (g: number, from: number) => g - from;
  const lit = (g: number) => LIGHT_OFF.map((t) => g < t);
  return <AbsoluteFill style={{background: color.night}}>
    {seq(S.lib, S.alert, <LibShot from={S.lib} to={S.alert}
      cam={[{at: 0, x: 67, y: 140, zoom: 1.05}, {at: E.phone, x: 67, y: 168, zoom: 1.9, ease: Easing.inOut(Easing.quad)}, {at: E.scream, x: 67, y: 178, zoom: 2.8, ease: Easing.out(Easing.cubic)}]}
      keys={[{at: 0, pose: 'down.neutral'}, {at: E.phone, pose: 'phone.worried'}, {at: E.scream, pose: 'phone.shock'}]} />)}
    {seq(S.alert, S.heat, <><Behind from={S.alert} pose="phone.shock" dark={0.5} /><Phone at={0} y={330}>
      <AlertScreen at={2} clock="4:52" lines={[{at: L(wf('A02', 2), S.alert), text: 'SHELTER IN PLACE.'}, {at: L(wf('A02', 5), S.alert), text: 'STAY QUIET.'},
        {at: L(wf('A02', 7), S.alert), text: 'THE INFECTED SOUND LIKE PEOPLE YOU KNOW.', red: true}]} /></Phone></>)}
    {seq(S.heat, S.hall1, <LibShot from={S.heat} to={S.hall1} cam={[{at: S.heat, x: 67, y: 150, zoom: 1.3}, {at: S.hall1, x: 67, y: 140, zoom: 1.2}]}
      keys={[{at: 0, pose: 'phone.scared'}, {at: E.stop, pose: 'down.lookup'}]} />)}
    {seq(S.hall1, S.freeze, <World cam={{x: 67, y: 126, zoom: 1.25}}><Hall g={0} lit={lit(f)} dark={0.15} /></World>)}
    {seq(S.freeze, S.speaker, <LibShot from={S.freeze} to={S.speaker} litUntil={0} cam={[{at: S.freeze, x: 67, y: 180, zoom: 2.6}, {at: S.speaker, x: 67, y: 182, zoom: 3.3}]}
      keys={[{at: 0, pose: 'down.scared'}, {at: E.locker, pose: 'down.shock'}]} />)}
    {seq(S.speaker, S.lot, <Speaker from={S.speaker} />)}
    {seq(S.lot, S.rule1, <Lot from={S.lot} />)}
    {seq(S.rule1, S.window, <><Speaker from={S.rule1} dark={0.7} /><AbsoluteFill style={{background: '#05060a', opacity: 0.35}} />
      <RuleCard at={L(wf('A07', 0), S.rule1)} n={1} title="IGNORE THE SPEAKERS" sub="SHE LEFT AT 3." /></>)}
    {seq(S.window, S.call, <><Lot from={S.window} wide /><WindowFrame /></>)}
    {seq(S.call, S.rule2, <><Behind from={S.call} /><Phone at={0} y={330}>
      {f < E.decline + 8 ? <IncomingCall name="Mom" declineAt={L(E.decline, S.call)} />
        : <Thread name="Mom" msgs={[{at: L(E.textOut, S.call), text: 'did you just call me??', out: true}, {at: L(E.reply, S.call), text: "I'm at work. Why?", hl: true}]} />}
    </Phone></>)}
    {seq(S.rule2, S.hall2, <><Behind from={S.rule2} dark={0.6} /><Phone at={-30} y={760}><IncomingCall name="Mom" declineAt={L(E.decline2, S.rule2)} /></Phone>
      <RuleCard at={L(wf('A11', 0), S.rule2)} n={2} title="DON'T PICK UP" sub="MOM ONLY TEXTS." y={330} /></>)}
    {seq(S.hall2, S.hallwin, <HallJanitor from={S.hall2} />)}
    {seq(S.hallwin, S.drop, <HallFigure from={S.hallwin} />)}
    {seq(S.drop, S.knock, <><Door from={S.drop} face={[E.face, E.faceOff]} />
      <Sequence from={S.rule3 - S.drop}><RuleCard at={L(wf('A15', 0), S.rule3)} n={3} title="STAY BELOW THE GLASS" sub="IT CHECKS EVERY WINDOW." /></Sequence></>)}
    {seq(S.knock, S.text, <Door from={S.knock} shadowFrom={E.knock - 4} dim={0.6} />)}
    {seq(S.text, S.choice, <><Door from={S.text} shadowFrom={0} dim={0.7} zoom={2.2} /><AbsoluteFill style={{background: '#05060a', opacity: 0.45}} />
      <Phone at={0} y={330}><Thread name="Bestie" sub="last seen 4:04 PM" msgs={[{at: -40, text: 'this project is killing me', time: '3:41 PM'},
        {at: L(E.lol, S.text), text: 'still at school too lol', time: '4:03 PM', hl: true}]} /></Phone></>)}
    {seq(S.choice, S.end, <><Door from={S.choice} shadowFrom={0} dim={0.72} zoom={2.4} /><AbsoluteFill style={{background: '#05060a', opacity: 0.55}} />
      <Question at={2} l1="SHE'S STILL" l2="KNOCKING." a="OPEN THE DOOR" b="STAY SILENT" /></>)}
    {seq(S.end, AH_FRAMES, <><AbsoluteFill style={{background: '#000'}} /><SeriesCard at={4} series="AFTER HOURS" day="DAY 1" clock="5:07 PM" follow hold /></>)}

    {/* shocks */}
    <Flash at={E.scream} color="#ff2d3d" dur={4} peak={0.45} />
    <Flash at={E.dark} color="#000" dur={4} peak={0.7} />
    <Flash at={E.keys} color="#ffffff" dur={2} peak={0.25} />
    <Flash at={E.gone - 2} color="#000" dur={6} peak={1} />
    <Flash at={E.turns} color="#ff2d3d" dur={3} peak={0.35} />
    <Flash at={E.face} color="#ffffff" dur={2} peak={0.3} />
    {f < S.end && <Vignette strength={0.85} />}

    {f < S.end && <AbsoluteFill style={{top: -300}}><SeriesCard at={36} dur={44} series="AFTER HOURS" day="DAY 1" clock="4:52 PM" /></AbsoluteFill>}
    {f < S.choice && <Hud series="AFTER HOURS" part="DAY 1" status={hud.status} statusChangedAt={hud.changed} />}
    {f < S.choice && <NoiseMeter level={noiseAt(f)} top={236} />}
    {f < S.choice && <WordCaption phrases={PHRASES} />}
    <Audio src={staticFile('audio/ah-mix.wav')} />
  </AbsoluteFill>;
};
