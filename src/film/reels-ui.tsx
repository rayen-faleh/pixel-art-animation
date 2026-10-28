import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font} from '../kit/theme';
import {clamp} from '../kit/world';

// Reel toolkit from story-blueprint.md section 4 (reference 2): hook headline on frame 0, a fact chip per beat,
// big count-up numbers, numbered choices and an end card that promises the comments decide. Portrait 1080x1920.

const pop = (f: number, at: number, fps: number, stiffness = 260, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});
const stroke = (px: number) => ({WebkitTextStroke: `${px}px ${color.ink}`, paintOrder: 'stroke fill'} as const);

/** Frame-0 hook: two lines (white, then red) and an optional series signpost, held then faded. */
export const HookHeadline: React.FC<{l1: string; l2: string; sign?: string; l2At?: number; until: number; y?: number}> = ({l1, l2, sign, l2At = 0, until, y = 300}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f > until + 10) return null;
  const o = interpolate(f, [until, until + 10], [1, 0], clamp);
  const p2 = pop(f, l2At, fps, 300, 16);
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none', opacity: o}}>
    <div style={{fontFamily: font.caption, fontSize: 104, lineHeight: 1.02, color: '#fff', textAlign: 'center', maxWidth: 980, ...stroke(12)}}>{l1}</div>
    <div style={{fontFamily: font.caption, fontSize: 104, lineHeight: 1.02, color: color.keyRed, textAlign: 'center', maxWidth: 980, opacity: p2,
      transform: `scale(${0.85 + 0.15 * p2})`, ...stroke(12)}}>{l2}</div>
    {sign && <div style={{marginTop: 22, fontFamily: font.pixel, fontWeight: 700, fontSize: 30, color: color.keyYellow, letterSpacing: 3, ...stroke(6)}}>{sign}</div>}
  </AbsoluteFill>;
};

export type Chip = {at: number; text: string; tone?: 'ok' | 'fact' | 'bad'; sub?: string};
/** One fact label per beat (top centre). Each new chip replaces the last with a pop; `stack` keeps a checklist. */
export const BeatChips: React.FC<{chips: Chip[]; y?: number; stack?: [number, number]}> = ({chips, y = 330, stack}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const tone = (t?: string) => (t === 'ok' ? color.keyGreen : t === 'bad' ? color.keyRed : color.keyYellow);
  const pill = (c: Chip, k: number, s: number) => <div key={k} style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(8,9,13,0.82)',
    border: `4px solid ${tone(c.tone)}`, borderRadius: 14, padding: '8px 22px 6px', transform: `scale(${0.6 + 0.4 * s})`, opacity: s}}>
    <div style={{fontFamily: font.caption, fontSize: 50, color: tone(c.tone), letterSpacing: 1, lineHeight: 1.05}}>{c.tone === 'ok' ? '✓ ' : ''}{c.text}</div>
    {c.sub && <div style={{fontFamily: font.pixel, fontSize: 20, color: 'rgba(255,255,255,0.75)', letterSpacing: 2}}>{c.sub}</div>}
  </div>;
  const shown = chips.filter((c) => f >= c.at);
  if (!shown.length) return null;
  if (stack && f >= stack[0] && f < stack[1]) {
    const inStack = shown.filter((c) => c.at >= stack[0] && c.at < stack[1]);
    return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, padding: '0 80px'}}>
      {inStack.map((c, k) => pill(c, k, pop(f, c.at, fps)))}</div>;
  }
  const c = shown[shown.length - 1];
  if (c.text === '') return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center'}}>{pill(c, 0, pop(f, c.at, fps))}</div>;
};

/** Big number that pops each time it changes (room numbers, counts, seconds). */
export const BigCount: React.FC<{steps: {at: number; text: string; red?: boolean}[]; y?: number; until?: number}> = ({steps, y = 470, until = 1e9}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const cur = [...steps].reverse().find((s) => f >= s.at);
  if (!cur || f >= until) return null;
  const s = pop(f, cur.at, fps, 320, 14);
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: font.caption, fontSize: 210, lineHeight: 1,
    color: cur.red ? color.keyRed : color.keyYellow, transform: `scale(${1.4 - 0.4 * s})`, ...stroke(14), textShadow: '0 10px 0 rgba(0,0,0,0.5)'}}>{cur.text}</div>;
};

/** Numbered ending: question, "1 — …" (green) / "2 — …" (red), then COMMENT 1 OR 2. */
export const NumberedChoice: React.FC<{at: number; l1: string; l2: string; a: string; b: string; y?: number}> = ({at, l1, l2, a, b, y = 470}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const p = (d: number) => pop(f, at + d, fps, 300, 14);
  const pill = (n: number, txt: string, c: string, d: number) => <div style={{display: 'flex', alignItems: 'center', gap: 22, transform: `scale(${p(d)})`, border: `6px solid ${c}`,
    background: 'rgba(8,9,13,0.8)', borderRadius: 100, padding: '10px 50px 6px 14px'}}>
    <div style={{width: 92, height: 92, borderRadius: 46, background: c, color: '#0b0c11', fontFamily: font.caption, fontSize: 70, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
    <div style={{fontFamily: font.caption, fontSize: 78, color: c}}>{txt}</div>
  </div>;
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 124, color: '#fff', lineHeight: 1, transform: `scale(${0.7 + 0.3 * p(0)})`, opacity: p(0), ...stroke(12)}}>{l1}</div>
    <div style={{fontFamily: font.caption, fontSize: 124, color: color.keyRed, lineHeight: 1.05, opacity: p(4), ...stroke(12)}}>{l2}</div>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, marginTop: 50}}>{pill(1, a, color.keyGreen, 10)}{pill(2, b, color.keyRed, 18)}</div>
    <div style={{marginTop: 46, fontFamily: font.pixel, fontWeight: 700, fontSize: 40, color: '#fff', letterSpacing: 4, opacity: p(26), ...stroke(6)}}>COMMENT 1 OR 2 ↓</div>
  </AbsoluteFill>;
};

/** End card: series, next day, and the promise that comments decide. */
export const NextDayCard: React.FC<{at: number; series: string; next: string; clock?: string}> = ({at, series, next, clock}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 200, 16), b = pop(f, at + 14, fps, 300, 14), c = pop(f, at + 24, fps, 300, 16);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(50% 35% at 50% 50%, rgba(255,45,61,0.22), transparent 70%), #000'}}>
    <div style={{textAlign: 'center', transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 2)}}>
      <div style={{fontFamily: font.caption, fontSize: 84, color: 'rgba(255,255,255,0.85)', letterSpacing: 8}}>{series}</div>
      <div style={{fontFamily: font.caption, fontSize: 300, color: color.keyRed, lineHeight: 0.95, textShadow: '0 0 60px rgba(255,45,61,0.5)'}}>{next}</div>
      {clock && <div style={{fontFamily: font.pixel, fontSize: 40, color: 'rgba(255,255,255,0.7)', letterSpacing: 6, marginTop: 6}}>{clock}</div>}
      <div style={{display: 'inline-block', marginTop: 40, background: color.alertRed, color: '#fff', fontFamily: font.pixel, fontWeight: 700, fontSize: 32, padding: '14px 30px 10px',
        borderRadius: 40, transform: `scale(${b})`, letterSpacing: 2}}>FOLLOW FOR {next}</div>
      <div style={{marginTop: 26, fontFamily: font.pixel, fontSize: 28, color: '#fff', letterSpacing: 3, opacity: c}}>YOUR COMMENTS DECIDE WHAT HAPPENS</div>
    </div>
  </AbsoluteFill>;
};
