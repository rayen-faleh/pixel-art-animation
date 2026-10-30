"""Ingest AI-generated pixel art (incoming/*.png) into clean kit assets.

Sheets (magenta-keyed sprites):
  1. measure the fake-pixel block size and grid phase (comb search on colour edges),
  2. resample each block to ONE art pixel (mode of the block's centre),
  3. key out magenta, quantise colours, snap near-black to the kit outline colour,
  4. find sprites as connected regions (nearby bits merged), order them in rows,
  5. pack them bottom-centred into fixed cells -> public/sprites/<atlas>.png/.json
     (same JSON shape as pixelkit.Atlas, so <PixelSprite> reads it unchanged).
Plates (environments): resampled to exactly H art px tall -> public/sets/<name>_bg.png.

Usage: python3.12 kit/ingest.py kit/ingest_manifest.json [--only name] [--preview out/ingest]
"""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

OUTLINE = np.array([0x14, 0x15, 0x1b])


def is_key(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r > 170) & (b > 170) & (g < 120) & (np.abs(r - b) < 90)


def comb(signal, lo=4.0, hi=16.0):
    """Best (period, phase) whose grid lines sit on the strongest edges."""
    n = len(signal); best = (0, lo, 0.0)
    sig = signal / (signal.mean() + 1e-9)
    for p in np.arange(lo, hi, 0.05):
        for ph in np.arange(0, p, 0.25):
            idx = np.round(np.arange(ph, n - 1, p)).astype(int)
            s = sig[idx].mean()
            if s > best[0]:
                best = (s, p, ph)
    return best[1], best[2]


def grid(rgb):
    a = rgb.astype(int)
    ex = np.abs(np.diff(a, axis=1)).sum(2); ey = np.abs(np.diff(a, axis=0)).sum(2)
    sx = np.concatenate([[0], (ex > 40).sum(0)]).astype(float)
    sy = np.concatenate([[0], (ey > 40).sum(1)]).astype(float)
    px, phx = comb(sx); py, phy = comb(sy)
    p = (px + py) / 2   # pixels are square; average the two estimates
    return p, phx % p, phy % p


def resample(rgb, p, phx, phy, out_w=None, out_h=None):
    """One art pixel per block: mode colour of the block's central 50%."""
    H, W = rgb.shape[:2]
    if out_w is None:
        xs = np.arange(phx, W - p * 0.5, p); ys = np.arange(phy, H - p * 0.5, p)
    else:
        xs = np.arange(out_w) * (W / out_w); ys = np.arange(out_h) * (H / out_h); p = W / out_w
    q = (rgb // 8).astype(np.int32)
    code = (q[..., 0] << 10) | (q[..., 1] << 5) | q[..., 2]
    out = np.zeros((len(ys), len(xs), 3), np.uint8)
    for j, y in enumerate(ys):
        y0, y1 = int(y + p * 0.25), max(int(y + p * 0.25) + 1, int(y + p * 0.75))
        for i, x in enumerate(xs):
            x0, x1 = int(x + p * 0.25), max(int(x + p * 0.25) + 1, int(x + p * 0.75))
            blk = code[y0:y1, x0:x1].ravel()
            if not len(blk):
                continue
            m = np.bincount(blk).argmax()
            sel = rgb[y0:y1, x0:x1].reshape(-1, 3)[blk == m]
            out[j, i] = sel.mean(0)
    return out


def quantise(art, mask, colours=40):
    """Merge near-duplicate colours left by the model's noise; snap darks to the outline."""
    px = art[mask]
    if len(px) == 0:
        return art
    im = Image.fromarray(px.reshape(-1, 1, 3)).quantize(colors=colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(im.getpalette()[:colours * 3]).reshape(-1, 3)
    q = pal[np.array(im).ravel()]
    lum = q @ np.array([0.3, 0.59, 0.11])
    q[lum < 34] = OUTLINE
    out = art.copy(); out[mask] = q
    return out


def sprites(art, mask, merge=3, min_px=6):
    """Connected regions, merging pieces closer than `merge` art px; ordered in rows."""
    grown = ndimage.binary_dilation(mask, iterations=merge)
    lab, n = ndimage.label(grown, structure=np.ones((3, 3)))
    boxes = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        m = (lab[sl] == k) & mask[sl]
        if m.sum() < min_px:
            continue
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = sl[0].start + ys.min(), sl[0].start + ys.max() + 1, sl[1].start + xs.min(), sl[1].start + xs.max() + 1
        boxes.append([y0, y1, x0, x1, (lab[y0:y1, x0:x1] == k) & mask[y0:y1, x0:x1]])
    # rows: cluster by vertical overlap of boxes
    boxes.sort(key=lambda b: (b[0] + b[1]) / 2)
    rows = []
    for b in boxes:
        c = (b[0] + b[1]) / 2
        if rows and any(r[0] <= c <= r[1] for r in [(min(x[0] for x in rows[-1]), max(x[1] for x in rows[-1]))]):
            rows[-1].append(b)
        else:
            rows.append([b])
    ordered = [b for r in rows for b in sorted(r, key=lambda b: b[2])]
    return ordered, len(rows)


def write_atlas(name, frames, out_dir, pad=1, cols=8):
    cw = max(f.shape[1] for _, f in frames) + pad * 2
    ch = max(f.shape[0] for _, f in frames) + pad
    rows = (len(frames) + cols - 1) // cols
    sheet = np.zeros((rows * ch, min(cols, len(frames)) * cw, 4), np.uint8)
    index = {}
    for i, (fname, f) in enumerate(frames):
        cx, cy = (i % cols) * cw, (i // cols) * ch
        h, w = f.shape[:2]
        ox, oy = cx + (cw - w) // 2, cy + ch - h       # bottom-centred, feet on the cell floor
        sheet[oy:oy + h, ox:ox + w] = f
        index[fname] = {'x': int(cx), 'y': int(cy), 'w': int(cw), 'h': int(ch)}
    os.makedirs(out_dir, exist_ok=True)
    Image.fromarray(sheet, 'RGBA').save(f'{out_dir}/{name}.png')
    json.dump({'image': f'{name}.png', 'cell': [cw, ch], 'pivot': [cw // 2, ch - 1], 'sheet': [sheet.shape[1], sheet.shape[0]],
               'frames': index, 'source': 'kit/ingest.py (AI-generated, cleaned)'}, open(f'{out_dir}/{name}.json', 'w'), indent=1)
    return sheet


def block_size(crop):
    """Art-pixel size from the first autocorrelation peak of the colour-edge signal (x and y)."""
    a = crop.astype(int); est = []
    for s in ((np.abs(np.diff(a, axis=1)).sum(2) > 40).sum(0), (np.abs(np.diff(a, axis=0)).sum(2) > 40).sum(1)):
        s = s.astype(float) - s.mean()
        ac = np.correlate(s, s, 'full')[len(s) - 1:]
        if ac[0] <= 0:
            continue
        ac /= ac[0]
        for L in range(4, min(40, len(ac) - 1)):
            if ac[L] > ac[L - 1] and ac[L] >= ac[L + 1] and ac[L] > 0.1:
                y0, y1, y2 = ac[L - 1], ac[L], ac[L + 1]
                est.append(L + (y0 - y2) / (2 * (y0 - 2 * y1 + y2) + 1e-9)); break
    return est


def phase(signal, p):
    best = (-1, 0.0)
    for ph in np.arange(0, p, 0.25):
        idx = np.round(np.arange(ph, len(signal) - 1, p)).astype(int)
        sc = signal[idx].mean()
        if sc > best[0]:
            best = (sc, ph)
    return best[1]


def ingest_sheet(path, names, merge, log):
    """Find sprites at full resolution, then re-pixelate each on its own grid phase (shared sheet pixel size)."""
    rgb = np.asarray(Image.open(path).convert('RGB'))
    key = is_key(rgb)
    solid = ndimage.binary_opening(~key, iterations=2)
    lab, _ = ndimage.label(ndimage.binary_dilation(solid, iterations=merge))
    boxes = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        if ((lab[sl] == k) & solid[sl]).sum() < 1500:
            continue
        boxes.append(sl)
    # order: rows by vertical centre (gap-clustered), then left to right
    boxes.sort(key=lambda sl: (sl[0].start + sl[0].stop) / 2)
    rows = []
    for sl in boxes:
        c = (sl[0].start + sl[0].stop) / 2
        if rows and rows[-1][0] <= c <= rows[-1][1]:
            rows[-1][2].append(sl); rows[-1][0] = min(rows[-1][0], sl[0].start); rows[-1][1] = max(rows[-1][1], sl[0].stop)
        else:
            rows.append([sl[0].start, sl[0].stop, [sl]])
    ordered = [sl for r in rows for sl in sorted(r[2], key=lambda sl: sl[1].start)]
    ests = [e for sl in ordered for e in block_size(rgb[sl])]
    p = float(np.median(ests)) if ests else 8.0
    out = []
    for nm, sl in zip(names, ordered):
        m = 2 * int(p)
        y0, y1 = max(0, sl[0].start - m), min(rgb.shape[0], sl[0].stop + m)
        x0, x1 = max(0, sl[1].start - m), min(rgb.shape[1], sl[1].stop + m)
        crop = rgb[y0:y1, x0:x1]; c = crop.astype(int)
        sx = np.concatenate([[0], (np.abs(np.diff(c, axis=1)).sum(2) > 40).sum(0)]).astype(float)
        sy = np.concatenate([[0], (np.abs(np.diff(c, axis=0)).sum(2) > 40).sum(1)]).astype(float)
        art = resample(crop, p, phase(sx, p), phase(sy, p))
        mask = ~is_key(art)
        r, g, b = art[..., 0].astype(int), art[..., 1].astype(int), art[..., 2].astype(int)
        pink = (r > 100) & (b > 90) & (g < np.minimum(r, b) - 45)
        mask &= ~pink
        # keep only the main sprite (largest region + anything within 2 px), drop speckle
        lab2, n2 = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
        if n2 > 1:
            sizes = ndimage.sum(mask, lab2, range(1, n2 + 1)); mask &= lab2 == (np.argmax(sizes) + 1)
        art = quantise(art, mask)
        ys, xs = np.nonzero(mask)
        art, mask = art[ys.min():ys.max() + 1, xs.min():xs.max() + 1], mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        rgba = np.zeros((*mask.shape, 4), np.uint8); rgba[..., :3] = art; rgba[..., 3] = mask * 255
        out.append((nm, rgba))
    status = 'ok' if len(ordered) == len(names) else f'MISMATCH found {len(ordered)} expected {len(names)}'
    sizes = ' '.join(f'{f.shape[1]}x{f.shape[0]}' for _, f in out[:4])
    log.append(f'{os.path.basename(path)}: block {p:.2f}px, {len(ordered)} sprites in {len(rows)} rows [{status}]  e.g. {sizes}')
    return out


def ingest_plate(path, name, height, out_dir, log, aspect=None):
    """Re-pixelate on the plate's own grid (no colour reduction: dark plates need every shade),
    then nearest-scale to `height` art px so all sets share the world's 240-px height.
    `aspect` (w/h, e.g. 16/9) centre-crops the source first: 3:2 GPT plates -> 16:9 sets."""
    rgb = np.asarray(Image.open(path).convert('RGB'))
    if aspect:
        H, W = rgb.shape[:2]
        if W / H < aspect:
            ch = round(W / aspect); y0 = (H - ch) // 2; rgb = rgb[y0:y0 + ch]
        else:
            cw = round(H * aspect); x0 = (W - cw) // 2; rgb = rgb[:, x0:x0 + cw]
    ests = sorted(block_size(rgb))
    p = ests[0] if len(ests) == 1 or ests[1] > ests[0] * 1.6 else float(np.mean(ests))  # ignore a 2x harmonic
    c = rgb.astype(int)
    sx = np.concatenate([[0], (np.abs(np.diff(c, axis=1)).sum(2) > 40).sum(0)]).astype(float)
    sy = np.concatenate([[0], (np.abs(np.diff(c, axis=0)).sum(2) > 40).sum(1)]).astype(float)
    art = resample(rgb, p, phase(sx, p), phase(sy, p))
    native = art.shape
    w = round(height * art.shape[1] / art.shape[0])
    art = np.asarray(Image.fromarray(art).resize((w, height), Image.NEAREST))
    os.makedirs(out_dir, exist_ok=True)
    Image.fromarray(art).convert('RGBA').save(f'{out_dir}/{name}_bg.png')
    reg = f'{out_dir}/plates.json'
    plates = json.load(open(reg)) if os.path.exists(reg) else {}
    plates[name] = {'w': w, 'h': height, 'fg': os.path.exists(f'{out_dir}/{name}_fg.png'), 'source': os.path.basename(path)}
    json.dump(plates, open(reg, 'w'), indent=1)
    log.append(f'{os.path.basename(path)}: plate block {p:.2f}px, native {native[1]}x{native[0]} -> {w}x{height} art px')
    return art


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('manifest'); ap.add_argument('--only'); ap.add_argument('--preview', default='out/ingest')
    a = ap.parse_args()
    man = json.load(open(a.manifest)); root = os.path.dirname(os.path.abspath(a.manifest)) + '/..'
    log = []
    os.makedirs(a.preview, exist_ok=True)
    for atlas in man['atlases']:
        if a.only and atlas['name'] != a.only:
            continue
        frames = []
        for src in atlas['sources']:
            got = ingest_sheet(f"{root}/{src['file']}", src['names'], src.get('merge', 20), log)
            frames += got
        sheet = write_atlas(atlas['name'], frames, f"{root}/public/sprites")
        Image.fromarray(sheet, 'RGBA').resize((sheet.shape[1] * 4, sheet.shape[0] * 4), Image.NEAREST).save(f"{a.preview}/{atlas['name']}.png")
    for pl in man.get('plates', []):
        if a.only and pl['name'] != a.only:
            continue
        aspect = pl.get('aspect')
        art = ingest_plate(f"{root}/{pl['file']}", pl['name'], pl.get('height', man.get('plate_height', 240)), f"{root}/public/sets", log,
                           (lambda a, b: float(a) / float(b))(*aspect.split('/')) if isinstance(aspect, str) else aspect)
        Image.fromarray(art).resize((art.shape[1] * 3, art.shape[0] * 3), Image.NEAREST).save(f"{a.preview}/{pl['name']}.png")
    print('\n'.join(log))


if __name__ == '__main__':
    main()
