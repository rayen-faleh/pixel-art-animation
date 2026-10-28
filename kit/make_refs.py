"""Style-reference images for image-generation prompts (prompts/refs/)."""
import json, sys
from PIL import Image, ImageDraw
MAG = (255, 0, 255, 255)
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = f'{ROOT}/prompts/refs'

def frame(atlas, name):
    meta = json.load(open(f'{ROOT}/public/sprites/{atlas}.json'))
    sheet = Image.open(f'{ROOT}/public/sprites/{meta["image"]}').convert('RGBA')
    r = meta['frames'][name]
    return sheet.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))

def strip(items, scale, gap=8, path=None):
    ims = [frame(a, n) for a, n in items]
    w = sum(i.width for i in ims) + gap * (len(ims) + 1); h = max(i.height for i in ims) + gap * 2
    s = Image.new('RGBA', (w, h), MAG); x = gap
    for im in ims:
        s.alpha_composite(im, (x, h - gap - im.height)); x += im.width + gap
    s.resize((w * scale, h * scale), Image.NEAREST).save(path)

strip([('hero', 'down.neutral.b0'), ('hero', 'phone.scared.b0'), ('hero', 'reach.worried.b0'), ('hero', 'turn0.neutral.b0'),
       ('ghost_olive', 'down.creepy.b0'), ('ghost_maroon', 'turn1.creepy.b0'), ('ghost_navy', 'open.creepy.b0'), ('ghost_teal', 'turn0.creepy.b0')],
      10, path=f'{OUT}/ref-cast.png')
strip([('props', 'door'), ('props2', 'lamp_on'), ('props2', 'lamp_off')], 6, path=f'{OUT}/ref-props-large.png')
strip([('items', n) for n in ('water', 'cereal', 'phone', 'flashlight', 'candles')], 16, path=f'{OUT}/ref-props-small.png')

plates = []
for layers in (['bedroom_bg', 'bedroom_fg'], ['hall_bg'], ['street_bg', 'street_mid', 'street_fg'], ['kitchen_bg', 'kitchen_fg']):
    im = Image.new('RGBA', (135, 240), (7, 10, 18, 255))
    for l in layers:
        im.alpha_composite(Image.open(f'{ROOT}/public/sets/{l}.png').convert('RGBA'))
    plates.append(im)
s = Image.new('RGBA', (135 * 4 + 5 * 6, 250), (0, 0, 0, 255))
for i, p in enumerate(plates):
    s.alpha_composite(p, (6 + i * 141, 5))
s.resize((s.width * 4, s.height * 4), Image.NEAREST).save(f'{OUT}/ref-sets.png')

pal = [('outline', '#14151b'), ('night', '#121829'), ('wall', '#151c31'), ('glass', '#3d5688'), ('glass2', '#1f2d4d'),
       ('wood', '#3a2a24'), ('wood hi', '#4a362e'), ('lawn', '#16241c'), ('road', '#14151b'), ('siding', '#2b2d3b'),
       ('skin', '#f1ece2'), ('skin sh', '#d2cabb'), ('changed', '#b9bdc7'), ('changed sh', '#959aa6'), ('hoodie', '#6b7286'),
       ('hoodie sh', '#545a6b'), ('pants', '#262833'), ('olive', '#4e5a3a'), ('maroon', '#5c2f38'), ('navy', '#2f3b5c'),
       ('brown', '#5c4632'), ('teal', '#2f5c57'), ('plum', '#4b3a5c'), ('lamp', '#f2d9a0'), ('sign red', '#c8323c'),
       ('accent', '#ffcf3a'), ('eyes', '#ffffff')]
cols = 9; cw, ch = 150, 120
p = Image.new('RGB', (cols * cw, ((len(pal) + cols - 1) // cols) * ch), (255, 255, 255)); d = ImageDraw.Draw(p)
for i, (n, hx) in enumerate(pal):
    x, y = (i % cols) * cw, (i // cols) * ch
    d.rectangle([x + 6, y + 6, x + cw - 6, y + 80], fill=hx, outline=(0, 0, 0))
    d.text((x + 8, y + 86), f'{n}\n{hx}', fill=(0, 0, 0))
p.save(f'{OUT}/ref-palette.png')
print('refs ->', OUT)
