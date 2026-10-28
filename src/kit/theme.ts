// Pixel Dread tokens. Screen 1080x1920 @30fps; world = 135x240 art px at PX=8.
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const ART_W = 135;
export const ART_H = 240;
export const PX = W / ART_W; // 8 screen px per art px at camera zoom 1

export const color = {
  night: '#070a12',
  ink: '#0b0c11',
  white: '#ffffff',
  keyYellow: '#ffcf3a', // neutral emphasis (time, numbers, things)
  keyRed: '#ff3b3b', // danger / wrongness
  keyGreen: '#5fd38a', // safe / relief
  alertRed: '#ff2d3d',
  moon: 'rgba(120,160,255,1)',
  phone: 'rgba(160,215,255,1)',
  warm: 'rgba(255,200,110,1)',
  ghost: 'rgba(225,235,255,1)',
  hudChip: 'rgba(16,18,26,0.82)',
  hudChipBorder: 'rgba(255,255,255,0.14)',
} as const;

export const font = {
  caption: 'Anton, Impact, sans-serif', // heavy condensed caps
  pixel: 'Silkscreen, monospace', // HUD + pixel UI
  ui: 'Inter, system-ui, sans-serif', // phone UI
  mono: '"JetBrains Mono", monospace',
} as const;

export const caption = {
  size: 92,
  centerY: 0.64, // fraction of H
  maxWidth: 900,
  stroke: 14,
} as const;

// Frames @30fps. Pixel sprites change pose on "twos/threes"; everything else is smooth.
export const timing = {
  breathe: 22, // frames per breathing pose (b0/b1)
  blinkEvery: 75,
  wordPop: 4,
  cardIn: 9,
  flash: 3,
} as const;
