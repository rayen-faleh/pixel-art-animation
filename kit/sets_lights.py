"""LIGHTS OUT sets and props (135x240 art px; same palette/density as sets.py).

  street_bg   sky, far houses and the lit room behind Mr. Hale's window
  street_mid  Hale's facade (window cut out), lawn, sidewalk, dead street lamps
  street_fg   our own window frame + blind slats (we look out through them)
  kitchen_bg  moonlit kitchen wall, window, cabinets, fridge
  kitchen_fg  counter top + front (items stand on it, hero stands behind it)
  props2      lamp_on/lamp_off, ceiling_on/ceiling_off, flashlight, candles, phone_flat
Lighting is added in Remotion, never baked here.
"""
import math, random, sys
from pixelkit import Canvas, Atlas, hexc, text3x5

SW, SH = 135, 240
OUT = hexc('#0b0c11')


def street(out):
    rnd = random.Random(3)
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 120, [hexc('#05070e'), hexc('#0a1020'), hexc('#121b30')])
    for _ in range(26):
        bg.put(rnd.randrange(SW), rnd.randrange(70), hexc('#7d8bab'))
    # far rooftops and trees behind Hale's house
    for x0, w, h in ((0, 30, 34), (98, 37, 40)):
        bg.rect(x0, 120 - h, x0 + w, 125, hexc('#0b0f1b'))
    for cx, cy, r in ((14, 88, 14), (120, 84, 16)):
        bg.disc(cx, cy, r, hexc('#0a1414'))
    bg.rect(0, 120, SW - 1, 200, hexc('#0b0f1b'))        # far yards behind the facade
    # the room behind the lit window: warm wall, lamp shade, picture frame
    bg.rect(36, 104, 98, 162, hexc('#7a5636'))
    bg.vgradient(36, 104, 98, 162, [hexc('#8e6640'), hexc('#6d4c30'), hexc('#4d3524')])
    bg.rect(84, 112, 93, 122, hexc('#b88a50'))          # picture frame
    bg.rect(86, 114, 91, 120, hexc('#5a4630'))
    bg.rect(40, 150, 98, 162, hexc('#3d2a1e'))          # floor inside
    bg.save(f'{out}/street_bg.png')

    mid = Canvas(SW, SH)
    # Hale's house: two-storey facade, gable, big window (hole) at 40..94 x 108..150
    for i in range(34):
        mid.hline(8 + i * 2, 126 - i * 2, 70 - i, hexc('#16171f'))
    mid.rect(10, 70, 124, 190, hexc('#2b2d3b'))
    for y in range(72, 190, 4):
        mid.hline(10, 124, y, hexc('#252734'))
    mid.rect(6, 68, 128, 71, hexc('#1f2029'))
    # upstairs dark windows
    for wx in (22, 92):
        mid.rect(wx, 78, wx + 20, 96, hexc('#121624')); mid.rect(wx + 1, 79, wx + 19, 95, hexc('#161d31'))
        mid.vline(wx + 10, 79, 95, hexc('#121624'))
    # big front window frame; the glass area stays transparent so bg + Hale show through
    mid.rect(36, 104, 98, 107, hexc('#1a1b24')); mid.rect(36, 150, 98, 153, hexc('#1a1b24'))
    mid.rect(36, 104, 39, 153, hexc('#1a1b24')); mid.rect(95, 104, 98, 153, hexc('#1a1b24'))
    mid.rect(66, 107, 68, 150, hexc('#1a1b24'))
    for y in range(108, 150):                            # cut the glass out
        for x in range(40, 95):
            if not 66 <= x <= 68:
                mid.px[x, y] = (0, 0, 0, 0)
    mid.rect(33, 153, 101, 156, hexc('#2f3140'))         # sill
    # front door at right
    mid.rect(104, 150, 120, 190, hexc('#211a1a')); mid.rect(106, 152, 118, 190, hexc('#3a2a24'))
    mid.rect(115, 170, 116, 171, hexc('#c9a24a'))
    # hedge, lawn, sidewalk, road with dashes
    for x in range(10, 100, 6):
        mid.disc(x + 3, 188, 4, hexc('#0f1d16'))
    mid.vgradient(0, 190, SW - 1, 206, [hexc('#16241c'), hexc('#101a15')])
    mid.rect(0, 206, SW - 1, 210, hexc('#2d2f38')); mid.hline(0, SW - 1, 206, hexc('#3a3c48'))
    mid.vgradient(0, 211, SW - 1, SH - 1, [hexc('#15161c'), hexc('#101116')])
    for x in range(2, SW, 18):
        mid.rect(x, 226, x + 8, 227, hexc('#4a4632'))
    # dead street lamp (left)
    mid.rect(4, 120, 5, 208, hexc('#30323c')); mid.rect(4, 120, 14, 121, hexc('#30323c'))
    mid.rect(11, 122, 16, 124, hexc('#3a3c48')); mid.rect(12, 125, 15, 125, hexc('#4a4d5a'))
    mid.save(f'{out}/street_mid.png')

    fg = Canvas(SW, SH)
    # our window frame: thick sill at bottom, frame sides, blind slats at the top (half raised)
    wood, dark = hexc('#2a2f45'), hexc('#1b1f30')
    fg.rect(0, 0, 7, SH - 1, wood); fg.rect(127, 0, SW - 1, SH - 1, wood)
    fg.vline(7, 0, SH - 1, dark); fg.vline(127, 0, SH - 1, dark)
    fg.rect(0, 0, SW - 1, 5, wood)
    for i in range(9):                                   # slats bunched at the top
        y = 6 + i * 3
        fg.hline(8, 126, y, hexc('#8b8f9c')); fg.hline(8, 126, y + 1, hexc('#6f7380'))
    fg.vline(30, 6, 34, hexc('#55596a')); fg.vline(104, 6, 34, hexc('#55596a'))   # cords
    fg.rect(0, 232, SW - 1, SH - 1, wood); fg.hline(0, SW - 1, 232, hexc('#3a405c'))
    fg.save(f'{out}/street_fg.png')


def kitchen(out):
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 200, [hexc('#0f1322'), hexc('#141a2c'), hexc('#121726')])
    # tiles behind the counter
    for y in range(120, 192, 6):
        bg.hline(0, SW - 1, y, hexc('#171d30'))
    for x in range(0, SW, 8):
        bg.vline(x, 120, 192, hexc('#171d30'))
    # upper cabinets
    for x0 in (2, 34, 98):
        bg.rect(x0, 30, x0 + 30, 86, hexc('#2b2320')); bg.rect(x0 + 2, 32, x0 + 28, 84, hexc('#33291f'))
        bg.rect(x0 + 24, 70, x0 + 25, 76, hexc('#8a8f9c'))
    # window above the sink with moonlight
    bg.rect(66, 34, 96, 84, hexc('#2a3250')); bg.vgradient(68, 36, 94, 82, [hexc('#3d5688'), hexc('#2b3f68'), hexc('#1f2d4d')])
    bg.rect(80, 36, 81, 82, hexc('#2a3250')); bg.rect(68, 58, 94, 59, hexc('#2a3250'))
    for x in range(68, 95, 7):
        bg.rect(x, 74 - (x * 5) % 6, x + 5, 82, hexc('#141c30'))
    # fridge (dead) on the right
    bg.rect(112, 76, 134, 214, hexc('#4a4f5e')); bg.rect(113, 77, 133, 213, hexc('#5d6373'))
    bg.hline(113, 133, 136, hexc('#444956')); bg.rect(115, 116, 116, 132, hexc('#5e6370')); bg.rect(115, 140, 116, 156, hexc('#5e6370'))
    bg.vgradient(0, 214, SW - 1, SH - 1, [hexc('#151313'), hexc('#0e0c0c')])
    bg.save(f'{out}/kitchen_bg.png')

    fg = Canvas(SW, SH)
    fg.rect(0, 192, 111, 196, hexc('#5c5f6e')); fg.hline(0, 111, 192, hexc('#7a7e8f'))   # counter top (waist height)
    fg.rect(0, 197, 111, 226, hexc('#2b2320'))
    for x0 in (2, 38, 74):
        fg.rect(x0, 200, x0 + 32, 223, hexc('#33291f')); fg.rect(x0 + 15, 203, x0 + 18, 204, hexc('#8a8f9c'))
    fg.rect(0, 224, 111, 226, hexc('#1a1412'))
    fg.save(f'{out}/kitchen_fg.png')


def props2(out):
    at = Atlas(64, 140, [32, 139], cols=8)
    for on in (True, False):                            # bedside lamp
        c = Canvas(64, 140)
        c.rect(29, 124, 34, 139, hexc('#6a5a48')); c.rect(25, 136, 38, 139, hexc('#4a3e32'))
        shade = hexc('#f2d9a0') if on else hexc('#6d6658')
        side = hexc('#e0bf78') if on else hexc('#5a5448')
        for i in range(12):
            c.hline(24 - i // 3, 39 + i // 3, 112 + i, shade)
        c.vline(36, 112, 123, side); c.vline(37, 113, 123, side)
        c.outline(OUT)
        at.add('lamp_on' if on else 'lamp_off', c)
    for on in (True, False):                            # hallway ceiling fixture
        c = Canvas(64, 140)
        c.rect(30, 0, 33, 3, hexc('#3a3c48'))
        col = hexc('#fff0c8') if on else hexc('#5d6070')
        for i in range(6):
            c.hline(24 + i // 2, 39 - i // 2, 4 + i, col)
        c.outline(OUT)
        at.add('ceiling_on' if on else 'ceiling_off', c)
    f = Canvas(64, 140)                                  # flashlight lying down
    f.rect(16, 132, 40, 137, hexc('#2c2f3a')); f.rect(40, 130, 47, 139, hexc('#3c404e'))
    f.rect(47, 131, 48, 138, hexc('#b8c4d8')); f.rect(22, 131, 25, 131, hexc('#c8323c'))
    f.outline(OUT)
    at.add('flashlight', f)
    k = Canvas(64, 140)                                  # two candles (unlit)
    k.rect(20, 118, 25, 139, hexc('#e8e0cc')); k.rect(30, 124, 35, 139, hexc('#d8cfb8'))
    k.vline(22, 115, 117, OUT); k.vline(32, 121, 123, OUT)
    k.vline(24, 118, 139, hexc('#c9bfa8')); k.vline(34, 124, 139, hexc('#bdb39c'))
    k.outline(OUT)
    at.add('candles', k)
    p = Canvas(64, 140)                                  # phone lying screen-up (seen from the front edge)
    p.rect(20, 135, 43, 139, hexc('#1c1d24')); p.rect(21, 135, 42, 136, hexc('#2c3a5c'))
    p.outline(OUT)
    at.add('phone_flat', p)
    at.write(f'{out}/props2.png', f'{out}/props2.json', {'note': 'pivot = bottom centre of cell'})


def items(out):
    """Small supplies scaled to the cast (16x20 cells, bottom-centre pivot)."""
    at = Atlas(16, 20, [8, 19], cols=8)
    w = Canvas(16, 20)                                   # water bottle
    w.rect(6, 9, 9, 19, hexc('#3d7bd6')); w.rect(7, 6, 8, 8, hexc('#cfd8e6')); w.hline(7, 8, 5, hexc('#e8eef6'))
    w.rect(6, 12, 9, 14, hexc('#2c5fae')); w.vline(6, 9, 18, hexc('#79a9ee')); w.outline(OUT)
    at.add('water', w)
    c = Canvas(16, 20)                                   # cereal box, half empty
    c.rect(3, 5, 12, 19, hexc('#c8913a')); c.rect(3, 5, 12, 8, hexc('#8a5a2a')); c.rect(10, 5, 12, 19, hexc('#a5762f'))
    c.rect(5, 11, 8, 14, hexc('#e8d7a0')); c.outline(OUT)
    at.add('cereal', c)
    f = Canvas(16, 20)                                   # flashlight lying down
    f.rect(1, 16, 10, 19, hexc('#2c2f3a')); f.rect(10, 15, 14, 19, hexc('#3c404e')); f.vline(14, 16, 18, hexc('#b8c4d8'))
    f.put(4, 16, hexc('#c8323c')); f.outline(OUT)
    at.add('flashlight', f)
    k = Canvas(16, 20)                                   # two candles
    k.rect(4, 10, 6, 19, hexc('#e8e0cc')); k.rect(9, 13, 11, 19, hexc('#d8cfb8')); k.put(5, 9, OUT); k.put(10, 12, OUT)
    k.outline(OUT)
    at.add('candles', k)
    p = Canvas(16, 20)                                   # phone propped against the cereal, screen dark
    p.rect(5, 9, 10, 19, hexc('#1c1d24')); p.rect(6, 10, 9, 18, hexc('#232c44')); p.outline(OUT)
    at.add('phone', p)
    at.write(f'{out}/items.png', f'{out}/items.json', {'note': 'pivot = bottom centre of cell'})


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'out'
    street(f'{out}/sets'); kitchen(f'{out}/sets'); props2(f'{out}/sprites'); items(f'{out}/sprites')
    print('lights-out sets + props ->', out)
