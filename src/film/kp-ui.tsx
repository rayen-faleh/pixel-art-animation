import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {color, font} from '../kit/theme';
import {clamp} from '../kit/world';
import {Atlas} from '../kit/sprite';

// KEEP PRETENDING UI (16:9). Generic UI only: no real apps, brands or OS chrome.

const pop = (f: number, at: number, fps: number, stiffness = 240, damping = 18) =>
  f < at ? 0 : spring({frame: f - at, fps, config: {stiffness, damping}});
const stroke = (px: number) => ({WebkitTextStroke: `${px}px ${color.ink}`, paintOrder: 'stroke fill'} as const);

/** Night-vision pet-cam look over any WorldL: green mono, crushed blacks, grain, scanlines, timestamp. */
export const PetCamFeed: React.FC<{children: React.ReactNode; clock: string; label?: string; live?: boolean; scrub?: number}> = ({children, clock, label = 'KITCHEN CAM', live, scrub}) => {
  const f = useCurrentFrame();
  const grain = Array.from({length: 90}, (_, i) => {
    const x = random(`pg${i}-${f}`) * 1920, y = random(`ph${i}-${f}`) * 1080, w = 3 + random(`pw${i}-${f}`) * 8;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 3, background: 'rgba(200,255,200,0.10)'}} />;
  });
  return <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{filter: 'grayscale(1) brightness(1.9) contrast(1.25) sepia(1) hue-rotate(55deg) saturate(1.6)'}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0 3px, transparent 3px 6px)', pointerEvents: 'none'}} />
    {grain}
    <AbsoluteFill style={{boxShadow: 'inset 0 0 260px rgba(0,0,0,0.9)', pointerEvents: 'none'}} />
    <div style={{position: 'absolute', left: 60, top: 44, fontFamily: font.mono, fontSize: 34, color: '#d8ffd8', letterSpacing: 2, textShadow: '0 0 8px rgba(0,0,0,0.9)'}}>
      {live ? <span style={{color: '#ff4a4a'}}>● LIVE</span> : <span>▶ CLIP</span>}  {label}
    </div>
    <div style={{position: 'absolute', right: 60, top: 44, fontFamily: font.mono, fontSize: 34, color: '#d8ffd8', letterSpacing: 2}}>{clock}</div>
    {scrub !== undefined && <div style={{position: 'absolute', left: 60, right: 60, bottom: 48, height: 10, borderRadius: 5, background: 'rgba(216,255,216,0.25)'}}>
      <div style={{width: `${scrub * 100}%`, height: '100%', borderRadius: 5, background: '#d8ffd8'}} />
      <div style={{position: 'absolute', left: `calc(${scrub * 100}% - 12px)`, top: -7, width: 24, height: 24, borderRadius: 12, background: '#fff'}} />
    </div>}
  </AbsoluteFill>;
};

/** Phone in the hand, landscape film: a portrait phone on the right, scene dimmed behind it. */
export const Phone: React.FC<{at?: number; x?: number; y?: number; children: React.ReactNode; dim?: number; glow?: string}> = ({at = -99, x = 1180, y = 70, children, glow}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 200, 20);
  return <div style={{position: 'absolute', left: x, top: y + (1 - s) * 900, width: 500, height: 980, borderRadius: 66, background: '#0d0e12', border: '10px solid #23252d',
    boxShadow: `0 40px 120px rgba(0,0,0,0.75), 0 0 140px ${glow ?? 'rgba(120,180,255,0.16)'}`, overflow: 'hidden', fontFamily: font.ui, color: '#fff'}}>
    <div style={{position: 'absolute', left: '50%', top: 18, width: 120, height: 30, borderRadius: 15, background: '#000', transform: 'translateX(-50%)'}} />
    <div style={{position: 'absolute', inset: '72px 26px 26px'}}>{children}</div>
  </div>;
};

/** Pet-cam app: a notification card or a clip list. */
export const CamNotice: React.FC<{at: number; title: string; sub: string; red?: boolean; y?: number}> = ({at, title, sub, red, y = 40}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 260, 18);
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, transform: `translateY(${(1 - s) * -60}px)`, opacity: s,
    background: 'rgba(40,42,52,0.96)', borderRadius: 26, padding: '22px 24px', display: 'flex', gap: 18, alignItems: 'center'}}>
    <div style={{width: 64, height: 64, borderRadius: 16, background: '#e9e9e2', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 30, height: 30, borderRadius: 15, background: '#1b1d26', border: '6px solid #c9c9c0'}} />
    </div>
    <div><div style={{fontSize: 30, fontWeight: 700, color: red ? color.keyRed : '#fff'}}>{title}</div><div style={{fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 4}}>{sub}</div></div>
  </div>;
};

/** Text thread (generic messaging). `side` = whose phone it is. */
export type Msg = {at: number; text: string; out?: boolean; hl?: boolean; time?: string};
export const Thread: React.FC<{name: string; sub?: string; msgs: Msg[]; typingFrom?: number}> = ({name, sub, msgs, typingFrom}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const shown = msgs.filter((m) => f >= m.at);
  const typing = typingFrom !== undefined && f >= typingFrom && (shown.length === msgs.length ? false : true);
  return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
    <div style={{textAlign: 'center', paddingBottom: 16, borderBottom: '2px solid rgba(255,255,255,0.08)'}}>
      <div style={{width: 64, height: 64, borderRadius: 32, background: '#5a6070', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700}}>{name[0]}</div>
      <div style={{fontSize: 28, fontWeight: 700}}>{name}</div>{sub && <div style={{fontSize: 20, color: 'rgba(255,255,255,0.5)'}}>{sub}</div>}
    </div>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, paddingTop: 14}}>
      {shown.slice(-7).map((m, i) => {
        const s = spring({frame: f - m.at, fps, config: {stiffness: 260, damping: 18}});
        return <div key={i} style={{alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth: '84%', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: m.out ? 'right' : 'left', opacity: s}}>
          {m.time && <div style={{fontSize: 17, color: 'rgba(255,255,255,0.4)', textAlign: m.out ? 'right' : 'left', marginBottom: 4}}>{m.time}</div>}
          <div style={{background: m.out ? '#2f7cf6' : m.hl ? '#5a2228' : '#2c2e36', color: '#fff', borderRadius: 24, padding: '14px 20px', fontSize: 27, fontWeight: 500, lineHeight: 1.25,
            border: m.hl ? `2px solid ${color.keyRed}` : undefined}}>{m.text}</div>
        </div>;
      })}
      {typing && <div style={{alignSelf: 'flex-start', background: '#2c2e36', borderRadius: 24, padding: '16px 22px', display: 'flex', gap: 8}}>
        {[0, 1, 2].map((k) => <div key={k} style={{width: 12, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.6)', opacity: 0.3 + 0.7 * ((Math.floor(f / 6) + k) % 3 === 0 ? 1 : 0)}} />)}
      </div>}
    </div>
  </div>;
};

/** A crisp pixel sprite frame drawn at `scale` screen px per art px (UI space, not world). */
export const UISprite: React.FC<{atlas: Atlas; frame: string; scale: number; style?: React.CSSProperties}> = ({atlas, frame, scale, style}) => {
  const fr = atlas.frames[frame];
  if (!fr) throw new Error(`Missing sprite frame "${frame}" in ${atlas.image}`);
  return <div style={{position: 'relative', width: fr.w * scale, height: fr.h * scale, overflow: 'hidden', ...style}}>
    <Img src={staticFile(`sprites/${atlas.image}`)} style={{position: 'absolute', left: -fr.x * scale, top: -fr.y * scale, width: atlas.sheet[0] * scale, height: atlas.sheet[1] * scale,
      imageRendering: 'pixelated', maxWidth: 'none'}} />
  </div>;
};

/** Shelter email with three drop-off photos; photo i appears at photoAt[i]. */
export const DropOffPhotos: React.FC<{busts: Atlas; photoAt: number[]; hlAt?: number}> = ({busts, photoAt, hlAt = 1e9}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const who: [string, string][] = [['dana', 'MAR 2023'], ['marcus', 'JAN 2024'], ['june', 'AUG 2025']];
  return <AbsoluteFill style={{background: 'radial-gradient(70% 60% at 50% 45%, #1e2230, #07080c)', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: font.ui, color: 'rgba(255,255,255,0.75)', fontSize: 34, marginBottom: 40}}>Re: intake records, Pepper (#4471)</div>
    <div style={{display: 'flex', gap: 60}}>
      {who.map(([n, d], i) => {
        const s = pop(f, photoAt[i], fps, 220, 16);
        const hl = f >= hlAt;
        return <div key={n} style={{background: '#f2efe6', padding: '22px 22px 18px', transform: `rotate(${[-4, 2, -2][i]}deg) scale(${s})`, boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
          <div style={{background: '#9aa6a0', width: 340, height: 340, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden',
            outline: hl ? `6px solid ${color.keyRed}` : undefined}}>
            <UISprite atlas={busts} frame={n} scale={5.2} />
          </div>
          <div style={{fontFamily: font.mono, fontSize: 24, color: '#2a2c33', marginTop: 12, display: 'flex', justifyContent: 'space-between'}}><span>DROP-OFF</span><span>{d}</span></div>
        </div>;
      })}
    </div>
  </AbsoluteFill>;
};

/** Rule card that flips to its real meaning (red), one per beat. */
export const RuleFlip: React.FC<{rules: {at: number; flip: number; was: string; is: string}[]}> = ({rules}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const cur = [...rules].reverse().find((r) => f >= r.at);
  if (!cur) return null;
  const n = rules.indexOf(cur) + 1;
  const s = pop(f, cur.at, fps, 260, 18);
  const fl = interpolate(f, [cur.flip, cur.flip + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const showIs = fl > 0.5;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: font.caption, fontSize: 46, color: '#fff', background: showIs ? color.alertRed : '#3a3d48', padding: '4px 20px 0', borderRadius: 6, letterSpacing: 2, transform: `scale(${s})`}}>RULE #{n}</div>
    <div style={{marginTop: 24, transform: `rotateX(${(showIs ? 1 - fl : fl) * 90}deg) scale(${0.8 + 0.2 * s})`, fontFamily: font.caption, fontSize: 150, lineHeight: 1,
      color: showIs ? color.keyRed : '#fff', ...stroke(12), textAlign: 'center', maxWidth: 1700}}>{showIs ? cur.is : cur.was}</div>
    {showIs && <div style={{marginTop: 24, fontFamily: font.caption, fontSize: 52, color: 'rgba(255,255,255,0.55)', textDecoration: 'line-through', ...stroke(6)}}>{cur.was}</div>}
  </AbsoluteFill>;
};

/** SUSPICION meter (top right): a cat eye whose pupil narrows as it rises, plus a 12-segment bar. */
export const SuspicionMeter: React.FC<{level: number; show?: number}> = ({level, show = 1}) => {
  const l = Math.max(0, Math.min(1, level));
  const n = 12, lit = Math.round(l * n);
  return <div style={{position: 'absolute', right: 48, top: 40, display: 'flex', alignItems: 'center', gap: 14, fontFamily: font.pixel, opacity: show}}>
    <div style={{fontSize: 22, color: l > 0.7 ? color.keyRed : 'rgba(255,255,255,0.75)', letterSpacing: 2}}>SUSPICION</div>
    <div style={{width: 66, height: 40, borderRadius: '50%', background: '#c3d64a', border: '3px solid #14151b', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: l > 0.7 ? `0 0 18px ${color.keyRed}` : undefined}}>
      <div style={{width: interpolate(l, [0, 1], [26, 4]), height: 34, borderRadius: 20, background: '#14151b'}} />
    </div>
    <div style={{display: 'flex', gap: 3, background: color.hudChip, border: `2px solid ${color.hudChipBorder}`, borderRadius: 6, padding: 5}}>
      {Array.from({length: n}, (_, i) => {
        const c = i < 6 ? '#5fd38a' : i < 9 ? color.keyYellow : color.keyRed;
        return <div key={i} style={{width: 12, height: 22, borderRadius: 2, background: i < lit ? c : 'rgba(255,255,255,0.08)'}} />;
      })}
    </div>
  </div>;
};

/** Small beat chip under the HUD (fact labels). */
export const BeatChip: React.FC<{chips: {at: number; text: string; tone?: 'bad' | 'ok' | 'fact'}[]; until?: number}> = ({chips, until = 1e9}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const cur = [...chips].reverse().find((c) => f >= c.at);
  if (!cur || !cur.text || f > until) return null;
  const s = pop(f, cur.at, fps, 280, 18);
  const bg = cur.tone === 'bad' ? color.alertRed : cur.tone === 'ok' ? '#2f8a57' : 'rgba(16,18,26,0.88)';
  return <div style={{position: 'absolute', left: 48, top: 168, transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: 'left', opacity: s,
    background: bg, border: `2px solid ${cur.tone ? 'transparent' : color.hudChipBorder}`, color: '#fff', fontFamily: font.pixel, fontSize: 26, fontWeight: 700,
    padding: '8px 16px 5px', borderRadius: 8, letterSpacing: 1}}>{cur.text}</div>;
};

/** End card. */
export const EndCard: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const p = (d: number) => pop(f, at + d, fps, 220, 16);
  return <AbsoluteFill style={{background: '#06070b', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
    <div style={{fontFamily: font.caption, fontSize: 190, color: '#fff', letterSpacing: 4, lineHeight: 1, opacity: p(0), transform: `scale(${0.85 + 0.15 * p(0)})`, ...stroke(12)}}>KEEP PRETENDING</div>
    <div style={{marginTop: 26, fontFamily: font.pixel, fontSize: 36, color: color.keyYellow, letterSpacing: 4, opacity: p(10)}}>PEPPER IS AVAILABLE FOR ADOPTION</div>
    <div style={{marginTop: 70, fontFamily: font.caption, fontSize: 92, color: color.keyRed, opacity: p(30), transform: `translateY(${(1 - p(30)) * 20}px)`, ...stroke(8)}}>IS YOUR CAT FACING YOU RIGHT NOW?</div>
    <div style={{marginTop: 28, fontFamily: font.pixel, fontSize: 28, color: 'rgba(255,255,255,0.75)', letterSpacing: 3, opacity: p(46)}}>CHECK. THEN TELL ME IN THE COMMENTS ↓</div>
  </AbsoluteFill>;
};

/** The shelter's cage card (insert). */
export const CageCard: React.FC<{returned: number; at?: number; strikeAt?: number}> = ({returned, at = 0, strikeAt}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = pop(f, at, fps, 220, 18);
  const st = strikeAt !== undefined ? interpolate(f, [strikeAt, strikeAt + 10], [0, 1], clamp) : 0;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div style={{width: 900, background: '#f4f1e6', padding: '40px 56px', transform: `rotate(-2deg) scale(${0.8 + 0.2 * s})`, opacity: s, boxShadow: '0 40px 120px rgba(0,0,0,0.6)', fontFamily: font.mono, color: '#22242b'}}>
      <div style={{fontSize: 34, letterSpacing: 4, color: '#5a6a5a'}}>ADOPT ME</div>
      <div style={{fontFamily: font.caption, fontSize: 150, lineHeight: 1, marginTop: 8}}>PEPPER</div>
      <div style={{fontSize: 30, marginTop: 10}}>Male · ~4 yrs · grey tuxedo · very calm</div>
      <div style={{height: 3, background: '#22242b', margin: '26px 0'}} />
      <div style={{fontSize: 44, color: color.alertRed, fontWeight: 500, position: 'relative', display: 'inline-block'}}>
        RETURNED {st > 0.5 ? returned + 1 : returned} TIMES.
        {st > 0 && st < 1 && <div style={{position: 'absolute', left: 0, top: '50%', height: 5, width: `${st * 100}%`, background: color.alertRed}} />}
      </div>
      <div style={{fontSize: 38, marginTop: 8}}>No reason given.</div>
    </div>
  </AbsoluteFill>;
};
