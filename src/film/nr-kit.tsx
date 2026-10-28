import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font, timing} from '../kit/theme';
import {clamp, ramp} from '../kit/world';
import {Phrase} from '../kit/overlay';

// NIGHT ROAD runs landscape: stage 240x135 art px at 8x = 1920x1080.
export const LW = 1920, LH = 1080, LART_W = 240, LART_H = 135, LPX = 8;

const pop = (f: number, at: number, fps: number, stiffness = 240, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});
const stroke = (px: number) => ({WebkitTextStroke: `${px}px ${color.ink}`, paintOrder: 'stroke fill'} as const);

/** Landscape World: same contract as kit World (art-px children, smooth camera), centred on 960x540. */
export const WorldL: React.FC<{cam: {x: number; y: number; zoom: number}; children: React.ReactNode; shake?: number}> = ({cam, children, shake = 0}) => {
  const f = useCurrentFrame();
  const sx = shake ? Math.sin(f * 2.7) * shake : 0, sy = shake ? Math.cos(f * 3.3) * shake * 0.6 : 0;
  const s = LPX * cam.zoom;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: LART_W, height: LART_H, transformOrigin: '0 0',
      transform: `translate(${LW / 2 - (cam.x + sx) * s}px, ${LH / 2 - (cam.y + sy) * s}px) scale(${s})`}}>{children}</div>
  </AbsoluteFill>;
};

export const SetL: React.FC<{src: string; x?: number; y?: number; w?: number; flip?: boolean; style?: React.CSSProperties}> = ({src, x = 0, y = 0, w = LART_W, flip, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: x, top: y, width: w, height: LART_H, imageRendering: 'pixelated', maxWidth: 'none',
    transform: flip ? 'scaleX(-1)' : undefined, ...style}} />
);

/** Everything dark except an elliptical pool of light (art px). Used to read the card by whatever light there is. */
export const LightMask: React.FC<{x: number; y: number; rx: number; ry: number; dark?: number; soft?: number}> = ({x, y, rx, ry, dark = 0.94, soft = 0.45}) => (
  <div style={{position: 'absolute', inset: 0, background: `rgba(3,4,8,${dark})`, pointerEvents: 'none',
    WebkitMaskImage: `radial-gradient(${rx}px ${ry}px at ${x}px ${y}px, transparent ${(1 - soft) * 100}%, black 100%)`,
    maskImage: `radial-gradient(${rx}px ${ry}px at ${x}px ${y}px, transparent ${(1 - soft) * 100}%, black 100%)`}} />
);

// ---------- captions ----------
export const CaptionL: React.FC<{phrases: Phrase[]; y?: number; size?: number}> = ({phrases, y = 905, size = 76}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = f / fps;
  const ph = phrases.find((p) => t >= p.start && t < p.end);
  if (!ph) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.6, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
    <div style={{maxWidth: 1500, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.24em', fontFamily: font.caption, fontSize: size,
      lineHeight: 1.04, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1}}>
      {ph.words.map((w, i) => {
        const wf = Math.round(w.s * fps);
        if (f < wf) return null;
        const p = ramp(f, wf, timing.wordPop, Easing.out(Easing.back(2.2)));
        const c = w.key === 'r' ? color.keyRed : w.key === 'g' ? color.keyGreen : w.key ? color.keyYellow : color.white;
        return <span key={i} style={{display: 'inline-block', color: c, transform: `scale(${1.35 - 0.35 * p})`, opacity: Math.min(1, (f - wf + 1) / 2),
          ...stroke(12), filter: 'drop-shadow(0 5px 0 rgba(0,0,0,0.55))'}}>{w.t}</span>;
      })}
    </div>
  </div>;
};

// ---------- HUD ----------
export type ChipL = {label: string; value: string; tone?: 'ok' | 'warn' | 'bad'; changedAt?: number};
export const HudL: React.FC<{series: string; clock: string; status: string; chips?: ChipL[]; changedAt?: number}> = ({series, clock, status, chips = [], changedAt}) => {
  const f = useCurrentFrame();
  const sc = changedAt !== undefined ? Math.max(0, 1 - (f - changedAt) / 10) * (f >= changedAt ? 1 : 0) : 0;
  return <div style={{position: 'absolute', left: 48, top: 40, fontFamily: font.pixel}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{background: color.alertRed, color: '#fff', fontSize: 24, fontWeight: 700, padding: '5px 12px 3px', borderRadius: 6, letterSpacing: 1}}>{series}</div>
      <div style={{color: color.keyYellow, fontSize: 24, fontWeight: 700}}>{clock}</div>
    </div>
    <div style={{marginTop: 10, color: '#fff', fontSize: 22, letterSpacing: 1, textShadow: `0 0 ${sc * 18}px ${color.keyRed}`}}>{status}</div>
    <div style={{marginTop: 10, display: 'flex', gap: 10}}>
      {chips.map((c, i) => {
        const hot = c.changedAt !== undefined && f >= c.changedAt ? Math.max(0, 1 - (f - c.changedAt) / 14) : 0;
        const tone = c.tone === 'bad' ? color.keyRed : c.tone === 'warn' ? color.keyYellow : '#9fd8ff';
        return <div key={i} style={{background: color.hudChip, border: `2px solid ${hot > 0 ? tone : color.hudChipBorder}`, borderRadius: 6,
          padding: '5px 10px 3px', fontSize: 19, color: 'rgba(255,255,255,0.75)', transform: `scale(${1 + hot * 0.12})`}}>{c.label} <span style={{color: tone}}>{c.value}</span></div>;
      })}
    </div>
  </div>;
};

/** SEEN meter (top right): how visible you are. Rises with any light on or near you. */
export const SeenMeter: React.FC<{level: number; show?: number}> = ({level, show = 1}) => {
  const n = 14, lit = Math.round(Math.max(0, Math.min(1, level)) * n);
  return <div style={{position: 'absolute', right: 48, top: 40, display: 'flex', alignItems: 'center', gap: 12, fontFamily: font.pixel, opacity: show,
    transform: `translateY(${(1 - show) * -12}px)`}}>
    <div style={{fontSize: 22, color: level > 0.7 ? color.keyRed : 'rgba(255,255,255,0.75)', letterSpacing: 2}}>SEEN</div>
    <div style={{display: 'flex', gap: 3, background: color.hudChip, border: `2px solid ${color.hudChipBorder}`, borderRadius: 6, padding: 5}}>
      {Array.from({length: n}, (_, i) => {
        const c = i < 7 ? '#5fd38a' : i < 11 ? color.keyYellow : color.keyRed;
        return <div key={i} style={{width: 13, height: 22, borderRadius: 2, background: i < lit ? c : 'rgba(255,255,255,0.08)',
          boxShadow: i < lit && i >= 11 ? `0 0 10px ${color.keyRed}` : undefined}} />;
      })}
    </div>
  </div>;
};

// ---------- cards ----------
export const RuleCardL: React.FC<{at: number; n: number; title: string; sub: string; y?: number; out?: number}> = ({at, n, title, sub, y = 70, out}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 260, 16), s2 = pop(f, at + 6, fps, 260, 18);
  const o = out !== undefined ? interpolate(f, [out, out + 6], [1, 0], clamp) : 1;
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none', opacity: o}}>
    <div style={{background: color.alertRed, color: '#fff', fontFamily: font.caption, fontSize: 46, padding: '4px 20px 0', borderRadius: 6, transform: `scale(${s})`, letterSpacing: 2}}>RULE #{n}</div>
    <div style={{marginTop: 14, fontFamily: font.caption, fontSize: 100, color: '#fff', lineHeight: 1, textAlign: 'center', maxWidth: 1600,
      transform: `scale(${0.7 + 0.3 * s})`, opacity: s, ...stroke(10)}}>{title}</div>
    <div style={{width: 700 * s, height: 7, background: color.alertRed, marginTop: 12, borderRadius: 4}} />
    <div style={{marginTop: 12, fontFamily: font.caption, fontSize: 56, color: color.keyRed, opacity: s2, transform: `translateY(${(1 - s2) * 16}px)`, ...stroke(8), letterSpacing: 1}}>{sub}</div>
  </AbsoluteFill>;
};

export const TitleL: React.FC<{at: number; dur?: number; title: string; clock: string; hold?: boolean; follow?: string}> = ({at, dur = 54, title, clock, hold, follow}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at || (!hold && f > at + dur + 8)) return null;
  const s = pop(f, at, fps, 200, 16);
  const o = hold ? 1 : interpolate(f, [at + dur, at + dur + 8], [1, 0], clamp);
  const fp = follow ? pop(f, at + 16, fps, 300, 14) : 0;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: o}}>
    <div style={{textAlign: 'center', transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 2)}}>
      <div style={{fontFamily: font.caption, fontSize: 230, color: '#fff', lineHeight: 0.95, letterSpacing: 4, ...stroke(14)}}>{title}</div>
      <div style={{fontFamily: font.pixel, fontSize: 40, color: 'rgba(255,255,255,0.8)', letterSpacing: 6, marginTop: 14}}>{clock}</div>
      {follow && <div style={{display: 'inline-block', marginTop: 40, background: color.alertRed, color: '#fff', fontFamily: font.pixel, fontWeight: 700, fontSize: 30,
        padding: '12px 28px 8px', borderRadius: 40, transform: `scale(${fp})`, letterSpacing: 2}}>{follow}</div>}
    </div>
  </AbsoluteFill>;
};

export const QuestionL: React.FC<{at: number; l1: string; l2: string}> = ({at, l1, l2}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const p = (d: number) => pop(f, at + d, fps, 300, 14);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 150, color: '#fff', lineHeight: 1, transform: `scale(${0.7 + 0.3 * p(0)})`, opacity: p(0), ...stroke(12)}}>{l1}</div>
    <div style={{fontFamily: font.caption, fontSize: 150, color: color.keyRed, lineHeight: 1.05, opacity: p(5), ...stroke(12)}}>{l2}</div>
    <div style={{marginTop: 40, fontFamily: font.pixel, fontSize: 34, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, opacity: p(16)}}>COMMENT BELOW ↓</div>
  </AbsoluteFill>;
};

/** Big red countdown (the dome light's fade). */
export const Countdown: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 6) return null;
  const left = Math.max(0, 10 * (1 - (f - from) / (to - from)));
  const n = Math.ceil(left);
  const local = (left % 1);
  return <div style={{position: 'absolute', right: 90, top: 330, fontFamily: font.caption, fontSize: 260, color: color.keyRed, ...stroke(14),
    transform: `scale(${1 + 0.12 * local})`, opacity: f > to ? 1 - (f - to) / 6 : 1, textShadow: '0 0 40px rgba(255,45,61,0.5)'}}>{n}</div>;
};

// ---------- phone (generic UI, no real OS) ----------
export const PhoneL: React.FC<{at?: number; x?: number; children: React.ReactNode; tint?: string}> = ({at = 0, x = 1250, children, tint}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 200, 20);
  return <div style={{position: 'absolute', left: x, top: 60 + (1 - s) * 700, width: 470, height: 960, borderRadius: 64, background: '#0d0e12', border: '10px solid #23252d',
    boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 120px ${tint ?? 'rgba(120,180,255,0.18)'}`, overflow: 'hidden', fontFamily: font.ui, color: '#fff'}}>
    <div style={{position: 'absolute', left: '50%', top: 18, width: 120, height: 30, borderRadius: 15, background: '#000', transform: 'translateX(-50%)'}} />
    <div style={{position: 'absolute', inset: '70px 30px 30px'}}>{children}</div>
  </div>;
};

/** Search on the phone: query types in, then the answer card. */
export const SearchScreen: React.FC<{typeFrom: number; answerAt: number; q: string}> = ({typeFrom, answerAt, q}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const n = Math.max(0, Math.min(q.length, Math.floor((f - typeFrom) * 1.6)));
  const s = pop(f, answerAt, fps, 260, 20);
  return <>
    <div style={{background: '#1c1d23', borderRadius: 30, padding: '18px 22px', fontSize: 25, color: '#e8e8ea', minHeight: 70}}>{q.slice(0, n)}<span style={{opacity: Math.floor(f / 8) % 2}}>|</span></div>
    <div style={{marginTop: 30, background: '#16171c', borderRadius: 24, padding: 26, opacity: s, transform: `translateY(${(1 - s) * 30}px)`}}>
      <div style={{fontSize: 22, color: 'rgba(255,255,255,0.5)'}}>Answer</div>
      <div style={{fontSize: 64, fontWeight: 700, color: '#5fd38a', marginTop: 6}}>No.</div>
      <div style={{fontSize: 27, lineHeight: 1.35, marginTop: 10, color: 'rgba(255,255,255,0.85)'}}>No state law bans driving with the inside light on. Most people heard it from a parent.</div>
    </div>
  </>;
};

/** Map: highway goes red (crash), then the reroute down the empty county road. */
export const MapScreen: React.FC<{redAt: number; rerouteAt: number; emptyAt?: number}> = ({redAt, rerouteAt, emptyAt = 1e9}) => {
  const f = useCurrentFrame();
  const red = ramp(f, redAt, 10), rr = ramp(f, rerouteAt, 30);
  return <>
    <svg width="410" height="760" viewBox="0 0 410 760" style={{position: 'absolute', left: 0, top: 0}}>
      <rect width="410" height="760" fill="#14161b" />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M0 ${i * 60 + 20} L410 ${i * 60 - 30}`} stroke="#1a1c22" strokeWidth="2" />)}
      <path d="M60 760 C 90 560, 120 420, 140 300 S 200 80, 230 0" stroke={`rgb(${70 + 185 * red}, ${130 - 80 * red}, ${230 - 170 * red})`} strokeWidth="12" fill="none" />
      {red > 0 && <g transform="translate(130 360)" opacity={red}><circle r="22" fill="#ff3b3b" /><text x="0" y="9" textAnchor="middle" fontSize="28" fontWeight="700" fill="#fff">!</text></g>}
      <path d="M60 760 C 200 640, 360 520, 330 300 S 300 80, 230 0" stroke="#5fa8ff" strokeWidth="10" fill="none" strokeDasharray="1400" strokeDashoffset={1400 * (1 - rr)} strokeLinecap="round" />
      <circle cx="60" cy="740" r="14" fill="#5fa8ff" stroke="#fff" strokeWidth="4" />
    </svg>
    <div style={{position: 'absolute', left: 14, right: 14, top: 14, background: 'rgba(22,23,28,0.95)', borderRadius: 22, padding: '16px 20px'}}>
      {f < rerouteAt ? <><div style={{fontSize: 22, color: color.keyRed, fontWeight: 700, opacity: red}}>Crash · both lanes closed</div>
        <div style={{fontSize: 30, fontWeight: 700}}>I-80 East</div></>
        : <><div style={{fontSize: 22, color: '#5fa8ff', fontWeight: 700}}>Rerouting…</div><div style={{fontSize: 30, fontWeight: 700}}>Route 9 · 40 mi</div></>}
    </div>
    {f >= emptyAt && <div style={{position: 'absolute', left: 14, right: 14, bottom: 14, background: 'rgba(22,23,28,0.95)', borderRadius: 22, padding: '14px 20px', fontSize: 24,
      color: 'rgba(255,255,255,0.7)', opacity: ramp(f, emptyAt, 8)}}>No services for 40 mi</div>}
  </>;
};

/** Lock screen with one notification. */
export const LockScreen: React.FC<{clock: string; at: number; from: string; text: string}> = ({clock, at, from, text}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 260, 18);
  return <>
    <div style={{textAlign: 'center', fontSize: 110, fontWeight: 700, marginTop: 40}}>{clock}</div>
    <div style={{marginTop: 50, background: 'rgba(40,42,50,0.95)', borderRadius: 26, padding: '20px 24px', opacity: s, transform: `scale(${0.85 + 0.15 * s})`}}>
      <div style={{fontSize: 22, color: 'rgba(255,255,255,0.55)'}}>Messages · now</div>
      <div style={{fontSize: 30, fontWeight: 700, marginTop: 6}}>{from}</div>
      <div style={{fontSize: 28, marginTop: 4}}>{text}</div>
    </div>
  </>;
};
