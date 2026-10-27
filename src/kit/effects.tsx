import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {clamp, ramp} from './world';

/** World-space light: soft radial glow in art px, additive (screen). Smooth, not pixelated. */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; intensity?: number; flicker?: number; seed?: string; rx?: number}> = ({x, y, r, color, intensity = 1, flicker = 0, seed = 'g', rx}) => {
  const f = useCurrentFrame();
  const fl = flicker ? 1 - flicker * random(`${seed}-${Math.floor(f / 2)}`) : 1;
  const w = rx ?? r;
  return <div style={{position: 'absolute', left: x - w, top: y - r, width: w * 2, height: r * 2, borderRadius: '50%',
    background: `radial-gradient(closest-side, ${color.replace(/[\d.]+\)$/, `${0.55 * intensity * fl})`)}, ${color.replace(/[\d.]+\)$/, `${0.18 * intensity * fl})`)} 45%, transparent 100%)`,
    mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/** Light cone/beam (e.g. moonlight through a window, porch lamp) in art px. */
export const Beam: React.FC<{x: number; y: number; w0: number; w1: number; h: number; color: string; intensity?: number}> = ({x, y, w0, w1, h, color, intensity = 1}) => (
  <div style={{position: 'absolute', left: x - w1 / 2, top: y, width: w1, height: h, mixBlendMode: 'screen', pointerEvents: 'none',
    clipPath: `polygon(${50 - (w0 / w1) * 50}% 0, ${50 + (w0 / w1) * 50}% 0, 100% 100%, 0 100%)`,
    background: `linear-gradient(180deg, ${color.replace(/[\d.]+\)$/, `${0.28 * intensity})`)}, transparent)`}} />
);

/** Darken the world (multiply) so lights read; use per shot. */
export const Darken: React.FC<{amount: number; color?: string}> = ({amount, color = '#0a0e1c'}) => (
  <div style={{position: 'absolute', inset: 0, background: color, opacity: amount, mixBlendMode: 'multiply'}} />
);

/** Screen-space colour wash: alert red pulses, flashes. `pulse` = frames per cycle. */
export const Tint: React.FC<{color: string; from: number; to?: number; peak?: number; pulse?: number; fadeIn?: number}> = ({color, from, to = 1e9, peak = 0.45, pulse = 0, fadeIn = 2}) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 8) return null;
  const inP = ramp(f, from, fadeIn), outP = ramp(f, to, 8);
  const p = pulse ? 0.65 + 0.35 * Math.cos(((f - from) / pulse) * Math.PI * 2) : 1;
  return <AbsoluteFill style={{background: color, opacity: peak * inP * (1 - outP) * p, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/** Hard flash on a cut (white or red), 2-4 frames. */
export const Flash: React.FC<{at: number; color?: string; dur?: number; peak?: number}> = ({at, color = '#fff', dur = 4, peak = 0.8}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  return <AbsoluteFill style={{background: color, opacity: peak * (1 - (f - at) / dur), pointerEvents: 'none'}} />;
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
  <AbsoluteFill style={{background: `radial-gradient(120% 75% at 50% 45%, transparent 45%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);

/** Expanding thin rings (sound, impact, "it noticed you"). World or screen space. */
export const Rings: React.FC<{x: number; y: number; at: number; count?: number; every?: number; life?: number; maxR: number; color?: string; width?: number}> = ({x, y, at, count = 3, every = 6, life = 24, maxR, color = 'rgba(255,255,255,0.8)', width = 0.6}) => {
  const f = useCurrentFrame();
  return <>{Array.from({length: count}, (_, i) => {
    const t = (f - at - i * every) / life;
    if (t < 0 || t > 1) return null;
    const r = maxR * Easing.out(Easing.cubic)(t);
    return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
      border: `${width}px solid ${color}`, opacity: 1 - t, pointerEvents: 'none'}} />;
  })}</>;
};

/** Decaying shake offset for hits (knock, slam). Returns art-px offset. */
export const useHits = (hits: number[], amp = 1.2, decay = 7) => {
  const f = useCurrentFrame();
  let dx = 0;
  for (const h of hits) {
    const d = f - h;
    if (d >= 0 && d < decay * 2) dx += Math.sin(d * 2.4) * amp * Math.exp(-d / (decay / 2.5));
  }
  return dx;
};

/** Dust motes falling after an impact (deterministic). */
export const Dust: React.FC<{x: number; y: number; at: number; n?: number; spread?: number}> = ({x, y, at, n = 8, spread = 14}) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 40) return null;
  return <>{Array.from({length: n}, (_, i) => {
    const px = x + (random(`dx${at}${i}`) - 0.5) * spread, vy = 0.15 + random(`dv${at}${i}`) * 0.25;
    return <div key={i} style={{position: 'absolute', left: Math.round(px), top: Math.round(y + d * vy), width: 1, height: 1,
      background: '#c9c2b5', opacity: interpolate(d, [0, 30, 40], [0.9, 0.6, 0], clamp)}} />;
  })}</>;
};
