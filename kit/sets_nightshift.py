"""NIGHT SHIFT interior (160x240 art px, kit density: hero = 34 px tall) + counter props.

  store_bg   back wall: glass storefront + door (outside visible), shutter housing, snack shelf,
             ice machine, fluorescent tubes (OFF; light added in Remotion), tiled floor
  store_fg   the counter (top y=202, waist height for feet at ~214), occludes whoever stands behind it
  ns_props   register, cctv, open_on/open_off, nozzle (32x32 cells, bottom-centre pivot)
The roller shutter itself is drawn in Remotion so it can roll smoothly and jam.
"""
import random, sys
from pixelkit import Canvas, Atlas, hexc, text3x5

SW, SH = 160, 240
OUT = hexc('#0b0c11')
FLOOR_Y = 200          # back-wall floor line (shutter bottom when fully down)
WIN = (46, 62, 156, 199)  # storefront glass area (x0, y0, x1, y1)


def store(out):
    rnd = random.Random(5)
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 30, [hexc('#15182a'), hexc('#1b1f33')])          # ceiling
    for x in range(0, SW, 20):
        bg.vline(x, 0, 30, hexc('#12152a'))
    for x0 in (26, 96):                                                           # tube fixtures (off)
        bg.rect(x0, 26, x0 + 36, 29, hexc('#2c3044')); bg.rect(x0 + 2, 27, x0 + 34, 28, hexc('#9aa0b4'))
    bg.vgradient(0, 31, SW - 1, FLOOR_Y, [hexc('#1f2538'), hexc('#1a2032'), hexc('#161b2b')])   # back wall
    bg.hline(0, SW - 1, 31, hexc('#2a3046'))
    # outside, seen through the glass: night sky, dark forecourt, pump silhouettes
    x0, y0, x1, y1 = WIN
    bg.vgradient(x0, y0, x1, y1, [hexc('#0a0f1c'), hexc('#111a2c'), hexc('#1a2333')])
    bg.rect(x0, 176, x1, y1, hexc('#20242e'))                                     # forecourt
    for px in (66, 98):
        bg.rect(px, 152, px + 8, 176, hexc('#2c3140')); bg.rect(px + 2, 155, px + 6, 160, hexc('#3d4458'))
        bg.rect(px - 3, 176, px + 11, 178, hexc('#3a3f4c'))
    bg.rect(x0, 120, x1, 123, hexc('#2b3040'))                                    # canopy edge far away
    # window frame + mullions + door
    frame = hexc('#3a3f52')
    bg.rect(x0 - 2, y0 - 2, x1 + 2, y0, frame); bg.rect(x0 - 2, y0, x0, y1, frame); bg.rect(x1, y0, x1 + 2, y1, frame)
    for mx in (82, 112, 138):
        bg.rect(mx, y0, mx + 1, y1, frame)
    bg.rect(113, 128, 137, 130, hexc('#8b90a0'))                                  # door push bar
    for gx in range(x0 + 4, x1, 17):                                              # faint glass streaks
        bg.line(gx, y0 + 4, gx + 6, y0 + 16, hexc('#25304a'))
    # shutter housing above the glass
    bg.rect(x0 - 3, 53, x1 + 3, 60, hexc('#4a4f5e')); bg.hline(x0 - 3, x1 + 3, 53, hexc('#6a6f80'))
    bg.rect(x0 - 3, 60, x1 + 3, 61, hexc('#2c303c'))
    # wall switch panel left of the glass (the shutter switch)
    bg.rect(36, 120, 42, 130, hexc('#3d4252')); bg.rect(38, 122, 40, 125, hexc('#c8323c'))
    # snack shelf (upper left)
    bg.rect(2, 66, 34, 116, hexc('#2a2420'))
    for sy in (78, 92, 106):
        bg.rect(3, sy, 33, sy + 1, hexc('#4a3e32'))
    cols = ['#c8913a', '#c8323c', '#3d7bd6', '#e8d7a0', '#4e5a3a', '#8a5a2a', '#cfd8e6']
    for sy in (67, 81, 95, 109):
        x = 4
        while x < 32:
            w = rnd.choice((3, 4, 5)); h = rnd.choice((7, 8, 9))
            bg.rect(x, sy + 10 - h, min(32, x + w - 1), sy + 10, hexc(rnd.choice(cols)))
            x += w + 1
    # ice machine (lower left)
    bg.rect(3, 150, 31, FLOOR_Y, hexc('#8d93a3')); bg.rect(4, 151, 30, FLOOR_Y, hexc('#a4aaba'))
    bg.rect(6, 154, 28, 164, hexc('#5d6c86')); text3x5(bg, 11, 157, 'ICE', hexc('#e8eef6'))
    bg.hline(4, 30, 170, hexc('#7c8291')); bg.rect(14, 174, 20, 176, hexc('#5e6370'))
    bg.rect(27, 167, 28, 168, hexc('#2a3044'))                                    # LED housing (lit in Remotion)
    # floor tiles
    for ty in range(FLOOR_Y, SH, 6):
        for tx in range(0, SW, 8):
            c = hexc('#22252e') if ((tx // 8) + (ty // 6)) % 2 else hexc('#1b1d25')
            bg.rect(tx, ty, tx + 7, min(SH - 1, ty + 5), c)
    bg.hline(0, SW - 1, FLOOR_Y, hexc('#2e3240'))
    bg.save(f'{out}/sets/store_bg.png')

    fg = Canvas(SW, SH)                                                           # counter
    fg.rect(0, 202, 104, 205, hexc('#8b8f9c')); fg.hline(0, 104, 202, hexc('#b8bcc6'))   # top at waist height
    fg.rect(0, 206, 102, 228, hexc('#2e2a2c'))
    for x0 in (4, 36, 68):
        fg.rect(x0, 209, x0 + 28, 224, hexc('#3a3436')); fg.hline(x0, x0 + 28, 209, hexc('#4a4446'))
    fg.rect(103, 206, 104, 228, hexc('#1a1718')); fg.rect(0, 228, 104, 230, hexc('#141214'))
    fg.save(f'{out}/sets/store_fg.png')


def props(out):
    at = Atlas(32, 32, [16, 31], cols=8)
    r = Canvas(32, 32)                                                            # register
    r.rect(6, 24, 26, 31, hexc('#3c404e')); r.rect(7, 25, 25, 26, hexc('#5a5f70'))
    r.rect(8, 28, 22, 29, hexc('#2c2f3a'))
    for k in range(4):
        r.rect(9 + k * 3, 27, 10 + k * 3, 27, hexc('#8b90a0'))
    r.rect(18, 16, 24, 23, hexc('#2c2f3a')); r.rect(19, 17, 23, 20, hexc('#1f3a2c'))
    r.outline(OUT); at.add('register', r)
    c = Canvas(32, 32)                                                            # cctv monitor
    c.rect(5, 12, 26, 27, hexc('#2c2f3a')); c.rect(7, 14, 24, 25, hexc('#0f1418'))
    c.rect(13, 28, 18, 31, hexc('#3c404e')); c.rect(10, 30, 21, 31, hexc('#3c404e'))
    c.outline(OUT); at.add('cctv', c)
    for on in (True, False):                                                      # OPEN sign
        s = Canvas(32, 32)
        s.rect(2, 20, 29, 30, hexc('#1a1416')); s.rect(3, 21, 28, 29, hexc('#c8323c') if on else hexc('#4a2a2e'))
        s.rect(4, 22, 27, 28, hexc('#1a1416'))
        text3x5(s, 8, 23, 'OPEN', hexc('#ff6a6a') if on else hexc('#5a3036'))
        s.vline(8, 14, 19, hexc('#3a3f52')); s.vline(23, 14, 19, hexc('#3a3f52'))
        at.add('open_on' if on else 'open_off', s)
    n = Canvas(32, 32)                                                            # dangling pump nozzle
    n.line(16, 0, 16, 22, hexc('#14151b')); n.line(17, 0, 17, 22, hexc('#2c2f3a'))
    n.rect(13, 22, 19, 26, hexc('#3c404e')); n.rect(17, 27, 18, 31, hexc('#8b90a0'))
    n.outline(OUT); at.add('nozzle', n)
    w = Canvas(32, 32)                                                            # walkie-talkie, hero-scaled
    w.vline(19, 13, 19, hexc('#2c2f3a')); w.vline(20, 13, 19, hexc('#3c404e'))
    w.rect(13, 19, 21, 31, hexc('#2c2f3a')); w.rect(14, 20, 20, 30, hexc('#3c404e'))
    w.rect(15, 21, 19, 23, hexc('#5d6c86'))
    for yy in (25, 27, 29):
        w.hline(15, 19, yy, hexc('#22252e'))
    w.put(14, 20, hexc('#c8323c'))
    w.outline(OUT); at.add('walkie', w)
    at.write(f'{out}/sprites/ns_props.png', f'{out}/sprites/ns_props.json', {'note': 'NIGHT SHIFT counter props, pivot bottom centre'})


if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else 'public'
    store(o); props(o)
    print('night shift sets + props ->', o)
