import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font} from '../kit/theme';
import {clamp, ramp} from '../kit/world';

/** Phone close-up: the thumb drags brightness from 100% to 1%; the screen dies with it. */
export const BrightnessInsert: React.FC<{dragAt: number; dragDur: number}> = ({dragAt, dragDur}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const inP = spring({frame: f, fps, config: {stiffness: 200, damping: 22}});
  const p = ramp(f, dragAt, dragDur, Easing.bezier(0.45, 0, 0.2, 1));
  const pct = Math.round(interpolate(p, [0, 1], [100, 1]));
  const lum = interpolate(p, [0, 1], [1, 0.06]);
  const knobX = interpolate(p, [0, 1], [560, 16]);
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <AbsoluteFill style={{background: '#000', opacity: 0.55 * inP}} />
    <div style={{width: 600, height: 680, borderRadius: 80, background: '#0b0c10', border: '10px solid #22242c', marginTop: -420,
      transform: `translateY(${(1 - inP) * 600}px)`, boxShadow: `0 0 ${160 * lum}px rgba(160,215,255,${0.55 * lum})`, overflow: 'hidden', position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(150,190,235,${lum}), rgba(70,100,150,${lum}))`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontFamily: font.ui, fontWeight: 700, fontSize: 40,
        color: `rgba(255,255,255,${0.35 + 0.65 * lum})`}}>Brightness</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: font.caption, fontSize: 150,
        color: pct <= 5 ? color.keyYellow : '#fff', opacity: 0.4 + 0.6 * Math.max(lum, 0.5)}}>{pct}%</div>
      {/* slider track */}
      <div style={{position: 'absolute', left: 30, top: 420, width: 560, height: 70, borderRadius: 35, background: 'rgba(255,255,255,0.18)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: knobX + 35, borderRadius: 35, background: `rgba(255,255,255,${0.4 + 0.5 * lum})`}} />
        <div style={{position: 'absolute', left: knobX - 6, top: -8, width: 86, height: 86, borderRadius: 43, background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.5)'}} />
        {/* thumb */}
        <div style={{position: 'absolute', left: knobX + 6, top: 40, width: 120, height: 180, borderRadius: '60px 60px 40px 40px', background: '#e9e2d4',
          border: '6px solid #14151b', opacity: f >= dragAt - 6 ? 1 : 0}} />
      </div>
    </div>
  </AbsoluteFill>;
};

/** Generic incoming-message banner (no real OS branding). */
export const MessageBanner: React.FC<{at: number; from: string; text: string; y?: number}> = ({at, from, text, y = 400}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {stiffness: 260, damping: 18}});
  const buzz = Math.sin((f - at) * 3.1) * Math.max(0, 1 - (f - at) / 10) * 12;
  return <div style={{position: 'absolute', left: 90, right: 90, top: y - (1 - s) * 260, opacity: Math.min(1, s * 1.6), transform: `translateX(${buzz}px)`,
    background: 'rgba(235,240,250,0.97)', borderRadius: 34, padding: '26px 34px', fontFamily: font.ui, color: '#111',
    boxShadow: '0 0 120px rgba(190,225,255,0.75)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, color: '#555', fontWeight: 500}}>
      <div style={{width: 40, height: 40, borderRadius: 10, background: '#36c759'}} />MESSAGES<span style={{marginLeft: 'auto'}}>now</span>
    </div>
    <div style={{marginTop: 12, fontSize: 40, fontWeight: 700}}>{from}</div>
    <div style={{marginTop: 4, fontSize: 36, fontWeight: 500}}>{text}</div>
  </div>;
};

export type InvItem = {at: number; label: string; value: string; light?: boolean};
/** Inventory list: rows pop in as they are named; light sources flip red on `lightAt`. */
export const Inventory: React.FC<{items: InvItem[]; lightAt: number; y?: number}> = ({items, lightAt, y = 330}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 60, right: 60, top: y, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: font.pixel}}>
    <div style={{color: 'rgba(255,255,255,0.6)', fontSize: 28, letterSpacing: 4, marginBottom: 4, opacity: ramp(f, items[0].at - 8, 6)}}>SUPPLIES</div>
    {items.filter((it) => f >= it.at).map((it, i) => {
      const s = spring({frame: f - it.at, fps, config: {stiffness: 320, damping: 16}});
      const bad = it.light && f >= lightAt + i * 3;
      const hot = bad ? Math.max(0, 1 - (f - lightAt - i * 3) / 12) : 0;
      return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${(1 - s) * -80}px) scale(${1 + hot * 0.08})`, opacity: Math.min(1, s * 1.5),
        background: bad ? 'rgba(80,10,16,0.88)' : color.hudChip, border: `3px solid ${bad ? color.keyRed : color.hudChipBorder}`, borderRadius: 10,
        padding: '12px 22px 8px', width: 'fit-content'}}>
        <span style={{color: '#fff', fontSize: 34}}>{it.label}</span>
        <span style={{color: bad ? color.keyRed : color.keyYellow, fontSize: 34}}>{it.value}</span>
        {bad && <span style={{color: color.keyRed, fontSize: 26, marginLeft: 6, letterSpacing: 2}}>= LIGHT</span>}
      </div>;
    })}
  </div>;
};

/** Ending: title, then two stacked pills (long labels fit at 1080 wide). */
export const ChoiceStack: React.FC<{at: number; title: string; a: string; b: string; aAt?: number; bAt?: number; y?: number}> = ({at, title, a, b, aAt = 8, bAt = 16, y = 640}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const pop = (d: number) => (f >= at + d ? spring({frame: f - at - d, fps, config: {stiffness: 300, damping: 14}}) : 0);
  const pill = (txt: string, bg: string, fg: string, d: number) => <div style={{transform: `scale(${pop(d)})`, background: bg, color: fg, fontFamily: font.caption,
    fontSize: 104, padding: '14px 80px 8px', borderRadius: 100, boxShadow: `0 0 50px ${bg}66`}}>{txt}</div>;
  const tp = pop(0);
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 150, color: '#fff', transform: `scale(${0.7 + 0.3 * tp})`, opacity: tp, WebkitTextStroke: `12px ${color.ink}`, paintOrder: 'stroke fill'}}>{title}</div>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, marginTop: 50}}>
      {pill(a, color.keyYellow, '#111', aAt)}{pill(b, color.alertRed, '#fff', bAt)}
    </div>
  </AbsoluteFill>;
};

/** Hard black hold (e.g. right after a light dies). */
export const Blackout: React.FC<{from: number; to: number; peak?: number}> = ({from, to, peak = 1}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 2, to - 3, to], [0, peak, peak, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null;
};
