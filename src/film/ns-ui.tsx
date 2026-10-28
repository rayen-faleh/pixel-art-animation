import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {color, font} from '../kit/theme';

/** Security-camera look over whatever world is rendered underneath. */
export const CctvOverlay: React.FC<{cam: string; clock: string}> = ({cam, clock}) => {
  const f = useCurrentFrame();
  const grain = Array.from({length: 140}, (_, i) => {
    const x = random(`gx${i}-${f}`) * 1080, y = random(`gy${i}-${f}`) * 1920, w = 2 + random(`gw${i}-${f}`) * 6;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 3, background: 'rgba(255,255,255,0.10)'}} />;
  });
  const roll = (f * 7) % 1920;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.28) 0 3px, transparent 3px 6px)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: roll, height: 160, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.05), transparent)'}} />
    {grain}
    <AbsoluteFill style={{boxShadow: 'inset 0 0 220px rgba(0,0,0,0.85)'}} />
    <div style={{position: 'absolute', right: 56, top: 132, fontFamily: font.pixel, fontSize: 30, color: '#e8eef6', textAlign: 'right', letterSpacing: 2}}>
      <span style={{color: color.keyRed, opacity: Math.floor(f / 15) % 2 ? 1 : 0.2}}>●</span> REC {cam}<br />{clock}
    </div>
  </AbsoluteFill>;
};

/** Wrap a <World> so it reads as CCTV footage (desaturated, contrasty). */
export const CctvFilter: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{filter: 'grayscale(1) contrast(1.35) brightness(1.15) sepia(0.15) hue-rotate(60deg)'}}>{children}</AbsoluteFill>
);

/** NOISE meter: 14 segments, green -> yellow -> red; level 0..1. */
export const NoiseMeter: React.FC<{level: number; top?: number; label?: string}> = ({level, top = 282, label = 'NOISE'}) => {
  const n = 14, lit = Math.round(Math.max(0, Math.min(1, level)) * n);
  return <div style={{position: 'absolute', left: 52, top, display: 'flex', alignItems: 'center', gap: 14, fontFamily: font.pixel}}>
    <div style={{fontSize: 24, color: level > 0.7 ? color.keyRed : 'rgba(255,255,255,0.75)', letterSpacing: 2, width: 96}}>{label}</div>
    <div style={{display: 'flex', gap: 4, background: color.hudChip, border: `2px solid ${color.hudChipBorder}`, borderRadius: 6, padding: 6}}>
      {Array.from({length: n}, (_, i) => {
        const c = i < 7 ? '#5fd38a' : i < 11 ? color.keyYellow : color.keyRed;
        return <div key={i} style={{width: 16, height: 26, borderRadius: 2, background: i < lit ? c : 'rgba(255,255,255,0.08)',
          boxShadow: i < lit && i >= 11 ? `0 0 10px ${color.keyRed}` : undefined}} />;
      })}
    </div>
  </div>;
};
