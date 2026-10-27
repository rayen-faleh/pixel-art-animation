---
name: pixel-dread-style
description: Pixel-art survival-horror storytime style for remotion-video-studio: second-person shorts with reusable pixel sprite cast, smooth camera/light effects, word-pop captions, HUD and choice ending.
---

# Pixel Dread Style

A style layer for `remotion-video-studio`, not a replacement. Run its workflow
(brief → script → narration → timing → shotbook → build → five-pass QA → delivery)
and let this file decide the look, characters, motion grammar, captions, HUD,
sound and the style QA gate. Facts, rights, alignment and verification rules of
the core skill always win.

Origin: measured analysis of a 100 s, 720×1280, 30 fps second-person horror short
(round-head cast, night suburb, emergency alert, inventory HUD, "YOUR CALL" ending).
This skill keeps its staging, pacing and overlay system but replaces the flat-vector
characters with **2D pixel sprites** while keeping every camera move, light and
effect smooth. Observations come from frames, frame differences and audio statistics;
the reference audio was not listened to.

## 1. The core principle: crisp pixels, smooth world

| Layer | Treatment |
| --- | --- |
| Characters, props, sets | Native pixel art (no anti-aliasing), scaled with `image-rendering: pixelated`. Poses change in **steps** (held drawings, turns on threes), like real sprite animation. |
| Camera, positions, lights, tints, rings, UI, captions | Smooth 30 fps, sub-pixel, eased or sprung. Never quantised. |

One art pixel = 8 screen px at camera zoom 1 (world 135×240 art px → 1080×1920).
Close-ups come from **camera zoom on the whole world**, never by scaling one sprite,
so every shot keeps one consistent pixel density. Light is never baked into PNGs;
`Glow`, `Beam`, `Tint` add it at full resolution so it can flicker, pulse and move.

## 2. Inquiry shortcut

The style is fixed; ask only:
1. Premise and the single rule of the threat ("do not look at the sky", "do not open the door").
2. Series name and part number for the HUD tag; the status line (day/night + clock).
3. Inventory/resources to track in chips (phone %, water, signal, door) and when they change.
4. Ending choice labels (default two options) and runtime (default 15–100 s).
5. Voice: default Kokoro `am_onyx`, speed 1.2, with dramatic pauses — confirm or name another.

## 3. Script shape

- Second person, present tense, short declaratives. Open on a precise time ("It's 3:07 AM.").
- Escalation ladder: normal → signal (phone/alert) → rule → first sign → proof it's wrong
  → wider threat → personal stakes → choice. One beat per sentence.
- Phrases of 1–7 words; pauses carry dread (0.2–0.6 s between sentences; longer before reveals).
- Keywords per phrase: **yellow** for neutral emphasis (times, numbers, objects), **red** for danger/wrongness.
- End on "Your call." + two choice pills. Never present fiction as real news or real alerts.
- Original premise, series name and alert text — never reuse the reference's ("Eyes Down", sky alert, etc.).

## 4. Shot grammar (observed)

- **Hard cuts** between settings, each 2–6 s; a 1-frame snap-zoom or flash marks a shock.
- Inside a shot the camera **creeps** (slow push-in) or **reveals** (pull-back that exposes
  the threat: crowd, sign, light in the sky). Reveal = cut-tight → hold → ease out wide.
- Repeated establishing shot of the street/house returns with new information each time.
- Insert shots: phone UI (alert, chat), inventory still life, big time card.
- Threat language: glowing white eyes, too-wide smiles, figures standing still in a row,
  light from above, sound rings. Stillness of the threat vs. small nervous motion of the hero.

## 5. Character system (Appendix C; component in Appendix J)

- Cell 32×40 art px, pivot at feet `[16,39]`. Round head (r=8) with top-left light,
  1 px dark outline, hoodie torso with shade column, round hands, short legs.
- Frame names: `<arms>.<face>.b<0|1>`; arms = `down phone open up cover reach`;
  faces = `neutral worried scared shock lookup blink creepy smile`; plus `turn0..2.<face>`
  (back → front) and `walk0..3.<face>`.
- Variants: `hero` (warm head, hoodie) and `ghost_<colour>` (grey head, creepy face) for the
  changed/watchers; add more with `build_character(name, head, clothes)`.
- `<PixelSprite keys=[{at, pose:'phone.scared'}]>` steps poses, auto-breathes (b0/b1 every 22 f),
  auto-blinks (not on creepy/shock), and gives a 3-frame squash accent on each pose change.
- `turnKeys(at, face, 3)` = back → 3/4 → front on threes (the reveal turn).
- Acting rule: change pose **on the spoken word** that motivates it; hero reacts (worried →
  shock → scared → lookup), threats stay still and only turn or smile.
- New poses/faces: add to `ARMS`/`draw_face` in `characters.py`, rebuild; keep the 1 px outline,
  2-tone shading and the same light direction.

## 6. Sets and props (Appendix B/D)

- Sets are 135×240 PNG layers: `<set>_bg` behind actors, `<set>_fg` in front (blanket, posts).
- Draw with `pixelkit` primitives: dithered gradients (Bayer 4×4), rects, lines, `text3x5` signage.
- Night palette: navy walls `#121829`, wood `#3a2a24`, moonlit glass `#3d5688`, lawn `#16241c`.
- Characters must stay at believable scale: doors ≈ 2× character height.
- Props atlas (64×140 cells, bottom-centre pivot): `door`, `sold_sign`, `blinds0..6`, `water`, `cereal`.
- Shipped sets: `bedroom`, `hall`, `porch` (house front + neighbour's yard with SOLD sign).

## 7. Effects and overlays (Appendix E/F; world + camera in Appendix I)

| Need | Use |
| --- | --- |
| Phone/lamp/eye light | `Glow` (screen blend, optional flicker), `Beam` for window light |
| Mood | `Darken` 0.25–0.35 per shot, `Vignette` 0.8 |
| Alert | `Flash` red 4 f + `Tint` red pulse (18 f period, peak ≈ 0.32) + `AlertCard` spring-up with shake |
| Knock/impact | `useHits` decaying shake on the object + camera shake 0.35 + `Rings` (thin, faint) + `Dust` |
| Reveal | 1–3 frame white/red `Flash`, snap push, then pull-back |
| Status | `Hud`: red series tag + yellow part, pixel-font status line, inventory chips that pop in and flash on change |
| Phone inserts | `AlertCard`, `Chat` (generic UI, no real-OS branding) |
| Time skip | `TimeCard` big time drop-in |
| Ending | `Choice` title + two pills popping on the last words |

Captions (`WordCaption`): words **appear as spoken** (no dim preview), pop 1.35→1 in 4 frames
with back-ease, Anton caps 92 px, 14 px dark stroke + hard drop shadow, centred at 64 % height,
max 900 px wide. Phrase replaces instantly. Exclude the final "Your call." (shown by `Choice`).

## 8. Voice and sound (Appendix G/H)

- Kokoro via `kokoro_narrate.py` (exposed duration tensor = real word timings; per-sentence
  `pause`). Default `am_onyx`, speed 1.2. Words espeak merges are flagged `approx`; never on keywords.
- Narration: `highpass 60, acompressor 2.5:1, loudnorm I=-15`.
- `sfx_mix.py` synthesises an original kit (drone bed with swells and a cut before the choice,
  phone buzz, two-tone alert, knock, sting, boom, riser, UI pop, tick) and places events on
  word anchors from `cues.json`. Final mix ≈ −14 LUFS (reference −14.4), peak ≤ −1.5 dBFS.
- Put SFX on actions (buzz on "buzzes", knocks on "knocks", sting on the turn, boom on the proof).

## 9. Build commands

```sh
python3 kit/characters.py public/sprites      # cast atlases (+ JSON)
python3 kit/sets.py public                    # set layers + props atlas
python3 scripts/kokoro_narrate.py script.json audio/raw --voice am_onyx --speed 1.2
ffmpeg -i audio/raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/narration.wav
python3 scripts/sfx_mix.py audio/narration.wav cues.json audio/mix_pre.wav --length 15
# normalise mix_pre to -14 LUFS -> public/audio/mix.wav ; copy audio/raw/timing.json -> src/timing.json
npx remotion render src/index.ts <Comp> out/film.mp4 --codec=h264 --crf=18 --x264-preset=veryfast
```

Shot timing: shot boundaries = first word of the phrase − 2..3 frames; every cue is
`Math.round(word.s * 30) − shotStart`. The sample `src/film/Film.tsx` in the kit shows a
complete 15 s film (bedroom → hall → porch reveal → choice).

## 10. Style QA gate

Render stills of every shot, then per-frame strips around the alert, an impact, the turn
reveal and the pull-back. Confirm:
- [ ] Pixel layers are crisp at every zoom (no blurred sprites); lights/camera are smooth.
- [ ] One pixel density per shot (no individually scaled sprites).
- [ ] Poses change on their spoken words; threats stay still; hero breathes and blinks.
- [ ] Words pop on aligned starts; yellow/red used by meaning; captions clear of faces.
- [ ] HUD chips appear/flash exactly when the story changes them.
- [ ] Nothing important cropped at reveal endpoints (signs, clocks, faces).
- [ ] Mix measured (≈ −14 LUFS) and listened to when possible; state if not.

---

## Appendix A: theme.ts

Save as `src/kit/theme.ts`.

```typescript
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
```

## Appendix B: pixelkit.py

Save as `kit/pixelkit.py`.

```python
"""pixelkit: tiny deterministic pixel-art toolkit for sprite sheets and set layers.

Everything is drawn at native art resolution (1 art pixel = 1 PNG pixel) and scaled
up in Remotion with `image-rendering: pixelated`. No anti-aliasing anywhere here.
"""
from __future__ import annotations
import json, math, os
from PIL import Image

RGBA = tuple[int, int, int, int]


def hexc(h: str, a: int = 255) -> RGBA:
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


class Canvas:
    def __init__(self, w: int, h: int):
        self.w, self.h = w, h
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.px = self.img.load()

    # --- primitives -------------------------------------------------------
    def put(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            self.px[x, y] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[x, y]
        return (0, 0, 0, 0)

    def rect(self, x0, y0, x1, y1, c):  # inclusive
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, c)

    def hline(self, x0, x1, y, c):
        self.rect(min(x0, x1), y, max(x0, x1), y, c)

    def vline(self, x, y0, y1, c):
        self.rect(x, min(y0, y1), x, max(y0, y1), c)

    def line(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.put(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def disc(self, cx, cy, r, c):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6:
                    self.put(x, y, c)

    def thick(self, x0, y0, x1, y1, r, c):
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
        for i in range(n + 1):
            t = i / n
            self.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c)

    def dither(self, x0, y0, x1, y1, c_a, c_b, t):
        """Ordered dither between two colours; t in 0..1 (share of c_b)."""
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, c_b if (BAYER4[y % 4][x % 4] + 0.5) / 16 < t else c_a)

    def vgradient(self, x0, y0, x1, y1, stops):
        """Dithered vertical gradient through a list of colours."""
        n = len(stops) - 1
        for y in range(int(y0), int(y1) + 1):
            f = (y - y0) / max(1, (y1 - y0)) * n
            i = min(n - 1, int(f)); t = f - i
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, stops[i + 1] if (BAYER4[y % 4][x % 4] + 0.5) / 16 < t else stops[i])

    def outline(self, c, diagonal=False):
        """1px outline around all opaque pixels (exterior only)."""
        src = self.img.copy().load()
        nb = [(-1, 0), (1, 0), (0, -1), (0, 1)] + ([(-1, -1), (1, -1), (-1, 1), (1, 1)] if diagonal else [])
        for y in range(self.h):
            for x in range(self.w):
                if src[x, y][3] == 0 and any(0 <= x + dx < self.w and 0 <= y + dy < self.h and src[x + dx, y + dy][3] > 0 for dx, dy in nb):
                    self.px[x, y] = c

    def paste(self, other: 'Canvas', ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                p = other.px[x, y]
                if p[3] > 0:
                    self.put(ox + x, oy + y, p)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.img.save(path)


class Atlas:
    """Fixed-cell sprite sheet + JSON (frame -> x,y,w,h; shared pivot)."""

    def __init__(self, cell_w, cell_h, pivot, cols=16):
        self.cw, self.ch, self.pivot, self.cols = cell_w, cell_h, pivot, cols
        self.frames: list[tuple[str, Canvas]] = []

    def add(self, name, cv: Canvas):
        assert cv.w == self.cw and cv.h == self.ch, name
        self.frames.append((name, cv))

    def write(self, png_path, json_path, meta=None):
        rows = math.ceil(len(self.frames) / self.cols)
        sheet = Canvas(self.cw * min(self.cols, len(self.frames)), self.ch * rows)
        index = {}
        for i, (name, cv) in enumerate(self.frames):
            x, y = (i % self.cols) * self.cw, (i // self.cols) * self.ch
            sheet.paste(cv, x, y)
            index[name] = {'x': x, 'y': y, 'w': self.cw, 'h': self.ch}
        sheet.save(png_path)
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        json.dump({'image': os.path.basename(png_path), 'cell': [self.cw, self.ch], 'pivot': self.pivot,
                   'sheet': [sheet.w, sheet.h], 'frames': index, **(meta or {})}, open(json_path, 'w'), indent=1)
        return sheet


# 3x5 pixel font (caps, digits, a few symbols) for baked signage.
FONT3x5 = {
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
    'E': '111100110100111', 'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101',
    'I': '111010010010111', 'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
    'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
    'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
    'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
    'Y': '101101010010010', 'Z': '111001010100111', '0': '111101101101111', '1': '010110010010111',
    '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110',
    '6': '011100110101010', '7': '111001010010010', '8': '010101010101010', '9': '010101011001110',
    ':': '000010000010000', '.': '000000000000010', '!': '010010010000010', '?': '110001010000010',
    '-': '000000111000000', ' ': '000000000000000', '%': '101001010100101',
}


def text3x5(cv, x, y, s, c, gap=1):
    for ch in s.upper():
        g = FONT3x5.get(ch, FONT3x5['?'])
        for i, bit in enumerate(g):
            if bit == '1':
                cv.put(x + i % 3, y + i // 3, c)
        x += 3 + gap
    return x
```

## Appendix C: characters.py

Save as `kit/characters.py`.

```python
"""Pixel character generator: round-head cast, front/turn/back views, arm poses,
faces, 2-frame breathing and a 4-frame walk. Output: one sprite sheet + JSON per
character variant. Frame names: "<arms>.<face>.<bob>" e.g. "phone.scared.b1",
"turn1.creepy.b0" (back -> front: turn0 back, turn1, turn2, then "down.<face>"),
"walk2.neutral.b0".
"""
from pixelkit import Canvas, Atlas, hexc

CW, CH = 32, 40              # cell size (art pixels)
PIVOT = [16, 39]             # feet centre: anchor used by <PixelSprite>
OUT = hexc('#14151b')
EYE = hexc('#1b1c24')
MOUTH_IN = hexc('#7a1f2b')
SWEAT = hexc('#9fd6ff')
PHONE_SCREEN = hexc('#9fd8ff')
PANTS = hexc('#262833')

HEADS = {
    'warm': (hexc('#f1ece2'), hexc('#d2cabb'), hexc('#ffffff')),   # protagonist
    'ghost': (hexc('#b9bdc7'), hexc('#959aa6'), hexc('#d8dbe2')),  # the changed ones
}
CLOTHES = {
    'hoodie': (hexc('#6b7286'), hexc('#545a6b')),
    'olive': (hexc('#4e5a3a'), hexc('#3d472d')),
    'maroon': (hexc('#5c2f38'), hexc('#47232b')),
    'navy': (hexc('#2f3b5c'), hexc('#242d47')),
    'brown': (hexc('#5c4632'), hexc('#473626')),
    'teal': (hexc('#2f5c57'), hexc('#244744')),
    'plum': (hexc('#4b3a5c'), hexc('#3a2c47')),
}

FACES = ['neutral', 'worried', 'scared', 'shock', 'lookup', 'blink', 'creepy', 'smile']
# shoulder -> elbow -> hand for (left, right); y offsets get the breathing dy added.
ARMS = {
    'down':  [((10, 22), (9, 27), (9, 32)), ((22, 22), (23, 27), (23, 32))],
    'phone': [((10, 22), (9, 29), (13, 28)), ((22, 22), (23, 29), (19, 28))],
    'open':  [((10, 22), (6, 22), (2, 17)), ((22, 22), (26, 22), (30, 17))],
    'up':    [((10, 22), (9, 27), (9, 32)), ((22, 22), (26, 15), (26, 7))],
    'cover': [((10, 22), (9, 28), (13, 17)), ((22, 22), (23, 28), (19, 17))],
    'reach': [((10, 22), (9, 27), (9, 32)), ((22, 22), (26, 24), (30, 23))],
}


def head_mask(cx, cy, r=8):
    return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6


def draw_head(cv, cx, cy, head):
    base, shade, hi = head
    inside = head_mask(cx, cy)
    for y in range(cy - 9, cy + 10):
        for x in range(cx - 9, cx + 10):
            if inside(x, y):
                # light from top-left: crescent shade bottom-right
                lit = (x - cx + 2.6) ** 2 + (y - cy + 2.6) ** 2 <= 8 * 8 + 3
                cv.put(x, y, base if lit else shade)
    cv.put(cx - 4, cy - 5, hi); cv.put(cx - 5, cy - 4, hi); cv.put(cx - 4, cy - 4, hi)


def draw_face(cv, kind, cx, cy, ox, head):
    inside = head_mask(cx, cy, 7)
    def p(x, y, c):
        if inside(x, y):
            cv.put(x, y, c)
    ex = [cx - 3 + ox, cx + 3 + ox]
    w = (255, 255, 255, 255)

    def eye(x, y0, h=3, wd=2, shine=True):
        for yy in range(y0, y0 + h):
            for xx in range(x - wd + 1, x + 1):
                p(xx, yy, EYE)
        if shine:
            p(x - wd + 1, y0, w)

    def brows(lift, slope):  # slope>0: inner ends raised (worry)
        for i, e in enumerate(ex):
            d = -1 if i == 0 else 1
            for k in range(3):
                xx = e - 1 + k if i == 0 else e - 1 + k
                inner = (k == 2) if i == 0 else (k == 0)
                yy = cy - lift - (slope if inner else 0)
                p(xx, yy, EYE)
                if k == 1: p(xx, yy - (slope if slope else 0) * 0, EYE)

    if kind == 'neutral':
        for e in ex: eye(e, cy - 1)
        for x in range(cx - 1 + ox, cx + 2 + ox): p(x, cy + 4, EYE)
    elif kind == 'smile':
        for e in ex: eye(e, cy - 1)
        for x, y in [(-2, 4), (-1, 5), (0, 5), (1, 5), (2, 4)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'worried':
        for e in ex: eye(e, cy - 1)
        brows(4, 1)
        for x, y in [(-2, 5), (-1, 4), (0, 5), (1, 4), (2, 5)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'scared':
        for e in ex: eye(e, cy - 2, h=4, wd=3)
        brows(4, 1)
        for y in range(cy + 3, cy + 7):
            for x in range(cx - 1 + ox, cx + 2 + ox): p(x, y, EYE)
        p(cx + ox, cy + 4, MOUTH_IN); p(cx + ox, cy + 5, MOUTH_IN)
        if inside(cx + 7, cy - 5) or True:
            cv.put(cx + 8, cy - 6, SWEAT); cv.put(cx + 8, cy - 5, SWEAT); cv.put(cx + 7, cy - 5, SWEAT)
    elif kind == 'shock':
        for e in ex:
            p(e, cy, EYE); p(e, cy - 1, EYE)
        brows(5, 0)
        for y in range(cy + 3, cy + 7):
            for x in range(cx + ox, cx + 2 + ox): p(x, y, EYE)
        p(cx + ox, cy + 4, MOUTH_IN); p(cx + 1 + ox, cy + 4, MOUTH_IN)
    elif kind == 'lookup':
        for e in ex: eye(e, cy - 3)
        brows(5, 1)
        for x, y in [(-1, 4), (0, 4), (1, 4), (-1, 5), (1, 5), (0, 6)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'blink':
        for e in ex:
            for x in range(e - 2, e + 1): p(x, cy + 1, EYE)
        brows(3, 1)
        for x, y in [(-2, 5), (-1, 4), (0, 5), (1, 4), (2, 5)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'creepy':
        bright = (255, 255, 255, 255)
        for e in ex:
            for yy in (cy - 1, cy):
                for xx in (e - 2, e - 1, e): p(xx, yy, bright)
            for xx in (e - 2, e - 1, e): p(xx, cy + 1, head[1])
        for x, y in [(-5, 3), (-4, 4), (-3, 5), (-2, 5), (-1, 5), (0, 5), (1, 5), (2, 5), (3, 5), (4, 4), (5, 3)]:
            p(cx + x + ox, cy + y, EYE)


def draw_arm(cv, sh, el, hd, cloth, head, dy):
    (sx, sy), (exx, ey), (hx, hy) = sh, el, hd
    sy, ey, hy = sy + dy, ey + dy, hy + dy
    cv.thick(sx, sy, exx, ey, 2.2, OUT); cv.thick(exx, ey, hx, hy, 2.2, OUT)
    cv.thick(sx, sy, exx, ey, 1.2, cloth[0]); cv.thick(exx, ey, hx, hy, 1.2, cloth[0])
    cv.disc(hx, hy, 2.2, OUT); cv.disc(hx, hy, 1.3, head[0])


def body(cv, cloth, dy, legs='stand', walk=0):
    base, shade = cloth
    # legs
    if legs == 'stand':
        cv.rect(11, 35, 14, 38, PANTS); cv.rect(18, 35, 21, 38, PANTS)
    elif legs == 'walk':
        l_up, r_up = [(0, 1), (0, 0), (1, 0), (0, 0)][walk]
        cv.rect(11, 35, 14, 38 - l_up, PANTS); cv.rect(18, 35, 21, 38 - r_up, PANTS)
    # torso: rounded shoulders, shade column right, collar shadow under head
    top = 19 + dy
    cv.rect(9, top + 2, 23, 35, base)
    cv.rect(10, top + 1, 22, top + 1, base); cv.rect(11, top, 21, top, base)
    cv.rect(20, top + 2, 23, 35, shade); cv.rect(20, top + 1, 22, top + 1, shade)
    cv.rect(12, top, 20, top + 1, shade)          # collar / head shadow
    cv.rect(13, 31, 19, 31, shade)               # pocket seam


def build_frame(head, cloth, arms='down', face='neutral', dy=0, view='front', ox=0, legs='stand', walk=0):
    b = Canvas(CW, CH)
    body(b, cloth, dy, legs, walk)
    a = ARMS[arms]
    if view == 'front' and arms != 'cover':
        if arms == 'phone':  # phone in both hands, screen faces the character
            b.rect(13, 22 + dy, 19, 31 + dy, OUT); b.rect(14, 23 + dy, 18, 30 + dy, (52, 58, 74, 255)); b.rect(15, 23 + dy, 17, 23 + dy, (90, 98, 120, 255))
        for side in a:
            draw_arm(b, *side, cloth, head, dy)
    elif view != 'front':
        for side in ARMS['down']:
            draw_arm(b, *side, cloth, head, dy)
    b.outline(OUT)
    h = Canvas(CW, CH)
    draw_head(h, 16, 10 + dy, head)
    h.outline(OUT)
    b.paste(h, 0, 0)
    if view != 'back':
        draw_face(b, face, 16, 10 + dy, ox, head)
    if arms == 'cover' and view == 'front':
        for side in a:
            draw_arm(b, *side, cloth, head, dy)
    if arms == 'phone' and view == 'front':
        # screen glow spill on the chin (light source is the phone)
        for x in range(13, 20):
            if b.get(x, 18 + dy)[3] and b.get(x, 18 + dy)[:3] == head[1][:3]:
                b.put(x, 18 + dy, head[0])
    return b


def build_character(name, head_key, cloth_key, out_dir, faces=FACES, arms=list(ARMS)):
    head, cloth = HEADS[head_key], CLOTHES[cloth_key]
    at = Atlas(CW, CH, PIVOT, cols=16)
    for ar in arms:
        for fc in faces:
            for bob in (0, 1):
                at.add(f'{ar}.{fc}.b{bob}', build_frame(head, cloth, ar, fc, bob))
    # turnaround back -> front (front is "down.<face>")
    for fc in faces:
        for bob in (0, 1):
            at.add(f'turn0.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='back'))
            at.add(f'turn1.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='turn', ox=7))
            at.add(f'turn2.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='turn', ox=4))
    for fc in faces:
        for k in range(4):
            at.add(f'walk{k}.{fc}.b0', build_frame(head, cloth, 'down', fc, [0, 1, 0, 1][k], legs='walk', walk=k))
    at.write(f'{out_dir}/{name}.png', f'{out_dir}/{name}.json',
             {'character': name, 'head': head_key, 'clothes': cloth_key,
              'faces': faces, 'arms': arms, 'naming': '<arms|turnN|walkN>.<face>.b<0|1>'})
    return at


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/sprites'
    build_character('hero', 'warm', 'hoodie', out)
    for c in ['olive', 'maroon', 'navy', 'brown', 'teal', 'plum']:
        build_character(f'ghost_{c}', 'ghost', c, out)
    print('characters ->', out)
```

## Appendix D: sets.py

Save as `kit/sets.py`.

```python
"""Pixel sets (135x240 art px = 1080x1920 at 8x) and props.

Each set is split into layers so characters can stand between them:
  <set>_bg.png   everything behind the actors
  <set>_fg.png   occluders in front of the actors (blanket, railing...)
Smooth lighting (moonlight, phone glow, porch light, alert tint) is NOT baked in:
Remotion adds it at full resolution so it can animate smoothly.
"""
import json, sys, random
from pixelkit import Canvas, Atlas, hexc, text3x5

SW, SH = 135, 240
OUT = hexc('#0b0c11')


def bedroom(out):
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 200, [hexc('#0e1322'), hexc('#151c31'), hexc('#121829')])
    # window with moonlit glass, mullions, sill
    bg.rect(38, 26, 97, 92, hexc('#2a3250'))
    bg.vgradient(41, 29, 94, 89, [hexc('#3d5688'), hexc('#2b3f68'), hexc('#1f2d4d')])
    for x in range(41, 95, 9):                      # far rooftops through the glass
        bg.rect(x, 78 - (x * 7) % 9, x + 7, 89, hexc('#141c30'))
    bg.rect(67, 29, 68, 89, hexc('#2a3250')); bg.rect(41, 58, 94, 59, hexc('#2a3250'))
    bg.rect(35, 92, 100, 95, hexc('#2f3756'))
    # curtains with folds
    for x0, x1 in ((24, 44), (91, 111)):
        bg.rect(x0, 20, x1, 112, hexc('#1b2240'))
        for x in range(x0 + 2, x1, 4):
            bg.vline(x, 22, 112, hexc('#151b33'))
        bg.hline(x0, x1, 20, hexc('#2a3256'))
    bg.rect(20, 17, 115, 19, hexc('#3a3f58'))        # curtain rod
    # headboard + pillow
    bg.rect(16, 118, 119, 170, hexc('#3a2a24'))
    bg.rect(16, 116, 119, 118, hexc('#4a362e')); bg.rect(20, 124, 115, 166, hexc('#33241f'))
    bg.rect(26, 136, 109, 158, hexc('#8e97ab')); bg.rect(26, 154, 109, 158, hexc('#737c91'))
    bg.rect(28, 134, 107, 135, hexc('#a3abbd'))
    # nightstand + LED clock housing
    bg.rect(0, 160, 22, 200, hexc('#2b201c')); bg.rect(0, 158, 23, 160, hexc('#3a2b25'))
    bg.rect(2, 164, 20, 173, hexc('#07080b'))
    bg.rect(2, 180, 20, 181, hexc('#1f1714'))
    # floor
    bg.vgradient(0, 200, SW - 1, SH - 1, [hexc('#10131f'), hexc('#0a0c14')])
    bg.save(f'{out}/bedroom_bg.png')

    fg = Canvas(SW, SH)
    # blanket with wavy top edge and folds
    for x in range(10, 126):
        top = 180 + int(2 * __import__('math').sin(x / 6))
        fg.rect(x, top, x, 212, hexc('#3b4766'))
        if x % 11 in (0, 1):
            fg.rect(x, top + 3, x, 212, hexc('#323c58'))
    fg.rect(10, 206, 125, 212, hexc('#2c3550'))
    fg.rect(8, 212, 127, 222, hexc('#3a2a24')); fg.rect(8, 212, 127, 213, hexc('#4a362e'))
    fg.save(f'{out}/bedroom_fg.png')


def hall(out):
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 196, [hexc('#151a28'), hexc('#1b2133'), hexc('#161b2a')])
    for y in range(8, 196, 12):                     # wainscot lines
        bg.hline(0, SW - 1, y, hexc('#171c2c'))
    # door frame (door itself is a prop so it can shake)
    bg.rect(46, 116, 89, 198, hexc('#2e2a2c')); bg.rect(48, 118, 87, 198, hexc('#0d0e13'))
    bg.rect(18, 70, 40, 98, hexc('#2a2228')); bg.rect(20, 72, 38, 96, hexc('#1c2336'))   # framed picture
    bg.rect(24, 80, 34, 92, hexc('#283250')); bg.rect(95, 150, 98, 156, hexc('#3a3c48'))  # light switch
    # side window with blinds slot (blinds are a prop)
    bg.rect(102, 104, 129, 168, hexc('#2a3044')); bg.vgradient(104, 106, 127, 166, [hexc('#24314f'), hexc('#1a243b')])
    # floor boards + rug
    bg.vgradient(0, 197, SW - 1, SH - 1, [hexc('#1b1716'), hexc('#110f0f')])
    for y in range(203, SH, 7):
        bg.hline(0, SW - 1, y, hexc('#0e0c0c'))
    bg.rect(44, 202, 92, 212, hexc('#3b2328')); bg.rect(46, 204, 90, 210, hexc('#47292f'))
    bg.save(f'{out}/hall_bg.png')


def porch(out):
    rnd = random.Random(7)
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 150, [hexc('#070a14'), hexc('#0d1424'), hexc('#18233b')])
    for _ in range(30):
        bg.put(rnd.randrange(SW), rnd.randrange(100), hexc('#8d9bbd'))
    for x0, w, h in ((0, 22, 40), (112, 23, 46)):                  # far roofs
        bg.rect(x0, 150 - h, x0 + w, 152, hexc('#0b0f1b'))
    # our house: gable roof, siding, two windows, door, porch lamp
    for i in range(30):
        bg.hline(20 + i * 2, 114 - i * 2, 100 - i, hexc('#191a22'))
    bg.rect(22, 100, 112, 202, hexc('#2f3140'))
    for y in range(102, 202, 4):
        bg.hline(22, 112, y, hexc('#282a37'))
    bg.rect(18, 98, 116, 101, hexc('#24252f'))
    for wx in (28, 88):
        bg.rect(wx, 128, wx + 18, 152, hexc('#121624')); bg.rect(wx + 1, 129, wx + 17, 151, hexc('#1c2640'))
        bg.vline(wx + 9, 129, 151, hexc('#121624')); bg.hline(wx + 1, wx + 17, 140, hexc('#121624'))
    bg.rect(52, 150, 82, 202, hexc('#211a1a'))                      # door recess
    bg.rect(54, 152, 80, 202, hexc('#3a2a24'))
    bg.rect(60, 156, 74, 166, hexc('#191a22')); bg.rect(61, 157, 73, 165, hexc('#2d3a5c'))
    for (x0, y0, x1, y1) in ((57, 170, 66, 184), (68, 170, 77, 184), (57, 187, 66, 199), (68, 187, 77, 199)):
        bg.rect(x0, y0, x1, y1, hexc('#32241f'))
    bg.rect(76, 180, 77, 181, hexc('#c9a24a'))
    bg.rect(85, 156, 89, 164, hexc('#3a3424')); bg.rect(86, 157, 88, 163, hexc('#f2d27a'))
    # steps, lawn, sidewalk, street
    bg.vgradient(0, 202, SW - 1, 226, [hexc('#16241c'), hexc('#101a15')])
    bg.rect(46, 202, 88, 206, hexc('#3b3c48')); bg.rect(42, 207, 92, 211, hexc('#34353f'))
    bg.rect(0, 226, SW - 1, 229, hexc('#2d2f38')); bg.rect(0, 230, SW - 1, SH - 1, hexc('#14151b'))
    for x in range(4, SW, 16):
        bg.rect(x, 236, x + 7, 237, hexc('#4a4632'))
    # neighbour's yard (right): fence + SOLD sign (camera reveals it on pull-back)
    for x in range(116, SW, 4):
        bg.rect(x, 196, x + 1, 214, hexc('#3a3b46'))
    bg.hline(116, SW - 1, 200, hexc('#3a3b46')); bg.hline(116, SW - 1, 208, hexc('#3a3b46'))
    bg.rect(124, 206, 125, 224, hexc('#5a4632'))
    bg.rect(110, 194, 133, 208, hexc('#f0ece2')); bg.rect(111, 195, 132, 207, hexc('#c8323c'))
    text3x5(bg, 114, 198, 'SOLD', hexc('#f0ece2'))
    bg.save(f'{out}/porch_bg.png')

    fg = Canvas(SW, SH)
    for x in (40, 92):                                              # porch posts
        fg.rect(x, 166, x + 2, 211, hexc('#4a4b58')); fg.rect(x, 166, x + 2, 167, hexc('#5c5d6b'))
    fg.save(f'{out}/porch_fg.png')


def props(out):
    at = Atlas(64, 140, [32, 139], cols=8)
    # front door (hall, inside view): 38x80, panels, small window, knob
    d = Canvas(64, 140)
    d.rect(13, 59, 50, 138, hexc('#3a2a24')); d.rect(13, 59, 50, 60, hexc('#4a362e'))
    for (x0, y0, x1, y1) in ((17, 84, 30, 106), (33, 84, 46, 106), (17, 110, 30, 134), (33, 110, 46, 134)):
        d.rect(x0, y0, x1, y1, hexc('#32241f')); d.hline(x0, x1, y0, hexc('#2a1e1a')); d.vline(x0, y0, y1, hexc('#2a1e1a'))
    d.rect(22, 64, 41, 79, hexc('#191a22')); d.rect(23, 65, 40, 78, hexc('#2d3a5c'))
    d.rect(44, 106, 46, 108, hexc('#c9a24a')); d.put(44, 106, hexc('#f2d27a'))
    d.outline(OUT)
    at.add('door', d)
    # sold sign on a post
    s = Canvas(64, 140)
    s.rect(30, 70, 33, 139, hexc('#5a4632'))
    s.rect(6, 76, 57, 104, hexc('#f0ece2')); s.rect(8, 78, 55, 102, hexc('#c8323c'))
    text3x5(s, 24, 88, 'SOLD', hexc('#f0ece2'))
    s.outline(OUT)
    at.add('sold_sign', s)
    # blinds: 0 (up) .. 6 (fully down), 24x62 slot drawn inside a 64x140 cell
    for k in range(7):
        b = Canvas(64, 140)
        b.rect(18, 2, 45, 4, hexc('#8b8f9c'))
        for i in range(k * 4):
            b.hline(19, 44, 5 + i * 2, hexc('#b8bcc6') if i % 2 == 0 else hexc('#9a9eaa'))
        b.vline(31, 2, 5 + k * 8, hexc('#6f7380'))
        at.add(f'blinds{k}', b)
    # water bottle, cereal box, candle
    w = Canvas(64, 140)
    w.rect(27, 104, 36, 137, hexc('#3d7bd6')); w.rect(29, 98, 34, 104, hexc('#cfd8e6')); w.rect(29, 96, 34, 97, hexc('#e8eef6'))
    w.rect(27, 112, 36, 120, hexc('#2c5fae')); w.vline(28, 106, 135, hexc('#79a9ee')); w.outline(OUT)
    at.add('water', w)
    c = Canvas(64, 140)
    c.rect(18, 88, 46, 137, hexc('#c8913a')); c.rect(18, 88, 46, 100, hexc('#8a5a2a')); c.rect(40, 88, 46, 137, hexc('#a5762f'))
    c.outline(OUT)
    at.add('cereal', c)
    at.write(f'{out}/props.png', f'{out}/props.json', {'note': 'pivot = bottom centre of cell'})


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'out'
    bedroom(f'{out}/sets'); hall(f'{out}/sets'); porch(f'{out}/sets'); props(f'{out}/sprites')
    print('sets + props ->', out)
```

## Appendix E: effects.tsx

Save as `src/kit/effects.tsx`.

```tsx
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
```

## Appendix F: overlay.tsx

Save as `src/kit/overlay.tsx`.

```tsx
import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {caption, color, font, timing, H} from './theme';
import {clamp, ramp} from './world';

// ---------- word-append captions ----------
export type Word = {t: string; s: number; e?: number; key?: 'y' | 'r' | boolean; brk?: boolean};
export type Phrase = {start: number; end: number; words: Word[]};

export const phrasesFrom = (words: Word[], hold = 0.6, maxEnd?: number): Phrase[] => {
  const out: Phrase[] = []; let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    if (w.brk || i === words.length - 1) {
      const next = words[i + 1];
      out.push({start: cur[0].s - 0.03, end: next ? next.s - 0.03 : Math.min(maxEnd ?? 1e9, (w.e ?? w.s) + hold), words: cur});
      cur = [];
    }
  });
  return out;
};

/**
 * Caption: words APPEAR as spoken (no dim preview), each popping 1.35 -> 1 in 4
 * frames. Heavy condensed caps, white with a thick dark stroke; keywords yellow
 * (neutral emphasis) or red (danger). Phrase cuts off instantly when the next starts.
 */
export const WordCaption: React.FC<{phrases: Phrase[]; centerY?: number; size?: number}> = ({phrases, centerY = caption.centerY, size = caption.size}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = f / fps;
  const ph = phrases.find((p) => t >= p.start && t < p.end);
  if (!ph) return null;
  return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', top: centerY * H - H / 2, pointerEvents: 'none'}}>
    <div style={{maxWidth: caption.maxWidth, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.24em', rowGap: 0,
      fontFamily: font.caption, fontSize: size, lineHeight: 1.04, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1}}>
      {ph.words.map((w, i) => {
        const wf = Math.round(w.s * fps);
        if (f < wf) return null;
        const p = ramp(f, wf, timing.wordPop, Easing.out(Easing.back(2.2)));
        const c = w.key === 'r' ? color.keyRed : w.key ? color.keyYellow : color.white;
        return <span key={i} style={{display: 'inline-block', color: c, transform: `scale(${1.35 - 0.35 * p})`, opacity: Math.min(1, (f - wf + 1) / 2),
          WebkitTextStroke: `${caption.stroke}px ${color.ink}`, paintOrder: 'stroke fill',
          filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.55))'}}>{w.t}</span>;
      })}
    </div>
  </AbsoluteFill>;
};

// ---------- HUD ----------
export type Chip = {label: string; value: string; tone?: 'ok' | 'warn' | 'bad'; from?: number; changedAt?: number};
export const Hud: React.FC<{series: string; part: string; status: string; chips?: Chip[]; statusChangedAt?: number}> = ({series, part, status, chips = [], statusChangedAt}) => {
  const f = useCurrentFrame();
  const sc = statusChangedAt !== undefined ? Math.max(0, 1 - (f - statusChangedAt) / 10) : 0;
  return <div style={{position: 'absolute', left: 52, top: 120, fontFamily: font.pixel}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{background: color.alertRed, color: '#fff', fontSize: 26, fontWeight: 700, padding: '6px 14px 4px', borderRadius: 6, letterSpacing: 1}}>{series}</div>
      <div style={{color: color.keyYellow, fontSize: 24, fontWeight: 700}}>{part}</div>
    </div>
    <div style={{marginTop: 12, color: '#fff', fontSize: 26, letterSpacing: 1, textShadow: `0 0 ${sc * 18}px ${color.keyRed}`}}>{status}</div>
    <div style={{marginTop: 12, display: 'flex', gap: 10}}>
      {chips.filter((c) => c.from === undefined || f >= c.from).map((c, i) => {
        const inP = c.from !== undefined ? ramp(f, c.from, 6) : 1;
        const hot = c.changedAt !== undefined ? Math.max(0, 1 - (f - c.changedAt) / 14) * (f >= c.changedAt ? 1 : 0) : 0;
        const tone = c.tone === 'bad' ? color.keyRed : c.tone === 'warn' ? color.keyYellow : '#9fd8ff';
        return <div key={i} style={{background: color.hudChip, border: `2px solid ${hot > 0 ? tone : color.hudChipBorder}`, borderRadius: 6,
          padding: '6px 12px 4px', fontSize: 22, color: 'rgba(255,255,255,0.75)', opacity: inP, transform: `translateY(${(1 - inP) * -8}px) scale(${1 + hot * 0.12})`}}>
          {c.label} <span style={{color: tone}}>{c.value}</span>
        </div>;
      })}
    </div>
  </div>;
};

// ---------- phone alert card (generic, not any real OS) ----------
export const AlertCard: React.FC<{at: number; title: string; body: string; sub?: string; y?: number}> = ({at, title, body, sub, y = 1340}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {stiffness: 220, damping: 20}});
  const shake = Math.sin((f - at) * 3) * Math.max(0, 1 - (f - at) / 12) * 10;
  return <div style={{position: 'absolute', left: 90, right: 90, top: y + (1 - s) * 500 , transform: `translateX(${shake}px)`, opacity: Math.min(1, s * 1.5),
    background: 'rgba(28,29,36,0.96)', borderRadius: 36, padding: '30px 36px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', fontFamily: font.ui, color: '#fff'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, color: color.alertRed, fontWeight: 700, fontSize: 30, letterSpacing: 1}}>
      <svg width="40" height="36" viewBox="0 0 40 36"><path d="M20 2 L38 34 H2 Z" fill={color.alertRed} /><rect x="18" y="12" width="4" height="12" fill="#fff" /><rect x="18" y="27" width="4" height="4" fill="#fff" /></svg>
      {title}<span style={{marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 24}}>now</span>
    </div>
    <div style={{marginTop: 14, fontSize: 40, fontWeight: 700}}>{body}</div>
    {sub && <div style={{marginTop: 8, fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: 500}}>{sub}</div>}
  </div>;
};

/** Chat bubbles (incoming grey / outgoing blue), each pops in at its frame. */
export const Chat: React.FC<{name: string; msgs: {at: number; text: string; out?: boolean; failed?: boolean}[]}> = ({name, msgs}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 170, right: 170, top: 380, height: 1000, borderRadius: 70, background: '#121318', border: '6px solid #24262e', fontFamily: font.ui, padding: '60px 34px'}}>
    <div style={{textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 34}}>{name}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40}}>
      {msgs.filter((m) => f >= m.at).map((m, i) => {
        const s = spring({frame: f - m.at, fps, config: {stiffness: 260, damping: 18}});
        return <div key={i} style={{alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth: '78%', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: m.out ? 'right' : 'left', opacity: s}}>
          <div style={{background: m.out ? '#2f7cf6' : '#2c2e36', color: '#fff', borderRadius: 28, padding: '16px 24px', fontSize: 32, fontWeight: 500}}>{m.text}</div>
          {m.failed && <div style={{textAlign: 'right', color: color.keyRed, fontSize: 22, marginTop: 6}}>Not Delivered ⓘ</div>}
        </div>;
      })}
    </div>
  </div>;
};

/** Big time / day card that drops in (e.g. "5:40 AM"). */
export const TimeCard: React.FC<{at: number; big: string; small?: string; y?: number}> = ({at, big, small, y = 520}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {stiffness: 200, damping: 14}});
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2)}}>
    <div style={{background: 'rgba(8,9,13,0.92)', padding: '20px 44px 16px', borderRadius: 14, textAlign: 'center'}}>
      <div style={{fontFamily: font.caption, fontSize: 130, color: '#fff', lineHeight: 1}}>{big}</div>
      {small && <div style={{fontFamily: font.pixel, fontSize: 24, color: 'rgba(255,255,255,0.7)', marginTop: 8}}>{small}</div>}
    </div>
  </div>;
};

/** Ending choice: headline, then two pills pop in sequence. */
export const Choice: React.FC<{at: number; title: string; a: string; b: string; aAt?: number; bAt?: number; y?: number}> = ({at, title, a, b, aAt = 8, bAt = 16, y = 760}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  if (f < at) return null;
  const pop = (d: number) => spring({frame: f - at - d, fps, config: {stiffness: 300, damping: 14}});
  const pill = (txt: string, bg: string, d: number, fg: string) => {
    const s = f >= at + d ? pop(d) : 0;
    return <div style={{transform: `scale(${s})`, background: bg, color: fg, fontFamily: font.caption, fontSize: 96, padding: '14px 70px 10px', borderRadius: 90, boxShadow: `0 0 40px ${bg}66`}}>{txt}</div>;
  };
  const tp = pop(0);
  return <AbsoluteFill style={{alignItems: 'center', top: y, pointerEvents: 'none'}}>
    <div style={{fontFamily: font.caption, fontSize: 140, color: '#fff', transform: `scale(${0.7 + 0.3 * tp})`, opacity: tp, WebkitTextStroke: `12px ${color.ink}`, paintOrder: 'stroke fill'}}>{title}</div>
    <div style={{display: 'flex', gap: 46, marginTop: 50}}>{pill(a, color.keyYellow, aAt, '#111')}{pill(b, color.alertRed, bAt, '#fff')}</div>
  </AbsoluteFill>;
};
```

## Appendix G: kokoro_narrate.py

Save as `scripts/kokoro_narrate.py`.

```python
#!/usr/bin/env python3
"""Kokoro (ONNX) narration with real word timings and per-sentence pauses.

Word times come from Kokoro's own predicted phoneme durations (1 unit = 600 samples
= 25 ms at 24 kHz), exposed from the ONNX graph. No guessing, no even splits.

Usage:
  python3 kokoro_narrate.py script.json out_dir [--models DIR] [--voice am_onyx] [--speed 1.2]

script.json: {"sentences": [ [word, ...]  or  {"words": [word, ...], "pause": 0.45}, ... ]}
  word = {"t": "Your"} / {"t": "mess.", "key": "r", "brk": true}
  pause = silence (s) after that sentence; default GAP_S. Horror pacing uses 0.3-0.7 s.
  t     = on-screen word (punctuation allowed)
  say   = optional spoken form fed to TTS ("1,284" -> "twelve eighty-four")
  key   = caption keyword, brk = caption phrase ends after this word
Writes out_dir/narration.wav (24 kHz mono) and out_dir/timing.json.
"""
import argparse, json, os, sys
import numpy as np, soundfile as sf, onnx, onnxruntime as ort
from kokoro_onnx import Kokoro

SR, UNIT = 24000, 600            # samples per duration unit
DUR_TENSOR = '/encoder/Clip_output_0'
LEAD_S, TAIL_S, GAP_S = 0.04, 0.10, 0.06   # default gap; use per-sentence "pause" for dread
PUNCT = set(' ;:,.!?¡¿—–-…"«»“”()[]')


def dur_model(models):
    src = os.path.join(models, 'kokoro-v1.0.onnx')
    dst = os.path.join(models, 'kokoro-v1.0-dur.onnx')
    if not os.path.exists(dst):
        m = onnx.load(src)
        m.graph.output.append(onnx.helper.make_tensor_value_info(DUR_TENSOR, onnx.TensorProto.FLOAT, None))
        onnx.save(m, dst)
    return ort.InferenceSession(dst)


def groups(k, text):
    ph = k.tokenizer.phonemize(text, 'en-us').strip()
    return [g for g in ph.split(' ') if g]


def _strip(s):
    return ''.join(c for c in s if c not in PUNCT and c not in 'ˈˌ')


def _lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def align_words(word_ph, groups_ph):
    """DP: map words to sentence phoneme groups. espeak merges short words ("for the"
    -> one group) and splits long ones; allow 1:1, 1:n (n<=4) and n:1 (n<=3)."""
    W, G = [_strip(w) for w in word_ph], [_strip(g) for g in groups_ph]
    INF = float('inf'); n, m = len(W), len(G)
    dp = [[INF] * (m + 1) for _ in range(n + 1)]; bk = {}
    dp[0][0] = 0
    moves = [(1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (3, 1)]
    for i in range(n + 1):
        for j in range(m + 1):
            if dp[i][j] == INF:
                continue
            for a, b in moves:
                if i + a > n or j + b > m:
                    continue
                x, y = ''.join(W[i:i + a]), ''.join(G[j:j + b])
                c = dp[i][j] + _lev(x, y) / max(1, len(x), len(y))
                if c < dp[i + a][j + b]:
                    dp[i + a][j + b] = c; bk[(i + a, j + b)] = (a, b)
    if dp[n][m] == INF:
        sys.exit('Could not align words to phonemes; add "say" forms.')
    spans, i, j = [], n, m
    while i or j:
        a, b = bk[(i, j)]; spans.append((i - a, a, j - b, b)); i, j = i - a, j - b
    return spans[::-1], W, dp[n][m] / max(1, n)


def synth_sentence(k, sess, words, voice, speed):
    spoken = [w.get('say', w['t']) for w in words]
    ph_groups = groups(k, ' '.join(spoken))
    ph = ' '.join(ph_groups)
    spans, Wst, avg_cost = align_words([''.join(groups(k, s)) for s in spoken], ph_groups)
    if avg_cost > 0.5:
        print(f'warning: weak alignment ({avg_cost:.2f}) in "{" ".join(spoken)}"', file=sys.stderr)
    vocab = k.tokenizer.vocab
    toks, char_kind = [], []          # char_kind: group index or -1 for space/punct
    gi = 0
    for ch in ph:
        if ch == ' ':
            gi += 1
        if ch not in vocab:
            continue
        toks.append(vocab[ch])
        char_kind.append(-1 if ch in PUNCT else gi)
    if len(toks) > 510:
        sys.exit('Sentence too long for Kokoro (510 tokens); split it.')
    style = k.get_voice_style(voice)[len(toks)].reshape(1, 256).astype(np.float32)
    audio, dur = sess.run(None, {'tokens': np.array([[0, *toks, 0]], np.int64), 'style': style,
                                 'speed': np.array([speed], np.float32)})
    dur = dur.ravel()
    starts = np.concatenate([[0], np.cumsum(dur)[:-1]])   # in units, incl. leading pad
    gs, ge = {}, {}
    for i, g in enumerate(char_kind):
        if g < 0:
            continue
        s, e = starts[i + 1], starts[i + 1] + dur[i + 1]    # +1 skips the leading pad
        gs[g] = min(gs.get(g, s), s); ge[g] = max(ge.get(g, e), e)
    out = []
    for wi, a, gj, b in spans:
        s0 = min(gs[g] for g in range(gj, gj + b) if g in gs)
        e0 = max(ge[g] for g in range(gj, gj + b) if g in ge)
        if a == 1:
            out.append({**words[wi], 's': s0 * UNIT / SR, 'e': e0 * UNIT / SR})
            continue
        # merged short words share one group: split by their phoneme lengths (marked approx)
        lens = [max(1, len(Wst[wi + x])) for x in range(a)]; tot = sum(lens); cur = s0
        for x in range(a):
            nxt = cur + (e0 - s0) * lens[x] / tot
            out.append({**words[wi + x], 's': cur * UNIT / SR, 'e': nxt * UNIT / SR, 'approx': True}); cur = nxt
    return audio.astype(np.float32), out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script'); ap.add_argument('out')
    ap.add_argument('--models', default=os.path.join(os.path.dirname(__file__), 'models'))
    ap.add_argument('--voice', default='am_onyx'); ap.add_argument('--speed', type=float, default=1.0)
    a = ap.parse_args()
    k = Kokoro(os.path.join(a.models, 'kokoro-v1.0.onnx'), os.path.join(a.models, 'voices-v1.0.bin'))
    sess = dur_model(a.models)
    sentences = json.load(open(a.script))['sentences']
    pieces, words, t = [], [], 0.0
    for sent in sentences:
        pause = GAP_S
        if isinstance(sent, dict):
            pause, sent = sent.get('pause', GAP_S), sent['words']
        audio, ws = synth_sentence(k, sess, sent, a.voice, a.speed)
        a0 = max(0, int((ws[0]['s'] - LEAD_S) * SR)); a1 = min(len(audio), int((ws[-1]['e'] + TAIL_S) * SR))
        clip = audio[a0:a1].copy()
        f = int(0.008 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)  # click-free joins
        off = t - a0 / SR
        for w in ws:
            words.append({k2: v for k2, v in w.items() if k2 != 'say'} | {'s': round(w['s'] + off, 3), 'e': round(w['e'] + off, 3)})
        pieces += [clip, np.zeros(int(pause * SR), np.float32)]
        t += len(clip) / SR + pause
    full = np.concatenate(pieces)
    os.makedirs(a.out, exist_ok=True)
    sf.write(os.path.join(a.out, 'narration.wav'), full, SR)
    json.dump({'provenance': f'kokoro-onnx v1.0, voice {a.voice}, speed {a.speed}, durations from {DUR_TENSOR}',
               'units': 'seconds', 'duration': round(len(full) / SR, 3), 'words': words},
              open(os.path.join(a.out, 'timing.json'), 'w'), indent=1)
    print(f'{len(words)} words, {len(full)/SR:.2f}s -> {a.out}')


if __name__ == '__main__':
    main()
```

## Appendix H: sfx_mix.py

Save as `scripts/sfx_mix.py`.

```python
#!/usr/bin/env python3
"""Synthesised horror-short sound kit + mixer (all original, no samples).

Usage: python3 sfx_mix.py narration.wav cues.json out.wav [--length 15.0]
cues.json: {"bed": {"gain_db": -22, "swell": [[10.0, 3.0]], "cut": 13.7},
            "events": [{"t": 2.85, "fx": "buzz", "gain_db": -10}, ...]}
fx: buzz, alert, knock, sting, boom, riser, pop, tick
"""
import argparse, json
import numpy as np, soundfile as sf

SR = 48000
rng = np.random.default_rng(11)


def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
    return e


def lowpass(x, cutoff):
    # one-pole low-pass, deterministic
    a = np.exp(-2 * np.pi * cutoff / SR); y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y


def fx_buzz():
    out = []
    for _ in range(2):
        n = int(0.28 * SR); t = np.arange(n) / SR
        w = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.6 + np.sin(2 * np.pi * 75 * t) * 0.4
        w = lowpass(w, 900) * np.minimum(1, t / 0.01) * np.minimum(1, (0.28 - t) / 0.02)
        out += [w, np.zeros(int(0.12 * SR))]
    return np.concatenate(out)


def fx_alert():
    out = []
    for k in range(3):
        n = int(0.32 * SR); t = np.arange(n) / SR
        w = 0.5 * np.sin(2 * np.pi * 853 * t) + 0.5 * np.sin(2 * np.pi * 960 * t)
        out += [w * np.minimum(1, t / 0.01) * np.minimum(1, (0.32 - t) / 0.02), np.zeros(int(0.08 * SR))]
    return np.concatenate(out)


def fx_knock():
    n = int(0.25 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (140 - 60 * t / 0.25) * t) * env(n, 0.001, 0.05)
    click = lowpass(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.012) * 0.8
    return body + click


def fx_boom(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (55 - 20 * t / dur) * t) * env(n, 0.004, 0.6) + lowpass(rng.standard_normal(n), 300) * env(n, 0.002, 0.15) * 0.6


def fx_sting(dur=1.8):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((311.1, 0), (329.6, 1), (466.2, 2), (493.9, .5)))
    tone = lowpass(s / 4, 2500) * env(n, 0.01, 0.7)
    return tone * 0.7 + fx_boom(dur) * 0.8


def fx_riser(dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), 1200) * (t / dur) ** 2
    return noise * 0.6 + np.sin(2 * np.pi * (200 + 600 * (t / dur) ** 2) * t) * (t / dur) ** 3 * 0.3


def fx_pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (520 + 380 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.04)


def fx_tick():
    n = int(0.05 * SR)
    return lowpass(rng.standard_normal(n), 4000) * env(n, 0.0003, 0.006)


FX = {'buzz': fx_buzz, 'alert': fx_alert, 'knock': fx_knock, 'sting': fx_sting, 'boom': fx_boom,
      'riser': fx_riser, 'pop': fx_pop, 'tick': fx_tick}


def bed(length, swells, cut):
    n = int(length * SR); t = np.arange(n) / SR
    d = 0.55 * np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 55.7 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.2 * t))
    d += lowpass(rng.standard_normal(n), 220) * 0.6
    g = np.minimum(1, t / 0.8)
    for at, dur in swells:
        g *= 1 + 1.2 * np.clip(1 - np.abs(t - at) / dur, 0, 1)
    if cut is not None:
        g *= np.clip(1 - (t - cut) / 0.25, 0, 1)
    return d * g


def db(x):
    return 10 ** (x / 20)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('narration'); ap.add_argument('cues'); ap.add_argument('out')
    ap.add_argument('--length', type=float, default=None)
    a = ap.parse_args()
    voice, vsr = sf.read(a.narration)
    if voice.ndim > 1: voice = voice.mean(1)
    if vsr != SR:  # linear resample (narration is speech; fine for a mix)
        idx = np.arange(int(len(voice) * SR / vsr)) * vsr / SR
        voice = np.interp(idx, np.arange(len(voice)), voice)
    cues = json.load(open(a.cues))
    L = a.length or len(voice) / SR + 0.5
    mix = np.zeros(int(L * SR))
    mix[:len(voice)] += voice[:len(mix)]
    b = cues.get('bed')
    if b:
        mix += bed(L, b.get('swell', []), b.get('cut')) * db(b.get('gain_db', -22))
    for ev in cues.get('events', []):
        s = FX[ev['fx']]() * db(ev.get('gain_db', -10))
        i = int(ev['t'] * SR); j = min(len(mix), i + len(s))
        if i < len(mix):
            mix[i:j] += s[:j - i]
    # gentle limiter: soft clip above -1 dBFS
    lim = db(-1.0)
    mix = np.where(np.abs(mix) > lim * 0.8, np.sign(mix) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(mix) - lim * 0.8) / (lim * 0.2))), mix)
    sf.write(a.out, np.stack([mix, mix], 1).astype(np.float32), SR)
    print(f'mixed {L:.2f}s -> {a.out}')


if __name__ == '__main__':
    main()
```

## Appendix I: world.tsx

Save as `src/kit/world.tsx`.

```tsx
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
```

## Appendix J: sprite.tsx

Save as `src/kit/sprite.tsx`.

```tsx
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
```
