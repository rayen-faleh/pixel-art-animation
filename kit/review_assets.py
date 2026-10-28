"""Contact sheets for ingested assets: every atlas frame next to the kit hero for scale."""
import json, sys
from PIL import Image, ImageDraw
OUT = sys.argv[1]; S = 4
BG = (24, 27, 38, 255)
def frames(name):
    m = json.load(open(f'public/sprites/{name}.json')); sh = Image.open(f'public/sprites/{m["image"]}').convert('RGBA')
    for k, r in m['frames'].items():
        yield k, sh.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
hero = dict(frames('hero'))['down.neutral.b0']
def strip(names, path, per_row=16):
    items = [('HERO', hero)] + [(f'{n}:{k}', im) for n in names for k, im in frames(n)]
    rows = [items[i:i + per_row] for i in range(0, len(items), per_row)]
    rh = [max(im.height for _, im in r) + 14 for r in rows]
    W = max(sum(im.width + 4 for _, im in r) for r in rows) + 4
    canvas = Image.new('RGBA', (W, sum(rh) + 4), BG); y = 2
    for r, h in zip(rows, rh):
        x = 4
        for k, im in r:
            canvas.alpha_composite(im, (x, y + h - 12 - im.height)); x += im.width + 4
        ImageDraw.Draw(canvas).line([(0, y + h - 12), (W, y + h - 12)], fill=(60, 64, 80, 255))
        y += h
    canvas.resize((canvas.width * S, canvas.height * S), Image.NEAREST).save(path)
strip(['civilians'], f'{OUT}/rev_civilians.png', 12)
strip(['hero_actions', 'changed_stages', 'busts'], f'{OUT}/rev_hero_stages.png', 9)
strip(['changed_poses'], f'{OUT}/rev_changed.png', 16)
strip(['tall_one', 'crawler', 'crowd_tiny'], f'{OUT}/rev_monsters.png', 12)
strip(['fg_props', 'openings', 'lights'], f'{OUT}/rev_props.png', 12)
strip(['supplies', 'icons'], f'{OUT}/rev_items.png', 21)
plates = ['livingroom', 'basement', 'street_wide', 'gas_station', 'aisle', 'car_pov', 'town']
ims = [Image.open(f'public/sets/{p}_bg.png') for p in plates]
c = Image.new('RGBA', (sum(i.width + 4 for i in ims), 244), (0, 0, 0, 255)); x = 2
for i in ims:
    c.paste(i, (x, 2)); x += i.width + 4
c.resize((c.width * 2, c.height * 2), Image.NEAREST).save(f'{OUT}/rev_plates.png')
print('ok')
