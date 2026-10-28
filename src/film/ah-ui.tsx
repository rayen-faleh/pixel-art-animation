import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font} from '../kit/theme';
import {clamp} from '../kit/world';

const pop = (f: number, at: number, fps: number, stiffness = 240, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});

/** Rule card: red "RULE #n" tag, big white title with a red underline, red reason line. */
export const RuleCard: React.FC<{at: number; n: number; title: string; sub: string; y?: number; out?: number}> = ({at, n, title, sub, y = 380, out}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 260, 16), s2 = pop(f, at + 6, fps, 260, 18);
  const o = out !== undefined ? interpolate(f, [out, out + 6], [1, 0], clamp) : 1;
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none', opacity: o}}>
    <div style={{background: color.alertRed, color: '#fff', fontFamily: font.caption, fontSize: 52, padding: '6px 22px 2px', borderRadius: 6,
      transform: `scale(${s})`, letterSpacing: 2}}>RULE #{n}</div>
    <div style={{marginTop: 22, fontFamily: font.caption, fontSize: 112, color: '#fff', lineHeight: 1, textAlign: 'center', maxWidth: 1000,
      transform: `scale(${0.7 + 0.3 * s})`, opacity: s, WebkitTextStroke: `10px ${color.ink}`, paintOrder: 'stroke fill'}}>{title}</div>
    <div style={{width: 760 * s, height: 8, background: color.alertRed, marginTop: 14, borderRadius: 4}} />
    <div style={{marginTop: 18, fontFamily: font.caption, fontSize: 64, color: color.keyRed, opacity: s2, transform: `translateY(${(1 - s2) * 20}px)`,
      WebkitTextStroke: `8px ${color.ink}`, paintOrder: 'stroke fill', letterSpacing: 1}}>{sub}</div>
  </AbsoluteFill>;
};

/** Series card: used as the title over the opening shot and as the end card on black. */
export const SeriesCard: React.FC<{at: number; dur?: number; series: string; day: string; clock: string; follow?: boolean; hold?: boolean}> = ({at, dur = 48, series, day, clock, follow, hold}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at || (!hold && f > at + dur + 8)) return null;
  const s = pop(f, at, fps, 200, 16);
  const o = hold ? 1 : interpolate(f, [at + dur, at + dur + 8], [1, 0], clamp);
  const fp = follow ? pop(f, at + 14, fps, 300, 14) : 0;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: o}}>
    <div style={{textAlign: 'center', transform: `scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 2)}}>
      <div style={{fontFamily: font.caption, fontSize: 84, color: 'rgba(255,255,255,0.85)', letterSpacing: 8, WebkitTextStroke: `8px ${color.ink}`, paintOrder: 'stroke fill'}}>{series}</div>
      <div style={{fontFamily: font.caption, fontSize: 300, color: '#fff', lineHeight: 0.95, WebkitTextStroke: `14px ${color.ink}`, paintOrder: 'stroke fill'}}>{day}</div>
      <div style={{fontFamily: font.pixel, fontSize: 44, color: 'rgba(255,255,255,0.75)', letterSpacing: 6, marginTop: 10}}>{clock}</div>
      {follow && <div style={{display: 'inline-block', marginTop: 46, background: color.alertRed, color: '#fff', fontFamily: font.pixel, fontWeight: 700, fontSize: 32,
        padding: '14px 30px 10px', borderRadius: 40, transform: `scale(${fp})`, letterSpacing: 2}}>FOLLOW FOR PART 2</div>}
    </div>
  </AbsoluteFill>;
};

/** Emergency alert on the phone: header, then each line appears when it is read. Generic UI. */
export const AlertScreen: React.FC<{clock: string; lines: {at: number; text: string; red?: boolean}[]; at: number}> = ({clock, lines, at}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 260, 18);
  const shake = Math.sin((f - at) * 3) * Math.max(0, 1 - (f - at) / 14) * 12;
  return <>
    <div style={{textAlign: 'center', fontSize: 150, fontWeight: 700, letterSpacing: -2, marginTop: 30}}>{clock}</div>
    <div style={{textAlign: 'center', fontSize: 30, color: 'rgba(255,255,255,0.6)'}}>Tuesday, December 9</div>
    <div style={{marginTop: 60, background: '#f4f1e8', color: '#14151b', borderRadius: 30, padding: '28px 32px', transform: `scale(${0.8 + 0.2 * s}) translateX(${shake}px)`,
      opacity: s, border: `5px solid ${color.alertRed}`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, color: color.alertRed, fontWeight: 700, fontSize: 32, letterSpacing: 1}}>
        <svg width="40" height="36" viewBox="0 0 40 36"><path d="M20 2 L38 34 H2 Z" fill={color.alertRed} /><rect x="18" y="12" width="4" height="12" fill="#fff" /><rect x="18" y="27" width="4" height="4" fill="#fff" /></svg>
        EMERGENCY ALERT
      </div>
      {lines.filter((l) => f >= l.at).map((l, i) => <div key={i} style={{marginTop: 16, fontSize: 42, fontWeight: 700, lineHeight: 1.15,
        color: l.red ? color.alertRed : '#14151b', opacity: Math.min(1, (f - l.at) / 4)}}>{l.text}</div>)}
    </div>
  </>;
};

/** Incoming call: ringing rings around the avatar; decline turns it into "Call declined". */
export const IncomingCall: React.FC<{name: string; declineAt?: number}> = ({name, declineAt}) => {
  const f = useCurrentFrame();
  const declined = declineAt !== undefined && f >= declineAt;
  const ring = (k: number) => {
    const p = ((f + k * 12) % 36) / 36;
    return declined ? null : <div key={k} style={{position: 'absolute', left: '50%', top: 95, width: 190 + p * 220, height: 190 + p * 220, borderRadius: '50%',
      border: '4px solid rgba(95,211,138,0.6)', transform: 'translate(-50%, -50%)', opacity: 1 - p}} />;
  };
  return <div style={{position: 'relative', textAlign: 'center', paddingTop: 0, height: '100%'}}>
    {[0, 1, 2].map(ring)}
    <div style={{display: 'inline-block', width: 190, height: 190, borderRadius: 95, background: '#8a5a6a', position: 'relative'}} />
    <div style={{fontSize: 72, fontWeight: 700, marginTop: 30}}>{name}</div>
    <div style={{fontSize: 32, color: declined ? color.keyRed : 'rgba(255,255,255,0.6)', marginTop: 8}}>{declined ? 'Call declined' : 'incoming call… mobile'}</div>
    <div style={{position: 'absolute', left: 40, right: 40, bottom: 40, display: 'flex', justifyContent: 'space-between', opacity: declined ? 0.3 : 1}}>
      {[['#ff3b3b', 'Decline'], ['#5fd38a', 'Accept']].map(([c, l]) => <div key={l} style={{textAlign: 'center'}}>
        <div style={{width: 130, height: 130, borderRadius: 65, background: c, margin: '0 auto', transform: l === 'Decline' && declineAt !== undefined && f >= declineAt - 4 && !declined ? 'scale(0.85)' : undefined}} />
        <div style={{fontSize: 26, marginTop: 10, color: 'rgba(255,255,255,0.7)'}}>{l}</div>
      </div>)}
    </div>
  </div>;
};

/** Text thread inside <Phone>: header name + bubbles that pop in at their frames. */
export const Thread: React.FC<{name: string; sub?: string; msgs: {at: number; text: string; out?: boolean; time?: string; hl?: boolean}[]}> = ({name, sub, msgs}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <>
    <div style={{textAlign: 'center'}}>
      <div style={{display: 'inline-block', width: 96, height: 96, borderRadius: 48, background: name === 'Mom' ? '#8a5a6a' : '#3d7bd6'}} />
      <div style={{fontSize: 40, fontWeight: 700, marginTop: 10}}>{name}</div>
      {sub && <div style={{fontSize: 24, color: 'rgba(255,255,255,0.5)'}}>{sub}</div>}
    </div>
    <div style={{borderTop: '2px solid #24262e', marginTop: 22}} />
    <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 30}}>
      {msgs.filter((m) => f >= m.at).map((m, i) => {
        const s = pop(f, m.at, fps, 300, 16);
        return <div key={i} style={{alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth: '82%', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: m.out ? 'right' : 'left', opacity: s}}>
          {m.time && <div style={{fontSize: 22, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textAlign: m.out ? 'right' : 'left'}}>{m.time}</div>}
          <div style={{background: m.out ? '#2f7cf6' : '#2c2e36', color: '#fff', borderRadius: 30, padding: '18px 26px', fontSize: 40, fontWeight: 500,
            boxShadow: m.hl ? `0 0 0 4px ${color.keyYellow}` : undefined}}>{m.text}</div>
        </div>;
      })}
    </div>
  </>;
};

/** Looking through the door's wired-glass window: everything outside the pane is door. */
export const DoorPane: React.FC<{x?: number; y?: number; w?: number; h?: number}> = ({x = 250, y = 420, w = 580, h = 760}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxShadow: '0 0 0 3000px #3a281c', border: '22px solid #2a2d36', boxSizing: 'border-box'}} />
    <div style={{position: 'absolute', left: x + 22, top: y + 22, width: w - 44, height: h - 44,
      background: 'repeating-linear-gradient(45deg, rgba(154,160,180,0.22) 0 3px, transparent 3px 46px), repeating-linear-gradient(-45deg, rgba(154,160,180,0.22) 0 3px, transparent 3px 46px)'}} />
    <div style={{position: 'absolute', left: x + 22, top: y + 22, width: w - 44, height: h - 44, background: 'linear-gradient(160deg, rgba(255,255,255,0.08), transparent 40%)'}} />
  </AbsoluteFill>
);

/** Ending question with two stacked pills and a comment prompt. */
export const Question: React.FC<{at: number; l1: string; l2: string; a: string; b: string; aAt?: number; bAt?: number; y?: number}> = ({at, l1, l2, a, b, aAt = 10, bAt = 18, y = 520}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const p = (d: number) => pop(f, at + d, fps, 300, 14);
  const pill = (txt: string, c: string, d: number) => <div style={{transform: `scale(${p(d)})`, border: `6px solid ${c}`, color: c, background: 'rgba(8,9,13,0.75)',
    fontFamily: font.caption, fontSize: 92, padding: '10px 64px 4px', borderRadius: 100}}>{txt}</div>;
  const stroke = {WebkitTextStroke: `12px ${color.ink}`, paintOrder: 'stroke fill'} as const;
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 130, color: '#fff', lineHeight: 1, transform: `scale(${0.7 + 0.3 * p(0)})`, opacity: p(0), ...stroke}}>{l1}</div>
    <div style={{fontFamily: font.caption, fontSize: 130, color: color.keyRed, lineHeight: 1.05, opacity: p(4), ...stroke}}>{l2}</div>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, marginTop: 56}}>{pill(a, '#5fd38a', aAt)}{pill(b, color.keyRed, bAt)}</div>
    <div style={{marginTop: 46, fontFamily: font.pixel, fontSize: 34, color: 'rgba(255,255,255,0.85)', letterSpacing: 4, opacity: p(26)}}>COMMENT BELOW ↓</div>
  </AbsoluteFill>;
};
