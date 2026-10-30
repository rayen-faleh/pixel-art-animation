import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../kp-timing.json';
import heroA from '../../public/sprites/hero.json';
import civA from '../../public/sprites/civilians.json';
import bustA from '../../public/sprites/busts.json';
import pepA from '../../public/sprites/pepper.json';
import pbA from '../../public/sprites/pepper_busts.json';
import sbA from '../../public/sprites/smile_busts.json';
import kpA from '../../public/sprites/kp_props.json';
import {FPS, color} from '../kit/theme';
import {camAt, useKitFonts, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite, PoseKey, turnKeys} from '../kit/sprite';
import {Glow, Darken, Flash, Vignette, Rings, Tint} from '../kit/effects';
import {phrasesFrom, Word} from '../kit/overlay';
import {WorldL, SetL, CaptionL, HudL, RuleCardL, TitleL} from './nr-kit';
import {PetCamFeed, Phone, CamNotice, Thread, UISprite, DropOffPhotos, RuleFlip, SuspicionMeter, BeatChip, EndCard, CageCard} from './kp-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), civ = A(civA), busts = A(bustA), pep = A(pepA), pb = A(pbA), sb = A(sbA), kp = A(kpA);

// ---------- timing anchors (src/kp-timing.json, seconds -> frames) ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
// the final two lines are carried by the end card
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'P168'), 0.6);

export const KP_END = we('P168') + 45;
export const KP_FRAMES = KP_END + 150;

// ---------- key moments (mirrored in scripts/build_kp_cues.py) ----------
export const E = {
  turned: wf('P05', 2), buddy: wf('P07', 2), title: we('P09') + 6,
  stands: wf('P33', 3), upwalk: wf('P35', 0), scrub: wf('P36', 0), lookCam: wf('P39', 4), moved: wf('P43', 0),
  rule1: wf('P52', 0), rule2: wf('P53', 0), rule3: wf('P54', 0), rule4: wf('P55', 0), rule5: wf('P56', 0), breakOff: wf('P57', 5),
  behind: wf('P60', 0), lock: wf('P61', 0), cold: wf('P66', 5), spot: wf('P68', 0), check: wf('P74', 0), person: wf('P79', 1),
  pan: wf('P81', 3), creak: wf('P83', 3), steps: wf('P84', 0), two: wf('P85', 0), breath: wf('P87', 0), paws: wf('P88', 1),
  warm: wf('P92', 2), again1: wf('P97', 3), again2: wf('P97', 4), taller: wf('P98', 3), memo: wf('P100', 7), lastOne: wf('P102', 3),
  photo1: wf('P104', 0), photo2: wf('P104', 2), photo3: wf('P104', 5), sameSmile: wf('P106', 0),
  gift1: wf('P111', 3), gift2: wf('P112', 3), gift3: wf('P113', 3), gift4: wf('P114', 3), dana: wf('P116', 1), smudges: wf('P120', 6),
  flip1: wf('P122', 2), flip2: wf('P123', 2), flip3: wf('P124', 3), flip4: wf('P125', 2), flip5: wf('P126', 4), still: wf('P128', 5),
  dies: wf('P129', 3), whir: wf('P130', 5), t311: wf('P133', 0), empty: wf('P140', 3), buzz: wf('P141', 3), behindYou: wf('P143', 4),
  turnAround: wf('P146', 0), closer: wf('P151', 0), whisper: wf('P153', 0), dropout: we('P153') + 4,
  you: wf('P159', 1), returned4: wf('P162', 6), crying: wf('P163', 8), reveal: wf('P167', 0), end: wf('P168', 0),
};

// ---------- actors ----------
type Actor = {atlas: Atlas; frame?: string; keys?: PoseKey[]; x: number; y: number; flip?: boolean; op?: number; rot?: number; filter?: string; blink?: boolean};
const Actors: React.FC<{list: Actor[]}> = ({list}) => <>{list.map((a, i) => {
  const sp = <PixelSprite atlas={a.atlas} frame={a.frame} keys={a.keys} x={a.x} y={a.y} flip={a.flip} opacity={a.op ?? 1} breathe={!!a.keys} blink={a.blink ?? !!a.keys} squash={!!a.keys} />;
  const wrapped = a.filter ? <div style={{filter: a.filter}}>{sp}</div> : sp;
  return a.rot ? <div key={i} style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${a.rot}deg)`, transformOrigin: `${a.x}px ${a.y}px`}}>{wrapped}</div>
    : <React.Fragment key={i}>{wrapped}</React.Fragment>;
})}</>;
const P = (frame: string, x: number, y: number, o: Partial<Actor> = {}): Actor => ({atlas: pep, frame, x, y, ...o});
const H = (keys: PoseKey[] | string, x: number, y: number, o: Partial<Actor> = {}): Actor =>
  typeof keys === 'string' ? {atlas: hero, keys: [{at: -999, pose: keys}], x, y, ...o} : {atlas: hero, keys, x, y, ...o};
const K = (frame: string, x: number, y: number, o: Partial<Actor> = {}): Actor => ({atlas: kp, frame, x, y, ...o});
const walkFrame = (g: number, every = 5, prefix = 'walk') => `${prefix}${Math.floor(g / every) % 4}`;
const upWalk = (g: number) => `upwalk${Math.floor(g / 7) % 2}`;

type Light = 'night' | 'day' | 'dark' | 'dusk';
const Lighting: React.FC<{mode: Light; glows?: {x: number; y: number; r: number; c?: string; i?: number}[]}> = ({mode, glows = []}) => <>
  {mode === 'night' && <Darken amount={0.6} />}
  {mode === 'dusk' && <Darken amount={0.3} color="#1c2238" />}
  {mode === 'dark' && <Darken amount={0.86} />}
  {mode === 'day' && <AbsoluteFill style={{background: 'rgba(255,230,190,0.06)'}} />}
  {glows.map((gl, i) => <Glow key={i} x={gl.x} y={gl.y} r={gl.r} color={gl.c ?? 'rgba(150,170,230,1)'} intensity={gl.i ?? 0.35} />)}
</>;

// ---------- sets (positions: kit/sets_keep.py) ----------
type SceneP = {from: number; cam: CamKey[]; light?: Light; actors?: (g: number) => Actor[]; over?: (g: number) => Actor[]; glows?: (g: number) => {x: number; y: number; r: number; c?: string; i?: number}[];
  shake?: number; children?: (g: number) => React.ReactNode};
const scene = (src: string, defaults: Partial<SceneP> = {}) => (p: SceneP) => {
  const Comp: React.FC = () => {
    const f = useCurrentFrame(); const g = f + p.from;
    const light = p.light ?? defaults.light ?? 'night';
    return <WorldL cam={camAt(g, p.cam)} shake={p.shake ?? 0}>
      <SetL src={src} />
      {defaults.children?.(g)}
      <Actors list={p.actors?.(g) ?? []} />
      {p.children?.(g)}
      <Actors list={p.over?.(g) ?? []} />
      <Lighting mode={light} glows={p.glows?.(g) ?? (light === 'night' ? [{x: 136, y: 50, r: 30, c: 'rgba(120,150,230,1)', i: 0.3}] : [])} />
    </WorldL>;
  };
  return <Comp />;
};
const Apt = scene('sets/kp_apartment_bg.png');
const Bed = scene('sets/kp_bedroom_bg.png');
const Bath = scene('sets/kp_bathroom_bg.png');
const Shelter = scene('sets/kp_shelter_bg.png', {light: 'day'});
const Street = scene('sets/kp_street_bg.png', {light: 'day'});

// Apartment furniture/props that move between scenes.
const PETCAM_K = K('petcam', 66, 64, {});
const camOn = (g: number) => g < E.moved;                              // the cam is on the kitchen shelf until it's moved
const Mug: React.FC<{warm?: boolean; g: number}> = ({warm, g}) => <>
  <PixelSprite atlas={kp} frame="mug" x={88} y={96} breathe={false} squash={false} blink={false} />
  {warm && [0, 1, 2].map((k) => {
    const t = ((g + k * 14) % 42) / 42;
    return <div key={k} style={{position: 'absolute', left: 86 + Math.sin(t * 6 + k) * 1.5, top: 82 - t * 10, width: 1, height: 3, background: `rgba(230,230,230,${0.5 * (1 - t)})`}} />;
  })}
</>;
const Keys: React.FC<{on: boolean}> = ({on}) => on ? <>{[212, 215].map((x) => <div key={x} style={{position: 'absolute', left: x, top: 77, width: 1, height: 3, background: '#c9b48a'}} />)}</> : null;
const Led: React.FC<{x: number; y: number; g: number; c?: string}> = ({x, y, g, c = 'rgba(80,160,255,1)'}) => <>
  <div style={{position: 'absolute', left: x, top: y, width: 1, height: 1, background: c.replace(',1)', ',0.9)')}} />
  <Glow x={x + 0.5} y={y + 0.5} r={3 + (Math.floor(g / 20) % 2)} color={c} intensity={0.8} />
</>;
/** Duvet over a sleeper (hides the body of a rotated sprite) + optional person-shaped lump in "the spot". */
const Duvet: React.FC<{lump?: boolean; x0?: number}> = ({lump, x0 = 80}) => <>
  {lump && <div style={{position: 'absolute', left: 64, top: 80, width: 34, height: 9, borderRadius: '45% 45% 10% 10%', background: '#56688a', boxShadow: 'inset 0 2px 0 #6a7ea2'}} />}
  {lump && <div style={{position: 'absolute', left: 64, top: 77, width: 9, height: 8, borderRadius: '50%', background: '#56688a'}} />}
  <div style={{position: 'absolute', left: x0, top: 78, width: 178 - x0, height: 15, background: 'linear-gradient(#5d6f8f, #46567a)', borderTop: '1px solid #6a7ea2', borderRadius: '5px 5px 0 0'}} />
</>;
const SofaBlanket: React.FC = () => <div style={{position: 'absolute', left: 126, top: 83, width: 36, height: 22, background: 'linear-gradient(#7a5e6e, #654b5a)', borderTop: '1px solid #8e7282', borderRadius: '6px 6px 2px 2px'}} />;
/** A doorway-shaped mask (we're seeing the living room through the bedroom door). */
const DoorMask: React.FC = () => <AbsoluteFill style={{background: '#000', WebkitMaskImage: 'linear-gradient(90deg, black 0 30%, transparent 30% 70%, black 70%)', maskImage: 'linear-gradient(90deg, black 0 30%, transparent 30% 70%, black 70%)'}} />;

// Cats in the shelter (recoloured Pepper, so the kit never needs a second cat sheet).
const CAT_TINT = ['sepia(1) saturate(3.2) hue-rotate(-18deg) brightness(1.15)', 'brightness(0.42)', 'grayscale(1) brightness(1.75)', 'sepia(0.8) saturate(2) hue-rotate(-35deg) brightness(0.9)'];
const shelterCats = (g: number, pepperFrame = 'sit'): Actor[] => {
  const out: Actor[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x0 = 132 + c * 32, y = 30 + r * 26 + 22;
    if (r === 1 && c === 1) { out.push(P(pepperFrame, x0 + 15, y, {})); continue; }
    if ((r + c) % 3 === 2) continue;                                       // a few empty cages
    const k = r * 3 + c, pace = Math.sin((g + k * 37) / 18);
    const moving = k % 2 === 0;
    out.push(P(moving ? walkFrame(g + k * 3, 4) : (Math.floor((g + k * 11) / 40) % 2 ? 'sit' : 'stand4'), x0 + 15 + (moving ? pace * 6 : 0), y,
      {flip: moving && Math.cos((g + k * 37) / 18) < 0, filter: CAT_TINT[k % 4]}));
  }
  return out;
};
const Bars: React.FC = () => <>{[0, 1, 2].map((r) => [0, 1, 2].map((c) => {
  const x0 = 132 + c * 32, y0 = 30 + r * 26;
  return <React.Fragment key={`${r}${c}`}>{Array.from({length: 8}, (_, k) => <div key={k} style={{position: 'absolute', left: x0 + 4 + k * 3, top: y0 + 2, width: 1, height: 20, background: 'rgba(184,192,202,0.55)'}} />)}</React.Fragment>;
}))}</>;

// ---------- full-frame inserts ----------
const Bust: React.FC<{atlas: Atlas; frame: string | ((f: number) => string); from?: number; scale?: [number, number]; dur?: number; bg?: string; tint?: string}> = ({atlas, frame, scale = [13, 15], dur = 120, bg, tint}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, dur], scale, clamp);
  const fr = typeof frame === 'string' ? frame : frame(f);
  return <AbsoluteFill style={{background: bg ?? 'radial-gradient(60% 70% at 50% 45%, #1a1e2c, #050608)', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden'}}>
    <div style={{filter: tint}}><UISprite atlas={atlas} frame={fr} scale={s} /></div>
  </AbsoluteFill>;
};
/** Gift on the pillow (close-up still life at its own scale). */
const Gift: React.FC<{item: string; label?: string; labelAt?: number}> = ({item, label, labelAt = 0}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 150], [1, 1.08], clamp);
  return <AbsoluteFill style={{background: '#20283a', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: `scale(${z})`}}>
      <div style={{position: 'absolute', left: 260, top: 160, width: 1400, height: 760, borderRadius: 90, background: 'linear-gradient(#ece7da, #cfc8b8)', boxShadow: 'inset 0 -40px 0 rgba(0,0,0,0.08)'}} />
      <div style={{position: 'absolute', left: 960 - 16 * 22, top: 540 - 26 * 22}}><UISprite atlas={kp} frame={item} scale={22} /></div>
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.65))'}} />
    {label && f >= labelAt && <div style={{position: 'absolute', left: 1180, top: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 64, color: '#2a2c33', background: '#f4efdc',
      padding: '8px 20px', transform: 'rotate(-6deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>{label}</div>}
  </AbsoluteFill>;
};
/** The cat in the carrier, crying through the grille. */
const Carrier: React.FC = () => {
  const f = useCurrentFrame();
  const open = Math.floor(f / 9) % 3 !== 2;
  return <AbsoluteFill style={{background: '#9fb59b', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'relative', width: 1200, height: 900, borderRadius: 60, background: '#8e96a6', boxShadow: '0 40px 120px rgba(0,0,0,0.4)'}}>
      <div style={{position: 'absolute', left: 150, top: 120, width: 900, height: 660, borderRadius: 30, background: '#14151b', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
        <div style={{transform: `translateX(${Math.sin(f / 3) * 6}px)`}}><UISprite atlas={pb} frame={open ? 'talk' : 'slits'} scale={11} /></div>
      </div>
      {Array.from({length: 13}, (_, k) => <div key={k} style={{position: 'absolute', left: 180 + k * 68, top: 120, width: 14, height: 660, background: '#c6c9d0', boxShadow: '4px 0 0 rgba(0,0,0,0.3)'}} />)}
    </div>
  </AbsoluteFill>;
};

// ---------- HUD state ----------
const pick = <T,>(f: number, list: [number, T][]) => { let v = list[0][1]; for (const [at, x] of list) if (f >= at) v = x; return v; };
const CLOCK: [number, string][] = [[0, '3:12 AM'], [cut('P10'), 'DAY 1'], [cut('P18'), 'DAY 3'], [cut('P27'), 'DAY 8'], [cut('P30'), 'NIGHT 8 · 3:12 AM'], [cut('P40'), 'DAY 9'],
  [cut('P45'), 'DAY 9'], [cut('P63'), 'DAY 12'], [cut('P66'), 'NIGHT 15 · 3:12 AM'], [cut('P90'), 'DAY 16'], [cut('P109'), 'DAY 17'], [cut('P114'), 'DAY 20'],
  [cut('P131'), 'NIGHT 20'], [E.t311, '3:11 AM'], [cut('P154'), 'DAY 21']];
const STATUS: [number, string][] = [[0, 'APT 4C · KITCHEN'], [cut('P10'), 'CITY ANIMAL SHELTER'], [cut('P17'), 'APT 4C · HOME'], [cut('P45'), 'APT 4C · CALLING THE SHELTER'],
  [cut('P63'), 'APT 4C · FOLLOWING THE RULES'], [cut('P66'), 'APT 4C · BEDROOM'], [cut('P72'), 'APT 4C · SOFA'], [cut('P90'), 'APT 4C'], [cut('P131'), 'APT 4C · LEAVING'],
  [cut('P154'), 'CITY ANIMAL SHELTER']];
const PEPPER_STATE: [number, string, 'ok' | 'warn' | 'bad'][] = [[0, 'STANDING', 'bad'], [cut('P10'), 'CALM', 'ok'], [E.stands, 'STANDING', 'bad'], [cut('P40'), 'PURRING', 'ok'],
  [E.behind, 'WATCHING', 'warn'], [cut('P63'), 'CALM', 'ok'], [E.spot, 'IN YOUR SPOT', 'bad'], [E.paws, 'ON YOUR FEET', 'warn'], [cut('P90'), 'PRACTISING', 'bad'],
  [cut('P131'), 'ON THE COUNTER', 'warn'], [E.behindYou, 'BEHIND YOU', 'bad'], [cut('P154'), 'RETURNED', 'warn']];
const SPIKES: [number, number][] = [[E.behind, 0.45], [E.lock, 0.3], [E.spot, 0.55], [E.check, 0.75], [E.pan, 0.95], [E.two, 1], [E.memo, 0.6], [E.dana, 0.8], [E.empty, 0.9], [E.behindYou, 1], [E.closer, 1]];
const suspicion = (f: number) => {
  let lv = 0.08 + 0.02 * Math.sin(f * 0.05);
  for (const [at, l] of SPIKES) if (f >= at) lv = Math.max(lv, l * Math.exp(-(f - at) / 260));
  if (f >= E.paws && f < E.paws + 120) lv *= interpolate(f, [E.paws, E.paws + 60], [1, 0.35], clamp);
  return lv;
};
const CHIPS = [
  {at: cut('P10'), text: 'TWO WEEKS EARLIER'}, {at: wf('P15', 2), text: 'RETURNED 3×', tone: 'bad' as const}, {at: cut('P19'), text: 'CATS SEE YOU AS A BIG, CLUMSY CAT', tone: 'fact' as const},
  {at: cut('P23'), text: ''}, {at: wf('P24', 3), text: 'NO SOUND'}, {at: wf('P25', 2), text: 'NEVER SEEN EATING'}, {at: wf('P26', 4), text: 'ALWAYS FACING YOU', tone: 'bad' as const},
  {at: cut('P30'), text: ''}, {at: cut('P45'), text: 'WHO RETURNED HIM?'}, {at: wf('P46', 0), text: '2 NUMBERS DISCONNECTED', tone: 'bad' as const}, {at: cut('P48'), text: 'DANA · 2 MONTHS'},
  {at: wf('P49', 0), text: 'TEXT ONLY · "HE MIGHT HEAR"', tone: 'bad' as const}, {at: cut('P50'), text: ''},
  {at: cut('P90'), text: ''}, {at: E.warm, text: 'STILL WARM', tone: 'bad' as const}, {at: cut('P93'), text: ''}, {at: cut('P109'), text: 'CATS BRING THEIR OWNERS "GIFTS"', tone: 'fact' as const},
  {at: cut('P116'), text: ''}, {at: cut('P131'), text: 'WAIT FOR 3:11'}, {at: cut('P134'), text: ''}, {at: E.empty, text: 'YOUR KEYS: GONE', tone: 'bad' as const}, {at: cut('P141'), text: ''},
];

// ---------- the film ----------
type Shot = [number, (s: number) => React.ReactNode, ('feed' | 'insert' | 'phone')?];

export const KeepPretending: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const L = (g: number, s: number) => g - s;

  const shots: Shot[] = [
    // ===== COLD OPEN: 3:12, the cat standing in the kitchen (the thumbnail moment)
    [0, (s) => <Apt from={s} cam={[{at: 0, x: 40, y: 92, zoom: 3.6}, {at: cut('P03'), x: 40, y: 92, zoom: 3.9}]}
      actors={(g) => [P(g < wf('P02', 2) ? 'up_side' : 'up_side', 36, 112, {flip: true})]}
      glows={() => [{x: 15, y: 70, r: 26, c: 'rgba(180,220,255,1)', i: 0.35}, {x: 36, y: 96, r: 18, i: 0.4}]} />],
    [cut('P03'), (s) => <Apt from={s} cam={[{at: s, x: 30, y: 98, zoom: 5}, {at: cut('P05'), x: 30, y: 98, zoom: 5.6}]}
      actors={() => [P('up_side', 36, 112, {flip: true})]} glows={() => [{x: 15, y: 70, r: 26, c: 'rgba(180,220,255,1)', i: 0.4}, {x: 34, y: 96, r: 16, i: 0.5}]} />],
    [cut('P05'), (s) => <Apt from={s} cam={[{at: s, x: 36, y: 99, zoom: 5.6}, {at: E.turned, x: 36, y: 99, zoom: 5.6}, {at: E.turned + 3, x: 36, y: 96, zoom: 7, ease: Easing.out(Easing.cubic)}]}
      actors={(g) => [P(g < E.turned ? 'up_side' : g < E.turned + 3 ? 'up_back' : 'up', 36, 112, {flip: g < E.turned})]} glows={() => [{x: 36, y: 96, r: 16, i: 0.5}]} />],
    [wf('P05', 6) - 2, (s) => <Bust atlas={pb} frame="slits" />, 'insert'],
    [cut('P06'), (s) => <Apt from={s} cam={[{at: s, x: 90, y: 92, zoom: 2.3}, {at: cut('P08'), x: 92, y: 92, zoom: 2.5}]}
      actors={(g) => [P('up', 36, 112), H(g < E.buddy ? 'down.scared' : 'down.worried', 120 - Math.max(0, Math.min(1, (g - wf('P07', 6)) / 50)) * -60, 112)]}
      glows={() => [{x: 120, y: 95, r: 22, i: 0.35}, {x: 36, y: 96, r: 12, i: 0.35}]} />],
    [cut('P08'), (s) => <Apt from={s} cam={[{at: s, x: 40, y: 96, zoom: 4.5}, {at: E.title, x: 70, y: 80, zoom: 1.6}]}
      actors={() => [P('up', 36, 112)]} glows={() => [{x: 36, y: 96, r: 14, i: 0.4}]}
      children={(g) => <>{g > wf('P09') && <Glow x={34} y={92} r={2.5} color="rgba(220,240,120,1)" intensity={0.6} />}</>} />],
    [E.title, (s) => <><Apt from={s} cam={[{at: s, x: 70, y: 80, zoom: 1.6}]} actors={() => [P('up', 36, 112)]} light="dark" />
      <TitleL at={0} dur={56} title="KEEP PRETENDING" clock="3:12 AM" /></>, 'insert'],

    // ===== 1. RETURNED THREE TIMES
    [cut('P10'), (s) => <Street from={s} cam={[{at: s, x: 90, y: 72, zoom: 1.2}, {at: cut('P11'), x: 82, y: 76, zoom: 1.5}]}
      actors={(g) => [H(walkFrame(g, 6) + '.neutral', 60 + (g - s) * 0.12, 112)]} />],
    [cut('P11'), (s) => <Shelter from={s} cam={[{at: s, x: 150, y: 70, zoom: 1.6}, {at: cut('P12'), x: 170, y: 70, zoom: 2.2}]} actors={(g) => shelterCats(g)}
      children={() => <Bars />} />],
    [cut('P12'), (s) => <Shelter from={s} cam={[{at: s, x: 178, y: 68, zoom: 2.0}, {at: cut('P14'), x: 180, y: 70, zoom: 2.7}]} actors={(g) => shelterCats(g)} children={() => <Bars />} />],
    [cut('P14'), () => <><AbsoluteFill style={{background: '#93ab90'}} /><CageCard returned={3} at={0} /></>, 'insert'],
    [cut('P16'), (s) => <Shelter from={s} cam={[{at: s, x: 60, y: 92, zoom: 2.6}]}
      actors={() => [{atlas: civ, frame: 'nurse.front', x: 52, y: 92}, H('down.neutral', 82, 112)]} />],
    [cut('P17'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 150, y: 96, zoom: 2.4}, {at: s + 120, x: 140, y: 96, zoom: 2.6}]}
      actors={(g) => [K(g < s + 30 ? 'carrier' : 'carrier_open', 160, 112), H('down.smile', 182, 112), ...(g > s + 40 ? [P(walkFrame(g), 156 - (g - s - 40) * 0.25, 112, {flip: true})] : [])]} />],
    [cut('P18'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 136, y: 92, zoom: 2.6}]} actors={() => [H('down.smile', 126, 108), P('loaf', 146, 98)]} />],
    [cut('P19'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 140, y: 92, zoom: 2.2}, {at: cut('P21'), x: 134, y: 92, zoom: 2.6}]}
      actors={(g) => [H(g < wf('P20', 1) ? 'down.neutral' : 'down.smile', 124, 108), P('sit', 140, 98)]} />],
    [cut('P21'), (s) => <Bed from={s} light="dusk" cam={[{at: s, x: 118, y: 84, zoom: 2.3}]} actors={() => [H('down.smile', 100, 86, {rot: -90})]} over={() => [P('sleep', 160, 79)]}
      children={() => <Duvet />} glows={() => [{x: 120, y: 80, r: 40, i: 0.3}]} />],
    [wf('P21', 4) - 2, (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 120, y: 98, zoom: 4}]} actors={() => [H('reach.smile', 116, 112), P('rub', 130, 112, {flip: true})]} />],
    [wf('P21', 8) - 2, (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 190, y: 90, zoom: 2.6}]} actors={() => [H('open.smile', 197, 112), P('sit', 180, 112)]} />],
    [cut('P22'), () => <Bust atlas={pb} frame="calm" scale={[12, 16]} dur={110} />, 'insert'],
    [cut('P23'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 50, y: 96, zoom: 3}]}
      actors={(g) => {
        const j = L(g, wf('P24', 2)); const t = Math.max(0, Math.min(1, j / 10));
        return [P(j < 0 ? 'sit_side' : t < 1 ? 'crouch' : 'sit_side', 54 + t * 10, 88 + t * t * 24, {flip: true})];
      }} />],
    [cut('P25'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 32, y: 108, zoom: 6}, {at: s + 90, x: 32, y: 108, zoom: 6.6}]} actors={() => [K('bowl', 32, 113)]} />],
    [cut('P26'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 110, y: 96, zoom: 3}]}
      actors={() => [H([{at: -999, pose: 'turn0.neutral'}, ...turnKeys(wf('P26', 3), 'worried', 3)], 110, 112, {blink: false}), P('sit', 96, 112)]} />],
    [cut('P27'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 64, y: 74, zoom: 4.5}]} actors={(g) => (g > wf('P27', 3) ? [PETCAM_K] : [])} />],
    [cut('P28'), (s) => <><Apt from={s} light="day" cam={[{at: s, x: 110, y: 90, zoom: 1.4}]} /><AbsoluteFill style={{background: 'rgba(4,5,9,0.55)'}} />
      <Phone at={0}><CamNotice at={L(wf('P29', 0), s)} title="Motion detected" sub="Kitchen cam · 3:12 AM" red /></Phone></>, 'phone'],

    // ===== 2. THE CAMERA (night-vision clips)
    [cut('P30'), (s) => <PetCamFeed clock={feedClock(f, s, '03:12', 0)} scrub={0.1}><Apt from={s} light="dusk" cam={[{at: s, x: 140, y: 82, zoom: 1.05}]} actors={(g) => {
      const t = L(g, wf('P31', 3));
      return t < 0 ? [] : [P(walkFrame(g), 236 - Math.min(t, 140) * 0.75, 112, {flip: true})];
    }} /></PetCamFeed>, 'feed'],
    [cut('P32'), (s) => <PetCamFeed clock={feedClock(f, s, '03:13', 0)} scrub={0.18}><Apt from={s} light="dusk" cam={[{at: s, x: 130, y: 90, zoom: 1.6}]} actors={() => [P('sit_side', 131, 112, {flip: true})]} /></PetCamFeed>, 'feed'],
    [cut('P33'), (s) => <PetCamFeed clock={feedClock(f, s, '03:14', 0)} scrub={0.24}><Apt from={s} light="dusk" cam={[{at: s, x: 130, y: 94, zoom: 2.4}, {at: E.stands + 30, x: 130, y: 92, zoom: 2.8}]} actors={(g) => [
      P(g < E.stands ? 'sit_side' : g < E.stands + 4 ? 'rise0' : g < E.stands + 8 ? 'rise1' : 'up_side', 131, 112, {flip: true})]} /></PetCamFeed>, 'feed'],
    [cut('P35'), (s) => <PetCamFeed clock={feedClock(f, s, '03:14', 40)} scrub={0.3}><Apt from={s} light="dusk" cam={[{at: s, x: 170, y: 88, zoom: 1.6}]} actors={(g) => [
      P(upWalk(g), 131 + Math.max(0, g - s - 10) * 0.45, 112)]} /></PetCamFeed>, 'feed'],
    [cut('P36'), (s) => <PetCamFeed clock={scrubClock(f, s, wf('P38', 0), 3 * 60 + 20, 4 * 60 + 5)} scrub={interpolate(f, [s, wf('P38', 0)], [0.32, 0.86], clamp)}>
      <Apt from={s} light="dusk" cam={[{at: s, x: 200, y: 84, zoom: 2}, {at: cut('P39'), x: 214, y: 84, zoom: 2.6}]} actors={() => [P('up_back', 229, 112)]} /></PetCamFeed>, 'feed'],
    [cut('P39'), (s) => <PetCamFeed clock={f < E.lookCam ? '04:06:02' : '04:06:09'} scrub={0.88}>
      <Apt from={s} light="dusk" cam={[{at: s, x: 226, y: 96, zoom: 3.4}, {at: E.lookCam, x: 226, y: 96, zoom: 3.6}, {at: E.lookCam + 3, x: 229, y: 93, zoom: 6.5, ease: Easing.out(Easing.cubic)}]}
        actors={(g) => [P(g < E.lookCam - 4 ? 'up_back' : 'up', 229, 112)]} /></PetCamFeed>, 'feed'],
    [cut('P40'), (s) => <Bed from={s} cam={[{at: s, x: 80, y: 84, zoom: 4.2}, {at: s + 90, x: 80, y: 84, zoom: 4.6}]} actors={() => [H('down.scared', 100, 86, {rot: -90, blink: false})]} children={() => <Duvet />}
      glows={() => [{x: 76, y: 82, r: 16, i: 0.3}]} />],
    [cut('P41'), (s) => <Apt from={s} light="day" cam={[{at: s, x: 50, y: 98, zoom: 3.2}]} actors={(g) => [H('reach.smile', 46, 112), P(g < wf('P41', 7) ? 'rub' : 'eat', 60, 112, {flip: true}), K('bowl_full', 32, 113)]} />],
    [cut('P42'), (s) => <><Apt from={s} light="day" cam={[{at: s, x: 110, y: 90, zoom: 1.4}]} /><AbsoluteFill style={{background: 'rgba(4,5,9,0.55)'}} />
      <Phone at={0}><CamNotice at={L(E.moved, s)} title="Camera moved" sub="Kitchen cam · 4:07 AM" red /></Phone></>, 'phone'],
    [cut('P44'), (s) => <PetCamFeed clock="04:07:31" label="KITCHEN CAM" live><Bed from={s} light="dusk" cam={[{at: s, x: 110, y: 80, zoom: 1.5}, {at: s + 80, x: 100, y: 84, zoom: 1.9}]}
      actors={() => [H('down.neutral', 100, 86, {rot: -90})]} children={() => <Duvet />} /></PetCamFeed>, 'feed'],

    // ===== 3. DANA
    [cut('P45'), (s) => <><Apt from={s} light="day" cam={[{at: s, x: 136, y: 92, zoom: 2.2}]} actors={() => [H('phone.worried', 126, 108), P('loaf', 150, 98)]} />
      <AbsoluteFill style={{background: 'rgba(4,5,9,0.5)'}} />
      <Phone at={0}><div style={{textAlign: 'center', marginTop: 160}}>
        <div style={{fontSize: 30, color: 'rgba(255,255,255,0.6)'}}>{f < wf('P46', 0) ? 'Calling…' : 'Number disconnected'}</div>
        <div style={{fontSize: 44, fontWeight: 700, marginTop: 14}}>Adopter #{f < wf('P46', 4) ? 2 : 3}</div>
        <div style={{fontSize: 26, color: color.keyRed, marginTop: 30, opacity: f >= wf('P46', 0) ? 1 : 0}}>The number you have dialled is not in service.</div>
      </div></Phone></>, 'phone'],
    [cut('P47'), (s) => <><Apt from={s} light="day" cam={[{at: s, x: 136, y: 92, zoom: 2.2}]} actors={() => [H('phone.worried', 126, 108), P('loaf', 150, 98)]} />
      <AbsoluteFill style={{background: 'rgba(4,5,9,0.55)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1150, height: 1080}}>
        <RuleCardL at={L(E.rule1, s)} out={L(E.rule2, s) - 4} n={1} title="DON'T REACT" sub="HE'S A CAT. TALK TO HIM LIKE ONE." y={250} />
        <RuleCardL at={L(E.rule2, s)} out={L(E.rule3, s) - 4} n={2} title="CHANGE NOTHING" sub="HE NOTICES." y={250} />
        <RuleCardL at={L(E.rule3, s)} out={L(E.rule4, s) - 4} n={3} title="NEVER WATCH THE CAMERA" sub="WHERE HE CAN SEE YOU." y={250} />
        <RuleCardL at={L(E.rule4, s)} out={L(E.rule5, s) - 4} n={4} title="IN YOUR SPOT? SLEEP ELSEWHERE" sub="SAY NOTHING." y={250} />
        <RuleCardL at={L(E.rule5, s)} out={L(cut('P58'), s)} n={5} title="DON'T BRING HIM BACK" sub="WHEN I BROUGHT HIM BACK, I…" y={250} />
      </div>
      <Phone at={-99}><Thread name="Dana" sub="adopted Pepper · Mar 2023" typingFrom={L(wf('P50', 0), s)} msgs={[
        {at: L(wf('P48', 0), s), text: "It's Dana. I had him 2 months. I can't talk. He might hear.", time: '2:41 PM'},
        {at: L(wf('P51', 0), s), text: 'Did he stand up yet?', hl: true},
        {at: L(E.rule1, s), text: "Don't react. Whatever he's doing, he's a cat. Talk to him like a cat."},
        {at: L(E.rule2, s), text: "Don't change anything. Same food, same time, same lights. He notices."},
        {at: L(E.rule3, s), text: 'Never watch the camera where he can see you watching.'},
        {at: L(E.rule4, s), text: "If he's in your spot on the bed, sleep somewhere else. Say nothing."},
        {at: L(E.rule5, s), text: "And don't bring him back."},
        {at: L(E.breakOff - 10, s), text: 'When I brought him back, I', hl: true},
      ]} /></Phone></>, 'phone'],
    [cut('P59'), (s) => <Apt from={s} light="day" cam={[{at: s, x: 54, y: 92, zoom: 3.2}, {at: E.behind, x: 54, y: 92, zoom: 3.2}, {at: E.behind + 3, x: 58, y: 86, zoom: 4.4, ease: Easing.out(Easing.cubic)}]}
      actors={(g) => [H(g < E.lock ? 'phone.worried' : 'phone.scared', 46, 112), P(g < wf('P62', 0) ? 'sit' : g < wf('P62', 2) ? 'blink' : 'sleep', 62, 88)]}
      glows={(g) => (g < E.lock ? [{x: 46, y: 96, r: 10, c: 'rgba(160,215,255,1)', i: 0.5}] : [])} />],

    // ===== 4. THE SPOT
    [cut('P63'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 46, y: 100, zoom: 4}]} actors={() => [K('bowl_full', 32, 113), P('eat', 44, 112, {flip: true})]} />],
    [cut('P64'), (s) => <Apt from={s} light="dusk" cam={[{at: s, x: 134, y: 94, zoom: 2.6}]} actors={() => [H('reach.smile', 124, 108), P('content', 142, 98)]} />],
    [cut('P65'), (s) => <Bed from={s} cam={[{at: s, x: 120, y: 82, zoom: 2.2}]} actors={() => [H('down.neutral', 100, 86, {rot: -90})]} over={() => [P('sleep', 160, 79)]} children={() => <Duvet />} />],
    [cut('P66'), (s) => <Bed from={s} cam={[{at: s, x: 120, y: 84, zoom: 2.6}, {at: cut('P68'), x: 120, y: 84, zoom: 3}]} actors={(g) => [H(g < E.cold ? 'down.neutral' : 'down.worried', 152, 86, {rot: -90}), P('bed_person', 74, 88)]} children={() => <Duvet x0={130} />} />],
    [cut('P68'), (s) => <Bed from={s} cam={[{at: s, x: 108, y: 84, zoom: 2.4}, {at: we('P70'), x: 96, y: 84, zoom: 2.9}]} actors={() => [P('bed_person', 74, 88), H('down.worried', 152, 86, {rot: -90})]}
      children={() => <Duvet x0={130} />} glows={() => [{x: 76, y: 82, r: 14, i: 0.4}]} />],
    [cut('P71'), (s) => <Bed from={s} cam={[{at: s, x: 140, y: 80, zoom: 2.2}]} actors={(g) => [P('bed_person', 74, 88),
      H(walkFrame(g, 6) + '.scared', Math.min(206, 150 + Math.max(0, g - wf('P71', 4)) * 0.5), 112)]} children={() => <Duvet x0={130} />} />],
    [cut('P72'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 170, y: 88, zoom: 2.2}]} actors={() => [H('down.worried', 156, 96, {rot: -90})]}
      children={(g) => <><SofaBlanket /><Led x={230} y={66} g={g} /></>} glows={() => [{x: 120, y: 90, r: 20, i: 0.25}]} />],
    [cut('P74'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 126, y: 92, zoom: 2.8}, {at: s + 120, x: 126, y: 93, zoom: 3.2}]} actors={() => [H('down.worried', 156, 96, {rot: -90})]}
      children={(g) => <><SofaBlanket />{g >= E.check && <Glow x={136} y={94} r={9} color="rgba(160,215,255,1)" intensity={0.9} />}</>} />],
    [cut('P76'), (s) => <PetCamFeed clock="03:12:40" label="KITCHEN CAM" live><Bed from={s} light="dusk" cam={[{at: s, x: 110, y: 82, zoom: 1.6}, {at: E.person, x: 84, y: 84, zoom: 2.6},
      {at: E.person + 3, x: 80, y: 84, zoom: 3.6, ease: Easing.out(Easing.cubic)}]} children={() => <Duvet lump x0={98} />} /></PetCamFeed>, 'feed'],
    [cut('P80'), (s) => {
      const t = interpolate(f, [E.pan - 6, E.pan + 10], [0, 1], clamp);
      return <PetCamFeed clock="03:12:52" label="KITCHEN CAM" live>
        {t < 0.5 ? <Bed from={s} light="dusk" cam={[{at: s, x: 80 + t * 300, y: 84, zoom: 3.2}]} children={() => <Duvet lump x0={98} />} />
          : <><Apt from={s} light="night" cam={[{at: s, x: 134 - (1 - t) * 120, y: 94, zoom: 3.2}, {at: s + 200, x: 132, y: 94, zoom: 4}]} actors={() => [H('down.worried', 156, 96, {rot: -90})]}
            children={() => <><SofaBlanket /><Glow x={136} y={94} r={9} color="rgba(160,215,255,1)" intensity={1.2} /></>} /><DoorMask /></>}
        {t > 0.05 && t < 0.95 && <AbsoluteFill style={{backdropFilter: 'blur(14px)'}} />}
      </PetCamFeed>;
    }, 'feed'],
    [cut('P83'), (s) => <Apt from={s} light="dark" cam={[{at: s, x: 200, y: 84, zoom: 2.6}, {at: cut('P86'), x: 190, y: 88, zoom: 3}]} shake={0.15}
      children={(g) => <><Led x={230} y={66} g={g} />{g >= E.creak && <div style={{position: 'absolute', left: 222, top: 48, width: interpolate(g, [E.creak, E.creak + 30], [0, 6], clamp), height: 64, background: 'rgba(0,0,0,0.6)'}} />}</>} />],
    [cut('P86'), (s) => <Apt from={s} light="dark" cam={[{at: s, x: 124, y: 92, zoom: 4.2}, {at: cut('P88'), x: 122, y: 90, zoom: 4.6}]}
      actors={(g) => [H('down.scared', 156, 96, {rot: -90, blink: false}), ...(g >= E.breath - 20 ? [P('dark', 114, 112, {op: 0.55})] : [])]} children={() => <SofaBlanket />} />],
    [cut('P88'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 140, y: 94, zoom: 3.6}]} actors={(g) => [H('down.scared', 156, 96, {rot: -90, blink: false}),
    ]} over={(g) => (g >= E.paws ? [P(g < E.paws + 20 ? 'crouch' : 'sleep', 154, 84)] : [])} children={() => <SofaBlanket />} glows={() => [{x: 140, y: 90, r: 20, i: 0.3}]} />],

    // ===== 5. PRACTICE
    [cut('P90'), (s) => <Apt from={s} light="day" cam={[{at: s, x: 110, y: 90, zoom: 1.6}, {at: cut('P91'), x: 92, y: 92, zoom: 3.2}, {at: E.warm + 30, x: 89, y: 92, zoom: 5}]}
      actors={() => [P('sit', 30, 112)]} children={(g) => <Mug g={g} warm={g >= E.warm - 10} />} />],
    [cut('P93'), (s) => <><Apt from={s} light="day" cam={[{at: s, x: 110, y: 90, zoom: 1.4}]} /><AbsoluteFill style={{background: 'rgba(4,5,9,0.55)'}} />
      <Phone at={0}>
        <CamNotice at={0} title="3 new clips" sub="Bedroom cam · last night" red />
        <CamNotice at={L(wf('P94', 0), s)} title="03:12 · Bathroom" sub="Motion" y={170} />
        <CamNotice at={L(wf('P94', 3), s)} title="03:31 · Kitchen" sub="Motion" y={300} />
        <CamNotice at={L(wf('P95', 0), s)} title="03:50 · Kitchen" sub="Motion + sound" red y={430} />
      </Phone></>, 'phone'],
    [cut('P96'), (s) => <PetCamFeed clock={feedClock(f, s, '03:12', 0)} label="BEDROOM CAM" scrub={0.2}><Bath from={s} light="dusk" cam={[{at: s, x: 120, y: 66, zoom: 1.9}, {at: cut('P99'), x: 120, y: 60, zoom: 2.3}]}
      actors={(g) => [P(g < E.again1 ? 'mirror0' : g < E.again2 ? 'mirror1' : 'mirror2', 120, 92)]}
      children={(g) => <div style={{position: 'absolute', left: 94, top: 30, width: 52, height: 50, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -94, top: -30 + 4, opacity: 0.55}}><PixelSprite atlas={pep} frame="dark" x={120} y={78 + (g >= E.again2 ? -4 : g >= E.again1 ? -2 : 0)} breathe={false} squash={false} blink={false} /></div>
      </div>} /></PetCamFeed>, 'feed'],
    [cut('P99'), (s) => <PetCamFeed clock={feedClock(f, s, '03:31', 0)} label="BEDROOM CAM" scrub={0.45}><Apt from={s} light="dusk" cam={[{at: s, x: 96, y: 94, zoom: 3.4}, {at: s + 150, x: 94, y: 94, zoom: 4}]}
      actors={() => [P('chair', 99, 104)]} children={(g) => <Mug g={g} />} /></PetCamFeed>, 'feed'],
    [cut('P100'), (s) => <PetCamFeed clock={feedClock(f, s, '03:50', 0)} label="BEDROOM CAM" scrub={0.7}><Apt from={s} light="dusk" cam={[{at: s, x: 58, y: 80, zoom: 4}, {at: E.lastOne, x: 60, y: 76, zoom: 5}]}
      actors={(g) => [K('phone', 50, 89), P(g >= E.memo && Math.floor(g / 5) % 2 ? 'talk' : 'up', 62, 88)]}
      children={(g) => <Glow x={50} y={86} r={6} color="rgba(160,215,255,1)" intensity={0.8} />} /></PetCamFeed>, 'feed'],
    [E.lastOne + 6, () => <AbsoluteFill style={{background: '#000'}} />, 'insert'],
    [cut('P103'), () => <DropOffPhotos busts={sb} photoAt={[E.photo1 - cut('P103'), E.photo2 - cut('P103'), E.photo3 - cut('P103')]} hlAt={E.sameSmile - cut('P103')} />, 'insert'],
    [cut('P107'), () => <Bust atlas={sb} frame="dana" scale={[13, 14.5]} dur={60} bg="#9aa6a0" />, 'insert'],
    [wf('P107', 3), () => <Bust atlas={sb} frame="marcus" scale={[13, 14.5]} dur={60} bg="#9aa6a0" />, 'insert'],
    [wf('P107', 5), () => <Bust atlas={sb} frame="june" scale={[13, 14.5]} dur={60} bg="#9aa6a0" />, 'insert'],
    [cut('P108'), () => <DropOffPhotos busts={sb} photoAt={[-99, -99, -99]} hlAt={-99} />, 'insert'],

    // ===== 6. GIFTS
    [cut('P109'), (s) => <Bed from={s} light="day" cam={[{at: s, x: 74, y: 82, zoom: 3.2}, {at: s + 100, x: 72, y: 82, zoom: 3.8}]} actors={() => [P('sit', 74, 88)]} />],
    [cut('P111'), () => <Gift item="scrunchie" />, 'insert'],
    [cut('P112'), () => <Gift item="key_tag" label="D · 2B" labelAt={E.gift2 - cut('P112') + 20} />, 'insert'],
    [cut('P113'), () => <Gift item="wristband" label="MARCUS O." labelAt={E.gift3 - cut('P113') + 12} />, 'insert'],
    [cut('P114'), () => <Gift item="phone_cracked" label="2%" labelAt={wf('P115', 4) - cut('P114')} />, 'insert'],
    [cut('P116'), (s) => <><AbsoluteFill style={{background: 'radial-gradient(60% 60% at 70% 50%, #1b2030, #050608)'}} />
      <Phone at={-99}><Thread name="New adopter (4C)" sub="Dana's phone" msgs={[
        {at: -99, text: 'Did he stand up yet?', out: true, time: '3:12 AM'},
        {at: -99, text: "Don't react. Whatever he's doing, he's a cat. Talk to him like a cat.", out: true, time: '3:12 AM'},
        {at: -99, text: "Don't change anything. Same food, same time, same lights. He notices.", out: true, time: '3:12 AM'},
        {at: -99, text: 'Never watch the camera where he can see you watching.', out: true, time: '3:12 AM'},
        {at: -99, text: "If he's in your spot on the bed, sleep somewhere else. Say nothing.", out: true, time: '3:12 AM'},
        {at: -99, text: "And don't bring him back. When I brought him back, I", out: true, time: '3:12 AM'},
      ]} />
        {f >= E.smudges && Array.from({length: 18}, (_, k) => <div key={k} style={{position: 'absolute', left: 30 + ((k * 97) % 380), top: 80 + ((k * 151) % 760), width: 34, height: 30,
          borderRadius: '50%', background: 'rgba(255,255,255,0.10)', boxShadow: '0 0 0 2px rgba(255,255,255,0.05)', opacity: Math.min(1, (f - E.smudges) / 20)}} />)}
      </Phone></>, 'phone'],
    [cut('P121'), () => <><AbsoluteFill style={{background: 'radial-gradient(70% 60% at 50% 45%, #1a0c10, #050608)'}} />
      <RuleFlip rules={[{at: cut('P122') - cut('P121'), flip: E.flip1 - cut('P121'), was: "DON'T REACT", is: "DON'T FIGHT BACK"},
        {at: cut('P123') - cut('P121'), flip: E.flip2 - cut('P121'), was: 'CHANGE NOTHING', is: "DON'T LOCK THE DOORS"},
        {at: cut('P124') - cut('P121'), flip: E.flip3 - cut('P121'), was: 'NEVER WATCH THE CAMERA', is: "DON'T SEE IT COMING"},
        {at: cut('P125') - cut('P121'), flip: E.flip4 - cut('P121'), was: 'SLEEP SOMEWHERE ELSE', is: 'GIVE HIM YOUR BED'},
        {at: cut('P126') - cut('P121'), flip: E.flip5 - cut('P121'), was: "DON'T BRING HIM BACK", is: "DON'T LEAVE"}]} /></>, 'insert'],
    [cut('P127'), (s) => <Apt from={s} light="dark" cam={[{at: s, x: 60, y: 92, zoom: 2.4}, {at: E.still + 20, x: 58, y: 90, zoom: 3.4}]} actors={() => [P('content', 62, 88), H('phone.shock', 46, 112, {blink: false})]}
      glows={(g) => (g < E.dies ? [{x: 46, y: 96, r: 12, c: 'rgba(160,215,255,1)', i: 0.6}] : [])} />],
    [cut('P130'), (s) => <Apt from={s} light="dark" cam={[{at: s, x: 226, y: 72, zoom: 4}, {at: s + 120, x: 228, y: 70, zoom: 5}]} children={(g) => <Led x={230} y={66 + (g > E.whir ? Math.sin((g - E.whir) / 6) : 0)} g={g} />} />],

    // ===== 7. 3:11 AM
    [cut('P131'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 136, y: 92, zoom: 2.4}, {at: E.t311, x: 132, y: 94, zoom: 3}]} actors={() => [H('down.worried', 126, 108, {blink: true}), P('loaf', 48, 88)]} />],
    [cut('P134'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 70, y: 92, zoom: 2.4}, {at: cut('P138'), x: 120, y: 92, zoom: 2.2}]}
      actors={(g) => [P(g >= wf('P137', 4) && g < wf('P137', 4) + 12 ? 'blink' : 'content', 56, 88), H(walkFrame(g, 6) + (g < wf('P137', 0) ? '.worried' : '.scared'), 30 + (g - s) * 0.35, 112)]}
      glows={() => [{x: 56, y: 80, r: 14, i: 0.35}]} />],
    [cut('P138'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 200, y: 76, zoom: 4.2}, {at: cut('P140'), x: 210, y: 78, zoom: 5}, {at: E.empty + 2, x: 212, y: 80, zoom: 6, ease: Easing.out(Easing.cubic)}]}
      actors={() => [H('turn0.scared', 200, 112, {blink: false})]} children={() => <Keys on={false} />} glows={() => [{x: 205, y: 80, r: 18, i: 0.35}]} />],
    [cut('P141'), (s) => <><Apt from={s} light="night" cam={[{at: s, x: 200, y: 90, zoom: 2.8}]} actors={() => [H('turn0.scared', 200, 112, {blink: false})]} />
      <Phone at={0} x={1300}><CamNotice at={L(E.buzz, s)} title="Motion · Living room" sub="Kitchen cam · LIVE" red /></Phone></>, 'phone'],
    [cut('P142'), (s) => <PetCamFeed clock="03:11:48" label="KITCHEN CAM" live><Apt from={s} light="dusk" cam={[{at: s, x: 196, y: 90, zoom: 2.2}, {at: E.behindYou, x: 196, y: 90, zoom: 2.2},
      {at: wf('P145', 0), x: 194, y: 88, zoom: 3.2}]} actors={(g) => [H('turn0.scared', 200, 112, {blink: false}), ...(g >= E.behindYou - 6 ? [P('mirror2', 188, 112, {})] : [])]} /></PetCamFeed>, 'feed'],
    [cut('P146'), (s) => <Apt from={s} light="night" cam={[{at: s, x: 150, y: 92, zoom: 2}, {at: wf('P147', 0), x: 120, y: 92, zoom: 1.6}]}
      actors={() => [H([{at: -999, pose: 'turn0.scared'}, ...turnKeys(wf('P146', 1), 'shock', 3)], 200, 112, {blink: false}), P('loaf', 56, 88)]} glows={() => [{x: 56, y: 80, r: 14, i: 0.35}]} />],
    [cut('P149'), (s) => <PetCamFeed clock="03:12:02" label="KITCHEN CAM" live><Apt from={s} light="dusk" cam={[{at: s, x: 196, y: 90, zoom: 2.6}, {at: E.closer, x: 197, y: 92, zoom: 3.6}]}
      actors={(g) => [H('down.shock', 200, 112, {blink: false}), P('mirror2', g < E.closer ? 192 : 196, 112)]} /></PetCamFeed>, 'feed'],
    [cut('P152'), () => <Bust atlas={busts} frame="hero_terror" scale={[24, 30]} dur={150} />, 'insert'],
    [E.whisper + 22, () => <AbsoluteFill style={{background: '#000'}} />, 'insert'],

    // ===== ENDING: the shelter, and the narrator
    [cut('P154'), (s) => <Shelter from={s} cam={[{at: s, x: 150, y: 70, zoom: 1.5}]} actors={(g) => shelterCats(g, 'walk0').filter((a) => !(a.x > 160 && a.x < 200 && a.y < 80 && a.y > 70))} children={() => <Bars />} />],
    [cut('P155'), (s) => <Shelter from={s} cam={[{at: s, x: 60, y: 86, zoom: 3}]} actors={() => [K('carrier', 60, 87), {atlas: civ, frame: 'nurse.front', x: 34, y: 92}]} />],
    [cut('P157'), (s) => <Shelter from={s} cam={[{at: s, x: 76, y: 92, zoom: 3.2}, {at: E.you, x: 80, y: 92, zoom: 3.2}, {at: E.you + 3, x: 86, y: 92, zoom: 5, ease: Easing.out(Easing.cubic)}]}
      actors={(g) => [K('carrier', 60, 87), {atlas: civ, frame: 'nurse.front', x: 34, y: 92}, H(g < wf('P158', 0) ? 'turn0.neutral' : 'down.smile', 86, 112, {blink: false})]} />],
    [wf('P159', 1) + 4, () => <Bust atlas={sb} frame="hero_smile" scale={[15, 17]} dur={200} bg="radial-gradient(60% 70% at 50% 45%, #b8cdb4, #7d947b)" />, 'insert'],
    [cut('P162'), () => <><AbsoluteFill style={{background: '#93ab90'}} /><CageCard returned={3} at={-99} strikeAt={E.returned4 - cut('P162')} /></>, 'insert'],
    [cut('P163'), () => <Carrier />, 'insert'],
    [cut('P165'), (s) => <Shelter from={s} cam={[{at: s, x: 50, y: 86, zoom: 3.4}]} actors={() => [K('carrier', 60, 87), {atlas: civ, frame: 'nurse.front', x: 34, y: 92}]} />],
    [cut('P166'), (s) => <Street from={s} cam={[{at: s, x: 96, y: 80, zoom: 1.8}, {at: E.reveal, x: 120, y: 84, zoom: 2.2}]} actors={(g) => [H('down.smile', 80 + (g - s) * 0.22, 112, {blink: false})]} />],
    [E.reveal - 2, () => <Bust atlas={sb} frame="hero_smile" scale={[15, 22]} dur={110} bg="#0a0b10" />, 'insert'],
    [E.end - 4, () => <EndCard at={0} />, 'insert'],
  ];

  const kinds = shots.map((x) => x[2]);
  const idx = shots.findIndex((x, i) => f >= x[0] && (i + 1 >= shots.length || f < shots[i + 1][0]));
  const plain = idx >= 0 && (!kinds[idx] || kinds[idx] === 'phone');
  const sub = pick(f, CLOCK), status = pick(f, STATUS);
  const ps = PEPPER_STATE.reduce((a, b) => (f >= b[0] ? b : a), PEPPER_STATE[0]);
  const meterOn = f >= E.rule1 && f < E.end;

  return <AbsoluteFill style={{background: '#05060a'}}>
    {shots.map(([from, render], i) => {
      const to = i + 1 < shots.length ? shots[i + 1][0] : KP_FRAMES;
      return <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>{render(from)}</Sequence>;
    })}
    {/* accents */}
    <Flash at={E.turned + 3} color="#ffffff" dur={3} peak={0.25} />
    <Flash at={E.lookCam + 3} color="#ffffff" dur={3} peak={0.35} />
    <Flash at={E.person} color="#ff2d3d" dur={3} peak={0.3} />
    <Flash at={E.two} color="#ff2d3d" dur={3} peak={0.25} />
    <Flash at={E.sameSmile} color="#ff2d3d" dur={3} peak={0.25} />
    <Flash at={E.still} color="#ff2d3d" dur={4} peak={0.35} />
    <Flash at={E.behindYou} color="#ff2d3d" dur={3} peak={0.35} />
    <Flash at={E.you + 3} color="#ffffff" dur={3} peak={0.3} />
    <Tint color="rgba(255,30,40,1)" from={E.flip1} to={we('P128')} peak={0.08} pulse={30} />
    {plain && <Vignette strength={0.75} />}
    {plain && <HudL series="KEEP PRETENDING" clock={sub} status={status} chips={[{label: 'PEPPER', value: ps[1], tone: ps[2], changedAt: ps[0]}]} changedAt={pick(f, STATUS.map(([a]) => [a, a] as [number, number]))} />}
    {plain && <BeatChip chips={CHIPS} />}
    {plain && meterOn && <SuspicionMeter level={suspicion(f)} />}
    {f < E.end - 4 && (idx >= 0 && kinds[idx] === 'phone'
      ? <div style={{position: 'absolute', left: 0, top: 0, width: 1150, height: 1080}}><CaptionL phrases={PHRASES} size={68} /></div>
      : <CaptionL phrases={PHRASES} />)}
    <Audio src={staticFile('audio/kp-mix.wav')} />
  </AbsoluteFill>;
};

/** Feed clock that ticks in real time from a start "hh:mm" plus offset seconds. */
function feedClock(f: number, s: number, hhmm: string, offS: number) {
  const sec = Math.floor((f - s) / FPS) + offS;
  return `${hhmm}:${String(sec % 60).padStart(2, '0')}`;
}
/** Clock that scrubs fast between two times (in minutes) while the scrub bar moves. */
function scrubClock(f: number, s: number, to: number, fromMin: number, toMin: number) {
  const m = Math.round(interpolate(f, [s, to], [fromMin, toMin], clamp));
  return `0${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String((f * 7) % 60).padStart(2, '0')}`;
}

/** Thumbnail still: the cold-open moment, with the hook text. */
export const KeepPretendingThumb: React.FC = () => {
  useKitFonts();
  return <AbsoluteFill style={{background: '#000'}}>
    <PetCamFeed clock="03:12:44" label="KITCHEN CAM" live>
      <WorldL cam={{x: 72, y: 92, zoom: 2.6}}>
        <SetL src="sets/kp_apartment_bg.png" />
        <PixelSprite atlas={pep} frame="up" x={40} y={112} breathe={false} squash={false} blink={false} />
        <Darken amount={0.35} />
        <Glow x={37.5} y={92.5} r={1.3} color="rgba(240,255,240,1)" intensity={1.2} />
        <Glow x={42.5} y={92.5} r={1.3} color="rgba(240,255,240,1)" intensity={1.2} />
      </WorldL>
    </PetCamFeed>
    <div style={{position: 'absolute', right: 70, top: 220, textAlign: 'right', fontFamily: 'Anton, Impact, sans-serif', lineHeight: 0.98, WebkitTextStroke: `16px ${color.ink}`, paintOrder: 'stroke fill'}}>
      <div style={{fontSize: 150, color: '#fff'}}>IF YOUR CAT</div>
      <div style={{fontSize: 150, color: '#fff'}}>DOES THIS…</div>
      <div style={{fontSize: 118, color: color.keyRed, marginTop: 24}}>PRETEND YOU</div>
      <div style={{fontSize: 118, color: color.keyRed}}>DIDN'T SEE.</div>
    </div>
  </AbsoluteFill>;
};
