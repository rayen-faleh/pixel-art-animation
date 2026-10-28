import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color} from '../kit/theme';
import {clamp} from '../kit/world';

// DON'T REPLY phone screens. Generic messaging UI (no real app's look). Live inside <Phone> (inner ~712 px wide).
const pop = (f: number, at: number, fps: number, stiffness = 260, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});

export const Badge: React.FC<{size?: number; off?: boolean}> = ({size = 30, off}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" style={{flex: 'none', verticalAlign: 'middle'}}>
    <circle cx="15" cy="15" r="14" fill={off ? '#3a7fd0' : '#2f8cf6'} /><path d="M8 15.5 L13 20 L22 10" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Avatar: React.FC<{c: string; size?: number; dot?: 'on' | 'off'; children?: React.ReactNode}> = ({c, size = 72, dot, children}) => (
  <div style={{position: 'relative', width: size, height: size, borderRadius: size / 2, background: c, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.45, fontWeight: 700}}>{children}
    {dot && <div style={{position: 'absolute', right: -2, bottom: -2, width: size * 0.32, height: size * 0.32, borderRadius: size, background: dot === 'on' ? '#3ddc6a' : '#6b6f78',
      border: '5px solid #0f1014', boxShadow: dot === 'on' ? '0 0 18px #3ddc6a' : undefined}} />}
  </div>
);
const BEAST = '#1b6fe0';

/** Lock screen: big clock + stacked notifications that pop in at their frames. */
export const LockNotifs: React.FC<{clock: string; date?: string; items: {at: number; from: string; text: string; time: string; badge?: boolean; red?: boolean}[]}> = ({clock, date = 'Saturday, March 14', items}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <>
    <div style={{textAlign: 'center', fontSize: 150, fontWeight: 700, letterSpacing: -2, marginTop: 10}}>{clock}</div>
    <div style={{textAlign: 'center', fontSize: 30, color: 'rgba(255,255,255,0.6)'}}>{date}</div>
    <div style={{display: 'flex', flexDirection: 'column-reverse', gap: 16, marginTop: 50}}>
      {items.filter((n) => f >= n.at).map((n, i) => {
        const s = pop(f, n.at, fps);
        const shake = Math.sin((f - n.at) * 3) * Math.max(0, 1 - (f - n.at) / 12) * 8;
        return <div key={i} style={{background: 'rgba(40,42,50,0.96)', borderRadius: 30, padding: '22px 26px', transform: `scale(${0.85 + 0.15 * s}) translateX(${shake}px)`, opacity: s,
          border: n.red ? `3px solid ${color.alertRed}` : undefined}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: 'rgba(255,255,255,0.55)'}}>MESSAGES<span style={{marginLeft: 'auto'}}>{n.time}</span></div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 36, fontWeight: 700, marginTop: 6}}>{n.from}{n.badge && <Badge />}</div>
          <div style={{fontSize: 34, marginTop: 4, color: 'rgba(255,255,255,0.9)'}}>{n.text}</div>
        </div>;
      })}
    </div>
  </>;
};

/** DM requests list: one unread row from MrBeast; optional highlight on the name it used, and your own status row. */
export const Inbox: React.FC<{hlAt?: number; meDot?: 'on' | 'off'; meAt?: number; preview?: string}> = ({hlAt = 1e9, meDot, meAt = 1e9, preview = 'Hey Sam 👋 $10,000 is yours. Just reply YES'}) => {
  const f = useCurrentFrame();
  const hl = f >= hlAt;
  return <>
    {meDot && <div style={{display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 26, borderBottom: '2px solid #24262e', opacity: f >= meAt ? 1 : 0.0}}>
      <Avatar c="#7a6a9a" dot={meDot}>S</Avatar>
      <div><div style={{fontSize: 34, fontWeight: 700}}>@sx_07</div>
        <div style={{fontSize: 28, color: meDot === 'on' ? '#3ddc6a' : 'rgba(255,255,255,0.5)'}}>{meDot === 'on' ? 'Active now' : 'Offline'}</div></div>
    </div>}
    <div style={{fontSize: 30, fontWeight: 700, marginTop: 24, color: 'rgba(255,255,255,0.6)'}}>Message requests (1)</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 18, background: '#181920', borderRadius: 26, padding: 20}}>
      <Avatar c={BEAST}>M</Avatar>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 34, fontWeight: 700}}>MrBeast <Badge size={28} /><span style={{marginLeft: 'auto', fontSize: 24, color: 'rgba(255,255,255,0.5)', fontWeight: 500}}>3:33 AM</span></div>
        <div style={{fontSize: 30, color: 'rgba(255,255,255,0.85)', marginTop: 4}}>Hey <span style={{color: hl ? '#111' : '#fff', background: hl ? color.keyYellow : 'transparent', padding: '0 6px', borderRadius: 6}}>Sam</span> 👋 {preview.replace('Hey Sam 👋 ', '')}</div>
      </div>
      <div style={{width: 18, height: 18, borderRadius: 9, background: '#2f8cf6'}} />
    </div>
    {hl && <div style={{marginTop: 26, fontSize: 26, color: 'rgba(255,255,255,0.5)', textAlign: 'center'}}>your profile: <b style={{color: '#fff'}}>@sx_07</b> · name: <span style={{color: color.keyRed}}>not set</span></div>}
  </>;
};

/** A small pixel set rendered inside phone UI (135x240 art at `scale`). */
export const MiniSet: React.FC<{layers: string[]; scale: number; ox?: number; oy?: number; w: number; h: number; filter?: string; children?: React.ReactNode}> = ({layers, scale, ox = 0, oy = 0, w, h, filter, children}) => (
  <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', borderRadius: 20, filter}}>
    <div style={{position: 'absolute', left: -ox * scale, top: -oy * scale, width: 160, height: 240, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {layers.map((l) => <Img key={l} src={staticFile(l)} style={{position: 'absolute', left: 0, top: 0, height: 240, imageRendering: 'pixelated', maxWidth: 'none'}} />)}
      {children}
    </div>
  </div>
);

/** Jake's story: progress bars, header, photo, caption typing in. */
export const Story: React.FC<{photo: React.ReactNode; captionFrom: number; caption: string}> = ({photo, captionFrom, caption}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(caption.length, Math.floor((f - captionFrom) * 0.9)));
  return <div style={{position: 'absolute', inset: 0, background: '#000'}}>
    <div style={{position: 'absolute', left: 24, right: 24, top: 18, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.3)'}}>
      <div style={{width: `${Math.min(100, f / 2)}%`, height: 6, borderRadius: 3, background: '#fff'}} /></div>
    <div style={{position: 'absolute', left: 24, top: 40, display: 'flex', alignItems: 'center', gap: 14, zIndex: 2}}>
      <Avatar c="#c47a3a" size={56}>J</Avatar><div style={{fontSize: 30, fontWeight: 700}}>jake.m</div><div style={{fontSize: 26, color: 'rgba(255,255,255,0.6)'}}>4:12 AM</div></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 120}}>{photo}</div>
    {n > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 460, textAlign: 'center'}}>
      <span style={{background: '#fff', color: '#111', fontSize: 46, fontWeight: 700, padding: '8px 20px', borderRadius: 12}}>{caption.slice(0, n)}</span></div>}
  </div>;
};

/** Settings: "Show activity status" toggle that flips off at `offAt`. */
export const ActivityToggle: React.FC<{offAt: number}> = ({offAt}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = 1 - pop(f, offAt, fps, 300, 22);
  return <>
    <div style={{fontSize: 40, fontWeight: 700}}>Activity status</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 40}}>
      <Avatar c="#7a6a9a" dot={p > 0.5 ? 'on' : 'off'}>S</Avatar>
      <div style={{fontSize: 32, color: p > 0.5 ? '#3ddc6a' : 'rgba(255,255,255,0.5)'}}>{p > 0.5 ? 'Active now' : 'Offline'}</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', marginTop: 50, background: '#181920', borderRadius: 24, padding: '26px 24px'}}>
      <div style={{fontSize: 32, flex: 1}}>Show activity status</div>
      <div style={{width: 110, height: 62, borderRadius: 31, background: `rgb(${61 + (60 - 61) * (1 - p)}, ${220 * p + 64 * (1 - p)}, ${106 * p + 72 * (1 - p)})`, position: 'relative'}}>
        <div style={{position: 'absolute', top: 5, left: 5 + 48 * p, width: 52, height: 52, borderRadius: 26, background: '#fff'}} /></div>
    </div>
    <div style={{fontSize: 26, color: 'rgba(255,255,255,0.45)', marginTop: 18, lineHeight: 1.3}}>When this is off, people can't see when you're online.</div>
  </>;
};

/** Photo DM: the street at night, then the line under it. */
export const PhotoDM: React.FC<{photoAt: number; lineAt: number}> = ({photoAt, lineAt}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, photoAt, fps), l = pop(f, lineAt, fps, 300, 16);
  return <>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 20, borderBottom: '2px solid #24262e'}}>
      <Avatar c={BEAST} size={60}>M</Avatar><div style={{fontSize: 34, fontWeight: 700}}>MrBeast</div><Badge size={28} />
      <div style={{marginLeft: 'auto', fontSize: 24, color: 'rgba(255,255,255,0.5)'}}>preview</div></div>
    <div style={{marginTop: 30, transform: `scale(${0.8 + 0.2 * s})`, opacity: s, transformOrigin: 'left top'}}>
      <MiniSet layers={['sets/street_wide_bg.png']} scale={4.4} ox={2} oy={66} w={600} h={380} filter="brightness(0.75) contrast(1.1)" />
      <div style={{fontSize: 22, color: 'rgba(255,255,255,0.45)', marginTop: 8}}>IMG_0333.jpg · taken 3:33 AM</div>
    </div>
    <div style={{marginTop: 26, display: 'inline-block', background: '#2c2e36', borderRadius: 30, padding: '18px 28px', fontSize: 44, fontWeight: 700, transform: `scale(${l})`, transformOrigin: 'left'}}>
      which one is yours? 🙂</div>
  </>;
};

/** Notification quick-reply: the keyboard jumps up when the thumb slips; your typing bubble shows for a moment. */
export const Slip: React.FC<{slipAt: number; dotsAt: number; dotsOff: number}> = ({slipAt, dotsAt, dotsOff}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const k = pop(f, slipAt, fps, 320, 22);
  const dots = f >= dotsAt && f < dotsOff;
  return <>
    <div style={{background: 'rgba(40,42,50,0.96)', borderRadius: 30, padding: '22px 26px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 36, fontWeight: 700}}>MrBeast <Badge /></div>
      <div style={{fontSize: 32, marginTop: 4}}>which one is yours? 🙂</div>
      <div style={{marginTop: 18, background: '#1a1b21', borderRadius: 22, padding: '14px 20px', fontSize: 30, color: 'rgba(255,255,255,0.4)',
        border: k > 0.5 ? `3px solid ${color.keyRed}` : '3px solid transparent'}}>Reply…</div>
    </div>
    <div style={{marginTop: 24, height: 90}}>
      {dots && <div style={{display: 'inline-flex', alignItems: 'center', gap: 16}}>
        <div style={{background: '#2f7cf6', borderRadius: 30, padding: '18px 26px', display: 'flex', gap: 10}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: 0.4 + 0.6 * Math.abs(Math.sin((f - dotsAt) * 0.25 + i))}} />)}
        </div><div style={{fontSize: 28, color: color.keyRed, fontWeight: 700}}>Sam is typing</div></div>}
    </div>
    <div style={{position: 'absolute', left: -34, right: -34, bottom: -56, height: 330, background: '#22242b', transform: `translateY(${(1 - k) * 340}px)`, padding: 14}}>
      {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, r) => <div key={r} style={{display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10}}>
        {row.split('').map((c) => <div key={c} style={{width: 60, height: 76, borderRadius: 10, background: c === 'G' && f >= slipAt && f < slipAt + 6 ? '#8a8d96' : '#4a4d57',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>{c}</div>)}</div>)}
    </div>
  </>;
};

/** Brother's tablet: same DM, a keyboard, and his thumb hovering on Y. */
export const Tablet: React.FC<{typingFrom: number; y?: number}> = ({typingFrom, y = 420}) => {
  const f = useCurrentFrame();
  const hover = Math.sin(f * 0.18) * 6;
  const meter = interpolate(f, [typingFrom, typingFrom + 40], [0, 1], clamp);
  return <div style={{position: 'absolute', left: 60, right: 60, top: y, height: 900, borderRadius: 50, background: '#0f1014', border: '14px solid #2a3a3a', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', overflow: 'hidden',
    boxShadow: '0 0 140px rgba(160,215,255,0.3)'}}>
    <div style={{padding: '36px 40px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}><Avatar c={BEAST} size={64}>M</Avatar><div style={{fontSize: 38, fontWeight: 700}}>MrBeast</div><Badge size={32} /></div>
      <div style={{marginTop: 30, display: 'inline-block', background: '#2c2e36', borderRadius: 30, padding: '18px 28px', fontSize: 40}}>Hey Leo 👋 you won $10,000!! reply YES</div>
      <div style={{marginTop: 24, display: 'inline-flex', gap: 10, background: '#2f7cf6', borderRadius: 30, padding: '18px 26px', opacity: meter > 0 ? 1 : 0}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: 18, height: 18, borderRadius: 9, background: '#fff', opacity: 0.4 + 0.6 * Math.abs(Math.sin(f * 0.25 + i))}} />)}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: '#22242b', padding: 18}}>
      {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, r) => <div key={r} style={{display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12}}>
        {row.split('').map((c) => <div key={c} style={{width: 74, height: 96, borderRadius: 12, background: c === 'Y' ? '#7d5a2a' : '#4a4d57', boxShadow: c === 'Y' ? `0 0 0 4px ${color.keyYellow}` : undefined,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>{c}</div>)}</div>)}
      {/* his thumb */}
      <div style={{position: 'absolute', left: 482, top: -40 + hover, width: 92, height: 150, borderRadius: '46px 46px 30px 30px', background: '#f1d9c0', border: '6px solid #14151b', transform: 'rotate(-12deg)'}} />
    </div>
  </div>;
};
