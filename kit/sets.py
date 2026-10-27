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
