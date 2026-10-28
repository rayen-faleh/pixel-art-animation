"""Foreground (occluder) layers cut from ingested plates, so they align pixel-perfectly.

Each cut is a polygon in the ORIGINAL generated image's pixel coords (1024x1536), optionally
intersected with a colour rule. Output: public/sets/<plate>_fg.png (plate pixels inside the
cut, transparent elsewhere). Actors are drawn between <plate>_bg and <plate>_fg.
"""
import numpy as np
from PIL import Image, ImageDraw

SRC_W, SRC_H = 1024, 1536

CUTS = {
    # couch back across the bottom (blue cushions only, not the floor showing between them)
    'livingroom': {'polys': [[(0, 1290), (1024, 1290), (1024, 1536), (0, 1536)]], 'rule': 'blueish'},
    # stair side panel + handrail + newel post
    'basement': {'polys': [[(805, 370), (825, 370), (888, 700), (888, 885), (857, 885), (810, 750)]]},
    # the two pump islands (pumps, hoses, bollards, island kerbs)
    'gas_station': {'polys': [[(262, 712), (392, 712), (392, 892), (262, 892)], [(160, 878), (425, 878), (425, 918), (160, 918)], [(188, 826), (222, 826), (222, 892), (188, 892)],
                              [(628, 712), (768, 712), (768, 892), (628, 892)], [(598, 878), (860, 878), (860, 918), (598, 918)], [(790, 826), (830, 826), (830, 892), (790, 892)]]},
    # nearest shelf unit on each side
    'aisle': {'polys': [[(0, 0), (238, 300), (238, 968), (0, 1100)], [(786, 300), (1024, 0), (1024, 1010), (786, 950)]]},
    # everything except the windshield (the mirror stays in front)
    'car_pov': {'invert': [[(22, 160), (1002, 160), (1010, 690), (945, 885), (78, 885), (14, 690)]],
                'keep': [[(322, 180), (528, 180), (528, 305), (322, 305)]]},
    # the grass crest, so figures can rise over the hill
    'town': {'polys': [[(0, 1070), (1024, 1070), (1024, 1536), (0, 1536)]], 'rule': 'greenish'},
}


def poly_mask(polys, w, h):
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([(x * w / SRC_W, y * h / SRC_H) for x, y in p], fill=255)
    return np.asarray(m) > 0


def main():
    for name, c in CUTS.items():
        plate = np.asarray(Image.open(f'public/sets/{name}_bg.png').convert('RGBA'))
        h, w = plate.shape[:2]
        if 'invert' in c:
            m = ~poly_mask(c['invert'], w, h) | poly_mask(c.get('keep', []), w, h)
        else:
            m = poly_mask(c['polys'], w, h)
        r, g, b = (plate[..., i].astype(int) for i in range(3))
        if c.get('rule') == 'blueish':
            m &= b > r + 10
        elif c.get('rule') == 'greenish':
            m &= g > r + 4
            m = np.maximum.accumulate(m, axis=0)       # everything below the crest line too
        out = plate.copy(); out[..., 3] = np.where(m, 255, 0)
        Image.fromarray(out, 'RGBA').save(f'public/sets/{name}_fg.png')
        print(f'{name}_fg: {m.mean():.0%} of plate')


if __name__ == '__main__':
    main()
