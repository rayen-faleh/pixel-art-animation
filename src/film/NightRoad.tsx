import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import timing from '../nr-timing.json';
import heroA from '../../public/sprites/hero.json';
import dadA from '../../public/sprites/dad.json';
import infA from '../../public/sprites/infected.json';
import sedanA from '../../public/sprites/sedan.json';
import paleA from '../../public/sprites/pale.json';
import propA from '../../public/sprites/nr_props.json';
import {FPS, color} from '../kit/theme';
import {camAt, useKitFonts, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Beam, Darken, Flash, Vignette, Rings, Tint} from '../kit/effects';
import {phrasesFrom, Word} from '../kit/overlay';
import {WorldL, SetL, LightMask, CaptionL, HudL, SeenMeter, RuleCardL, TitleL, QuestionL, PhoneL, SearchScreen, MapScreen, ChipL} from './nr-kit';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), dad = A(dadA), inf = A(infA), sedan = A(sedanA), pale = A(paleA), prop = A(propA);

// ---------- timing anchors (seconds from src/nr-timing.json -> frames) ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'N101'), 0.6);

export const NR_END = we('N101') + 20;
export const NR_FRAMES = NR_END + 150;

// ---------- key moments (mirrored in scripts/build_nr_cues.py) ----------
const E = {
  flick: wf('N03', 6), truck: wf('N11', 2), visor: wf('N11', 15), drop: wf('N12', 3), passes: wf('N19', 2),
  lampOff: wf('N09', 7), carLit: wf('N29', 6), turn: wf('N31', 5), haz: wf('N32', 7), hazOff: wf('N32', 10),
  phoneUp: wf('N37', 2), blue: wf('N38', 4), stands: wf('N41', 5), slap: wf('N42', 1), click: wf('N43', 3), station: wf('N44', 6),
  buzz: wf('N50', 2), drops: wf('N55', 2), fuel: wf('N56', 2), canopy: wf('N61', 5), pullIn: wf('N62', 0), buzzLight: wf('N67', 9), lightOut: wf('N68', 1),
  door: wf('N69', 5), dome: wf('N70', 4), slam: wf('N71', 1), fade: wf('N72', 0), faces: wf('N74', 4), three: wf('N75', 0), two: wf('N75', 1), one: wf('N75', 2), dark: wf('N76', 0),
  roof: wf('N78', 1), slide: wf('N80', 1), now: wf('N83c', 4), throat: wf('N84', 8), reach: wf('N86', 2), back: wf('N88', 4),
  street: wf('N90', 4), sweep: wf('N91', 2), keys: wf('N99', 3), lock: we('N99', -1), byItself: wf('N100', 7),
};

// ---------- road geometry (kit/sets_nightroad.py) ----------
const VPX = 120, VPY = 46;
const gy = (z: number) => VPY + 89 / z;
const gx = (wx: number, z: number) => VPX + wx / z;
const V = 0.11;                                            // our speed, z units per frame
const ahead = (g: number, at: number, zAt: number, v = V) => zAt - v * (g - at);   // a fixed object we drive toward

type RObj = {kind: 'marker' | 'pale' | 'car' | 'lamp'; frame?: string; wx: number; z: number; glow?: number; flip?: boolean};
const RoadObjs: React.FC<{objs: RObj[]; head: number}> = ({objs, head}) => <>
  {[...objs].filter((o) => o.z > 0.35 && o.z < 60).sort((a, b) => b.z - a.z).map((o, i) => {
    const x = gx(o.wx, o.z), y = gy(o.z);
    const b = Math.min(1.35, 0.1 + head * 2.4 / o.z);
    if (o.kind === 'lamp') return <React.Fragment key={i}>
      <div style={{position: 'absolute', left: x, top: y - 70 / o.z, width: Math.max(0.6, 2 / o.z), height: 70 / o.z, background: '#1b1d22'}} />
      <Glow x={x - 8 / o.z} y={y - 70 / o.z} r={6 / o.z + 2} color="rgba(255,170,80,1)" intensity={(o.glow ?? 1) * 0.9} />
      <Glow x={x - 10 / o.z} y={y} r={30 / o.z + 3} rx={60 / o.z + 4} color="rgba(255,160,70,1)" intensity={(o.glow ?? 1) * 0.5} />
    </React.Fragment>;
    const atlas = o.kind === 'car' ? sedan : o.kind === 'marker' ? prop : pale;
    const sc = o.kind === 'car' ? 1.25 / o.z : 0.9 / o.z;
    return <div key={i} style={{filter: `brightness(${o.glow ? Math.max(b, o.glow) : b})`}}>
      <PixelSprite atlas={atlas} frame={o.frame ?? (o.kind === 'car' ? 'rear' : o.kind === 'pale' ? 'side' : 'marker_12')} x={x} y={y} scale={sc} flip={o.flip}
        breathe={false} squash={false} blink={false} />
    </div>;
  })}
</>;

const Dashes: React.FC<{g: number; v: number}> = ({g, v}) => {
  const P = 3, L = 1.3, ph = (g * v) % P;
  return <>{Array.from({length: 14}, (_, k) => {
    const z0 = 0.5 + k * P - ph, z1 = z0 + L;
    if (z0 < 0.4) return null;
    const y0 = gy(z1), y1 = gy(z0), w = Math.max(0.5, 2.4 / z0);
    return <div key={k} style={{position: 'absolute', left: gx(0, z0) - w / 2, top: y0, width: w, height: Math.max(0.5, y1 - y0),
      background: `rgba(160,140,60,${Math.min(0.9, 1.6 / z0)})`}} />;
  })}</>;
};

/** Forward view of Route 9 with our headlights. truck = [start, pass] frames of an oncoming truck. */
const RoadView: React.FC<{g: number; v?: number; objs?: RObj[]; head?: number; truck?: [number, number]; through?: boolean}> = ({g, v = V, objs = [], head = 1, truck, through}) => {
  let tz = 99;
  if (truck) tz = interpolate(g, [truck[0], truck[1]], [24, 0.4], clamp);
  return <>
    <SetL src="sets/nr_road.png" />
    <Dashes g={g} v={v} />
    <Darken amount={through ? 0.35 : 0.2} />
    <Glow x={120} y={128} r={38} rx={95} color="rgba(255,236,190,1)" intensity={0.5 * head} />
    <Glow x={120} y={86} r={22} rx={60} color="rgba(255,236,190,1)" intensity={0.22 * head} />
    <RoadObjs objs={objs} head={head} />
    {truck && tz < 24 && tz > 0.45 && <>
      <Glow x={gx(-44, tz)} y={gy(tz) - 9 / tz} r={8 / tz + 3} color="rgba(255,255,240,1)" intensity={1.1} />
      <Glow x={gx(-26, tz)} y={gy(tz) - 9 / tz} r={8 / tz + 3} color="rgba(255,255,240,1)" intensity={1.1} />
      <Glow x={gx(-35, tz)} y={gy(tz)} r={30 / tz + 6} rx={70 / tz + 8} color="rgba(255,255,240,1)" intensity={0.5} />
    </>}
  </>;
};

const Fwd: React.FC<{from: number; cam?: CamKey[]; objs?: (g: number) => RObj[]; truck?: [number, number]; head?: (g: number) => number; v?: number; dark?: number; children?: React.ReactNode}> = ({from, cam, objs, truck, head, v, dark = 0, children}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 120, y: 70, zoom: 1.05 + f * 0.0006};
  return <WorldL cam={c}><RoadView g={g} objs={objs?.(g)} truck={truck} head={head?.(g) ?? 1} v={v} />{children}{dark > 0 && <Darken amount={dark} />}</WorldL>;
};

// ---------- cab (inside, from the back seat) ----------
const WS_CLIP = 'polygon(40px 20px, 200px 20px, 218px 66px, 22px 66px)';
type CabProps = {
  from: number; cam?: CamKey[]; zoom?: number; objs?: (g: number) => RObj[]; truck?: [number, number]; pose?: {at: number; pose: string}[];
  visor?: 'up' | 'down'; dome?: (g: number) => number; phone?: (g: number) => number; tint?: string; faces?: (g: number) => number;
  street?: (g: number) => number; shake?: (g: number) => number; dash?: (g: number) => number; v?: number; fuel?: (g: number) => number;
  pov?: boolean; strip?: boolean;
};
const Cab: React.FC<CabProps> = ({from, cam, objs, truck, pose, visor = 'up', dome, phone, faces, street, shake, dash, v, fuel, pov, strip}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 120, y: 68, zoom: 1.02 + f * 0.0005};
  const dm = dome?.(g) ?? 0, ph = phone?.(g) ?? 0, fc = faces?.(g) ?? 0, st = street?.(g) ?? -1, dl = dash?.(g) ?? 1, fu = fuel?.(g) ?? 0;
  const keys = (pose ?? [{at: 0, pose: 'turn0.neutral'}]).map((k) => ({...k, at: k.at - from}));
  return <WorldL cam={c} shake={shake?.(g) ?? 0}>
    <RoadView g={g} objs={objs?.(g)} truck={truck} through v={v} />
    <SetL src="sets/nr_cab_bg.png" />
    <PixelSprite atlas={prop} frame={visor === 'down' ? 'visor_down' : 'visor_up'} x={72} y={50} breathe={false} squash={false} />
    {strip && <div style={{position: 'absolute', left: 62, top: 31, width: 22, height: 3, background: '#d8cfb4', transform: 'rotate(-4deg)'}} />}
    {!pov && <PixelSprite atlas={hero} x={72} y={111} keys={keys} />}
    <SetL src="sets/nr_cab_fg.png" />
    <Darken amount={0.42 * (1 - dm * 0.85)} />
    {/* dash lights */}
    <Glow x={58} y={77} r={6} color="rgba(120,220,170,1)" intensity={0.5 * dl} />
    <Glow x={86} y={77} r={6} color="rgba(120,220,170,1)" intensity={0.5 * dl} />
    <Glow x={114} y={78} r={9} color="rgba(120,255,170,1)" intensity={0.35 * dl} />
    {fu > 0 && <Glow x={72} y={80} r={5} color="rgba(255,150,40,1)" intensity={fu} />}
    {ph > 0 && <><Glow x={168} y={100} r={50} rx={80} color="rgba(120,180,255,1)" intensity={ph} /><Glow x={120} y={50} r={80} rx={140} color="rgba(120,180,255,1)" intensity={ph * 0.35} /></>}
    {st >= 0 && <Glow x={st} y={40} r={40} rx={60} color="rgba(255,170,80,1)" intensity={0.7} />}
    {dm > 0 && <>
      {/* windshield turns into a mirror: road gone, the cabin and you reflected, and faces behind the glass */}
      <div style={{position: 'absolute', inset: 0, clipPath: WS_CLIP, background: `rgba(14,12,10,${0.92 * Math.min(1, dm * 1.4)})`}}>
        <div style={{opacity: 0.3 * dm}}><PixelSprite atlas={hero} frame="down.scared.b0" x={72} y={76} flip /></div>
        {fc > 0 && [[150, 0], [104, 4], [186, 8], [42, 12], [128, 2]].map(([x, d], i) => <div key={i} style={{opacity: Math.min(1, Math.max(0, (fc * 30 - d) / 10))}}>
          <PixelSprite atlas={inf} frame={i % 2 ? 'face_open' : 'face'} x={x} y={40 + 51} breathe={false} squash={false} blink={false} />
        </div>)}
      </div>
      {fc > 0 && <>
        <div style={{position: 'absolute', left: 0, top: 22, width: 14, height: 44, overflow: 'hidden', opacity: fc}}><PixelSprite atlas={inf} frame="face" x={6} y={74} breathe={false} squash={false} blink={false} /></div>
        <div style={{position: 'absolute', left: 226, top: 22, width: 14, height: 44, overflow: 'hidden', opacity: fc}}><PixelSprite atlas={inf} frame="face_open" x={8} y={74} breathe={false} squash={false} blink={false} /></div>
      </>}
      <Glow x={120} y={10} r={150} rx={190} color="rgba(255,214,150,1)" intensity={dm * 0.9} />
      <Glow x={120} y={9} r={10} color="rgba(255,240,210,1)" intensity={dm * 1.2} />
    </>}
  </WorldL>;
};

/** A pale handprint smear on glass (art px). */
const Hand: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 0}) => <div style={{position: 'absolute', left: x - 2, top: y - 2, width: 5, height: 6, transform: `rotate(${r % 40 - 20}deg)`}}>
  <div style={{position: 'absolute', left: 0, top: 2, width: 5, height: 4, borderRadius: 2, background: 'rgba(235,238,245,0.55)'}} />
  {[0, 1.3, 2.6, 3.9].map((fx, i) => <div key={i} style={{position: 'absolute', left: fx, top: i === 0 || i === 3 ? 0.6 : 0, width: 1, height: 2.2, borderRadius: 0.5, background: 'rgba(235,238,245,0.5)'}} />)}
</div>;

// ---------- side view ----------
type SideProps = {from: number; cam?: CamKey[]; car?: string; carX?: (g: number) => number; scroll?: number; objs?: (g: number) => {frame: string; atlas: 'pale' | 'prop' | 'sedan'; x: number; y?: number; flip?: boolean; glow?: number}[];
  lit?: boolean; grass?: boolean; tint?: string; roof?: (g: number) => number; headOn?: boolean; dark?: number; prints?: [number, number][]};
const Side: React.FC<SideProps> = ({from, cam, car = 'side', carX, scroll = 1.6, objs, lit, grass, roof, headOn = true, dark = 0.25, prints = []}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 120, y: 80, zoom: 1.05};
  const cx = carX?.(g) ?? 120, bob = Math.round(Math.sin(g * 0.9) * 0.4);
  const far = -((g * scroll * 0.15) % 480);
  return <WorldL cam={c}>
    <SetL src="sets/nr_side_bg.png" />
    <SetL src="sets/nr_side_far.png" x={far} w={480} /><SetL src="sets/nr_side_far.png" x={far + 480} w={480} />
    {Array.from({length: 4}, (_, k) => { const x = ((k * 90 - g * scroll) % 360 + 360) % 360 - 60; return <div key={k} style={{position: 'absolute', left: x, top: 56, width: 2, height: 41, background: '#0b0d10'}} />; })}
    {Array.from({length: 7}, (_, k) => { const x = ((k * 40 - g * scroll) % 280 + 280) % 280 - 20; return <div key={k} style={{position: 'absolute', left: x, top: 104, width: 10, height: 1, background: 'rgba(150,130,60,0.6)'}} />; })}
    {objs?.(g).map((o, i) => <div key={i} style={{filter: o.glow ? `brightness(${o.glow})` : undefined}}><PixelSprite atlas={o.atlas === 'pale' ? pale : o.atlas === 'prop' ? prop : sedan}
      frame={o.frame} x={o.x} y={o.y ?? 96} flip={o.flip} breathe={false} squash={false} blink={false} /></div>)}
    {car !== 'none' && <>
      <PixelSprite atlas={sedan} frame={car} x={cx} y={110 + bob} breathe={false} squash={false} />
      {roof && roof(g) > 0 && <div style={{opacity: roof(g)}}><PixelSprite atlas={pale} frame="front" x={cx + 6} y={86 + bob} breathe={false} squash={false} blink={false} style={{transform: 'rotate(80deg)'}} /></div>}
    </>}
    {prints.map(([x, y], i) => <Hand key={i} x={x} y={y} r={i * 37} />)}
    {grass && <><SetL src="sets/nr_grass.png" x={-((g * scroll) % 480)} w={480} /><SetL src="sets/nr_grass.png" x={480 - ((g * scroll) % 480)} w={480} /></>}
    <Darken amount={dark} />
    {car !== 'none' && headOn && <><Beam x={cx - 75} y={88} w0={4} w1={60} h={22} color="rgba(255,236,190,1)" intensity={0.8} />
      <Glow x={cx - 46} y={95 + bob} r={4} color="rgba(255,240,200,1)" intensity={1} />
      <Glow x={cx + 42} y={95 + bob} r={3} color="rgba(255,40,40,1)" intensity={0.8} /></>}
    {lit && car !== 'none' && <Glow x={cx - 2} y={86} r={22} rx={30} color="rgba(255,200,120,1)" intensity={0.8} />}
  </WorldL>;
};

// ---------- inserts ----------
const Card: React.FC<{from: number; light: (g: number) => {x: number; y: number; rx: number; ry: number; c: string; i: number}; cam?: CamKey[]; dropAt?: number}> = ({from, light, cam, dropAt}) => {
  const f = useCurrentFrame(); const g = f + from;
  const L = light(g);
  const c = cam ? camAt(g, cam) : {x: 120, y: 66, zoom: 1.04 + f * 0.0008};
  const dy = dropAt !== undefined ? interpolate(g, [dropAt, dropAt + 7, dropAt + 10, dropAt + 13], [-150, 0, -3, 0], clamp) : 0;
  return <WorldL cam={c}>
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`}}><SetL src="sets/nr_card.png" /></div>
    <LightMask x={L.x} y={L.y} rx={L.rx} ry={L.ry} dark={0.93} />
    <Glow x={L.x} y={L.y} r={L.ry} rx={L.rx} color={L.c} intensity={L.i} />
  </WorldL>;
};

const Dome: React.FC<{from: number; sw?: (g: number) => 'off' | 'door' | 'on'; thumb?: (g: number) => number; lit?: (g: number) => number; cam?: CamKey[]}> = ({from, sw, thumb, lit, cam}) => {
  const f = useCurrentFrame(); const g = f + from;
  const pos = {off: 184, door: 196, on: 208}[sw?.(g) ?? 'door'];
  const th = thumb?.(g) ?? 0, li = lit?.(g) ?? 0;
  const c = cam ? camAt(g, cam) : {x: 140, y: 64, zoom: 1.15 + f * 0.001};
  return <WorldL cam={c}>
    <SetL src="sets/nr_dome.png" />
    <div style={{position: 'absolute', left: pos - 3, top: 56, width: 6, height: 14, background: '#4a4c57', boxShadow: 'inset 0 1px 0 #6a6c78'}} />
    {th > 0 && <PixelSprite atlas={prop} frame="hand_thumb" x={pos + 2} y={interpolate(th, [0, 1], [175, 96])} scale={2} breathe={false} squash={false} />}
    <Darken amount={0.55 * (1 - li)} />
    {li > 0 && <><Glow x={120} y={63} r={50} rx={70} color="rgba(255,226,170,1)" intensity={li * 1.3} /><Glow x={120} y={63} r={120} rx={160} color="rgba(255,206,140,1)" intensity={li * 0.6} /></>}
  </WorldL>;
};

const Radio: React.FC<{from: number; text: (g: number) => string; hand?: (g: number) => number; flicker?: (g: number) => number}> = ({from, text, hand, flicker}) => {
  const f = useCurrentFrame(); const g = f + from;
  const fl = flicker?.(g) ?? 0;
  const on = fl > 0 ? (random(`rf${Math.floor(g / 2)}`) > fl ? 1 : 0.25) : 1;
  const h = hand?.(g) ?? 0;
  return <WorldL cam={{x: 120, y: 68, zoom: 1.08 + f * 0.0012}}>
    <SetL src="sets/nr_radio.png" />
    <div style={{position: 'absolute', left: 60, top: 50, width: 88, height: 20, fontFamily: 'Silkscreen, monospace', fontSize: 13, lineHeight: '20px', color: `rgba(120,255,160,${on})`,
      textAlign: 'center', textShadow: `0 0 3px rgba(120,255,160,${0.8 * on})`, whiteSpace: 'nowrap'}}>{text(g)}</div>
    {h > 0 && <PixelSprite atlas={prop} frame="hand_reach" x={interpolate(h, [0, 1], [260, 200])} y={interpolate(h, [0, 1], [130, 82])} scale={2} breathe={false} squash={false} />}
    <Darken amount={0.25} />
    <Glow x={104} y={60} r={18} rx={52} color="rgba(120,255,160,1)" intensity={0.35 * on} />
  </WorldL>;
};

const Mirror: React.FC<{from: number; fig?: (g: number) => {x: number; s: number; frame: string} | null; street?: (g: number) => number; empty?: boolean}> = ({from, fig, street}) => {
  const f = useCurrentFrame(); const g = f + from;
  const F = fig?.(g), st = street?.(g) ?? -1;
  return <WorldL cam={{x: 120, y: 60, zoom: 1.12 + f * 0.0015}}>
    <SetL src="sets/nr_road.png" style={{filter: 'brightness(0.6)'}} />
    <Glow x={120} y={128} r={38} rx={95} color="rgba(255,236,190,1)" intensity={0.3} />
    <SetL src="sets/nr_mirror_in.png" />
    {F && <div style={{position: 'absolute', left: 44, top: 30, width: 153, height: 40, overflow: 'hidden'}}>
      <PixelSprite atlas={pale} frame={F.frame} x={F.x - 44} y={58 - 30} scale={F.s} flip breathe={false} squash={false} blink={false} />
      <Glow x={F.x - 44} y={22} r={10} color="rgba(255,40,40,1)" intensity={0.25} /></div>}
    {st >= 0 && <div style={{position: 'absolute', left: 44, top: 30, width: 153, height: 63, overflow: 'hidden'}}><Glow x={st} y={30} r={40} rx={50} color="rgba(255,170,80,1)" intensity={0.8} /></div>}
    <SetL src="sets/nr_mirror.png" />
    <Darken amount={0.35} />
    <Glow x={120} y={60} r={34} rx={80} color="rgba(255,60,60,1)" intensity={0.12} />
  </WorldL>;
};

const Rear: React.FC<{from: number; slide?: [number, number]; street?: (g: number) => number}> = ({from, slide, street}) => {
  const f = useCurrentFrame(); const g = f + from;
  const st = street?.(g) ?? -1;
  const sp = slide ? interpolate(g, [slide[0], slide[1]], [0, 1], {...clamp, easing: Easing.in(Easing.quad)}) : -1;
  return <WorldL cam={{x: 120, y: 64, zoom: 1.08 + f * 0.001}}>
    <div style={{position: 'absolute', left: 52, top: 22, width: 136, height: 43, background: 'linear-gradient(180deg, #05070d, #0a0e12)'}} />
    <Glow x={120} y={64} r={16} rx={90} color="rgba(255,30,30,1)" intensity={0.25} />
    {sp >= 0 && sp < 1 && <div style={{position: 'absolute', left: 52, top: 22, width: 136, height: 43, overflow: 'hidden'}}>
      <PixelSprite atlas={pale} frame="front" x={118} y={10 + sp * 80} scale={2.6} breathe={false} squash={false} blink={false} style={{transform: 'rotate(180deg)'}} />
    </div>}
    {sp >= 0.2 && [[96, 30], [132, 34], [110, 46], [146, 50]].map(([x, y], i) => <div key={i} style={{position: 'absolute', left: x, top: y, width: 7, height: 9, borderRadius: 3,
      background: 'rgba(210,214,222,0.22)', opacity: Math.min(1, (sp - 0.2) * 3)}} />)}
    <SetL src="sets/nr_rear_bg.png" />
    {st >= 0 && <Glow x={st} y={40} r={40} rx={70} color="rgba(255,170,80,1)" intensity={0.7} />}
    <Darken amount={0.4} />
  </WorldL>;
};

/** Behind our car on the road (rear view): one taillight out; optional thing on the roof. */
const Behind: React.FC<{from: number; roof?: (g: number) => number; cam?: CamKey[]; brake?: boolean}> = ({from, roof, cam}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 120, y: 84, zoom: 1.3 + f * 0.001};
  const bob = Math.sin(g * 0.8) * 0.3;
  const r = roof?.(g) ?? 0;
  return <WorldL cam={c}>
    <SetL src="sets/nr_road.png" />
    <Dashes g={-g} v={V} />
    <Darken amount={0.35} />
    <Glow x={120} y={70} r={20} rx={60} color="rgba(255,236,190,1)" intensity={0.35} />
    <PixelSprite atlas={sedan} frame="rear_ours" x={120} y={118 + bob} scale={1.6} breathe={false} squash={false} />
    {r > 0 && <div style={{opacity: r}}><PixelSprite atlas={pale} frame="front" x={128} y={75 + bob} scale={1.1} breathe={false} squash={false} blink={false} /></div>}
    <Glow x={120 - 25} y={89 + bob} r={6} color="rgba(255,30,30,1)" intensity={0.9} />
    <Glow x={120} y={100} r={30} rx={50} color="rgba(255,30,30,1)" intensity={0.15} />
  </WorldL>;
};

const Field: React.FC<{from: number; rise?: [number, number]; blue?: number; many?: (g: number) => number}> = ({from, rise, blue = 0, many}) => {
  const f = useCurrentFrame(); const g = f + from;
  const rp = rise ? interpolate(g, [rise[0], rise[1]], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 1;
  const turn = many?.(g) ?? -1;
  return <WorldL cam={{x: 120, y: 82, zoom: 1.2 + f * 0.0012}}>
    <SetL src="sets/nr_side_bg.png" />
    <SetL src="sets/nr_side_far.png" x={-60} w={480} />
    {rise && <PixelSprite atlas={pale} frame={rp > 0.9 ? 'look' : 'front'} x={150} y={128 + (1 - rp) * 40} breathe={false} squash={false} blink={false} />}
    {many && [[30, 92, 0], [70, 94, 3], [104, 91, 1], [150, 93, 5], [196, 92, 2], [224, 94, 4]].map(([x, y, d], i) =>
      <PixelSprite key={i} atlas={pale} frame={turn > d * 2 ? 'look' : 'side'} x={x} y={y} scale={0.7} breathe={false} squash={false} blink={false} />)}
    <SetL src="sets/nr_grass.png" x={-((g * 0.5) % 480)} w={480} />
    <Darken amount={0.3} />
    {blue > 0 && <Glow x={120} y={70} r={90} rx={160} color="rgba(120,180,255,1)" intensity={blue} />}
  </WorldL>;
};

const GAS_LIGHTS = [58, 98, 142, 182];
const Gas: React.FC<{from: number; cam?: CamKey[]; carX?: (g: number) => number; carFrame?: (g: number) => string; heroAt?: (g: number) => {x: number; pose: string} | null;
  figs?: (g: number) => number; step?: number; lightOut?: number; buzz?: number; pump?: (g: number) => string}> = ({from, cam, carX, carFrame, heroAt, figs, step = 1e9, lightOut = 1e9, buzz = 1e9, pump}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 120, y: 70, zoom: 1.02};
  const cx = carX?.(g) ?? 116, cf = carFrame?.(g) ?? 'side';
  const fv = figs?.(g) ?? 0;
  const stepP = interpolate(g, [step, step + 6], [0, 1], clamp);
  const lights = GAS_LIGHTS.map((_, i) => {
    if (i !== 1) return 1;
    if (g >= lightOut) return 0;
    if (g >= buzz) return random(`gb${Math.floor(g / 2)}`) > 0.35 ? 1 : 0.2;
    return 1;
  });
  const H = heroAt?.(g);
  return <WorldL cam={c}>
    <SetL src="sets/nr_gas_bg.png" />
    {fv > 0 && Array.from({length: 13}, (_, k) => {
      const x = 12 + k * 17.5 + (k % 2) * 2;
      return <div key={k} style={{opacity: Math.min(1, Math.max(0, fv * 14 - k * 0.6))}}><PixelSprite atlas={pale} frame="front" x={x} y={GAS_PAD + 1 + stepP * 4} scale={0.82 + stepP * 0.08}
        breathe={false} squash={false} blink={false} style={{filter: 'brightness(0.55)'}} /></div>;
    })}
    <PixelSprite atlas={prop} frame="pump" x={100} y={98} breathe={false} squash={false} />
    <PixelSprite atlas={prop} frame="pump" x={140} y={98} breathe={false} squash={false} />
    {pump && <div style={{position: 'absolute', left: 133, top: 70, width: 14, height: 6, fontFamily: 'Silkscreen, monospace', fontSize: 4.4, lineHeight: '6px', color: '#9fffb0',
      textAlign: 'center', textShadow: '0 0 1px #9fffb0'}}>{pump(g)}</div>}
    <PixelSprite atlas={sedan} frame={cf} x={cx} y={124} breathe={false} squash={false} />
    {H && <PixelSprite atlas={hero} x={H.x} y={126} keys={[{at: 0, pose: H.pose}]} />}
    <SetL src="sets/nr_gas_fg.png" />
    <Darken amount={0.3} />
    {GAS_LIGHTS.map((x, i) => lights[i] > 0 && <React.Fragment key={i}>
      <Glow x={x} y={26} r={10} rx={14} color="rgba(235,245,255,1)" intensity={1.1 * lights[i]} />
      <Glow x={x} y={110} r={30} rx={34} color="rgba(225,235,255,1)" intensity={0.55 * lights[i]} />
    </React.Fragment>)}
    {cf !== 'side' && <Glow x={cx} y={112} r={18} rx={30} color="rgba(255,200,120,1)" intensity={0.9} />}
    {fv > 0 && <div style={{position: 'absolute', left: 0, top: GAS_PAD - 40, width: 240, height: 40, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.25))'}} />}
  </WorldL>;
};
const GAS_PAD = 100;

const Porch: React.FC<{from: number; cam?: CamKey[]; dadAt?: (g: number) => {x: number; y: number; pose: string} | null; heroAt?: (g: number) => {x: number; pose: string} | null;
  carLit?: (g: number) => number; lockFlash?: number; carX?: (g: number) => number}> = ({from, cam, dadAt, heroAt, carLit, lockFlash = 1e9, carX}) => {
  const f = useCurrentFrame(); const g = f + from;
  const c = cam ? camAt(g, cam) : {x: 140, y: 80, zoom: 1.1};
  const D = dadAt?.(g), H = heroAt?.(g), cl = carLit?.(g) ?? 0, cx = carX?.(g) ?? 196;
  const lf = g >= lockFlash && g < lockFlash + 14 && Math.floor((g - lockFlash) / 4) % 2 === 0;
  return <WorldL cam={c}>
    <SetL src="sets/nr_porch_bg.png" />
    <PixelSprite atlas={sedan} frame={cl > 0.5 ? 'side_lit' : 'side'} x={cx} y={126} breathe={false} squash={false} />
    {D && <PixelSprite atlas={dad} x={D.x} y={D.y} keys={[{at: 0, pose: D.pose}]} />}
    {H && <PixelSprite atlas={hero} x={H.x} y={128} keys={[{at: 0, pose: H.pose}]} />}
    <Darken amount={0.35} />
    <Glow x={86} y={78} r={30} color="rgba(255,210,140,1)" intensity={0.8} flicker={0.03} seed="porch" />
    <Glow x={86} y={100} r={50} rx={70} color="rgba(255,200,120,1)" intensity={0.35} />
    {lf && <><Glow x={cx - 46} y={115} r={5} color="rgba(255,180,60,1)" intensity={1.2} /><Glow x={cx + 42} y={115} r={5} color="rgba(255,180,60,1)" intensity={1.2} /></>}
    {cl > 0 && <Glow x={cx - 2} y={104} r={22} rx={34} color="rgba(255,200,120,1)" intensity={cl * 0.9} />}
  </WorldL>;
};

const Fabric: React.FC<{from: number; phone: (g: number) => 'up' | 'down'; slap?: number; buzz?: number; light?: number}> = ({from, phone, slap = 1e9, buzz = 1e9}) => {
  const f = useCurrentFrame(); const g = f + from;
  const st = phone(g);
  const bz = g >= buzz ? Math.sin(g * 3.1) * 0.8 : 0;
  const sp = interpolate(g, [slap - 5, slap, slap + 8], [0, 1, 0], clamp);
  return <WorldL cam={{x: 120, y: 70, zoom: 1.6 + f * 0.0015}} shake={g >= slap && g < slap + 6 ? 0.8 : 0}>
    <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #1f2129 0 2px, #24262f 2px 3px)'}} />
    <PixelSprite atlas={prop} frame={`phone_${st}`} x={120 + bz} y={96} scale={2} breathe={false} squash={false} />
    {sp > 0 && <PixelSprite atlas={prop} frame="hand_flat" x={interpolate(sp, [0, 1], [190, 128])} y={interpolate(sp, [0, 1], [70, 84])} scale={2} breathe={false} squash={false} />}
    <Darken amount={0.35} />
    {st === 'up' && <Glow x={120} y={56} r={60} rx={90} color="rgba(120,180,255,1)" intensity={1} />}
    {g >= buzz && <Rings x={120} y={70} at={buzz - from} count={8} every={12} life={30} maxR={30} width={0.5} />}
  </WorldL>;
};

const Strip: React.FC<{from: number; sweep: [number, number]}> = ({from, sweep}) => {
  const f = useCurrentFrame(); const g = f + from;
  const x = interpolate(g, [sweep[0], sweep[1]], [-40, 280], clamp);
  const x2 = interpolate(g, [sweep[1], sweep[1] + 60], [-40, 280], clamp);
  const lx = g < sweep[1] ? x : x2;
  return <WorldL cam={{x: 120, y: 66, zoom: 1.12 + f * 0.001}}>
    <SetL src="sets/nr_strip.png" />
    <LightMask x={lx} y={64} rx={90} ry={80} dark={0.9} />
    <Glow x={lx} y={64} r={60} rx={80} color="rgba(255,170,80,1)" intensity={0.6} />
  </WorldL>;
};

// ---------- HUD state ----------
const CLOCK: [number, string][] = [[0, '11:40 PM'], [cut('N09'), '11:47 PM'], [cut('N21'), '11:58 PM'], [cut('N27'), '12:06 AM'], [cut('N37'), '12:19 AM'], [cut('N50'), '12:33 AM'],
  [cut('N56'), '12:41 AM'], [cut('N66'), '12:52 AM'], [cut('N77'), '12:57 AM'], [cut('N81'), '1:11 AM'], [cut('N90'), '1:34 AM'], [cut('N95'), '2:08 AM']];
const STATUS: [number, string][] = [[0, 'I-80 EAST'], [wf('N08', 4), 'ROUTE 9'], [wf('N21', 2), 'ROUTE 9 · MILE 12'], [wf('N25', 2), 'ROUTE 9 · MILE 13'], [wf('N26a', 2), 'ROUTE 9 · MILE 14'],
  [wf('N34', 2), 'ROUTE 9 · MILE 20'], [cut('N56'), 'ROUTE 9 · MILE 22'], [E.pullIn, 'ROUTE 9 GAS'], [cut('N77'), 'ROUTE 9 · MILE 27'], [wf('N81', 2), 'ROUTE 9 · MILE 30'],
  [wf('N82', 2), 'ROUTE 9 · MILE 31'], [wf('N90', 2), 'ROUTE 9 · MILE 40'], [cut('N95'), 'HOME']];
const pick = (f: number, list: [number, string][]) => { let v = list[0][1], at = -99; for (const [t, s] of list) if (f >= t) { v = s; at = t; } return {v, at}; };
const chipsAt = (f: number): ChipL[] => {
  const fuelLow = wf('N56', 2), full = wf('N66', 10), noSig = E.drops;
  return [
    f < fuelLow ? {label: 'FUEL', value: '1/2'} : f < full ? {label: 'FUEL', value: 'LOW', tone: 'bad', changedAt: fuelLow} : {label: 'FUEL', value: 'FULL', changedAt: full},
    f < noSig ? {label: 'PHONE', value: '30%', tone: 'warn'} : {label: 'PHONE', value: 'NO SIGNAL', tone: 'bad', changedAt: noSig},
  ];
};
const SEEN: [number, number, number?][] = [
  [E.carLit, 0.55], [E.carLit + 30, 0.6], [E.phoneUp, 0.75], [E.blue, 0.95], [E.stands, 1.0], [E.station, 0.35], [E.buzz, 0.4], [E.fuel, 0.3],
  [E.pullIn, 0.5], [wf('N64', 0), 0.6], [E.lightOut, 0.75], [E.door, 0.85], [E.dome, 1.0, 400], [E.roof, 0.8], [E.reach, 0.6], [E.street, 0.4], [E.byItself, 1.0, 400],
];
const SEEN_FROM = wf('N29', 0);
const seenAt = (f: number) => {
  let lv = 0.06 + 0.02 * Math.sin(f * 0.5);
  for (const [at, l, hold] of SEEN) if (f >= at) {
    const d = f - at - (hold ? Math.min(hold, Math.max(0, E.dark - at)) : 0);
    lv = Math.max(lv, l * (d <= 0 ? 1 : Math.exp(-d / 40)));
  }
  if (f >= E.dark && f < E.dark + 4) lv = Math.min(lv, 0.1);
  return lv;
};

// ---------- the film ----------
export const NightRoad: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const clock = pick(f, CLOCK), status = pick(f, STATUS);

  const m = (n: number, line: string, i = 0, zAt = 1.4, extra = 0) => (g: number): RObj[] => [{kind: 'marker', frame: `marker_${n}`, wx: 86, z: ahead(g, wf(line, i) + extra, zAt)}];
  const markerFig = (n: number, line: string, wxFig: number, zAt = 2.2) => (g: number): RObj[] => {
    const z = ahead(g, we(line, -1), zAt, 0.075);
    return [{kind: 'marker', frame: `marker_${n}`, wx: 88, z}, {kind: 'pale', frame: 'side', wx: wxFig, z, flip: true}];
  };
  const T = (from: string, to: string) => [wf(from, 0), we(to, -1)] as [number, number];
  const blueDecay = (at: number) => (g: number) => g < at ? 0 : Math.max(0.15, 1.1 * Math.exp(-(g - at) / 200));

  const shots: [number, (from: number) => React.ReactNode][] = [
    // ----- cold open
    [0, (s) => <Dome from={s} sw={() => 'off'} thumb={(g) => interpolate(g, [10, 120], [0.25, 0.85], clamp)} cam={[{at: 0, x: 170, y: 66, zoom: 1.5}, {at: wf('N01', 12), x: 185, y: 66, zoom: 2.3}]} />],
    [cut('N02'), (s) => <><Cab from={s} dash={() => 0.6} /><AbsoluteFill style={{background: 'rgba(4,5,9,0.5)'}} />
      <PhoneL x={1220}><SearchScreen typeFrom={2} answerAt={wf('N02', 1) - s} q="is it illegal to drive with the inside light on" /></PhoneL></>],
    [cut('N03'), (s) => <Cab from={s} pose={[{at: 0, pose: 'turn0.neutral'}, {at: E.flick, pose: 'turn0.scared'}]} dome={(g) => (g >= E.flick && g < E.flick + 9 ? 1 : 0)} faces={(g) => (g >= E.flick + 2 && g < E.flick + 9 ? 1 : 0)}
      cam={[{at: s, x: 120, y: 56, zoom: 1.25}, {at: s + 90, x: 120, y: 52, zoom: 1.45}]} />],
    [cut('N04'), (s) => <Side from={s} cam={[{at: s, x: 120, y: 82, zoom: 1.0}, {at: cut('N05'), x: 128, y: 84, zoom: 1.12}]} />],
    // ----- the detour
    [cut('N05'), (s) => <Cab from={s} objs={(g) => [{kind: 'lamp', wx: 92, z: ahead(g, s, 7)}, {kind: 'lamp', wx: 92, z: ahead(g, s, 15)}]} />],
    [cut('N06'), (s) => <Cab from={s} pov cam={[{at: s, x: 74, y: 76, zoom: 2.6}, {at: s + 120, x: 74, y: 76, zoom: 2.9}]} />],
    [cut('N07'), (s) => <><Cab from={s} dash={() => 0.6} /><AbsoluteFill style={{background: 'rgba(4,5,9,0.5)'}} />
      <PhoneL x={1220}><MapScreen redAt={wf('N07', 6) - s} rerouteAt={wf('N08', 3) - s} emptyAt={wf('N08', 12) - s} /></PhoneL></>],
    [cut('N09'), (s) => <Fwd from={s} objs={(g) => [{kind: 'lamp', wx: 92, z: ahead(g, E.lampOff, 0.4), glow: 1}, {kind: 'marker', frame: 'marker_1', wx: 88, z: ahead(g, E.lampOff, 1.6)}]} />],
    [cut('N10'), (s) => <Side from={s} cam={[{at: s, x: 120, y: 84, zoom: 1.5}, {at: s + 100, x: 120, y: 80, zoom: 1.0}]} />],
    [cut('N11'), (s) => <Fwd from={s} truck={[s + 10, E.visor - 4]} />],
    [E.visor - 3, (s) => <Cab from={s} visor="down" cam={[{at: s, x: 80, y: 40, zoom: 1.8}]} street={(g) => interpolate(g, [s, s + 30], [60, 140], clamp)} />],
    [cut('N12'), (s) => <Card from={s} dropAt={E.drop} light={() => ({x: 120, y: 60, rx: 150, ry: 110, c: 'rgba(255,255,235,1)', i: 0.15})} />],
    [cut('N14'), (s) => <Card from={s} cam={[{at: s, x: 122, y: 96, zoom: 1.3}]} light={() => ({x: 120, y: 90, rx: 150, ry: 90, c: 'rgba(255,255,235,1)', i: 0.12})} />],
    [cut('N15'), (s) => <Card from={s} light={(g) => ({x: interpolate(g, [s, s + 110], [80, 150]), y: 50, rx: 140, ry: 100, c: 'rgba(255,255,235,1)', i: 0.15})} />],
    [cut('N16'), (s) => <><Dome from={s} sw={() => 'door'} /><RuleCardL at={wf('N16', 0) - s} n={1} title="NEVER TURN ON THE INSIDE LIGHT" sub="NOT FOR A SECOND." /></>],
    [cut('N17'), (s) => <Card from={s} cam={[{at: s, x: 122, y: 50, zoom: 1.3}]} light={(g) => ({x: interpolate(g, [s, s + 150], [100, 170]), y: 46, rx: 130, ry: 50, c: 'rgba(255,255,235,1)', i: 0.12})} />],
    [cut('N18'), (s) => <Card from={s} cam={[{at: s, x: 122, y: 62, zoom: 1.3}]} light={(g) => ({x: interpolate(g, [s, s + 150], [150, 210]), y: 60, rx: 120, ry: 40, c: 'rgba(255,255,235,1)', i: 0.1 * interpolate(g, [s, s + 160], [1, 0.4], clamp)})} />],
    [cut('N19'), (s) => <Card from={s} cam={[{at: s, x: 120, y: 80, zoom: 1.5}]} light={(g) => ({x: interpolate(g, [s, E.passes + 12], [200, 330], clamp), y: 60, rx: 110, ry: 70, c: 'rgba(255,255,235,1)', i: 0.06})} />],
    [cut('N20'), (s) => <Cab from={s} visor="down" cam={[{at: s, x: 120, y: 40, zoom: 1.2}, {at: s + 120, x: 120, y: 18, zoom: 2.4}]} />],
    // ----- the markers
    [cut('N21'), (s) => <Fwd from={s} objs={markerFig(12, 'N21', 100, 2.2)} />],
    [cut('N22'), (s) => <Fwd from={s} v={0.03} cam={[{at: s, x: 165, y: 72, zoom: 2.6}, {at: cut('N23'), x: 175, y: 70, zoom: 3.1}]}
      objs={() => [{kind: 'marker', frame: 'marker_12', wx: 88, z: 1.6}, {kind: 'pale', frame: 'side', wx: 100, z: 1.6, flip: true}]} />],
    [cut('N23'), (s) => <Fwd from={s} v={0.03} cam={[{at: s, x: 182, y: 80, zoom: 5.5}, {at: s + 80, x: 182, y: 80, zoom: 6.2}]}
      objs={() => [{kind: 'pale', frame: 'side', wx: 100, z: 1.6, flip: true, glow: 1.05}]} />],
    [cut('N24'), (s) => <Mirror from={s} fig={(g) => ({x: interpolate(g, [s, s + 100], [150, 140]), s: interpolate(g, [s, s + 100], [0.55, 0.35]), frame: 'side'})} />],
    [cut('N25'), (s) => <Fwd from={s} objs={markerFig(13, 'N25', 80, 2.0)} />],
    [cut('N26'), (s) => <><Side from={s} objs={(g) => [{atlas: 'prop', frame: 'marker_13', x: 260 - (g - s) * 1.6, y: 98}, {atlas: 'pale', frame: 'side', x: 248 - (g - s) * 1.6, y: 104, flip: true, glow: 1.4}]} />
      <RuleCardL at={wf('N26', 0) - s + 20} n={2} title="DON'T STOP AT THE MILE MARKERS" sub="THEY AREN'T HITCHHIKING." /></>],
    [cut('N26a'), (s) => <Fwd from={s} objs={(g) => [{kind: 'marker', frame: 'marker_14', wx: 88, z: ahead(g, wf('N26a', 2), 2.0)}]} />],
    [cut('N27'), (s) => <Fwd from={s} objs={(g) => [{kind: 'car', frame: 'rear', wx: 30, z: interpolate(g, [s, s + 120], [9, 3.2], clamp), glow: 0.5}]} />],
    [cut('N28'), (s) => <Fwd from={s} cam={[{at: s, x: 125, y: 66, zoom: 1.6}]} objs={(g) => [{kind: 'car', frame: 'rear', wx: 30 + Math.sin(g * 0.06) * 8, z: 3.0, glow: 0.6}]} />],
    [cut('N29'), (s) => <Fwd from={s} cam={[{at: s, x: 125, y: 64, zoom: 1.7}, {at: E.carLit, x: 125, y: 64, zoom: 1.7}, {at: E.carLit + 2, x: 125, y: 62, zoom: 2.4, ease: Easing.out(Easing.cubic)}]}
      objs={(g) => [{kind: 'car', frame: g >= E.carLit ? 'rear_lit' : 'rear', wx: 30, z: 3.0, glow: g >= E.carLit ? 1.2 : 0.6}]} />],
    [cut('N30'), (s) => <Fwd from={s} v={0.04} cam={[{at: s, x: 130, y: 68, zoom: 4.4}, {at: s + 90, x: 130, y: 68, zoom: 5.0}]} objs={() => [{kind: 'car', frame: 'rear_lit', wx: 30, z: 3.0, glow: 1.2}]} />],
    [cut('N31'), (s) => <Field from={s} many={(g) => g - E.turn} />],
    [cut('N32'), (s) => <Fwd from={s} cam={[{at: s, x: 128, y: 64, zoom: 1.6}]} objs={(g) => {
      const wx = interpolate(g, [s, E.haz], [30, 75], clamp), z = interpolate(g, [s, E.hazOff + 20], [3.0, 1.4], clamp);
      const lit = g < E.hazOff; const haz = g >= E.haz && g < E.hazOff && Math.floor((g - E.haz) / 8) % 2 === 0;
      return [{kind: 'car', frame: lit ? 'rear_lit' : 'rear', wx, z, glow: haz ? 1.8 : lit ? 1.1 : 0.3}];
    }} />],
    [cut('N33'), (s) => <Side from={s} objs={(g) => [{atlas: 'sedan', frame: 'side', x: 40 - (g - s) * 1.2, y: 112, glow: 0.4}]} carX={() => 140} />],
    [cut('N34'), (s) => <Fwd from={s} objs={(g) => [{kind: 'marker', frame: 'marker_20', wx: 88, z: ahead(g, we('N34'), 1.5)}, {kind: 'car', frame: 'rear_lit', wx: 78, z: ahead(g, we('N34'), 2.0), glow: 1.2}]} />],
    [cut('N35'), (s) => <Side from={s} scroll={0.45} carX={() => -200} objs={(g) => [{atlas: 'sedan', frame: 'side_open', x: 200 - (g - s) * 0.45, y: 112, glow: 1.0}]} cam={[{at: s, x: 140, y: 92, zoom: 1.7}]} />],
    [cut('N36'), (s) => <><Side from={s} scroll={0.05} carX={() => -200} headOn={false} objs={() => [{atlas: 'sedan', frame: 'side_open', x: 150, y: 112, glow: 1.0}]} prints={[[134, 86], [141, 90], [149, 85], [156, 91], [163, 87], [170, 92], [146, 95], [160, 96]]} cam={[{at: s, x: 155, y: 90, zoom: 4.0}, {at: s + 100, x: 157, y: 90, zoom: 4.6}]} /></>],
    // ----- phone and radio
    [cut('N37'), (s) => <Cab from={s} phone={(g) => (g >= E.phoneUp ? interpolate(g, [E.phoneUp, E.blue], [0.5, 1.2], clamp) : 0)} />],
    [cut('N39'), (s) => <><Card from={s} light={() => ({x: 140, y: 74, rx: 140, ry: 26, c: 'rgba(120,180,255,1)', i: 0.6})} cam={[{at: s, x: 122, y: 74, zoom: 1.3}]} />
      <RuleCardL at={wf('N40', 0) - s} n={4} title="PHONE FACE DOWN" sub="SCREENS COUNT." y={40} /></>],
    [cut('N41'), (s) => <Field from={s} blue={0.6} rise={[E.stands - 6, E.stands + 16]} />],
    [cut('N42'), (s) => <Fabric from={s} phone={(g) => (g < E.slap ? 'up' : 'down')} slap={E.slap} />],
    [cut('N43'), (s) => <Radio from={s} text={(g) => (g < E.click ? '▶ ROAD MIX' : g < E.station ? '- - . -' : '87.9 FM')} flicker={(g) => (g >= E.click && g < E.station + 10 ? 0.6 : 0)} />],
    [cut('N45b'), (s) => <Behind from={s} cam={[{at: s, x: 120, y: 84, zoom: 1.2}, {at: wf('N46', 0), x: 120, y: 84, zoom: 1.3}]} />],
    [cut('N46'), (s) => <Behind from={s} cam={[{at: s, x: 140, y: 90, zoom: 2.6}, {at: s + 70, x: 144, y: 91, zoom: 4.2}]} />],
    [cut('N47'), (s) => <><Radio from={s} text={() => '87.9 FM'} hand={(g) => interpolate(g, [s, wf('N47', 4), wf('N47', 6), wf('N47', 8)], [0, 0.9, 0.9, 0], clamp)} />
      <RuleCardL at={wf('N47', 5) - s} n={3} title="NEVER TURN OFF THE RADIO" sub="LET IT PLAY." /></>],
    [cut('N48'), (s) => <Mirror from={s} />],
    [cut('N49'), (s) => <Cab from={s} v={0.2} shake={() => 0.15} />],
    // ----- dad
    [cut('N50'), (s) => <Fabric from={s} phone={() => 'down'} buzz={E.buzz} />],
    [cut('N51b'), (s) => <Cab from={s} cam={[{at: s, x: 78, y: 78, zoom: 2.5}, {at: cut('N54'), x: 78, y: 80, zoom: 3.0}]} pose={[{at: 0, pose: 'turn0.worried'}]} />],
    [cut('N54b'), (s) => <Cab from={s} cam={[{at: s, x: 120, y: 30, zoom: 2.2}, {at: s + 150, x: 120, y: 14, zoom: 3.4}]} />],
    [cut('N55'), (s) => <Side from={s} cam={[{at: s, x: 120, y: 82, zoom: 1.4}, {at: s + 200, x: 120, y: 78, zoom: 1.0}]} />],
    // ----- gas
    [cut('N56'), (s) => <Cab from={s} pov fuel={(g) => (g >= E.fuel ? 1.2 : 0)} cam={[{at: s, x: 76, y: 78, zoom: 2.8}, {at: s + 160, x: 74, y: 78, zoom: 3.2}]} />],
    [cut('N58'), (s) => <Card from={s} cam={[{at: s, x: 122, y: 90, zoom: 1.3}]} light={(g) => ({x: 120, y: g < wf('N60', 0) ? 88 : 100, rx: 150, ry: 26, c: 'rgba(255,170,90,1)', i: 0.5})} />],
    [cut('N61'), (s) => <><Fwd from={s} cam={[{at: s, x: 124, y: 56, zoom: 1.3}, {at: s + 150, x: 134, y: 46, zoom: 2.6}]} objs={() => []}>
      <div style={{position: 'absolute', left: 130, top: 40, width: 9, height: 1, background: '#f4f6ff'}} />
      <div style={{position: 'absolute', left: 131, top: 41, width: 1, height: 3, background: '#8a8c93'}} /><div style={{position: 'absolute', left: 137, top: 41, width: 1, height: 3, background: '#8a8c93'}} />
      <Glow x={134} y={42} r={8} rx={14} color="rgba(230,240,255,1)" intensity={1} /></Fwd></>],
    [cut('N62'), (s) => <><Gas from={s} carX={(g) => interpolate(g, [s, s + 70], [-60, 116], {...clamp, easing: Easing.out(Easing.cubic)})} />
      <RuleCardL at={wf('N62', 0) - s + 25} n={5} title="ONLY STOP UNDER A LIGHT" sub="NEVER IN THE DARK." /></>],
    [cut('N63'), (s) => <Gas from={s} cam={[{at: s, x: 120, y: 80, zoom: 1.4}, {at: s + 90, x: 60, y: 86, zoom: 2.2}]} />],
    [cut('N64'), (s) => <Gas from={s} figs={(g) => (g - s) / 40} cam={[{at: s, x: 70, y: 86, zoom: 2.2}, {at: wf('N64', 12), x: 120, y: 84, zoom: 1.5}, {at: we('N64'), x: 40, y: 96, zoom: 3.4}]} />],
    [cut('N65'), (s) => <Gas from={s} figs={() => 1} cam={[{at: s, x: 120, y: 70, zoom: 1.02}]} />],
    [cut('N66'), (s) => <Gas from={s} figs={() => 1} heroAt={() => ({x: 156, pose: 'turn0.scared'})} cam={[{at: s, x: 140, y: 84, zoom: 2.2}]}
      pump={(g) => (g < wf('N66', 7) ? '04.10' : g < wf('N66', 9) ? '10.00' : g < wf('N66', 10) ? '20.00' : '30.00')} />],
    [cut('N67'), (s) => <Gas from={s} figs={() => 1} heroAt={() => ({x: 156, pose: 'turn0.scared'})} buzz={E.buzzLight} cam={[{at: s, x: 98, y: 50, zoom: 1.8}]} />],
    [cut('N68'), (s) => <Gas from={s} figs={() => 1} heroAt={() => ({x: 156, pose: 'down.shock'})} buzz={E.buzzLight} lightOut={E.lightOut} step={wf('N68', 7)} cam={[{at: s, x: 110, y: 78, zoom: 1.3}]} />],
    [cut('N69'), (s) => <Gas from={s} figs={() => 1} lightOut={0} step={0} heroAt={(g) => (g < E.door + 8 ? {x: 156 - (g - s) * 0.4, pose: 'turn0.scared'} : null)}
      carFrame={(g) => (g >= E.door ? 'side_open' : 'side')} cam={[{at: s, x: 125, y: 82, zoom: 1.5}]} />],
    [cut('N70'), (s) => <Cab from={s} dome={(g) => (g >= E.dome ? 1 : 0)} pose={[{at: 0, pose: 'turn0.scared'}]} shake={(g) => (g >= E.slam && g < E.slam + 8 ? 0.8 : 0)}
      objs={() => []} cam={[{at: s, x: 120, y: 60, zoom: 1.15}]} />],
    [cut('N72'), (s) => <Cab from={s} dome={(g) => interpolate(g, [E.fade, E.dark], [1, 0.25], clamp)} faces={(g) => interpolate(g, [E.faces - 6, E.faces + 10], [0, 1], clamp)}
      pose={[{at: 0, pose: 'turn0.scared'}]} cam={[{at: s, x: 120, y: 56, zoom: 1.1}, {at: E.faces, x: 120, y: 50, zoom: 1.3}, {at: E.dark, x: 110, y: 50, zoom: 1.6}]} />],
    [E.dark, (s) => <Cab from={s} dash={() => 0.5} cam={[{at: s, x: 120, y: 56, zoom: 1.6}]} />],
    // ----- the back seat
    [cut('N77'), (s) => <Side from={s} scroll={2.6} cam={[{at: s, x: 120, y: 82, zoom: 1.2}]} />],
    [cut('N78'), (s) => <Cab from={s} shake={(g) => (g >= E.roof && g < E.roof + 10 ? 1.2 : 0)} cam={[{at: s, x: 120, y: 40, zoom: 1.4}]} />],
    [cut('N79'), (s) => <><Behind from={s} roof={() => 1} cam={[{at: s, x: 120, y: 84, zoom: 1.5}, {at: s + 140, x: 120, y: 84, zoom: 1.9}]} />
      <RuleCardL at={wf('N79', 6) - s} n={6} title="DON'T BRAKE" sub="BRAKE LIGHTS COUNT." /></>],
    [cut('N80'), (s) => <Rear from={s} slide={[E.slide, E.slide + 40]} />],
    [cut('N80a'), (s) => <Mirror from={s} />],
    [cut('N81'), (s) => <Fwd from={s} objs={(g) => [{kind: 'marker', frame: 'marker_30', wx: 88, z: ahead(g, we('N81'), 1.4)}, {kind: 'marker', frame: 'marker_31', wx: 88, z: ahead(g, we('N82'), 1.4)}]} />],
    [cut('N83'), (s) => <Radio from={s} text={() => '87.9 FM'} flicker={(g) => (g < wf('N83b', 0) ? 0.7 : 0)} />],
    [E.now - 2, (s) => <Rear from={s} />],
    [cut('N84b'), (s) => <Cab from={s} pose={[{at: 0, pose: 'turn0.scared'}]} cam={[{at: s, x: 76, y: 74, zoom: 2.2}, {at: cut('N86'), x: 76, y: 72, zoom: 3.2}]} dash={() => 0.7} />],
    [cut('N86'), (s) => <Dome from={s} sw={() => 'door'} thumb={(g) => interpolate(g, [s, wf('N87', 0), wf('N88', 0)], [0.2, 0.92, 0.92], clamp) - interpolate(g, [E.back, E.back + 12], [0, 0.9], clamp)} />],
    [cut('N88b'), (s) => <Cab from={s} pose={[{at: 0, pose: 'turn0.scared'}]} cam={[{at: s, x: 120, y: 60, zoom: 1.4}, {at: s + 90, x: 120, y: 60, zoom: 1.2}]} dash={() => 0.7} />],
    [cut('N89'), (s) => <Side from={s} cam={[{at: s, x: 120, y: 82, zoom: 1.0}]} />],
    [cut('N90'), (s) => <Fwd from={s} objs={(g) => [{kind: 'marker', frame: 'marker_40', wx: 88, z: ahead(g, wf('N90', 2), 1.4)}, {kind: 'lamp', wx: 92, z: ahead(g, E.street, 0.6)}, {kind: 'lamp', wx: 92, z: ahead(g, E.street + 40, 0.6)}, {kind: 'lamp', wx: 92, z: ahead(g, E.street + 80, 0.6)}]} />],
    [cut('N91'), (s) => <Cab from={s} visor="down" strip street={(g) => ((g - s) * 2.6) % 300 - 40} cam={[{at: s, x: 110, y: 44, zoom: 1.3}, {at: s + 130, x: 76, y: 32, zoom: 3.0}]} />],
    [cut('N92'), (s) => <><Strip from={s} sweep={[s, s + 50]} /><RuleCardL at={wf('N93', 0) - s} n={7} title="I WILL NEVER ASK YOU" sub="TO TURN ON THE LIGHT." y={50} /></>],
    [cut('N94'), (s) => <Mirror from={s} street={(g) => ((g - s) * 2.6) % 260 - 30} />],
    // ----- home
    [cut('N95'), (s) => <Porch from={s} carX={(g) => interpolate(g, [s, s + 60], [300, 196], {...clamp, easing: Easing.out(Easing.cubic)})} dadAt={() => ({x: 72, y: 104, pose: 'down.worried'})}
      cam={[{at: s, x: 130, y: 76, zoom: 1.0}]} />],
    [cut('N96'), (s) => <Porch from={s} heroAt={() => ({x: 150, pose: 'down.worried'})} dadAt={(g) => {
      const p = interpolate(g, [s, we('N96')], [0, 1], clamp);
      return {x: 72 + p * 160, y: interpolate(p, [0, 0.25, 1], [104, 128, 128]), pose: `walk${Math.floor((g - s) / 6) % 4}.neutral.b0`};
    }} cam={[{at: s, x: 150, y: 90, zoom: 1.3}]} />],
    [cut('N97'), (s) => <Porch from={s} heroAt={() => ({x: 150, pose: 'down.worried'})} dadAt={() => ({x: 222, y: 128, pose: 'turn0.worried'})} cam={[{at: s, x: 205, y: 100, zoom: 2.2}, {at: s + 90, x: 210, y: 98, zoom: 2.6}]} />],
    [cut('N97b'), (s) => <Porch from={s} heroAt={() => ({x: 150, pose: 'down.scared'})} dadAt={() => ({x: 172, y: 128, pose: 'down.worried'})} cam={[{at: s, x: 160, y: 104, zoom: 2.6}]} />],
    [cut('N99'), (s) => <Porch from={s} heroAt={() => ({x: 150, pose: 'reach.worried'})} dadAt={() => ({x: 172, y: 128, pose: 'reach.neutral'})} lockFlash={E.lock} cam={[{at: s, x: 165, y: 100, zoom: 1.9}]} />],
    [cut('N100'), (s) => <Porch from={s} heroAt={() => ({x: 150, pose: 'down.worried'})} dadAt={() => ({x: 128, y: 128, pose: 'turn0.neutral'})} carLit={(g) => (g >= E.byItself ? 1 : 0)}
      cam={[{at: s, x: 160, y: 100, zoom: 1.6}, {at: E.byItself, x: 160, y: 100, zoom: 1.6}, {at: E.byItself + 3, x: 190, y: 102, zoom: 2.4, ease: Easing.out(Easing.cubic)}, {at: E.byItself + 90, x: 192, y: 102, zoom: 2.8}]} />],
    [cut('N101'), (s) => <><Porch from={s} heroAt={() => ({x: 150, pose: 'down.worried'})} dadAt={() => ({x: 128, y: 128, pose: 'turn0.neutral'})} carLit={() => 1} cam={[{at: s, x: 190, y: 102, zoom: 2.8}]} />
      <AbsoluteFill style={{background: 'rgba(4,5,9,0.55)'}} /><QuestionL at={2} l1="WOULD YOU HAVE" l2="TURNED IT ON?" /></>],
    [NR_END, () => <><AbsoluteFill style={{background: '#000'}} /><TitleL at={4} title="NIGHT ROAD" clock="2:09 AM" hold follow="RULE #8 IS NEXT" /></>],
  ];

  return <AbsoluteFill style={{background: color.night}}>
    {shots.map(([from, render], i) => {
      const to = i + 1 < shots.length ? shots[i + 1][0] : NR_FRAMES;
      return <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>{render(from)}</Sequence>;
    })}

    {/* shocks */}
    <Flash at={E.flick} color="#fff" dur={3} peak={0.5} />
    <Flash at={E.flick + 9} color="#000" dur={6} peak={1} />
    <Flash at={E.visor - 6} color="#fffbe6" dur={8} peak={0.75} />
    <Flash at={E.carLit} color="#fff" dur={2} peak={0.25} />
    <Flash at={E.stands} color="#ff2d3d" dur={3} peak={0.3} />
    <Flash at={E.lightOut} color="#000" dur={4} peak={0.6} />
    <Flash at={E.dome} color="#fff3d6" dur={4} peak={0.6} />
    <Flash at={E.faces} color="#ff2d3d" dur={3} peak={0.3} />
    <Flash at={E.dark} color="#000" dur={10} peak={1} />
    <Flash at={E.roof} color="#fff" dur={2} peak={0.2} />
    <Flash at={E.byItself} color="#fff3d6" dur={3} peak={0.35} />
    <Tint color="rgba(80,140,255,1)" from={E.blue} to={E.slap} peak={0.18} />
    {f < NR_END && <Vignette strength={0.8} />}

    {f >= E.fade && f < E.dark + 6 && <CountdownKeys f={f} />}
    {f < NR_END && <TitleL at={wf('N04', 0) + 6} dur={70} title="NIGHT ROAD" clock="11:40 PM" />}
    {f >= cut('N05') && f < cut('N101') && <HudL series="NIGHT ROAD" clock={clock.v} status={status.v} changedAt={status.at} chips={chipsAt(f)} />}
    {f >= SEEN_FROM && f < cut('N101') && <SeenMeter level={seenAt(f)} show={Math.min(1, (f - SEEN_FROM) / 8)} />}
    {f < cut('N101') && <CaptionL phrases={PHRASES} />}
    <Audio src={staticFile('audio/nr-mix.wav')} />
  </AbsoluteFill>;
};

/** 10 -> 3 over the fade, then 3, 2, 1 exactly on the spoken words, 0 on "Dark". */
const CountdownKeys: React.FC<{f: number}> = ({f}) => {
  const n = f < E.three ? Math.ceil(interpolate(f, [E.fade, E.three], [10, 3.01], clamp)) : f < E.two ? 3 : f < E.one ? 2 : f < E.dark ? 1 : 0;
  const keys = [E.fade, ...Array.from({length: 7}, (_, k) => Math.round(interpolate(10 - k - 1, [3.01, 10], [E.three, E.fade]))), E.three, E.two, E.one, E.dark];
  const last = Math.max(...keys.filter((k) => k <= f));
  const p = Math.min(1, (f - last) / 6);
  return <div style={{position: 'absolute', right: 110, top: 300, fontFamily: 'Anton, Impact, sans-serif', fontSize: 280, color: n === 0 ? '#fff' : color.keyRed,
    WebkitTextStroke: `14px ${color.ink}`, paintOrder: 'stroke fill', transform: `scale(${1.25 - 0.25 * p})`, textShadow: '0 0 40px rgba(255,45,61,0.45)'}}>{n}</div>;
};

/** Thumbnail: the lit cab, windows turned to mirrors, faces in the glass. */
export const NightRoadThumb: React.FC = () => {
  useKitFonts();
  return <AbsoluteFill style={{background: color.night}}>
    <Cab from={E.faces + 30} dome={() => 1} faces={() => 1} pose={[{at: 0, pose: 'turn0.scared'}]} cam={[{at: 0, x: 120, y: 44, zoom: 1.35}]} />
    <Vignette strength={0.7} />
    <div style={{position: 'absolute', left: 70, top: 640, fontFamily: 'Anton, Impact, sans-serif', fontSize: 210, lineHeight: 0.92, color: '#fff',
      WebkitTextStroke: `16px ${color.ink}`, paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(0,0,0,0.6)'}}>NEVER TURN<br /><span style={{color: color.keyRed}}>THIS ON</span></div>
    <svg width="420" height="300" viewBox="0 0 420 300" style={{position: 'absolute', left: 1050, top: 90}}>
      <path d="M390 270 C 300 260, 150 200, 50 70" stroke={color.keyRed} strokeWidth="22" fill="none" strokeLinecap="round" />
      <path d="M125 62 L45 62 L50 145" stroke={color.keyRed} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </AbsoluteFill>;
};
