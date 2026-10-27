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
