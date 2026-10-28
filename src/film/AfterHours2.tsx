import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import timing from '../ah2-timing.json';
import heroA from '../../public/sprites/hero.json';
import actA from '../../public/sprites/hero_actions.json';
import {FPS, color, font} from '../kit/theme';
import {World, SetLayer, camAt, useKitFonts, clamp, CamKey} from '../kit/world';
import {Atlas, PixelSprite} from '../kit/sprite';
import {Glow, Darken, Flash, Vignette, Rings, Tint, useHits} from '../kit/effects';
import {WordCaption, Hud, phrasesFrom, Word} from '../kit/overlay';
import {NoiseMeter} from './ns-ui';
import {Phone} from './soul-ui';
import {RuleCard, Thread} from './ah-ui';
import {HookHeadline, BeatChips, BigCount, NumberedChoice, NextDayCard, Chip} from './reels-ui';

const A = (j: unknown) => j as Atlas;
const hero = A(heroA), act = A(actA);

// ---------- timing anchors ----------
type TW = Word & {line: string};
const WORDS = timing.words as TW[];
const byLine = (id: string) => WORDS.filter((w) => w.line === id);
const wf = (id: string, i = 0) => { const ws = byLine(id); return Math.round(ws[i < 0 ? ws.length + i : i].s * FPS); };
const we = (id: string, i = -1) => { const ws = byLine(id); return Math.round((ws[i < 0 ? ws.length + i : i].e ?? 0) * FPS); };
const cut = (id: string, i = 0) => wf(id, i) - 3;
const PHRASES = phrasesFrom(WORDS.filter((w) => w.line !== 'H27'), 0.5);

// key moments (mirrored in scripts/build_ah2_cues.py)
const E = {
  stopped: wf('H03', 3), voice: wf('H03b', 0), hide: wf('H04', 2), detail: wf('H06', 5), speaker: wf('H07', 7), twoWay: wf('H08', 3), listen: wf('H08', 13),
  r104: wf('H11', 8), off104: wf('H11', 12), r106: wf('H12', 0), r108: wf('H12', 1), r110: wf('H13', 3), click: wf('H14', 0), red: wf('H14', 5),
  stop: wf('H15', 1), cough: wf('H16', 5), dark: wf('H17', 2), run: wf('H17', 5), quiet: wf('H18', 3), all: wf('H19', 10), maya: wf('H20b', 0),
  yours: wf('H21', 2), phone: wf('H22', 2), dont: wf('H23', 3), delivered: wf('H23', 4), code: wf('H24', 7), star: wf('H24', 13), every: wf('H25', 8), hears: wf('H26', 2),
};
const CHOICE = wf('H27', 0) - 2;
export const AH2_END = we('H27') + 30;
export const AH2_FRAMES = AH2_END + 120;

// ---------- library (kit/sets_school.py) with the wall speaker under the clock ----------
const SPK = {x: 75, y: 68};          // speaker centre; LED at its right
const COVER_END = wf('H02', 0) - 3;
const ledAt = (g: number) => {        // the library speaker's red light: lit on the cover, on at "Click", off at "goes dark", on again for the all-call
  if (g < COVER_END) return 1;
  if (g >= E.all) return 1;
  if (g >= E.red && g < E.dark) return 1;
  if (g >= E.click && g < E.red) return Math.floor((g - E.click) / 3) % 2;
  return 0;
};
const Speaker: React.FC<{g: number}> = ({g}) => <>
  <div style={{position: 'absolute', left: SPK.x - 9, top: SPK.y - 5, width: 18, height: 10, background: '#b9bcc4', border: '1px solid #3a3d47'}} />
  {Array.from({length: 4}, (_, k) => <div key={k} style={{position: 'absolute', left: SPK.x - 7, top: SPK.y - 3 + k * 2, width: 12, height: 1, background: '#5a5d68'}} />)}
  <div style={{position: 'absolute', left: SPK.x + 6, top: SPK.y - 1, width: 2, height: 2, background: ledAt(g) ? '#ff3030' : '#4a2224'}} />
</>;

const HX = 60, HY = 236;                // hero crouched under the table (top y 188)
const Library: React.FC<{from: number; cam: CamKey[]; crouch?: (g: number) => number; dark?: number; pose?: string}> = ({from, cam, crouch, dark = 0.5, pose = 'crouch'}) => {
  const f = useCurrentFrame(); const g = f + from;
  const cp = crouch ? crouch(g) : 1;
  const hx = interpolate(cp, [0, 1], [112, HX]);
  const led = ledAt(g);
  return <World cam={camAt(g, cam)} shake={g >= E.all && g < E.all + 10 ? 0.5 : 0}>
    <SetLayer src="sets/library_bg.png" />
    <Speaker g={g} />
    {/* modesty panel at the back of the desk: the "wall at your back" */}
    <div style={{position: 'absolute', left: 14, top: 192, width: 108, height: 40, background: '#3a281c'}} />
    <PixelSprite atlas={act} frame={cp < 1 ? 'tiptoe' : pose} x={hx} y={HY} breathe={false} squash={false} />
    <SetLayer src="sets/library_fg.png" />
    <Darken amount={dark} />
    <Glow x={34} y={100} r={40} color={color.moon} intensity={0.25} />
    <Glow x={HX} y={HY - 16} r={20} color="rgba(190,205,240,1)" intensity={0.35} />
    {led > 0 && <><Glow x={SPK.x + 7} y={SPK.y} r={5} color="rgba(255,40,40,1)" intensity={1.3} /><Glow x={SPK.x} y={SPK.y + 30} r={50} color="rgba(255,40,40,1)" intensity={0.3} /></>}
  </World>;
};
const SpeakerShot: React.FC<{from: number; zoom?: number; rings?: number[]}> = ({from, zoom = 6, rings = []}) => {
  const f = useCurrentFrame(); const g = f + from;
  const led = ledAt(g);
  return <World cam={{x: SPK.x, y: SPK.y + 10, zoom: zoom * 0.7 + f * 0.004}}>
    <SetLayer src="sets/library_bg.png" />
    <Speaker g={g} />
    <Darken amount={0.4} />
    {led > 0 && <><Glow x={SPK.x + 7} y={SPK.y} r={4} color="rgba(255,40,40,1)" intensity={1.5} /><Glow x={SPK.x} y={SPK.y} r={24} color="rgba(255,40,40,1)" intensity={0.35} /></>}
    {rings.map((r, i) => <Rings key={i} x={SPK.x} y={SPK.y} at={r - from} count={4} every={8} life={28} maxR={18} width={0.3} />)}
  </World>;
};

// ---------- the library door from inside (light strip + feet under it) ----------
const Door: React.FC<{from: number; knocks?: number[]; feet?: [number, number]; run?: [number, number]}> = ({from, knocks = [], feet, run}) => {
  const f = useCurrentFrame(); const g = f + from;
  const hit = useHits(knocks, 1.0, 6);
  const leave = feet ? interpolate(g, [feet[1], feet[1] + 20], [0, 40], clamp) : 0;
  const runX = run ? interpolate(g, [run[0], run[1]], [-10, 50], clamp) : -99;
  return <World cam={{x: 69, y: 182, zoom: 3.0 + f * 0.003}} shake={Math.abs(hit) * 0.6}>
    <div style={{position: 'absolute', left: 61, top: 149, width: 16, height: 24, background: '#120d12'}} />
    <SetLayer src="sets/door_bg.png" />
    <div style={{position: 'absolute', left: 52, top: 199, width: 35, height: 1, background: 'rgba(255,120,110,0.75)'}} />
    {feet && g >= feet[0] && leave < 40 && <><div style={{position: 'absolute', left: 61 + leave, top: 199, width: 6, height: 1, background: '#0b0c11'}} />
      <div style={{position: 'absolute', left: 71 + leave, top: 199, width: 6, height: 1, background: '#0b0c11'}} /></>}
    {run && g >= run[0] && g < run[1] && [0, 1].map((k) => <div key={k} style={{position: 'absolute', left: 52 + runX + k * 8 + (Math.floor(g / 3) % 2) * 2, top: 199, width: 5, height: 1, background: '#0b0c11'}} />)}
    <SetLayer src="sets/door_fg.png" />
    <Darken amount={0.6} />
    <Glow x={69} y={199} r={14} color="rgba(255,90,80,1)" intensity={0.35} />
  </World>;
};

// ---------- the front-office intercom board (generic UI): who is LISTENing ----------
const ROOMS = [102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124];
const Panel: React.FC<{from: number; listen: (g: number) => number[]; dead?: (g: number) => number[]; title?: (g: number) => string}> = ({from, listen, dead, title}) => {
  const f = useCurrentFrame(); const g = f + from;
  const on = listen(g), off = dead?.(g) ?? [];
  return <AbsoluteFill style={{background: 'radial-gradient(70% 50% at 50% 45%, #1b1e28, #07080c)'}}>
    <div style={{position: 'absolute', left: 120, right: 120, top: 520, borderRadius: 26, background: '#c9c6bb', border: '10px solid #2a2c33', padding: '34px 34px 40px',
      boxShadow: '0 40px 120px rgba(0,0,0,0.7)', fontFamily: font.pixel}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 700, color: '#2a2c33', letterSpacing: 2}}>
        <span>FRONT OFFICE · INTERCOM</span><span style={{color: on.length ? '#c8202c' : '#2a2c33'}}>{title?.(g) ?? (on.length ? 'LISTEN' : 'IDLE')}</span></div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 30}}>
        {ROOMS.map((r) => {
          const lit = on.includes(r), gone = off.includes(r);
          return <div key={r} style={{background: r === 110 ? '#e8e2cf' : '#dcd8cb', border: `4px solid ${lit ? '#ff3030' : '#8a877d'}`, borderRadius: 12, padding: '14px 10px', textAlign: 'center',
            boxShadow: lit ? '0 0 30px rgba(255,48,48,0.8)' : undefined}}>
            <div style={{fontSize: 40, fontWeight: 700, color: gone ? '#9a978c' : '#1e2027'}}>{r}</div>
            <div style={{fontSize: 18, color: r === 110 ? '#c8202c' : '#5a5d68', marginTop: 2}}>{r === 110 ? 'LIBRARY' : gone ? 'NO SIGNAL' : 'ROOM'}</div>
            <div style={{width: 22, height: 22, borderRadius: 11, margin: '8px auto 0', background: lit ? '#ff3030' : '#4a2224', boxShadow: lit ? '0 0 16px #ff3030' : undefined}} />
          </div>;
        })}
      </div>
      <div style={{display: 'flex', gap: 16, marginTop: 30, justifyContent: 'center'}}>
        {['TALK', 'LISTEN', 'ALL CALL'].map((b) => <div key={b} style={{padding: '10px 22px', borderRadius: 10, background: '#2a2c33', color: (b === 'LISTEN' && on.length) || (b === 'ALL CALL' && on.length > 6) ? '#ff5050' : '#d0d0d0',
          fontSize: 24, fontWeight: 700}}>{b}</div>)}
      </div>
    </div>
  </AbsoluteFill>;
};

/** The librarian's desk phone with the page code taped on. */
const DeskPhone: React.FC<{codeAt: number; starAt: number}> = ({codeAt, starAt}) => {
  const f = useCurrentFrame();
  const hl = f >= starAt;
  return <AbsoluteFill style={{background: 'radial-gradient(60% 45% at 50% 50%, #2a2018, #07080c)'}}>
    <div style={{position: 'absolute', left: 170, right: 170, top: 520, height: 760, borderRadius: 40, background: '#d8d3c4', border: '10px solid #2a2c33', boxShadow: '0 40px 120px rgba(0,0,0,0.7)'}}>
      <div style={{position: 'absolute', left: 40, right: 40, top: 40, height: 150, borderRadius: 30, background: '#2a2c33'}} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 240, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22}}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => <div key={k} style={{height: 90, borderRadius: 18, background: '#f2efe6', border: '4px solid #8a877d',
          fontFamily: font.ui, fontWeight: 700, fontSize: 48, color: '#1e2027', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hl && (k === '*' || k === '2' || k === '1') ? `0 0 0 6px ${color.keyYellow}` : undefined}}>{k}</div>)}
      </div>
    </div>
    {/* the taped note */}
    <div style={{position: 'absolute', left: 300, top: 430, width: 480, padding: '20px 26px', background: '#f4e9a8', transform: `rotate(-4deg) scale(${f >= codeAt ? 1 : 0.0})`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: font.mono, color: '#2a2c33', textAlign: 'center'}}>
      <div style={{position: 'absolute', left: 160, top: -16, width: 150, height: 34, background: 'rgba(230,230,220,0.7)'}} />
      <div style={{fontSize: 34}}>PAGE ALL</div><div style={{fontSize: 70, fontWeight: 500, color: hl ? '#c8202c' : '#2a2c33'}}>* 2 1</div>
    </div>
  </AbsoluteFill>;
};

// ---------- HUD + NOISE ----------
const CLOCK: [number, string][] = [[0, '5:18 PM'], [cut('H07'), '5:22 PM'], [cut('H11'), '5:26 PM'], [cut('H19'), '5:29 PM'], [cut('H22'), '5:31 PM']];
const SPIKES: [number, number][] = [[wf('H02', 3), 0.8], [E.voice, 0.6], [E.r104, 0.3], [E.r106, 0.3], [E.r108, 0.3], [E.click, 0.5], [E.cough, 0.9], [E.run, 0.7],
  [E.all, 1.0], [E.maya, 0.8], [E.phone, 0.3]];
const noiseAt = (f: number) => {
  let lv = (f >= E.stop && f < E.cough ? 0.01 : 0.07) + 0.02 * Math.sin(f * 0.7);
  for (const [at, l] of SPIKES) if (f >= at) lv = Math.max(lv, l * Math.exp(-(f - at) / 24));
  return lv;
};
const hudAt = (f: number) => { let c = CLOCK[0][1]; for (const [at, s] of CLOCK) if (f >= at) c = s; return `${c} · LIBRARY · NO POWER`; };

const CHIPS: Chip[] = [
  {at: wf('H02', 5), text: '11 MINUTES', sub: 'OF KNOCKING'}, {at: E.stopped, text: 'SILENCE'}, {at: E.voice, text: 'HER VOICE?', tone: 'bad'},
  {at: E.hide, text: 'HIDE', tone: 'fact'},
  {at: wf('H05', 0), text: 'SOLID WOOD', tone: 'ok'}, {at: wf('H05', 2), text: 'ONE WAY IN', tone: 'ok'}, {at: wf('H05', 5), text: 'WALL BEHIND', tone: 'ok'},
  {at: E.detail, text: 'ONE DETAIL…', tone: 'bad'}, {at: E.speaker, text: 'SPEAKER', sub: 'IN EVERY ROOM'},
  {at: E.twoWay, text: 'TWO-WAY'}, {at: E.listen, text: 'IT CAN LISTEN', tone: 'bad'}, {at: wf('H09', 0), text: 'THE LAST STUDENT', sub: 'DAY 1', tone: 'bad'},
  {at: E.r104, text: 'CHECKING ROOMS'}, {at: E.r110, text: '110 = YOU', tone: 'bad'},
  {at: E.stop, text: 'HOLD YOUR BREATH', tone: 'bad'}, {at: E.cough, text: 'COUGH IN 108', tone: 'bad'}, {at: E.dark, text: 'LIGHT OFF', tone: 'ok'},
  {at: E.run, text: 'FOOTSTEPS → 108', tone: 'bad'}, {at: E.quiet, text: '108 · QUIET', tone: 'bad'},
  {at: E.all, text: 'ALL CALL', tone: 'bad'}, {at: E.maya, text: 'YOUR VOICE', tone: 'bad'}, {at: wf('H21', 3), text: 'LISTENING ALL DAY'},
  {at: E.phone, text: 'MAYA', sub: 'BAND ROOM'}, {at: E.delivered, text: 'NOT READ', tone: 'bad'},
  {at: E.code, text: 'PAGE ALL', sub: 'EVERY SPEAKER'}, {at: E.hears, text: 'IT HEARS WHERE', tone: 'bad'}, {at: CHOICE, text: ''},
];

export const AfterHours2: React.FC = () => {
  useKitFonts();
  const f = useCurrentFrame();
  const L = (g: number, s: number) => g - s;
  const KNOCKS = [wf('H02', 3), wf('H02', 3) + 7, wf('H02', 3) + 14, wf('H02', 6), wf('H02', 6) + 7];
  const roomsUpTo = (g: number) => (g >= E.all ? ROOMS : g >= E.r110 ? [110] : g >= E.r108 ? [108] : g >= E.r106 ? [106] : g >= E.r104 && g < E.off104 ? [104] : []);

  const shots: [number, (s: number) => React.ReactNode][] = [
    // frame 0 = the cover: you under the desk, the red light above you
    [0, (s) => <Library from={s} cam={[{at: 0, x: 67.5, y: 120, zoom: 1.0}, {at: cut('H02'), x: 67.5, y: 126, zoom: 1.08}]} dark={0.4} />],
    [cut('H02'), (s) => <Door from={s} knocks={KNOCKS} feet={[s, E.voice + 30]} />],
    [cut('H04'), (s) => <Library from={s} crouch={(g) => interpolate(g, [E.hide - 6, E.hide + 30], [0, 1], clamp)} cam={[{at: s, x: 70, y: 180, zoom: 1.6}, {at: cut('H06'), x: 64, y: 196, zoom: 2.2}]} />],
    [cut('H07'), (s) => <SpeakerShot from={s} zoom={5} />],
    [cut('H08'), (s) => <Panel from={s} listen={(g) => (g >= E.listen ? [110] : [])} title={(g) => (g < E.listen ? 'TALK' : 'LISTEN')} />],
    [cut('H10'), (s) => <><SpeakerShot from={s} zoom={4} /><AbsoluteFill style={{background: '#05060a', opacity: 0.35}} />
      <RuleCard at={L(wf('H10', 0), s)} n={4} title="RED LIGHT = LISTENING" sub="SAY NOTHING UNDER IT." y={560} /></>],
    [cut('H11'), (s) => <Panel from={s} listen={roomsUpTo} />],
    [cut('H14'), (s) => <SpeakerShot from={s} zoom={6} />],
    [cut('H15'), (s) => <Library from={s} cam={[{at: s, x: HX, y: 222, zoom: 4.2}, {at: s + 60, x: HX, y: 222, zoom: 4.6}]} dark={0.5} />],
    [cut('H16'), (s) => <Panel from={s} listen={(g) => (g < E.dark ? [110] : [])} title={(g) => (g >= E.cough ? 'NOISE · 108' : 'LISTEN')} />],
    [E.dark - 2, (s) => <Door from={s} run={[E.run - 4, E.run + 26]} />],
    [cut('H18'), (s) => <Panel from={s} listen={() => []} dead={(g) => (g >= E.quiet ? [108] : [])} />],
    [cut('H19'), (s) => <Library from={s} cam={[{at: s, x: 70, y: 150, zoom: 1.3}, {at: E.all, x: 70, y: 150, zoom: 1.3}, {at: E.all + 2, x: SPK.x, y: 110, zoom: 2.2, ease: Easing.out(Easing.cubic)}]} dark={0.45} />],
    [cut('H20b'), (s) => <><SpeakerShot from={s} zoom={5} rings={[E.maya, wf('H20b', 3), wf('H20b', 7)]} /></>],
    [cut('H21'), (s) => <Library from={s} cam={[{at: s, x: HX, y: 216, zoom: 3.0}, {at: s + 90, x: HX, y: 216, zoom: 3.3}]} dark={0.5} />],
    [cut('H22'), (s) => <><Library from={s} cam={[{at: s, x: HX, y: 222, zoom: 4.4}]} dark={0.6} /><AbsoluteFill style={{background: '#05060a', opacity: 0.45}} />
      <Phone at={0} y={600}><Thread name="Maya" sub="best friend" msgs={[{at: -60, text: 'still at school too lol', time: '4:03 PM'},
        {at: L(wf('H22', 5), s), text: 'is that you??', time: '5:31 PM'}, {at: L(wf('H22', 8), s), text: "im in the band room"}, {at: L(wf('H22', 13), s), text: 'coming now', hl: true},
        {at: L(E.dont, s), text: "DON'T", out: true}]} />
        {f >= E.delivered && <div style={{textAlign: 'right', fontSize: 26, color: color.keyRed, marginTop: 8}}>Delivered · not read</div>}</Phone></>],
    [cut('H24'), (s) => <DeskPhone codeAt={L(E.code, s)} starAt={L(E.star, s)} />],
    [cut('H25'), (s) => <Panel from={s} listen={(g) => (g >= E.every ? ROOMS : [])} title={() => 'ALL CALL'} />],
    [cut('H26'), (s) => <SpeakerShot from={s} zoom={6} />],
    [CHOICE, (s) => <><Library from={s} cam={[{at: s, x: HX, y: 200, zoom: 2.4}]} dark={0.6} /><AbsoluteFill style={{background: 'rgba(5,6,10,0.6)'}} />
      <NumberedChoice at={2} l1="WARN MAYA" l2="OR STAY HIDDEN?" a="PAGE THE SCHOOL" b="STAY HIDDEN" /></>],
    [AH2_END, () => <NextDayCard at={4} series="AFTER HOURS" next="DAY 3" clock="5:32 PM" />],
  ];

  return <AbsoluteFill style={{background: color.night}}>
    {shots.map(([from, render], i) => {
      const to = i + 1 < shots.length ? shots[i + 1][0] : AH2_FRAMES;
      return <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)}>{render(from)}</Sequence>;
    })}
    <Flash at={E.detail} color="#ff2d3d" dur={3} peak={0.25} />
    <Flash at={E.red} color="#ff2d3d" dur={3} peak={0.35} />
    <Flash at={E.cough} color="#ffffff" dur={2} peak={0.25} />
    <Flash at={E.all} color="#ff2d3d" dur={4} peak={0.45} />
    <Flash at={E.hears} color="#ff2d3d" dur={3} peak={0.3} />
    <Tint color="rgba(255,40,40,1)" from={E.all} to={we('H21')} peak={0.14} pulse={20} />
    {f < AH2_END && <Vignette strength={0.8} />}

    <HookHeadline l1="EVERY CLASSROOM SPEAKER" l2="IS ALSO A MICROPHONE." l2At={-12} sign="DAY 1 · ON MY PAGE" until={we('H01') + 45} y={700} />
    {f < CHOICE && <Hud series="AFTER HOURS" part="DAY 2" status={hudAt(f)} />}
    {f < CHOICE && <NoiseMeter level={noiseAt(f)} top={236} />}
    {f > we('H01') + 45 && f < CHOICE && <BeatChips chips={CHIPS} y={330} stack={[wf('H05', 0), E.detail]} />}
    <BigCount steps={[{at: E.r104, text: '104'}, {at: E.r106, text: '106'}, {at: E.r108, text: '108'}, {at: E.r110, text: '110', red: true}]} y={1330} until={cut('H14')} />
    {f < CHOICE && <WordCaption phrases={PHRASES} />}
    <Audio src={staticFile('audio/ah2-mix.wav')} />
  </AbsoluteFill>;
};
