import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame,
} from 'remotion';
import {ART_H, ART_W, PX} from './theme';

// ---------- fonts ----------
const FACES: [string, string, string][] = [
  ['Anton', 'anton-latin-400-normal.woff2', '400'],
  ['Silkscreen', 'silkscreen-latin-400-normal.woff2', '400'],
  ['Silkscreen', 'silkscreen-latin-700-normal.woff2', '700'],
  ['Inter', 'inter-latin-500-normal.woff2', '500'],
  ['Inter', 'inter-latin-700-normal.woff2', '700'],
  ['JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'],
];
export const useKitFonts = () => {
  const [h] = useState(() => delayRender('pixel-dread fonts'));
  useEffect(() => {
    Promise.all(FACES.map(([f, file, w]) => new FontFace(f, `url(${staticFile(`fonts/${file}`)})`, {weight: w}).load().then((l) => document.fonts.add(l))))
      .then(() => continueRender(h)).catch((e) => { console.error(e); continueRender(h); });
  }, [h]);
};

// ---------- easing helpers ----------
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const ramp = (f: number, a: number, d: number, e = ease) => interpolate(f, [a, a + Math.max(1, d)], [0, 1], {...clamp, easing: e});

export type CamKey = {at: number; x: number; y: number; zoom: number; ease?: (t: number) => number};
/** Smooth camera track (art-px centre + zoom). Cuts: put two keys on adjacent frames. */
export const camAt = (f: number, keys: CamKey[]) => {
  if (f <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (f <= b.at) {
      const t = (b.ease ?? ease)((f - a.at) / Math.max(1, b.at - a.at));
      return {at: f, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, zoom: a.zoom * Math.pow(b.zoom / a.zoom, t)};
    }
  }
  return keys[keys.length - 1];
};

/**
 * World: a 135x240 art-pixel stage rendered at 8x and framed by a smooth camera.
 * Children are positioned in ART PIXELS. Pixel art stays crisp (pixelated); light,
 * glow and camera motion stay smooth (sub-pixel), which is the core of the look.
 */
export const World: React.FC<{cam: {x: number; y: number; zoom: number}; children: React.ReactNode; shake?: number}> = ({cam, children, shake = 0}) => {
  const f = useCurrentFrame();
  const sx = shake ? Math.sin(f * 2.7) * shake : 0, sy = shake ? Math.cos(f * 3.3) * shake * 0.6 : 0;
  const s = PX * cam.zoom;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, transformOrigin: '0 0',
      transform: `translate(${540 - (cam.x + sx) * s}px, ${960 - (cam.y + sy) * s}px) scale(${s})`}}>
      {children}
    </div>
  </AbsoluteFill>;
};

/** Full-stage set layer (135x240 PNG). */
export const SetLayer: React.FC<{src: string; style?: React.CSSProperties}> = ({src, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, imageRendering: 'pixelated', ...style}} />
);
