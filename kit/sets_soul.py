"""SOUL FOR SALE: supermarket checkout set, props and extra cast (all code-drawn, 135x240 kit density).

  market_bg    back wall of aisle 6: shelving bays, hanging aisle sign, tube fixtures (OFF; light added in
               Remotion), lino floor. Floor line at y=186.
  market_fg    checkout counter: belt top y 205-209 (belt ridges are animated in Remotion), front panel, register
  soul_props   envelope, envelope_black, steak, cash, badge, clock, box, can (32x32 cells, pivot bottom centre)
  cast         manager, coworker, hero_uniform, stranger_{a..d} (+ _u uniform versions); 'hold' arms = a receipt
               hanging from the right hand
"""
import random, sys
import characters as C
from pixelkit import Canvas, Atlas, hexc, text3x5

SW, SH = 135, 240
OUT = hexc('#0b0c11')
FLOOR_Y = 186
BELT = (0, 205, 92, 209)


def market(out):
    rnd = random.Random(9)
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 34, [hexc('#14172a'), hexc('#1a1e33')])               # ceiling
    for x in range(0, SW, 18):
        bg.vline(x, 0, 34, hexc('#121527'))
    for x0 in (14, 84):                                                               # tube fixtures (off)
        bg.rect(x0, 20, x0 + 36, 23, hexc('#2c3044')); bg.rect(x0 + 2, 21, x0 + 34, 22, hexc('#9aa0b4'))
    bg.vgradient(0, 35, SW - 1, FLOOR_Y, [hexc('#232a3c'), hexc('#1d2334')])          # back wall
    # hanging aisle sign
    bg.vline(56, 26, 31, hexc('#3a3f52')); bg.vline(78, 26, 31, hexc('#3a3f52'))
    bg.rect(50, 32, 84, 42, hexc('#1e4c7a')); bg.rect(51, 33, 83, 41, hexc('#2a6aa8'))
    text3x5(bg, 53, 35, 'AISLE 6', hexc('#e8eef6'))
    # three shelving bays
    cols = ['#c8913a', '#c8323c', '#3d7bd6', '#e8d7a0', '#4e5a3a', '#8a5a2a', '#cfd8e6', '#6b3d6e', '#d6a13d']
    for bx0, bx1 in ((2, 43), (47, 88), (92, 133)):
        bg.rect(bx0, 48, bx1, FLOOR_Y, hexc('#2a2e3a'))
        bg.rect(bx0, 48, bx0 + 1, FLOOR_Y, hexc('#4a4f5e')); bg.rect(bx1 - 1, 48, bx1, FLOOR_Y, hexc('#3a3f4c'))
        for sy in (72, 96, 120, 144, 168):
            bg.rect(bx0, sy, bx1, sy + 2, hexc('#5a5f70')); bg.hline(bx0, bx1, sy, hexc('#8b90a0'))
            for tx in range(bx0 + 4, bx1 - 3, 7):                                  # price strip
                bg.rect(tx, sy + 1, tx + 2, sy + 2, hexc('#e8d7a0'))
            x = bx0 + 3
            while x < bx1 - 4:
                kind = rnd.random(); c = hexc(rnd.choice(cols))
                lite = tuple(min(255, v + 40) for v in c[:3]) + (255,)
                if kind < 0.45:                                                   # cereal-style box with label band
                    w, h = rnd.choice((6, 7)), rnd.choice((10, 12))
                    bg.rect(x, sy - h, x + w - 1, sy - 1, c); bg.rect(x + 1, sy - h + 3, x + w - 2, sy - h + 5, hexc('#e8eef6'))
                elif kind < 0.8:                                                  # stacked cans
                    w = 4
                    for cy0 in (sy - 5, sy - 10):
                        bg.rect(x, cy0, x + 3, cy0 + 4, c); bg.hline(x, x + 3, cy0, lite)
                else:                                                             # bottles
                    w = 3
                    bg.rect(x, sy - 8, x + 2, sy - 1, c); bg.put(x + 1, sy - 10, lite); bg.put(x + 1, sy - 9, lite)
                x += w + 1
    # lino floor
    for ty in range(FLOOR_Y, SH, 5):
        for tx in range(0, SW, 9):
            c = hexc('#3a3f4c') if ((tx // 9) + (ty // 5)) % 2 else hexc('#323642')
            bg.rect(tx, ty, tx + 8, min(SH - 1, ty + 4), c)
    bg.hline(0, SW - 1, FLOOR_Y, hexc('#4a4f5e'))
    bg.save(f'{out}/sets/market_bg.png')

    fg = Canvas(SW, SH)                                                               # checkout counter
    x0, y0, x1, y1 = BELT
    fg.rect(0, y0 - 1, SW - 1, y0 - 1, hexc('#b8bcc6'))
    fg.rect(x0, y0, x1, y1, hexc('#1c1d24'))                                           # belt (ridges in Remotion)
    fg.rect(x1 + 1, y0, SW - 1, y1, hexc('#8b8f9c')); fg.hline(x1 + 1, SW - 1, y0, hexc('#b8bcc6'))
    fg.rect(0, y1 + 1, SW - 1, y1 + 2, hexc('#5a5f70'))
    fg.rect(0, y1 + 3, SW - 1, 234, hexc('#c9ccd4'))                                  # front panel
    fg.rect(0, 220, SW - 1, 223, hexc('#c8323c'))                                     # store stripe
    for x in range(6, SW, 30):
        fg.vline(x, y1 + 3, 234, hexc('#aeb2bc'))
    fg.rect(0, 235, SW - 1, 239, hexc('#22252e'))
    # register on the right end
    fg.rect(104, 194, 126, 204, hexc('#3c404e')); fg.rect(105, 195, 125, 197, hexc('#5a5f70'))
    for k in range(5):
        fg.rect(107 + k * 4, 199, 108 + k * 4, 200, hexc('#8b90a0'))
    fg.rect(112, 180, 124, 191, hexc('#2c2f3a')); fg.rect(113, 181, 123, 189, hexc('#1f3a2c'))
    fg.rect(117, 192, 119, 193, hexc('#2c2f3a'))
    fg.outline(OUT)
    fg.save(f'{out}/sets/market_fg.png')


def props(out):
    at = Atlas(32, 32, [16, 31], cols=8)

    def add(name, draw, outline=True):
        c = Canvas(32, 32); draw(c)
        if outline: c.outline(OUT)
        at.add(name, c)

    def envelope(c, body, flap, seal):
        c.rect(8, 23, 23, 31, body); c.line(8, 23, 15, 28, flap); c.line(23, 23, 16, 28, flap)
        c.rect(15, 27, 16, 29, seal)
    add('envelope', lambda c: envelope(c, hexc('#e8dcc0'), hexc('#b8a988'), hexc('#c8323c')))
    add('envelope_black', lambda c: envelope(c, hexc('#26232a'), hexc('#48424e'), hexc('#ff3b3b')))

    def steak(c):
        c.rect(6, 28, 25, 31, hexc('#e8eef6')); c.hline(6, 25, 28, hexc('#ffffff'))
        c.disc(15, 26, 4.4, hexc('#a3202c')); c.disc(14, 25, 2.6, hexc('#c8323c'))
        c.line(11, 27, 18, 24, hexc('#f0d8d0'))
        c.rect(19, 27, 24, 29, hexc('#ffcf3a'))
    add('steak', steak)

    def cash(c):
        for k, y in enumerate((29, 27, 25)):
            c.rect(9 + k, y, 22 + k, y + 2, hexc('#5c8a4a')); c.hline(9 + k, 22 + k, y, hexc('#7fb36a'))
        c.rect(14, 25, 16, 31, hexc('#e8d7a0'))
    add('cash', cash)
    add('badge', lambda c: (c.rect(12, 26, 21, 31, hexc('#d6a13d')), c.rect(13, 28, 20, 29, hexc('#5a3a14'))))

    def clock(c):
        c.rect(8, 24, 23, 31, hexc('#2c2f3a')); c.rect(9, 25, 22, 30, hexc('#0f1012'))
    add('clock', clock)
    add('box', lambda c: (c.rect(12, 25, 19, 31, hexc('#a8743a')), c.hline(12, 19, 27, hexc('#7a5226'))))
    add('can', lambda c: (c.rect(14, 26, 17, 31, hexc('#c8323c')), c.hline(14, 17, 28, hexc('#e8eef6'))))
    at.write(f'{out}/sprites/soul_props.png', f'{out}/sprites/soul_props.json', {'note': 'SOUL FOR SALE props, pivot bottom centre'})


# ---------- extra cast ----------
C.HEADS.update({
    'tan': (hexc('#d9b48f'), hexc('#b8926d'), hexc('#efd0ae')),
    'deep': (hexc('#8a5a3c'), hexc('#6e452d'), hexc('#a8714f')),
    'pale': (hexc('#f3e3d3'), hexc('#d8c4b0'), hexc('#ffffff')),
    'olivetone': (hexc('#c79b6c'), hexc('#a67c50'), hexc('#e0b88a')),
})
UNIFORM = (hexc('#2b2c35'), hexc('#22232b'))
C.CLOTHES.update({'uniform': UNIFORM, 'mustard': (hexc('#8a7a3a'), hexc('#6e612d')), 'denim': (hexc('#3d5a7a'), hexc('#2f4760'))})
C.ARMS['hold'] = [((10, 22), (9, 27), (9, 32)), ((22, 22), (23, 27), (19, 27))]

_body, _frame = C.body, C.build_frame


def body(cv, cloth, dy, legs='stand', walk=0):
    _body(cv, cloth, dy, legs, walk)
    if cloth is UNIFORM:                                   # red name badge, left chest
        cv.rect(12, 24 + dy, 14, 25 + dy, hexc('#ff3b3b'))


def build_frame(head, cloth, arms='down', face='neutral', dy=0, view='front', ox=0, legs='stand', walk=0):
    b = _frame(head, cloth, arms, face, dy, view, ox, legs, walk)
    if arms == 'hold' and view == 'front':                 # receipt hanging from the right hand
        b.rect(17, 29 + dy, 20, 36 + dy, OUT); b.rect(18, 29 + dy, 19, 35 + dy, hexc('#f4f1e8'))
        for y in (31, 33):
            b.put(18, y + dy, hexc('#9a968c'))
        b.disc(19, 27 + dy, 1.3, head[0])
    return b


C.body, C.build_frame = body, build_frame


def cast(out):
    small = ['neutral', 'worried', 'smile', 'creepy', 'blink']
    C.build_character('manager', 'tan', 'maroon', out, faces=['neutral', 'worried', 'scared', 'blink'], arms=['down', 'open', 'reach'])
    C.build_character('coworker', 'deep', 'teal', out, faces=['neutral', 'smile', 'creepy', 'blink'], arms=['down', 'up', 'reach'])
    C.build_character('hero_uniform', 'warm', 'uniform', out, faces=['neutral', 'worried', 'scared', 'shock', 'blink'], arms=['down', 'phone', 'open'])
    for k, (h, c) in enumerate([('pale', 'mustard'), ('olivetone', 'denim'), ('deep', 'plum'), ('tan', 'olive')]):
        n = 'abcd'[k]
        C.build_character(f'stranger_{n}', h, c, out, faces=small, arms=['down', 'hold'])
        C.build_character(f'stranger_{n}_u', h, 'uniform', out, faces=small, arms=['down', 'hold'])


if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else 'public'
    market(o); props(o); cast(o + '/sprites')
    print('soul for sale sets + props + cast ->', o)
