import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font} from '../kit/theme';
import {clamp, ramp} from '../kit/world';

const pop = (f: number, at: number, fps: number, stiffness = 240, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});

// ---------- the receipt: one ledger, every day one line longer ----------
export type Entry = {got: string; paid: string; at: number; paidAt: number};

/**
 * Thermal receipt hanging from a printer slot. Lines print top-to-bottom in story order:
 * "YOU GOT" on the left, "PAID WITH" on the right in red. A line whose `at` has passed grows
 * in (paper feeding); its cost types in at `paidAt` and flashes. `spillAt` feeds a long tail
 * of paper off the bottom of the screen.
 */
export const Receipt: React.FC<{entries: Entry[]; day: string; at?: number; y?: number; spillAt?: number; extra?: React.ReactNode}> = ({entries, day, at = 0, y = 300, spillAt, extra}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const inP = pop(f, at, fps, 200, 22);
  const LH = 66;
  const spill = spillAt !== undefined ? interpolate(f, [spillAt, spillAt + 40], [0, 1400], {...clamp, easing: Easing.in(Easing.quad)}) : 0;
  const mono: React.CSSProperties = {fontFamily: font.mono, fontSize: 40, letterSpacing: 0};
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center',
    transform: `translateY(${(1 - inP) * -700}px)`}}>
    {/* printer slot */}
    <div style={{width: 920, height: 44, borderRadius: 12, background: '#1b1d24', border: '4px solid #33363f', boxShadow: '0 12px 30px rgba(0,0,0,0.6)', zIndex: 2}} />
    <div style={{width: 840, marginTop: -14, background: '#f4f1e8', color: '#24232a', padding: '30px 34px 0', boxShadow: '0 20px 60px rgba(0,0,0,0.55)', ...mono}}>
      <div style={{textAlign: 'center', fontWeight: 500, fontSize: 48, letterSpacing: 2}}>SOUL FOR SALE</div>
      <div style={{textAlign: 'center', color: '#6a6870', fontSize: 32, marginTop: 4}}>FREE TRIAL · {day}</div>
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#8a8890', fontSize: 30, marginTop: 18, borderBottom: '3px dashed #b8b4aa', paddingBottom: 8}}>
        <span>YOU GOT</span><span>PAID WITH</span>
      </div>
      {entries.filter((e) => f >= e.at).map((e, i) => {
        const g = ramp(f, e.at, 8);
        const pr = ramp(f, e.paidAt, 6);
        const shown = e.paid.slice(0, Math.round(pr * e.paid.length));
        const hot = f >= e.paidAt ? Math.max(0, 1 - (f - e.paidAt) / 16) : 0;
        return <div key={i} style={{height: LH * g, overflow: 'hidden'}}>
          <div style={{height: LH, display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{whiteSpace: 'nowrap'}}>{e.got}</span>
            <span style={{flex: 1, borderBottom: '3px dotted #b8b4aa', transform: 'translateY(6px)'}} />
            <span style={{whiteSpace: 'nowrap', color: '#c8202c', fontWeight: 500, background: `rgba(255,59,59,${hot * 0.35})`, padding: '0 6px',
              transform: `scale(${1 + hot * 0.25})`, transformOrigin: 'right center', display: 'inline-block'}}>{shown}</span>
          </div>
        </div>;
      })}
      {extra}
      <div style={{height: 30 + spill}} />
    </div>
    {/* torn zig-zag edge */}
    <div style={{width: 840, height: 18, background: 'linear-gradient(135deg, #f4f1e8 25%, transparent 25%) -9px 0/18px 18px, linear-gradient(225deg, #f4f1e8 25%, transparent 25%) -9px 0/18px 18px'}} />
  </div>;
};

/** The day-0 contract printed on the same receipt paper, with a signature that draws itself. */
export const Contract: React.FC<{at: number; signAt: number; y?: number}> = ({at, signAt, y = 300}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const inP = pop(f, at, fps, 200, 22);
  const sig = ramp(f, signAt, 14, Easing.inOut(Easing.quad));
  const row = (a: string, b?: string) => <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10}}><span>{a}</span>{b && <span>{b}</span>}</div>;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - inP) * 900}px) rotate(${(1 - inP) * -6}deg)`}}>
    <div style={{width: 840, background: '#f4f1e8', color: '#24232a', padding: '34px 44px 40px', fontFamily: font.mono, fontSize: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.6)'}}>
      <div style={{textAlign: 'center', fontSize: 42, letterSpacing: 2, fontWeight: 500}}>SOUL FOR SALE</div>
      <div style={{textAlign: 'center', color: '#6a6870', fontSize: 28}}>AISLE 6 · 02:41 AM</div>
      <div style={{borderBottom: '3px dashed #b8b4aa', margin: '16px 0 6px'}} />
      {row('1x SOUL', '(YOURS)')}
      {row('TERM', '7-DAY FREE TRIAL')}
      {row('PAYMENT', 'AS YOU GO')}
      <div style={{borderBottom: '3px dashed #b8b4aa', margin: '16px 0 0'}} />
      <div style={{position: 'relative', marginTop: 36, height: 90}}>
        <div style={{position: 'absolute', left: 0, bottom: 14, fontSize: 30, color: '#6a6870'}}>SIGN HERE ✕</div>
        <div style={{position: 'absolute', left: 200, right: 0, bottom: 14, borderBottom: '3px solid #24232a'}} />
        <svg width="420" height="90" viewBox="0 0 420 90" style={{position: 'absolute', left: 210, bottom: 10}}>
          <path d="M8 62 C 30 10, 52 10, 44 60 S 70 80, 92 34 S 120 20, 118 58 C 130 30, 160 24, 170 56 S 210 64, 230 30 C 240 60, 270 66, 300 40 S 360 30, 410 46"
            fill="none" stroke="#1f3fa8" strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - sig} />
        </svg>
      </div>
    </div>
  </div>;
};

// ---------- phone UI (generic social app, no real branding) ----------
export const Phone: React.FC<{children: React.ReactNode; at?: number; y?: number}> = ({children, at = 0, y = 300}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 220, 22);
  return <div style={{position: 'absolute', left: 150, right: 150, top: y, height: 820, borderRadius: 64, background: '#0f1014', border: '8px solid #24262e',
    padding: '56px 34px', fontFamily: font.ui, color: '#fff', transform: `translateY(${(1 - s) * 900}px)`, boxShadow: '0 0 120px rgba(160,215,255,0.25)', overflow: 'hidden'}}>
    {children}
  </div>;
};

const Avatar: React.FC<{c: string; size?: number}> = ({c, size = 64}) => <div style={{width: size, height: size, borderRadius: size / 2, background: c, flex: 'none'}} />;

/** The post, laugh counter, and comments. `typed` = how much of "Sign me up" is in the box. */
export const Post: React.FC<{laughFrom: number; typeFrom: number; typeTo: number; sendAt: number; extraAt?: number}> = ({laughFrom, typeFrom, typeTo, sendAt, extraAt}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const laughs = Math.round(interpolate(f, [laughFrom, laughFrom + 60], [2100, 10400], clamp));
  const msg = 'Sign me up';
  const typed = msg.slice(0, Math.round(interpolate(f, [typeFrom, typeTo], [0, msg.length], clamp)));
  const sent = f >= sendAt;
  const sp = pop(f, sendAt, fps, 300, 18);
  const ep = extraAt !== undefined ? pop(f, extraAt, fps, 300, 16) : 0;
  const comment = (name: string, text: string, c: string, s = 1, hl = false) => <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 22,
    transform: `scale(${0.7 + 0.3 * s})`, opacity: s, transformOrigin: 'left center', background: hl ? 'rgba(255,207,58,0.14)' : undefined, borderRadius: 18, padding: hl ? 10 : 0}}>
    <Avatar c={c} size={48} />
    <div><div style={{fontSize: 24, color: 'rgba(255,255,255,0.55)', fontWeight: 500}}>{name}</div><div style={{fontSize: 32, fontWeight: 500}}>{text}</div></div>
  </div>;
  return <>
    <div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
      <Avatar c="#3a1d24" /><div><div style={{fontWeight: 700, fontSize: 30}}>after_hours_deals</div><div style={{fontSize: 22, color: 'rgba(255,255,255,0.5)'}}>2h</div></div>
    </div>
    <div style={{marginTop: 26, fontSize: 46, fontWeight: 700, lineHeight: 1.15}}>Selling souls.<br />Serious offers only.</div>
    <div style={{marginTop: 18, fontSize: 26, color: color.keyYellow, fontWeight: 700}}>HA HA {(laughs / 1000).toFixed(1)}K · 812 comments</div>
    <div style={{borderTop: '2px solid #24262e', marginTop: 22}} />
    {comment('mike.d', 'my ex already took mine', '#4e5a3a')}
    {sent && comment('you', msg, '#6b7286', sp, true)}
    {extraAt !== undefined && f >= extraAt && comment('user_4471', 'lol sign me up', '#2f5c57', ep, true)}
    {!sent && <div style={{position: 'absolute', left: 34, right: 34, bottom: 46, height: 76, borderRadius: 38, background: '#1d1f26', display: 'flex', alignItems: 'center',
      padding: '0 26px', fontSize: 32}}>
      <span style={{color: typed ? '#fff' : 'rgba(255,255,255,0.35)'}}>{typed || 'Add a comment…'}</span>
      {typed && Math.floor(f / 8) % 2 === 0 && <span style={{width: 3, height: 36, background: '#fff', marginLeft: 3}} />}
      <span style={{marginLeft: 'auto', color: typed.length === msg.length ? '#2f7cf6' : 'rgba(255,255,255,0.3)', fontWeight: 700}}>Post</span>
    </div>}
  </>;
};

/** Day 3: the viral comment + a follower counter racing to 2M. */
export const Followers: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [from, to], [212, 2000000], {...clamp, easing: Easing.in(Easing.cubic)}));
  return <>
    <div style={{textAlign: 'center'}}><div style={{display: 'inline-block'}}><Avatar c="#6b7286" size={130} /></div></div>
    <div style={{textAlign: 'center', fontSize: 36, fontWeight: 700, marginTop: 14}}>you</div>
    <div style={{textAlign: 'center', fontFamily: font.caption, fontSize: 120, color: color.keyYellow, marginTop: 30, lineHeight: 1}}>{n.toLocaleString('en-US')}</div>
    <div style={{textAlign: 'center', fontSize: 30, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 3}}>FOLLOWERS</div>
    <div style={{marginTop: 50, background: '#1d1f26', borderRadius: 24, padding: '20px 26px'}}>
      <div style={{fontSize: 24, color: 'rgba(255,255,255,0.5)'}}>your comment · 31.6M views</div>
      <div style={{fontSize: 40, fontWeight: 700, marginTop: 6}}>“Sign me up”</div>
    </div>
  </>;
};

/** Day 3: calling Mom. */
export const Call: React.FC<{connectAt: number}> = ({connectAt}) => {
  const f = useCurrentFrame();
  const secs = Math.max(0, Math.floor((f - connectAt) / 30));
  return <div style={{textAlign: 'center', paddingTop: 60}}>
    <div style={{display: 'inline-block'}}><Avatar c="#8a5a6a" size={190} /></div>
    <div style={{fontSize: 64, fontWeight: 700, marginTop: 30}}>Mom</div>
    <div style={{fontSize: 30, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>{f < connectAt ? 'calling…' : `00:0${Math.min(9, secs)}`}</div>
  </div>;
};

/** Scratch card: the silver coating comes off in strips, revealing the prize. */
export const ScratchCard: React.FC<{at: number; scratchFrom: number; scratchTo: number; y?: number}> = ({at, scratchFrom, scratchTo, y = 380}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 220, 20);
  const n = 9;
  return <div style={{position: 'absolute', left: 170, right: 170, top: y, height: 470, borderRadius: 26, background: 'linear-gradient(160deg, #3d7bd6, #2a4f9a)',
    border: '6px solid #14151b', transform: `translateY(${(1 - s) * 900}px) rotate(${-3 + s * 2}deg)`, padding: 28, fontFamily: font.caption, color: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
    <div style={{fontSize: 70, textAlign: 'center', color: color.keyYellow, WebkitTextStroke: '6px #14151b', paintOrder: 'stroke fill'}}>LUCKY NIGHT</div>
    <div style={{position: 'relative', margin: '24px auto 0', width: 560, height: 230, borderRadius: 14, background: '#f4f1e8', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontSize: 150, color: '#1f7a3a'}}>$50,000</div>
      {Array.from({length: n}, (_, i) => {
        const p = ramp(f, scratchFrom + (scratchTo - scratchFrom) * (i / n), (scratchTo - scratchFrom) / n + 2);
        return <div key={i} style={{position: 'absolute', top: 0, bottom: 0, left: (560 / n) * i - 1, width: 560 / n + 2,
          background: 'repeating-linear-gradient(45deg, #a9aeb8 0 8px, #c3c8d1 8px 16px)', opacity: 1 - p,
          clipPath: `inset(${p * 100}% 0 0 0)`}} />;
      })}
    </div>
  </div>;
};

/** Close-up card for an envelope or a note. */
export const Card: React.FC<{at: number; tone: 'cream' | 'black'; children: React.ReactNode; y?: number}> = ({at, tone, children, y = 380}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 220, 20);
  const bg = tone === 'cream' ? '#e8dcc0' : '#1c1a20';
  return <div style={{position: 'absolute', left: 150, right: 150, top: y, height: 470, background: bg, border: '6px solid #14151b', borderRadius: 10,
    transform: `scale(${0.6 + 0.4 * s})`, opacity: s, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden'}}>
    {tone === 'cream' && <><svg width="100%" height="100%" viewBox="0 0 780 470" preserveAspectRatio="none" style={{position: 'absolute', inset: 0}}>
      <path d="M0 0 L390 250 L780 0" fill="none" stroke="#b8a988" strokeWidth="6" />
    </svg>
    <div style={{position: 'absolute', left: 365, top: 225, width: 50, height: 50, borderRadius: 25, background: '#c8323c'}} /></>}
    <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', ...(tone === 'cream' ? {bottom: 50} : {top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'})}}>{children}</div>
  </div>;
};

export const DayCard: React.FC<{at: number; day: number; dur?: number}> = ({at, day, dur = 28}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at || f > at + dur + 8) return null;
  const s = pop(f, at, fps, 260, 16);
  const out = interpolate(f, [at + dur, at + dur + 8], [1, 0], clamp);
  return <AbsoluteFill style={{alignItems: 'center', top: 330, pointerEvents: 'none'}}>
    <div style={{transform: `scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 2) * out, background: 'rgba(8,9,13,0.9)', padding: '18px 48px 10px', borderRadius: 14,
      border: `3px solid ${color.alertRed}`, textAlign: 'center'}}>
      <div style={{fontFamily: font.caption, fontSize: 120, color: '#fff', lineHeight: 1}}>DAY {day}</div>
      <div style={{fontFamily: font.pixel, fontSize: 24, color: color.keyRed, marginTop: 6, letterSpacing: 3}}>OF YOUR FREE TRIAL</div>
    </div>
  </AbsoluteFill>;
};
