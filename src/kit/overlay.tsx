import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {caption, color, font, timing, H} from './theme';
import {clamp, ramp} from './world';

// ---------- word-append captions ----------
export type Word = {t: string; s: number; e?: number; key?: 'y' | 'r' | 'g' | boolean; brk?: boolean};
export type Phrase = {start: number; end: number; words: Word[]};

export const phrasesFrom = (words: Word[], hold = 0.6, maxEnd?: number): Phrase[] => {
  const out: Phrase[] = []; let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    if (w.brk || i === words.length - 1) {
      const next = words[i + 1];
      out.push({start: cur[0].s - 0.03, end: next ? next.s - 0.03 : Math.min(maxEnd ?? 1e9, (w.e ?? w.s) + hold), words: cur});
      cur = [];
    }
  });
  return out;
};

/**
 * Caption: words APPEAR as spoken (no dim preview), each popping 1.35 -> 1 in 4
 * frames. Heavy condensed caps, white with a thick dark stroke; keywords yellow
 * (neutral emphasis) or red (danger). Phrase cuts off instantly when the next starts.
 */
export const WordCaption: React.FC<{phrases: Phrase[]; centerY?: number; size?: number}> = ({phrases, centerY = caption.centerY, size = caption.size}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = f / fps;
  const ph = phrases.find((p) => t >= p.start && t < p.end);
  if (!ph) return null;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: centerY * H - H / 2, pointerEvents: 'none'}}>
    <div style={{maxWidth: caption.maxWidth, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.24em', rowGap: 0,
      fontFamily: font.caption, fontSize: size, lineHeight: 1.04, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1}}>
      {ph.words.map((w, i) => {
        const wf = Math.round(w.s * fps);
        if (f < wf) return null;
        const p = ramp(f, wf, timing.wordPop, Easing.out(Easing.back(2.2)));
        const c = w.key === 'r' ? color.keyRed : w.key === 'g' ? color.keyGreen : w.key ? color.keyYellow : color.white;
        return <span key={i} style={{display: 'inline-block', color: c, transform: `scale(${1.35 - 0.35 * p})`, opacity: Math.min(1, (f - wf + 1) / 2),
          WebkitTextStroke: `${caption.stroke}px ${color.ink}`, paintOrder: 'stroke fill',
          filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.55))'}}>{w.t}</span>;
      })}
    </div>
  </AbsoluteFill>;
};

// ---------- HUD ----------
export type Chip = {label: string; value: string; tone?: 'ok' | 'warn' | 'bad'; from?: number; changedAt?: number};
export const Hud: React.FC<{series: string; part: string; status: string; chips?: Chip[]; statusChangedAt?: number}> = ({series, part, status, chips = [], statusChangedAt}) => {
  const f = useCurrentFrame();
  const sc = statusChangedAt !== undefined ? Math.max(0, 1 - (f - statusChangedAt) / 10) : 0;
  return <div style={{position: 'absolute', left: 52, top: 120, fontFamily: font.pixel}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{background: color.alertRed, color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 14px 4px', borderRadius: 6, letterSpacing: 1}}>{series}</div>
      <div style={{color: color.keyYellow, fontSize: 24, fontWeight: 700}}>{part}</div>
    </div>
    <div style={{marginTop: 12, color: '#fff', fontSize: 26, letterSpacing: 1, textShadow: `0 0 ${sc * 18}px ${color.keyRed}`}}>{status}</div>
    <div style={{marginTop: 12, display: 'flex', gap: 10}}>
      {chips.filter((c) => c.from === undefined || f >= c.from).map((c, i) => {
        const inP = c.from !== undefined ? ramp(f, c.from, 6) : 1;
        const hot = c.changedAt !== undefined ? Math.max(0, 1 - (f - c.changedAt) / 14) * (f >= c.changedAt ? 1 : 0) : 0;
        const tone = c.tone === 'bad' ? color.keyRed : c.tone === 'warn' ? color.keyYellow : '#9fd8ff';
        return <div key={i} style={{background: color.hudChip, border: `2px solid ${hot > 0 ? tone : color.hudChipBorder}`, borderRadius: 6,
          padding: '6px 12px 4px', fontSize: 22, color: 'rgba(255,255,255,0.75)', opacity: inP, transform: `translateY(${(1 - inP) * -8}px) scale(${1 + hot * 0.12})`}}>
          {c.label} <span style={{color: tone}}>{c.value}</span>
        </div>;
      })}
    </div>
  </div>;
};

// ---------- phone alert card (generic, not any real OS) ----------
export const AlertCard: React.FC<{at: number; title: string; body: string; sub?: string; y?: number}> = ({at, title, body, sub, y = 1340}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {stiffness: 220, damping: 20}});
  const shake = Math.sin((f - at) * 3) * Math.max(0, 1 - (f - at) / 12) * 10;
  return <div style={{position: 'absolute', left: 90, right: 90, top: y + (1 - s) * 500 , transform: `translateX(${shake}px)`, opacity: Math.min(1, s * 1.5),
    background: 'rgba(28,29,36,0.96)', borderRadius: 36, padding: '30px 36px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', fontFamily: font.ui, color: '#fff'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, color: color.alertRed, fontWeight: 700, fontSize: 30, letterSpacing: 1}}>
      <svg width="40" height="36" viewBox="0 0 40 36"><path d="M20 2 L38 34 H2 Z" fill={color.alertRed} /><rect x="18" y="12" width="4" height="12" fill="#fff" /><rect x="18" y="27" width="4" height="4" fill="#fff" /></svg>
      {title}<span style={{marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 24}}>now</span>
    </div>
    <div style={{marginTop: 14, fontSize: 40, fontWeight: 700}}>{body}</div>
    {sub && <div style={{marginTop: 8, fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: 500}}>{sub}</div>}
  </div>;
};

/** Chat bubbles (incoming grey / outgoing blue), each pops in at its frame. */
export const Chat: React.FC<{name: string; msgs: {at: number; text: string; out?: boolean; failed?: boolean}[]}> = ({name, msgs}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 170, right: 170, top: 380, height: 1000, borderRadius: 70, background: '#121318', border: '6px solid #24262e', fontFamily: font.ui, padding: '60px 34px'}}>
    <div style={{textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 34}}>{name}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40}}>
      {msgs.filter((m) => f >= m.at).map((m, i) => {
        const s = spring({frame: f - m.at, fps, config: {stiffness: 260, damping: 18}});
        return <div key={i} style={{alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth: '78%', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: m.out ? 'right' : 'left', opacity: s}}>
          <div style={{background: m.out ? '#2f7cf6' : '#2c2e36', color: '#fff', borderRadius: 28, padding: '16px 24px', fontSize: 32, fontWeight: 500}}>{m.text}</div>
          {m.failed && <div style={{textAlign: 'right', color: color.keyRed, fontSize: 22, marginTop: 6}}>Not Delivered ⓘ</div>}
        </div>;
      })}
    </div>
  </div>;
};

/** Big time / day card that drops in (e.g. "5:40 AM"). */
export const TimeCard: React.FC<{at: number; big: string; small?: string; y?: number}> = ({at, big, small, y = 520}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {stiffness: 200, damping: 14}});
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2)}}>
    <div style={{background: 'rgba(8,9,13,0.92)', padding: '20px 44px 16px', borderRadius: 14, textAlign: 'center'}}>
      <div style={{fontFamily: font.caption, fontSize: 130, color: '#fff', lineHeight: 1}}>{big}</div>
      {small && <div style={{fontFamily: font.pixel, fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 8}}>{small}</div>}
    </div>
  </div>;
};

/** Ending choice: headline, then two pills pop in sequence. */
export const Choice: React.FC<{at: number; title: string; a: string; b: string; aAt?: number; bAt?: number; y?: number}> = ({at, title, a, b, aAt = 8, bAt = 16, y = 760}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const pop = (d: number) => spring({frame: f - at - d, fps, config: {stiffness: 300, damping: 14}});
  const pill = (txt: string, bg: string, d: number, fg: string) => {
    const s = f >= at + d ? pop(d) : 0;
    return <div style={{transform: `scale(${s})`, background: bg, color: fg, fontFamily: font.caption, fontSize: 96, padding: '14px 70px 10px', borderRadius: 90, boxShadow: `0 0 40px ${bg}66`}}>{txt}</div>;
  };
  const tp = pop(0);
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 140, color: '#fff', transform: `scale(${0.7 + 0.3 * tp})`, opacity: tp, WebkitTextStroke: `12px ${color.ink}`, paintOrder: 'stroke fill'}}>{title}</div>
    <div style={{display: 'flex', gap: 46, marginTop: 50}}>{pill(a, color.keyYellow, aAt, '#111')}{pill(b, color.alertRed, bAt, '#fff')}</div>
  </AbsoluteFill>;
};
