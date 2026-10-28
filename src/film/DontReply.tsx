import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timing from '../dr-timing.json';
import heroA from '../../public/sprites/hero.json';
import broA from '../../public/sprites/brother.json';
import infA from '../../public/sprites/infected.json';
import props2A from '../../public/sprites/props2.json';
import {FPS, color} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Beam, Darken, Flash, Vignette, useHits} from '../kit/effects';
import {WordCaption, Hud, phrasesFrom, Word} from '../kit/overlay';
import {NoiseMeter} from './ns-ui';
import {Phone} from './soul-ui';
import {RuleCard, SeriesCard, Thread, Question} from './ah-ui';
import {LockNotifs, Inbox, MiniSet, Story, ActivityToggle, PhotoDM, Slip, Tablet} from './dr-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), bro = A(broA), inf = A(infA), props2 = A(props2A);

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'D22'), 0.5);

// key moments (mirrored in scripts/build_dr_cues.py)
const E = {
  beast: wf('D01', 9), jake: wf('D04', 6), name: wf('D05', 1), open: wf('D06', 4), empty: wf('D07', 6), yes: wf('D08', 3),
  buzz1: wf('D09', 0), buzz2: wf('D09', 4), dot: wf('D10', 5), offline: wf('D11', 4), photo: wf('D12', 2), which: wf('D13', 0),
  tall: wf('D15', 1), lit: wf('D15', 7), slip: wf('D16', 2), dots: wf('D16', 4), turns: wf('D17', 3), bang: wf('D19', 2), thumbY: wf('D21', 6),
};
const CHOICE = wf('D22') - 2;
export const DR_END = we('D22') + 14;
export const DR_FRAMES = DR_END + 105;

// ---------- bedroom (LIGHTS OUT set) in grey morning light ----------
const HX = 36, HY = 189;
const Bedroom: React.FC<{from: number; cam: CamKey[]; keys: {at: number; pose: string}[]; door?: boolean; broKeys?: {at: number; pose: string}[]; phone?: boolean}> = ({from, cam, keys, door, broKeys, phone = true}) => {
  const f = useCurrentFrame(); const g = f + from;
  const hit = useHits([E.bang], 1.4, 6);
  const doorP = door ? interpolate(g, [E.bang - 2, E.bang + 3], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
  return <World cam={camAt(g, cam)} shake={door && g >= E.bang && g < E.bang + 8 ? 0.6 : 0}>
    <SetLayer src="sets/bedroom_bg.png" />
    {/* grey morning through the window */}
    <Beam x={68} y={95} w0={50} w1={110} h={120} color="rgba(190,200,220,1)" intensity={0.55} />
    {/* bedroom door on the right wall: opens onto a lit hallway */}
    <div style={{position: 'absolute', left: 107, top: 115, width: 24, height: 81, background: '#191d2b', border: '1px solid #0b0c11'}} />
    {door && <>
      <div style={{position: 'absolute', left: 108, top: 116, width: 22, height: 80, background: '#c79a5a'}} />
      <div style={{position: 'absolute', left: 108 + 20 * doorP, top: 116, width: 22 - 19 * doorP, height: 80, background: '#3a2c24'}} />
    </>}
    <PixelSprite atlas={props2} frame="lamp_off" x={11} y={159} breathe={false} squash={false} />
    <PixelSprite atlas={hero} x={HX} y={HY} keys={keys.map((k) => ({...k, at: k.at - from}))} />
    <SetLayer src="sets/bedroom_fg.png" />
    {door && <PixelSprite atlas={bro} x={119 + hit * 0.3} y={196} scale={0.78} keys={(broKeys ?? [{at: 0, pose: 'phone.smile'}]).map((k) => ({...k, at: k.at - from}))} />}
    {phone && <Glow x={HX} y={HY - 17} r={16} color={color.phone} intensity={0.8} flicker={0.04} seed="ph" />}
    {door && <Glow x={119} y={160} r={40} color={color.warm} intensity={0.6 * doorP} />}
    {door && <Glow x={118} y={180} r={9} color={color.phone} intensity={0.8} />}
    <Darken amount={0.32} />
  </World>;
};

/** Close behind the hero, for phone inserts and rule cards. */
const Behind: React.FC<{from: number; pose?: string; dark?: number}> = ({from, pose = 'phone.scared', dark = 0.55}) => {
  const f = useCurrentFrame();
  return <><Bedroom from={from} cam={[{at: from, x: HX, y: 172, zoom: 3 + f * 0.002}]} keys={[{at: 0, pose}]} /><AbsoluteFill style={{background: '#05060a', opacity: dark}} /></>;
};

// ---------- the street through the blinds (LIGHTS OUT set), morning fog ----------
const FX = 20, FY = 200;   // the tall thing on the far sidewalk
const Street: React.FC<{from: number; cam: CamKey[]; fig?: (g: number) => string}> = ({from, cam, fig}) => {
  const f = useCurrentFrame(); const g = f + from;
  const fr = fig?.(g) ?? 'stand';
  return <World cam={camAt(g, cam)}>
    <SetLayer src="sets/street_bg.png" />
    <div style={{position: 'absolute', left: 36, top: 104, width: 63, height: 59, background: '#0a0c14', opacity: 0.9}} />
    <SetLayer src="sets/street_mid.png" />
    <Darken amount={0.25} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(150,160,180,0.10), rgba(150,160,180,0.28))'}} />
    {fig && <>
      <PixelSprite atlas={inf} frame={fr} x={FX} y={FY} breathe={false} squash={false} blink={false} />
      <div style={{position: 'absolute', left: FX + 8, top: FY - 30, width: 3, height: 5, background: '#bfe3ff'}} />
      <Glow x={FX + 9} y={FY - 30} r={10} color={color.phone} intensity={1} flicker={0.05} seed="fp" />
      <Glow x={FX + 4} y={FY - 50} r={8} color={color.phone} intensity={0.35} />
    </>}
    {/* blinds: slats with gaps we look through */}
    {Array.from({length: 19}, (_, k) => <div key={k} style={{position: 'absolute', left: 0, top: 18 + k * 12, width: 135, height: 3, background: '#3b3f4c', opacity: 0.9,
      boxShadow: 'inset 0 1px 0 #555a69'}} />)}
    <SetLayer src="sets/street_fg.png" />
  </World>;
};

// ---------- HUD + ONLINE meter ----------
const CLOCK: [number, string][] = [[0, '7:02 AM'], [cut('D07'), '7:03 AM'], [cut('D12'), '7:05 AM'], [cut('D19'), '7:08 AM']];
const SPIKES: [number, number][] = [[E.beast, 0.35], [wf('D04', 0), 0.3], [E.open, 0.45], [E.buzz1, 0.5], [E.buzz2, 0.6], [E.dot, 0.95], [E.photo, 0.4],
  [E.lit, 0.3], [E.slip, 0.8], [E.dots, 1.0], [E.turns, 0.9], [E.bang, 0.6]];
const onlineAt = (f: number) => {
  let lv = (f < E.offline ? 0.12 : 0.04) + 0.02 * Math.sin(f * 0.6);
  for (const [at, l] of SPIKES) if (f >= at) lv = Math.max(lv, l * Math.exp(-(f - at) / 26));
  if (f >= E.thumbY - 30) lv = Math.max(lv, interpolate(f, [E.thumbY - 30, CHOICE], [0.5, 1], clamp));
  return lv;
};
const hudAt = (f: number) => {
  let clock = CLOCK[0][1];
  for (const [at, c] of CLOCK) if (f >= at) clock = c;
  return `${clock} · ${f >= E.offline ? 'OFFLINE' : 'ONLINE'}`;
};

export const DontReply: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const L = (g: number, from: number) => g - from;
  const story = <MiniSet layers={['sets/bedroom_bg.png']} scale={5.6} ox={6} oy={96} w={712} h={330} filter="brightness(0.75) saturate(0.8)">
    <div style={{position: 'absolute', left: 30, top: 124, width: 8, height: 4, background: '#14151b'}} />
    <div style={{position: 'absolute', left: 31, top: 125, width: 6, height: 2, background: '#bfe3ff', boxShadow: '0 0 3px #bfe3ff'}} />
  </MiniSet>;

  const shots: [number, (s: number) => React.ReactNode][] = [
    [0, (s) => <Bedroom from={s} cam={[{at: 0, x: 40, y: 168, zoom: 2.0}, {at: E.beast - 1, x: 38, y: 170, zoom: 2.4}, {at: E.beast, x: 37, y: 172, zoom: 3.0, ease: Easing.out(Easing.cubic)}]}
      keys={[{at: 0, pose: 'phone.neutral'}, {at: E.beast, pose: 'phone.shock'}]} />],
    [cut('D02'), (s) => <><Behind from={s} pose="phone.shock" dark={0.5} /><Phone at={0} y={330}>
      <LockNotifs clock="7:02" items={[{at: 4, from: 'MrBeast', badge: true, text: 'Hey Sam 👋', time: '3:33 AM'}]} /></Phone></>],
    [cut('D03'), (s) => <><Behind from={s} dark={0.5} /><Phone at={-20} y={330}><Thread name="the group 🫡" sub="5 members" msgs={[
      {at: L(wf('D03', 1), s), text: 'guys'}, {at: L(wf('D03', 4), s), text: 'GUYS'},
      {at: L(wf('D04', 0), s), text: 'did everyone get the mrbeast dm??'}, {at: L(wf('D04', 4), s), text: "DON'T ANSWER IT"},
      {at: L(E.jake, s), text: 'jake answered.', hl: true}]} /></Phone></>],
    [cut('D05'), (s) => <><Behind from={s} dark={0.5} /><Phone at={-20} y={330}><Inbox hlAt={L(E.name, s)} /></Phone></>],
    [cut('D06'), (s) => <><Behind from={s} dark={0.6} /><Phone at={-30} y={760}><Inbox /></Phone>
      <div style={{position: 'absolute', left: 560, top: 1080 + Math.sin(f * 0.2) * 8, width: 120, height: 190, borderRadius: '60px 60px 40px 40px', background: '#f1ece2', border: '7px solid #14151b', transform: 'rotate(-14deg)'}} />
      <RuleCard at={L(wf('D06', 0), s)} n={1} title="DON'T OPEN IT" sub='IT SENDS "SEEN."' y={330} /></>],
    [cut('D07'), (s) => <><Behind from={s} dark={0.6} /><Phone at={0} y={330}><Story photo={story} captionFrom={L(E.yes, s)} caption="I said yes!! 🤑" /></Phone></>],
    [cut('D09'), (s) => <><Behind from={s} dark={0.5} /><Phone at={-20} y={330}><LockNotifs clock="7:04" items={[
      {at: -60, from: 'MrBeast', badge: true, text: 'Hey Sam 👋', time: '3:33 AM'},
      {at: L(E.buzz1, s), from: 'MrBeast', badge: true, text: '$10,000 is yours 💸', time: 'now'},
      {at: L(E.buzz2, s), from: 'MrBeast', badge: true, text: '$100,000. just say yes', time: 'now', red: true}]} /></Phone></>],
    [cut('D10'), (s) => <><Behind from={s} dark={0.5} /><div style={{position: 'absolute', inset: 0, transform: `scale(${interpolate(f, [s, E.dot, E.dot + 8], [1, 1, 1.35], clamp)})`, transformOrigin: '360px 460px'}}>
      <Phone at={-20} y={330}><Inbox meDot="on" meAt={0} /></Phone></div></>],
    [cut('D11'), (s) => <><Behind from={s} dark={0.6} /><Phone at={-30} y={760}><ActivityToggle offAt={L(E.offline, s)} /></Phone>
      <RuleCard at={L(wf('D11', 0), s)} n={2} title="GO OFFLINE" sub="IT FOLLOWS THE GREEN DOT." y={330} /></>],
    [cut('D12'), (s) => <><Behind from={s} dark={0.65} /><Phone at={-20} y={330}><PhotoDM photoAt={L(E.photo, s)} lineAt={L(E.which, s)} /></Phone></>],
    [cut('D14'), (s) => <Street from={s} cam={[{at: s, x: 67, y: 150, zoom: 1.3}, {at: s + 60, x: 67, y: 156, zoom: 1.1}]} />],
    [cut('D15'), (s) => <Street from={s} fig={() => 'stand'} cam={[{at: s, x: 67, y: 156, zoom: 1.1}, {at: E.tall + 2, x: 60, y: 160, zoom: 1.3}, {at: E.lit, x: FX + 12, y: FY - 32, zoom: 2.8}, {at: we('D15') + 10, x: FX + 12, y: FY - 34, zoom: 3.1}]} />],
    [cut('D16'), (s) => <><Behind from={s} pose="phone.shock" dark={0.6} /><Phone at={-20} y={330}><Slip slipAt={L(E.slip, s)} dotsAt={L(E.dots, s)} dotsOff={L(we('D16') + 4, s)} /></Phone></>],
    [cut('D17'), (s) => <Street from={s} fig={(g) => (g < E.turns - 4 ? 'stand' : g < E.turns ? 'tilt' : 'face')}
      cam={[{at: s, x: FX + 12, y: FY - 32, zoom: 2.4}, {at: E.turns - 1, x: FX + 12, y: FY - 34, zoom: 2.6}, {at: E.turns, x: FX + 4, y: FY - 50, zoom: 4.6, ease: Easing.out(Easing.cubic)}, {at: we('D17') + 10, x: FX + 4, y: FY - 50, zoom: 5.0}]} />],
    [cut('D18'), (s) => <><Behind from={s} pose="phone.scared" dark={0.6} /><Phone at={-30} y={760}><Slip slipAt={-1} dotsAt={1e9} dotsOff={0} /></Phone>
      <RuleCard at={L(wf('D18', 0), s)} n={3} title="DON'T TOUCH THE KEYBOARD" sub="IT SEES YOU TYPING." y={330} /></>],
    [cut('D19'), (s) => <Bedroom from={s} door cam={[{at: s, x: 72, y: 165, zoom: 1.3}, {at: E.bang, x: 72, y: 165, zoom: 1.3}, {at: E.bang + 2, x: 90, y: 168, zoom: 1.7, ease: Easing.out(Easing.cubic)}]}
      keys={[{at: 0, pose: 'phone.scared'}, {at: E.bang, pose: 'phone.shock'}]} broKeys={[{at: 0, pose: 'phone.smile'}]} />],
    [cut('D20'), (s) => <Bedroom from={s} door cam={[{at: s, x: 112, y: 172, zoom: 2.8}, {at: s + 90, x: 114, y: 174, zoom: 3.2}]} keys={[{at: 0, pose: 'phone.shock'}]} broKeys={[{at: 0, pose: 'phone.smile'}]} />],
    [cut('D21'), (s) => <><AbsoluteFill style={{background: '#06070b'}} /><Tablet typingFrom={L(E.thumbY, s)} /></>],
    [CHOICE, (s) => <><AbsoluteFill style={{background: '#06070b'}} /><Tablet typingFrom={-100} /><AbsoluteFill style={{background: 'rgba(5,6,10,0.62)'}} />
      <Question at={2} l1="HE'S" l2="TYPING." a="GRAB HIS TABLET" b="STAY OFFLINE" /></>],
    [DR_END, () => <><AbsoluteFill style={{background: '#000'}} /><SeriesCard at={4} series="DON'T REPLY" day="DAY 1" clock="7:09 AM" follow hold /></>],
  ];

  return <AbsoluteFill style={{background: color.night}}>
    {shots.map(([from, render], i) => {
      const to = i + 1 < shots.length ? shots[i + 1][0] : DR_FRAMES;
      return <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>{render(from)}</Sequence>;
    })}
    <Flash at={E.beast} color="#ffffff" dur={3} peak={0.3} />
    <Flash at={E.jake} color="#ff2d3d" dur={3} peak={0.3} />
    <Flash at={E.dot} color="#3ddc6a" dur={3} peak={0.25} />
    <Flash at={E.dots} color="#ff2d3d" dur={3} peak={0.3} />
    <Flash at={E.turns} color="#ff2d3d" dur={3} peak={0.4} />
    <Flash at={E.bang} color="#ffffff" dur={3} peak={0.35} />
    {f < DR_END && <Vignette strength={0.85} />}

    {f < DR_END && <AbsoluteFill style={{top: -300}}><SeriesCard at={wf('D01', 4)} dur={44} series="DON'T REPLY" day="DAY 1" clock="7:02 AM" /></AbsoluteFill>}
    {f < CHOICE && <Hud series="DON'T REPLY" part="DAY 1" status={hudAt(f)} statusChangedAt={E.offline} />}
    {f < CHOICE && <NoiseMeter level={onlineAt(f)} top={236} label="ONLINE" />}
    {f < CHOICE && <WordCaption phrases={PHRASES} />}
    <Audio src={staticFile('audio/dr-mix.wav')} />
  </AbsoluteFill>;
};
