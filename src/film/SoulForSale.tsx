import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../soul-timing.json';
import plates from '../../public/sets/plates.json';
import heroA from '../../public/sprites/hero.json';
import heroUA from '../../public/sprites/hero_uniform.json';
import mgrA from '../../public/sprites/manager.json';
import cowA from '../../public/sprites/coworker.json';
import sAA from '../../public/sprites/stranger_a.json';
import sBA from '../../public/sprites/stranger_b.json';
import sCA from '../../public/sprites/stranger_c.json';
import sDA from '../../public/sprites/stranger_d.json';
import sAuA from '../../public/sprites/stranger_a_u.json';
import sBuA from '../../public/sprites/stranger_b_u.json';
import sCuA from '../../public/sprites/stranger_c_u.json';
import sDuA from '../../public/sprites/stranger_d_u.json';
import propA from '../../public/sprites/soul_props.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, ramp, clamp} from '../kit/world';
import {Atlas, PixelSprite, PixelText} from '../kit/sprite';
import {Glow, Darken, Tint, Flash, Vignette, Rings} from '../kit/effects';
import {WordCaption, Hud, phrasesFrom, Word, Chip} from '../kit/overlay';
import {ChoiceStack, Blackout} from './lights-ui';
import {Receipt, Contract, Phone, Post, Followers, Call, ScratchCard, Card, DayCard, Entry} from './soul-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), heroU = A(heroUA), mgr = A(mgrA), cow = A(cowA), prop = A(propA);
const STR = [A(sAA), A(sBA), A(sCA), A(sDA)], STRU = [A(sAuA), A(sBuA), A(sCuA), A(sDuA)];
const P = plates as Record<string, {w: number}>;

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
export const SOUL_FRAMES = Math.ceil(timing.duration * FPS) + 50;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'S30'), 0.5);

// shots (mirrored in scripts/build_soul_cues.py)
const S = {
  store: 0, post: cut('S02'), dark: cut('S04'), env: cut('S05'), contract: cut('S06'), gone: cut('S08'),
  d1: cut('S09'), r1: cut('S10'), steak: cut('S11'), d2: cut('S12'), r2: cut('S13'), bed: cut('S14'),
  d3: cut('S15'), r3: cut('S16'), call: we('S16') + 2, d4: cut('S18'), r4: cut('S19'), hands: cut('S20'),
  d5: cut('S21'), r5: cut('S22'), d6: cut('S23'), close: cut('S24'), r7: cut('S25'), midnight: cut('S26'),
  endless: cut('S27'), env2: cut('S28'), comment: cut('S29'), choice: wf('S30'),
};
const E = {
  bank1: wf('S04', 1), bank2: we('S04', -1) - 4, back: wf('S05', 0), envStop: wf('S05', 6), nameCard: wf('S05', 7) - 2,
  sign: wf('S07', 3), out2: we('S07') + 2, back2: wf('S08') - 2, pocket: wf('S08', 4),
  cash: wf('S09', 5), quits: wf('S12', 4), yours: wf('S12', 7), say: wf('S18', 2), obey: wf('S18', 5),
  giveBack: wf('S21', 5), out3: we('S26') - 2,
};

// the receipt, one ledger for the whole week
const ENTRIES: Entry[] = [
  {got: '$50,000', paid: 'TASTE', at: wf('S10', 1), paidAt: wf('S10', 5)},
  {got: 'MANAGER JOB', paid: 'SLEEP', at: wf('S13', 0) - 4, paidAt: wf('S13', 2)},
  {got: '2M FOLLOWERS', paid: 'MOM', at: wf('S16', 0) - 4, paidAt: wf('S16', 2)},
  {got: 'OBEDIENCE', paid: 'YOUR HANDS', at: wf('S19', 0) - 4, paidAt: wf('S19', 2)},
  {got: 'REFUND', paid: 'NO REFUNDS', at: wf('S22', 0), paidAt: wf('S22', 2)},
  {got: 'TRIAL ENDS', paid: 'MIDNIGHT', at: wf('S25', 2), paidAt: wf('S25', 6)},
  {got: 'BALANCE', paid: 'PAID IN SHIFTS', at: wf('S25', 7), paidAt: wf('S25', 10)},
];
const soulAt = (g: number) => g < ENTRIES[0].paidAt ? 100 : g < ENTRIES[1].paidAt ? 80 : g < ENTRIES[2].paidAt ? 60 : g < ENTRIES[3].paidAt ? 40
  : g < ENTRIES[6].paidAt ? 20 : 0;

// ---------- the checkout ----------
const HX = 72, HY = 214;          // cashier spot behind the counter
const lightsAt = (g: number) => {
  if (g >= E.bank1 && g < E.back) return g >= E.bank2 ? 0 : 0.5;
  if (g >= E.back && g < E.back + 10) return [1, 0, 1, 0.3, 1, 0, 1, 1, 0.4, 1][g - E.back];
  if (g >= E.out2 && g < E.back2) return 0;
  return 1;
};

/** Belt ridges scroll while `moving`; rendered between the set and the counter fg. */
const Belt: React.FC<{g: number; speed: number}> = ({g, speed}) =>
  <div style={{position: 'absolute', left: 0, top: 205, width: 93, height: 5,
    background: `repeating-linear-gradient(90deg, #2c2e38 0 1px, #1c1d24 1px 4px)`, backgroundPosition: `${g * speed}px 0`}} />;

const Market: React.FC<{g: number; light?: number; children?: React.ReactNode; front?: React.ReactNode; fg?: boolean; belt?: number; dim?: number}> = ({g, light, children, front, fg = true, belt = 0, dim = 0.15}) => {
  const L = light ?? lightsAt(g);
  return <>
    <SetLayer src="sets/market_bg.png" />
    {children}
    {fg && <><SetLayer src="sets/market_fg.png" /><Belt g={g} speed={belt} /></>}
    {front}
    <Darken amount={dim + (1 - L) * 0.62} />
    {L > 0 && <><Glow x={32} y={22} r={70} color="rgba(225,235,255,1)" intensity={0.5 * L} flicker={0.04} seed="t1" />
      <Glow x={102} y={22} r={70} color="rgba(225,235,255,1)" intensity={0.5 * L} flicker={0.04} seed="t2" /></>}
    {fg && <Glow x={118} y={185} r={8} color="rgba(120,220,170,1)" intensity={0.5} />}
  </>;
};

const Pocket: React.FC<{x: number; y: number; glow?: number}> = ({x, y, glow = 1}) => <>
  <div style={{position: 'absolute', left: x - 6, top: y - 20, width: 2, height: 3, background: '#f4f1e8', outline: '0.5px solid #14151b'}} />
  <Glow x={x - 5} y={y - 19} r={4} color="rgba(255,60,60,1)" intensity={0.9 * glow} flicker={0.15} seed="pk" />
</>;
const Badge: React.FC<{x: number; y: number}> = ({x, y}) =>
  <div style={{position: 'absolute', left: x + 3, top: y - 16, width: 3, height: 2, background: '#d6a13d', outline: '0.5px solid #14151b'}} />;

const Prop: React.FC<{f: string; x: number; y: number; o?: number}> = ({f, x, y, o = 1}) =>
  <PixelSprite atlas={prop} frame={f} x={x} y={y} breathe={false} squash={false} opacity={o} />;

// ---------- shots ----------
const Store: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f, [{at: 0, x: 67, y: 130, zoom: 1.0}, {at: S.post, x: 70, y: 190, zoom: 2.4, ease: Easing.inOut(Easing.quad)}]);
  return <World cam={cam}><Market g={f}><PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'phone.neutral'}]} /></Market>
    <Glow x={HX} y={HY - 15} r={10} color={color.phone} intensity={0.6} /></World>;
};

/** Store behind an insert (phone, receipt, card): dim close-up so the insert reads. */
const Behind: React.FC<{from: number; pose?: string; atlas?: Atlas; dark?: number; x?: number; zoom?: number; children?: React.ReactNode}> = ({from, pose = 'phone.neutral', atlas = hero, dark = 0.55, x = HX, zoom = 3, children}) => {
  const f = useCurrentFrame(); const g = f + from;
  return <><World cam={{x, y: 196, zoom: zoom + f * 0.002}}><Market g={g}><PixelSprite atlas={atlas} x={HX} y={HY} keys={[{at: 0, pose}]} /></Market>{children}</World>
    <AbsoluteFill style={{background: '#05060a', opacity: dark}} /></>;
};

const Dark: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  return <World cam={{x: 67, y: 150, zoom: 1.35 - f * 0.002}}><Market g={g}><PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'phone.worried'}, {at: E.bank1 - from, pose: 'down.scared'}]} /></Market>
    {lightsAt(g) === 0 && <Glow x={HX} y={HY - 14} r={8} color={color.phone} intensity={0.35} />}</World>;
};

const Envelope: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const ex = interpolate(g, [E.back + 8, E.envStop], [-14, HX - 18], {...clamp, easing: Easing.out(Easing.quad)});
  const moving = g >= E.back + 8 && g < E.envStop ? 0.35 : 0;
  const cam = camAt(f, [{at: 0, x: 60, y: 175, zoom: 1.6}, {at: E.envStop - from, x: HX - 10, y: 198, zoom: 3.2}]);
  return <World cam={cam}><Market g={g} belt={moving} front={<Prop f="envelope" x={ex} y={209} />}>
    <PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.scared'}, {at: E.envStop - from, pose: 'down.shock'}]} />
  </Market><Glow x={ex} y={205} r={6} color="rgba(255,90,70,1)" intensity={0.5} flicker={0.2} seed="env" /></World>;
};

const Gone: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const cam = camAt(f, [{at: 0, x: 60, y: 196, zoom: 3.0}, {at: E.pocket - from - 2, x: 62, y: 197, zoom: 3.1}, {at: E.pocket - from, x: HX - 4, y: 196, zoom: 5.2}]);
  return <World cam={cam}><Market g={g}><PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.shock'}, {at: E.pocket - from, pose: 'down.scared'}]} /></Market>
    {g >= E.pocket && <Pocket x={HX} y={HY} />}</World>;
};

const Steak: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const paper = wf('S11', 8) - from;
  return <World cam={{x: HX - 2, y: 207, zoom: 3.4 + f * 0.004}}><Market g={f + from} front={<Prop f="steak" x={HX - 2} y={209} />}>
    <PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.neutral'}, {at: paper, pose: 'down.worried'}]} />
  </Market><Pocket x={HX} y={HY} glow={0.5} /></World>;
};

const Quit: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const mx = interpolate(g, [E.quits + 8, E.quits + 50], [44, -20], clamp);
  const walking = g >= E.quits + 8;
  return <World cam={{x: 60, y: 192, zoom: 2.6}}><Market g={g}>
    {!walking && <PixelSprite atlas={mgr} x={44} y={HY} keys={[{at: 0, pose: 'down.worried'}, {at: E.quits - from, pose: 'reach.scared'}]} />}
    {walking && <PixelSprite atlas={mgr} frame={`walk${Math.floor(g / 4) % 4}.scared.b0`} x={mx} y={HY} flip />}
    <PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.worried'}, {at: E.yours - from, pose: 'open.smile'}]} />
  </Market>{g >= E.yours && <Badge x={HX} y={HY} />}<Pocket x={HX} y={HY} glow={0.5} /></World>;
};

const Bed: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const hours = Math.min(6, 1 + Math.floor(interpolate(f, [6, wf('S14', 5) - from], [0, 5.99], clamp)));
  const ring = g >= wf('S14', 5);
  return <World cam={{x: 42, y: 158, zoom: 1.7 + f * 0.003}}>
    <SetLayer src="sets/bedroom_bg.png" />
    <Glow x={68} y={60} r={40} color={color.moon} intensity={0.35} />
    <PixelSprite atlas={hero} x={68} y={176} keys={[{at: 0, pose: 'down.shock'}]} blink={false} />
    <div style={{position: 'absolute', left: 28, top: 156, width: 82, height: 24, background: '#3d4a6e', borderTop: '1px solid #56638e'}} />
    <SetLayer src="sets/bedroom_fg.png" />
    <Prop f="clock" x={14} y={158} />
    <PixelText text={`${hours}:00`} x={7} y={152} color={ring ? '#ff8a8a' : '#ff3b3b'} glow="#ff3b3b" />
    <Glow x={14} y={154} r={8} color="rgba(255,60,60,1)" intensity={ring && Math.floor(f / 4) % 2 ? 1.2 : 0.6} />
    <Darken amount={0.3} />
  </World>;
};

const Obey: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  return <World cam={{x: 58, y: 190, zoom: 2.6 + f * 0.003}}><Market g={g}>
    <PixelSprite atlas={cow} x={42} y={HY} keys={[{at: 0, pose: 'down.neutral'}, {at: E.obey - from, pose: 'up.smile'}]} blink={false} breathe={g < E.obey} />
    <PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.neutral'}, {at: E.say - from, pose: 'reach.neutral'}, {at: E.obey - from + 12, pose: 'down.worried'}]} flip />
  </Market><Badge x={HX} y={HY} /><Rings x={42} y={176} at={E.obey - from} count={2} every={6} life={20} maxR={10} width={0.3} /></World>;
};

const Hands: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const arms = Math.floor(f / 6) % 2 ? 'up' : 'reach';
  const boxes = Math.min(7, Math.floor(f / 12));
  return <World cam={{x: 67, y: 166, zoom: 2.9 + f * 0.003}}><Market g={f + from} fg={false} light={Math.floor(f / 9) % 7 === 0 ? 0.2 : 0.55} dim={0.3}>
    {Array.from({length: boxes}, (_, i) => <Prop key={i} f={i % 2 ? 'can' : 'box'} x={52 + i * 5} y={143} />)}
    <PixelSprite atlas={hero} x={67} y={186} keys={[{at: 0, pose: `${arms}.shock`}]} squash={false} blink={false} />
  </Market></World>;
};

const GiveBack: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const cx = interpolate(g, [E.giveBack, E.giveBack + 40], [HX - 4, 8], {...clamp, easing: Easing.in(Easing.quad)});
  return <World cam={{x: 56, y: 194, zoom: 2.8}}><Market g={g} belt={g >= E.giveBack ? 0.35 : 0} front={<Prop f="cash" x={cx} y={209} />}>
    <PixelSprite atlas={hero} x={HX} y={HY} keys={[{at: 0, pose: 'down.worried'}, {at: E.giveBack - from - 4, pose: 'reach.worried'}]} flip />
  </Market><Pocket x={HX} y={HY} /></World>;
};

// aisle plate in perspective: sprite scale shrinks with distance to the far end (VP ~ y 110)
const VPY = 110;
const depth = (y: number) => (y - VPY) / 126;
const CROWD = [{x: 40, y: 200}, {x: 118, y: 196}, {x: 58, y: 160}, {x: 100, y: 158}, {x: 70, y: 140}, {x: 88, y: 134}, {x: 18, y: 236}, {x: 140, y: 236}];

const Crowd: React.FC<{uniform?: boolean; face?: string; pose?: string}> = ({uniform, face = 'smile', pose = 'hold'}) => <>
  {[...CROWD].sort((a, b) => a.y - b.y).map((c, i) =>
    <PixelSprite key={i} atlas={(uniform ? STRU : STR)[i % 4]} frame={`${pose}.${face}.b0`} x={c.x} y={c.y} scale={depth(c.y)} breathe={false} squash={false} />)}
</>;

const AisleSet: React.FC<{red?: number; light?: number; children?: React.ReactNode; nest?: boolean}> = ({red = 0, light = 1, children, nest}) => {
  const k = 0.11, w = P.aisle.w;
  return <>
    <SetLayer src="sets/aisle_bg.png" width={w} />
    {nest && [1, 2, 3].map((n) => {
      const s = Math.pow(k, n);
      return <SetLayer key={n} src="sets/aisle_bg.png" width={w} style={{left: 79 * (1 - s), top: VPY * (1 - s), width: w * s, height: 240 * s}} />;
    })}
    <SetLayer src="sets/aisle_fg.png" width={w} />
    <div style={{position: 'absolute', left: -40, top: 239, width: w + 80, height: 80, background: '#121828'}} />
    {children}
    <Darken amount={0.22 + (1 - light) * 0.4} />
    <Glow x={79} y={30} r={60} color="rgba(225,235,255,1)" intensity={0.35 * light} flicker={0.12} seed="ai" />
    {red > 0 && <div style={{position: 'absolute', left: -40, top: -40, width: w + 80, height: 340, background: '#ff2030', mixBlendMode: 'overlay', opacity: red}} />}
  </>;
};

const Customers: React.FC = () => {
  const f = useCurrentFrame();
  return <World cam={{x: 79, y: 160, zoom: 1.05 + f * 0.0015}}><AisleSet light={Math.floor(f / 11) % 9 === 0 ? 0.4 : 1}><Crowd /></AisleSet></World>;
};

const Close: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const cam = camAt(f, [{at: 0, x: 40, y: 200, zoom: 1.6}, {at: wf('S24', 6) - from, x: 24, y: 232, zoom: 4.2}]);
  return <World cam={cam}><AisleSet><Crowd /></AisleSet><Glow x={21} y={229} r={6} color="rgba(255,60,60,1)" intensity={0.8} flicker={0.2} seed="rc" /></World>;
};

const Endless: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const they = wf('S27', 7);
  const back = wf('S27', 4) - from;
  const cam = camAt(f, [{at: 0, x: 79, y: 140, zoom: 1.1}, {at: back - 1, x: 79, y: VPY, zoom: 8.5, ease: Easing.in(Easing.cubic)},
    {at: back, x: 79, y: 176, zoom: 1.35}, {at: back + 90, x: 79, y: 180, zoom: 1.5}]);
  return <World cam={cam}><AisleSet nest red={0.55}>
    {g >= they && <Crowd uniform face="neutral" pose="down" />}
    <PixelSprite atlas={heroU} x={79} y={236} keys={[{at: 0, pose: 'down.shock'}, {at: wf('S27', 6) - from, pose: 'down.scared'}]} />
  </AisleSet></World>;
};

const Envelope2: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame(); const g = f + from;
  const ex = interpolate(f, [0, 30], [-14, HX - 18], {...clamp, easing: Easing.out(Easing.quad)});
  return <World cam={{x: 60, y: 195, zoom: 2.8}}><Market g={g} light={0.5} belt={f < 30 ? 0.35 : 0} front={<Prop f="envelope_black" x={ex} y={209} />}>
    <PixelSprite atlas={heroU} x={HX} y={HY} keys={[{at: 0, pose: 'down.scared'}]} />
  </Market><AbsoluteFill style={{background: '#ff1e2e', mixBlendMode: 'multiply', opacity: 0.3}} /></World>;
};

// ---------- HUD ----------
const hudAt = (f: number): {status: string; changed: number; chips: Chip[]} => {
  const days: [number, string][] = [[0, 'NIGHT SHIFT · 02:40 AM'], [S.d1, 'DAY 1 OF 7'], [S.d2, 'DAY 2 OF 7'], [S.bed, 'DAY 2 · 1:00 AM'], [S.d3, 'DAY 3 OF 7'],
    [S.d4, 'DAY 4 OF 7'], [S.hands, 'DAY 4 · 03:00 AM'], [S.d5, 'DAY 5 OF 7'], [S.d6, 'DAY 6 OF 7'], [S.r7, 'DAY 7 · 11:59 PM'], [S.midnight, 'DAY 7 · 12:00 AM'],
    [S.endless, 'NIGHT SHIFT · FOREVER']];
  let status = days[0][1], changed = -99;
  for (const [at, s] of days) if (f >= at) { status = s; changed = at; }
  const soul = soulAt(f);
  const lastPay = [...ENTRIES].filter((e) => f >= e.paidAt).pop();
  const chips: Chip[] = [
    {label: 'SOUL', value: `${soul}%`, tone: soul >= 80 ? 'ok' : soul >= 40 ? 'warn' : 'bad', from: E.pocket, changedAt: lastPay?.paidAt},
    {label: 'CASH', value: '$50,000', tone: 'warn', from: E.cash},
  ];
  return {status, changed, chips};
};

export const SoulForSale: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const hud = hudAt(f);
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={Math.max(1, to - from)}>{el}</Sequence>;
  const L = (g: number, from: number) => g - from;
  const rec = (from: number, to: number, day: string, n: number, spillAt?: number) => seq(from, to, <>
    <Behind from={from} pose="down.worried" dark={0.62} />
    <Receipt entries={ENTRIES.slice(0, n).map((e) => ({...e, at: e.at - from, paidAt: e.paidAt - from}))} day={day} at={0} spillAt={spillAt !== undefined ? spillAt - from : undefined} />
  </>);
  return <AbsoluteFill style={{background: color.night}}>
    {seq(S.store, S.post, <Store />)}
    {seq(S.post, S.dark, <><Behind from={S.post} /><Phone at={2}><Post laughFrom={L(wf('S02', 2), S.post)} typeFrom={L(wf('S03', 2), S.post)} typeTo={L(we('S03'), S.post) - 2} sendAt={L(we('S03'), S.post) + 4} /></Phone></>)}
    {seq(S.dark, S.env, <Dark from={S.dark} />)}
    {seq(S.env, S.contract, <><Envelope from={S.env} />
      <Sequence from={E.nameCard - S.env}><AbsoluteFill style={{background: '#05060a', opacity: 0.5}} /><Card at={0} tone="cream">
        <div style={{fontFamily: 'Anton', fontSize: 130, color: '#24232a', lineHeight: 1}}>FOR: YOU</div></Card></Sequence></>)}
    {seq(S.contract, E.out2, <><Behind from={S.contract} pose="down.shock" dark={0.6} /><Contract at={0} signAt={E.sign - S.contract} /></>)}
    {seq(E.out2, S.gone, <AbsoluteFill style={{background: '#000'}} />)}
    {seq(S.gone, S.d1, <Gone from={S.gone} />)}

    {seq(S.d1, S.r1, <><Behind from={S.d1} pose="down.worried" dark={0.5} /><ScratchCard at={wf('S09', 2) - S.d1} scratchFrom={wf('S09', 3) - S.d1 + 4} scratchTo={wf('S09', 5) - S.d1} /></>)}
    {rec(S.r1, S.steak, 'DAY 1/7', 1)}
    {seq(S.steak, S.d2, <Steak from={S.steak} />)}
    {seq(S.d2, S.r2, <Quit from={S.d2} />)}
    {rec(S.r2, S.bed, 'DAY 2/7', 2)}
    {seq(S.bed, S.d3, <Bed from={S.bed} />)}
    {seq(S.d3, S.r3, <><Behind from={S.d3} pose="phone.shock" dark={0.55} /><Phone at={wf('S15', 2) - S.d3}><Followers from={wf('S15', 2) - S.d3} to={wf('S15', 6) - S.d3 + 4} /></Phone></>)}
    {rec(S.r3, S.call, 'DAY 3/7', 3)}
    {seq(S.call, S.d4, <><Behind from={S.call} pose="phone.worried" dark={0.55} /><Phone at={0}><Call connectAt={wf('S17b') - S.call - 2} /></Phone></>)}
    {seq(S.d4, S.r4, <Obey from={S.d4} />)}
    {rec(S.r4, S.hands, 'DAY 4/7', 4)}
    {seq(S.hands, S.d5, <Hands from={S.hands} />)}
    {seq(S.d5, S.r5, <GiveBack from={S.d5} />)}
    {rec(S.r5, S.d6, 'DAY 5/7', 5)}
    {seq(S.d6, S.close, <Customers />)}
    {seq(S.close, S.r7, <Close from={S.close} />)}
    {rec(S.r7, S.midnight, 'DAY 7/7', 7, we('S25') + 4)}
    {seq(S.midnight, S.endless, <><Behind from={S.midnight} pose="down.scared" dark={0.4} /><Blackout from={E.out3 - S.midnight} to={S.endless - S.midnight + 4} /></>)}
    {seq(S.endless, S.env2, <Endless from={S.endless} />)}
    {seq(S.env2, S.comment, <><Envelope2 from={S.env2} />
      <Sequence from={wf('S28', 3) - S.env2 - 2}><AbsoluteFill style={{background: '#05060a', opacity: 0.5}} /><Card at={0} tone="black">
        <div style={{fontFamily: 'Anton', fontSize: 74, color: color.keyRed, lineHeight: 1.1}}>TO CANCEL:<br />FIND A REPLACEMENT</div></Card></Sequence></>)}
    {seq(S.comment, SOUL_FRAMES, <><Behind from={S.comment} atlas={heroU} pose="phone.scared" dark={0.55} />
      <Phone at={0}><Post laughFrom={-200} typeFrom={-100} typeTo={-90} sendAt={-80} extraAt={wf('S29', 3) - S.comment} /></Phone></>)}

    {/* blackouts, day cards, shocks */}
    <Flash at={E.bank1} color="#000" dur={3} peak={0.6} />
    <Flash at={E.back} color="#ffffff" dur={3} peak={0.35} />
    <Flash at={S.gone} color="#ffffff" dur={3} peak={0.3} />
    {[S.d1, S.d2, S.d3, S.d4, S.d5, S.d6, S.r7].map((d, i) => <DayCard key={i} at={d + 1} day={[1, 2, 3, 4, 5, 6, 7][i]} dur={i === 0 ? 24 : 26} />)}
    {ENTRIES.slice(0, 5).map((e, i) => <Tint key={i} color="#ff1e2e" from={e.paidAt} to={e.paidAt + 10} peak={0.25} />)}
    <Tint color="#ff1e2e" from={ENTRIES[6].paidAt} to={S.midnight} peak={0.3} pulse={18} />
    <Flash at={S.endless} color="#ff2d3d" dur={4} peak={0.5} />
    <Vignette strength={0.82} />

    {f < S.choice && <Hud series="SOUL FOR SALE" part="PART 1" status={hud.status} statusChangedAt={hud.changed} chips={hud.chips} />}
    {f < S.choice && <WordCaption phrases={PHRASES} />}
    {seq(S.choice - 2, SOUL_FRAMES, <><AbsoluteFill style={{background: '#05060a', opacity: 0.6}} />
      <ChoiceStack at={2} title="YOUR CALL." a="TAKE THEIR PLACE" b="TAKE THEIRS" aAt={12} bAt={22} y={600} /></>)}
    <Audio src={staticFile('audio/soul-mix.wav')} />
  </AbsoluteFill>;
};
