import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {timing} from './theme';
import {clamp} from './world';

export type Atlas = {
  image: string; cell: [number, number]; pivot: [number, number]; sheet: [number, number];
  frames: Record<string, {x: number; y: number; w: number; h: number}>;
};

/** A pose key. `pose` is "<arms>.<face>" (breathing b0/b1 is added automatically)
 * or a full frame name ("turn1.creepy.b0", "blinds3"). Keys are stepped (held). */
export type PoseKey = {at: number; pose: string};

export const poseAt = (f: number, keys: PoseKey[]) => {
  let cur = keys[0];
  for (const k of keys) if (f >= k.at) cur = k;
  return cur;
};

/** back -> front turnaround on twos/threes, ending on "down.<face>". */
export const turnKeys = (at: number, face: string, step = 3): PoseKey[] => [
  {at, pose: `turn1.${face}`}, {at: at + step, pose: `turn2.${face}`}, {at: at + step * 2, pose: `down.${face}`},
];

/**
 * PixelSprite: crisp atlas frame placed by its PIVOT (feet) in art-pixel coordinates.
 * - pose changes are stepped (true pixel animation), with an optional 3-frame
 *   squash on change so the snap reads as a deliberate accent;
 * - breathing toggles b0/b1 every `timing.breathe` frames (phase-shiftable);
 * - auto-blink swaps to the "blink" face briefly unless disabled;
 * - x/y/opacity can be fractional: the sprite glides smoothly in screen space.
 */
export const PixelSprite: React.FC<{
  atlas: Atlas; keys?: PoseKey[]; frame?: string; x: number; y: number; flip?: boolean;
  breathe?: boolean; phase?: number; blink?: boolean; squash?: boolean; opacity?: number;
  scale?: number; style?: React.CSSProperties;
}> = ({atlas, keys, frame, x, y, flip, breathe = true, phase = 0, blink = true, squash = true, opacity = 1, scale = 1, style}) => {
  const f = useCurrentFrame();
  let name = frame ?? '';
  let changedAt = -999;
  if (keys) {
    const k = poseAt(f, keys);
    changedAt = k.at;
    name = k.pose;
    const parts = name.split('.');
    if (parts.length === 2) {
      let [arms, face] = parts;
      const t = f + phase;
      if (blink && !['creepy', 'blink', 'shock'].includes(face) && t % timing.blinkEvery < 4 && f - k.at > 6) face = 'blink';
      const bob = breathe ? Math.floor(t / timing.breathe) % 2 : 0;
      name = `${arms}.${face}.b${bob}`;
    }
  }
  const fr = atlas.frames[name];
  if (!fr) throw new Error(`Missing sprite frame "${name}" in ${atlas.image}`);
  const [cw, ch] = atlas.cell, [px, py] = atlas.pivot;
  const d = f - changedAt;
  const sq = squash && d >= 0 && d < 4 ? interpolate(d, [0, 1, 4], [1, 0.92, 1], clamp) : 1;
  return <div style={{position: 'absolute', left: x - px * scale, top: y - py * scale, width: cw * scale, height: ch * scale,
    overflow: 'hidden', opacity, transformOrigin: `${px * scale}px ${py * scale}px`,
    transform: `scale(${(flip ? -1 : 1) * (2 - sq)}, ${sq})`, ...style}}>
    <Img src={staticFile(`sprites/${atlas.image}`)} style={{position: 'absolute', left: -fr.x * scale, top: -fr.y * scale,
      width: atlas.sheet[0] * scale, height: atlas.sheet[1] * scale, imageRendering: 'pixelated', maxWidth: 'none'}} />
  </div>;
};

/** 3x5 pixel font for in-world signage/LED digits (drawn as crisp rects). */
const F: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  ':': '000010000010000', 'A': '010101111101101', 'M': '101111111101101', 'P': '110101110100100', ' ': '000000000000000',
};
export const PixelText: React.FC<{text: string; x: number; y: number; color: string; glow?: string; blinkColon?: boolean}> = ({text, x, y, color, glow, blinkColon}) => {
  const f = useCurrentFrame();
  let cx = x;
  const rects: React.ReactNode[] = [];
  for (const ch of text.toUpperCase()) {
    const g = F[ch] ?? F[' '];
    const hide = blinkColon && ch === ':' && Math.floor(f / 15) % 2 === 1;
    if (!hide) for (let i = 0; i < 15; i++) if (g[i] === '1')
      rects.push(<div key={`${cx}-${i}`} style={{position: 'absolute', left: cx + (i % 3), top: y + Math.floor(i / 3), width: 1, height: 1, background: color}} />);
    cx += ch === ':' ? 3 : 4;
  }
  return <div style={{position: 'absolute', left: 0, top: 0, filter: glow ? `drop-shadow(0 0 1.5px ${glow})` : undefined}}>{rects}</div>;
};
