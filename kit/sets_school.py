"""AFTER HOURS: school sets, props and extra cast (all code-drawn, 135x240 kit density).

  library_bg/fg  library at dusk: two tall windows (left), bookshelf (right), ceiling panels (OFF; light
                 added in Remotion), carpet. fg = long study table (top y 188) with books + laptop lid.
  hall_bg        one-point-perspective corridor, VP (67, 112): lockers, classroom doors, ceiling light
                 panels (OFF), far double doors + EXIT sign. Depth z: screen = VP + (near - VP) / z,
                 near frame x 0..134, ceiling y 20, floor y 232; far wall at z = FAR_Z.
  door_bg/fg     library side of the door: wall, door with a narrow window (TRANSPARENT so the
                 hallway/face drawn behind shows through), PA speaker above, wall clock.
                 fg = wired-glass mesh over the window + a low book-return cart (hero hides behind it).
  parking_bg     staff lot at night: streetlight, two parked cars, the principal's empty reserved spot.
  school_props   jan_cart, keys (32x32, pivot bottom centre)
  infected       tall figure, 32x64 cell, pivot [16, 63]: stand, tilt, face, face_open
  cast           janitor (tan / olive work shirt)
"""
import random, sys
import characters as C
from pixelkit import Canvas, Atlas, hexc, text3x5

SW, SH = 135, 240
OUT = hexc('#0b0c11')
VPX, VPY = 67, 112
NEAR_L, NEAR_R, NEAR_T, NEAR_B = 0, 134, 20, 232
FAR_Z = 4.47                      # where the side walls meet the far wall (x 52..82)
DOOR_WIN = (62, 150, 75, 171)     # door window hole (inclusive) in door_bg


def sx(x_near, z):
    return VPX + (x_near - VPX) / z


def sy(y_near, z):
    return VPY + (y_near - VPY) / z


def shade(c, k):
    """Darken a colour towards the corridor fog by k (0..1)."""
    fog = (10, 12, 22)
    return tuple(int(c[i] * (1 - k) + fog[i] * k) for i in range(3)) + (255,)


# ---------------- hallway ----------------
def hall(out):
    bg = Canvas(SW, SH)
    wall, ceil, floor_a, floor_b = hexc('#3a4256'), hexc('#262b3a'), hexc('#5a5f6c'), hexc('#4e5360')
    locker_c = [hexc('#2f5c8a'), hexc('#2a5480')]
    for y in range(SH):
        for x in range(SW):
            # inverse perspective: which surface, at what depth
            if x < sx(NEAR_L, FAR_Z) or x > sx(NEAR_R, FAR_Z):
                near = NEAR_L if x < VPX else NEAR_R
                z = (near - VPX) / (x - VPX)
                top, bot = sy(NEAR_T, z), sy(NEAR_B, z)
                if top <= y <= bot:
                    k = min(0.85, (z - 1) / 4.5)
                    hgt = (y - top) / (bot - top)              # 0 ceiling .. 1 floor
                    world = z * 4                               # locker column index along the wall
                    if hgt > 0.38:
                        col = int(world) % 2
                        c = locker_c[col]
                        if abs(world - round(world)) < 0.06 * z:
                            c = hexc('#1c2c44')                 # locker seam
                        if 0.5 < hgt < 0.53:
                            c = hexc('#8fa6c4')                 # vent slats band
                        if 0.62 < hgt < 0.66 and (world % 1) > 0.7:
                            c = hexc('#c9d3e0')                 # handle
                        if hgt > 0.97:
                            c = hexc('#1a1d26')                 # baseboard
                    else:
                        c = wall if hgt > 0.05 else hexc('#2e3446')
                    # classroom doors at a few depths
                    for dz in (1.6, 2.9):
                        if dz <= z <= dz + 0.35 and hgt > 0.2:
                            c = hexc('#5c4632') if not (0.3 < hgt < 0.5 and dz + 0.08 < z < dz + 0.22) else hexc('#16202e')
                    bg.put(x, y, shade(c, k)); continue
                z = None
            # ceiling / floor / far wall
            if y < VPY:
                z = (NEAR_T - VPY) / (y - VPY) if y != VPY else 99
            else:
                z = (NEAR_B - VPY) / (y - VPY) if y != VPY else 99
            if z > FAR_Z:                                       # far wall
                c = wall
                bg.put(x, y, shade(c, 0.85)); continue
            k = min(0.85, (z - 1) / 4.5)
            wx = (x - VPX) * z                                  # world x (near-frame px)
            if y < VPY:
                c = ceil
                for pz in PANELS:                               # ceiling light panels (off)
                    if pz <= z <= pz + 0.18 and abs(wx) < 22:
                        c = hexc('#9aa0b4') if abs(wx) < 20 else hexc('#5a6070')
            else:
                tile = (int(z * 6) + int((wx + 400) / 22)) % 2
                c = floor_a if tile else floor_b
            bg.put(x, y, shade(c, k))
    # far wall details: double doors + EXIT sign
    fx0, fx1, ft, fb = round(sx(NEAR_L, FAR_Z)), round(sx(NEAR_R, FAR_Z)), round(sy(NEAR_T, FAR_Z)), round(sy(NEAR_B, FAR_Z))
    bg.rect(fx0 + 6, ft + 16, fx1 - 6, fb, hexc('#2a2f3c'))
    bg.vline((fx0 + fx1) // 2, ft + 16, fb, hexc('#14161e'))
    for wx0 in (fx0 + 9, (fx0 + fx1) // 2 + 3):
        bg.rect(wx0, ft + 20, wx0 + 3, ft + 26, hexc('#0d1018'))
    bg.rect(VPX - 5, ft + 9, VPX + 5, ft + 13, hexc('#3a0e12'))
    text3x5(bg, VPX - 4, ft + 9, 'EX', hexc('#ff4a4a'))
    bg.save(f'{out}/sets/hall_bg.png')


PANELS = (1.25, 1.9, 2.6, 3.4)   # ceiling light panel depths (Remotion lights them)


# ---------------- library ----------------
def library(out):
    rnd = random.Random(3)
    bg = Canvas(SW, SH)
    FLOOR = 176
    bg.vgradient(0, 0, SW - 1, 26, [hexc('#1a1d2a'), hexc('#20243a')])
    for x0 in (14, 82):                                                     # ceiling panels (off)
        bg.rect(x0, 18, x0 + 38, 22, hexc('#2c3044')); bg.rect(x0 + 2, 19, x0 + 36, 21, hexc('#9aa0b4'))
    bg.vgradient(0, 27, SW - 1, FLOOR, [hexc('#3b3a4a'), hexc('#34333f')])  # wall
    bg.hline(0, SW - 1, 27, hexc('#4a4858'))
    for wx0, wx1 in ((6, 30), (38, 62)):                                    # tall windows: winter dusk
        bg.rect(wx0 - 2, 44, wx1 + 2, 150, hexc('#2a2a36'))
        bg.vgradient(wx0, 46, wx1, 148, [hexc('#0e1630'), hexc('#1d2a52'), hexc('#3a3a66')])
        for _ in range(4):                                                  # far streetlights
            bg.put(rnd.randint(wx0 + 1, wx1 - 1), rnd.randint(128, 140), hexc('#ffc46b'))
        bg.rect(wx0, 136, wx1, 148, hexc('#141826'))                        # tree line
        bg.vline((wx0 + wx1) // 2, 46, 148, hexc('#2a2a36')); bg.hline(wx0, wx1, 96, hexc('#2a2a36'))
        bg.rect(wx0 - 3, 150, wx1 + 3, 152, hexc('#4a4858'))                # sill
    # wall clock between window and shelf
    bg.disc(76, 52, 6, hexc('#e8eef6')); bg.disc(76, 52, 5, hexc('#f4f1e8'))
    bg.vline(76, 48, 52, hexc('#14151b')); bg.hline(76, 79, 52, hexc('#14151b'))
    # bookshelf (right)
    cols = ['#8a3a3a', '#3d5a7a', '#c8913a', '#4e5a3a', '#6b3d6e', '#e8d7a0', '#2f5c57', '#a8743a']
    bg.rect(88, 64, 133, FLOOR, hexc('#4a3426'))
    for sy0 in (64, 92, 120, 148):
        bg.rect(88, sy0, 133, sy0 + 2, hexc('#6b4c36'))
        x = 91
        while x < 130:
            w = rnd.choice((2, 2, 3)); h = rnd.randint(16, 22)
            bg.rect(x, sy0 + 26 - h + 2, x + w - 1, sy0 + 25, hexc(rnd.choice(cols)))
            x += w + (1 if rnd.random() < 0.2 else 0)
    bg.rect(88, FLOOR - 2, 133, FLOOR, hexc('#3a281c'))
    # carpet
    for ty in range(FLOOR, SH, 4):
        for tx in range(0, SW, 4):
            bg.put(tx + (ty // 4) % 2 * 2, ty + 1, hexc('#2c3346'))
    bg.rect(0, FLOOR + 1, SW - 1, SH - 1, hexc('#262c3c'))
    for ty in range(FLOOR + 2, SH, 5):
        for tx in range((ty // 5) % 3, SW, 3):
            bg.put(tx, ty, hexc('#2e3548'))
    bg.hline(0, SW - 1, FLOOR, hexc('#4a4858'))
    bg.save(f'{out}/sets/library_bg.png')

    fg = Canvas(SW, SH)                                                     # study table
    fg.rect(4, 188, 130, 192, hexc('#8a6440')); fg.hline(4, 130, 188, hexc('#a87c52'))
    fg.rect(4, 193, 130, 215, hexc('#5c4130'))
    fg.rect(8, 216, 12, 239, hexc('#3a281c')); fg.rect(122, 216, 126, 239, hexc('#3a281c'))
    fg.rect(52, 176, 82, 187, hexc('#2a2d36')); fg.rect(53, 177, 81, 186, hexc('#363a46'))  # laptop lid (back)
    fg.rect(64, 180, 70, 183, hexc('#4a4f5e'))
    for k, (bx, c) in enumerate(((16, '#8a3a3a'), (20, '#3d5a7a'), (24, '#c8913a'))):   # book stack
        fg.rect(bx - 6 + k, 184 - k * 3, bx + 10 + k, 186 - k * 3, hexc(c))
    fg.rect(100, 182, 114, 187, hexc('#e8eef6')); fg.hline(101, 113, 184, hexc('#9aa0b4'))  # notebook
    fg.outline(OUT)
    fg.save(f'{out}/sets/library_fg.png')


# ---------------- library door ----------------
def door(out):
    bg = Canvas(SW, SH)
    FLOOR = 200
    bg.vgradient(0, 0, SW - 1, FLOOR, [hexc('#33323e'), hexc('#3b3a4a')])
    bg.rect(0, 0, SW - 1, 6, hexc('#20243a'))
    # door frame + door
    bg.rect(48, 126, 90, FLOOR, hexc('#5a5868'))
    bg.rect(51, 129, 87, FLOOR, hexc('#6b4c36')); bg.vline(51, 129, FLOOR, hexc('#8a6440'))
    for y in (140, 186):
        bg.hline(53, 85, y, hexc('#5c4130'))
    bg.rect(80, 168, 84, 171, hexc('#c9ccd4')); bg.rect(81, 172, 82, 174, hexc('#9aa0b4'))    # handle
    x0, y0, x1, y1 = DOOR_WIN
    bg.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, hexc('#2a2d36'))
    for y in range(y0, y1 + 1):                                              # hole: hallway shows through
        for x in range(x0, x1 + 1):
            bg.put(x, y, (0, 0, 0, 0))
    # PA speaker above the door
    bg.rect(60, 104, 78, 116, hexc('#c9ccd4')); bg.rect(61, 105, 77, 115, hexc('#b3b8c2'))
    for y in range(106, 115, 2):
        bg.hline(62, 76, y, hexc('#6a6f7c'))
    # wall clock
    bg.disc(112, 96, 6, hexc('#e8eef6')); bg.disc(112, 96, 5, hexc('#f4f1e8'))
    bg.vline(112, 92, 96, hexc('#14151b')); bg.line(112, 96, 115, 98, hexc('#14151b'))
    text3x5(bg, 98, 70, 'LIBRARY', hexc('#8b90a0'))
    bg.rect(98, 112, 100, 116, hexc('#c9ccd4'))                              # light switch
    # floor
    bg.rect(0, FLOOR, SW - 1, SH - 1, hexc('#262c3c'))
    for ty in range(FLOOR + 2, SH, 5):
        for tx in range((ty // 5) % 3, SW, 3):
            bg.put(tx, ty, hexc('#2e3548'))
    bg.hline(0, SW - 1, FLOOR, hexc('#4a4858'))
    bg.save(f'{out}/sets/door_bg.png')

    fg = Canvas(SW, SH)
    for k in range(-30, 30, 7):                                              # wired glass (sparse diamond mesh)
        for t in range(0, 30):
            for (xx, yy) in ((x0 + k + t, y0 + t), (x0 + k + t, y1 - t)):
                if x0 <= xx <= x1 and y0 <= yy <= y1:
                    fg.put(xx, yy, hexc('#9aa0b4', 55))
    # book-return cart (hero ducks behind it)
    fg.rect(20, 182, 60, 184, hexc('#7a7f8c')); fg.rect(20, 185, 60, 198, hexc('#4a4f5e'))
    for bx in range(22, 58, 3):
        fg.rect(bx, 176, bx + 1, 181, hexc(['#8a3a3a', '#3d5a7a', '#c8913a', '#4e5a3a'][bx % 4]))
    fg.disc(24, 199, 1.5, hexc('#1c1d24')); fg.disc(56, 199, 1.5, hexc('#1c1d24'))
    fg.outline(OUT)
    fg.save(f'{out}/sets/door_fg.png')


# ---------------- staff parking lot ----------------
def parking(out):
    rnd = random.Random(8)
    bg = Canvas(SW, SH)
    bg.vgradient(0, 0, SW - 1, 120, [hexc('#070a16'), hexc('#0e1630'), hexc('#1a2244')])
    for _ in range(18):
        bg.put(rnd.randint(0, SW - 1), rnd.randint(0, 60), hexc('#8b90a0'))
    for x in range(0, SW):                                                   # tree line
        h = 8 + int(4 * abs(((x * 7) % 11) - 5) / 5)
        bg.vline(x, 120 - h, 122, hexc('#0b0f1a'))
    bg.vgradient(0, 122, SW - 1, SH - 1, [hexc('#1c1f28'), hexc('#262a34')])  # asphalt
    for k in range(6):                                                       # bay lines in perspective
        xb = 4 + k * 26
        bg.line(xb, 236, 34 + k * 14, 140, hexc('#c9ccd4'))
    bg.hline(20, 120, 140, hexc('#8b90a0'))
    # streetlight
    bg.rect(112, 52, 113, 140, hexc('#3a3f4c')); bg.rect(100, 50, 113, 52, hexc('#3a3f4c'))
    bg.rect(98, 52, 104, 54, hexc('#e8d7a0'))
    # parked cars (bays 1 and 3)
    def car(x, y, c):
        bg.rect(x, y - 9, x + 22, y, hexc(c)); bg.rect(x + 4, y - 15, x + 18, y - 9, hexc(c))
        bg.rect(x + 6, y - 14, x + 16, y - 10, hexc('#141826'))
        bg.disc(x + 5, y + 1, 2.5, hexc('#0b0c11')); bg.disc(x + 17, y + 1, 2.5, hexc('#0b0c11'))
        bg.rect(x + 1, y - 7, x + 2, y - 6, hexc('#ff3b3b'))
    car(10, 206, '#3d5a7a'); car(66, 172, '#5c2f38')
    # the principal's empty bay: sign post + text
    bg.rect(46, 196, 46, 226, hexc('#8b90a0'))
    bg.rect(26, 182, 66, 198, hexc('#e8eef6')); bg.rect(27, 183, 65, 197, hexc('#1e4c7a'))
    text3x5(bg, 31, 185, 'RESERVED', hexc('#e8eef6')); text3x5(bg, 29, 191, 'PRINCIPAL', hexc('#ffcf3a'))
    bg.save(f'{out}/sets/parking_bg.png')


# ---------------- props + infected ----------------
def props(out):
    at = Atlas(32, 32, [16, 31], cols=8)

    def add(name, draw):
        c = Canvas(32, 32); draw(c); c.outline(OUT); at.add(name, c)

    def cart(c):
        c.rect(6, 18, 25, 20, hexc('#ffcf3a')); c.rect(7, 21, 24, 28, hexc('#d6a13d'))
        c.rect(9, 10, 14, 17, hexc('#3d7bd6')); c.rect(17, 12, 21, 17, hexc('#5a5f70'))   # bucket, bin
        c.vline(25, 6, 20, hexc('#8b90a0')); c.rect(24, 5, 27, 6, hexc('#8b90a0'))         # mop handle
        c.disc(9, 30, 1.5, hexc('#1c1d24')); c.disc(22, 30, 1.5, hexc('#1c1d24'))
    add('jan_cart', cart)
    add('keys', lambda c: (c.disc(15, 29, 2, hexc('#c9ccd4')), c.rect(17, 29, 20, 30, hexc('#d6a13d')), c.rect(12, 30, 14, 31, hexc('#9aa0b4'))))
    at.write(f'{out}/sprites/school_props.png', f'{out}/sprites/school_props.json', {'note': 'AFTER HOURS props, pivot bottom centre'})

    inf = Atlas(32, 64, [16, 63], cols=8)
    skin, sh, eye = hexc('#c3c7cf'), hexc('#8f949e'), hexc('#ffffff')

    def figure(tilt=0, face=False, mouth=False):
        c = Canvas(32, 64)
        c.thick(14, 62, 14, 36, 1.0, sh); c.thick(18, 62, 18, 36, 1.0, skin)     # legs
        c.rect(13, 20, 19, 37, skin); c.vline(19, 20, 37, sh)                     # torso
        c.thick(12, 21, 9, 34, 0.8, sh); c.thick(9, 34, 9, 46, 0.8, sh)           # long arms
        c.thick(20, 21, 23, 34, 0.8, skin); c.thick(23, 34, 23, 46, 0.8, skin)
        c.rect(15, 16, 17, 19, sh)                                                # neck
        hx, hy = 16 + tilt, 11 + abs(tilt) // 2
        c.disc(hx, hy, 5, skin); c.disc(hx + 1, hy + 1, 3.5, skin)
        for x in range(hx - 5, hx + 6):
            for y in range(hy - 5, hy + 6):
                if (x - hx) ** 2 + (y - hy) ** 2 <= 27 and (x - hx) + (y - hy) > 3:
                    c.put(x, y, sh)
        if face:
            c.put(hx - 2, hy, eye); c.put(hx + 2, hy, eye)
            if mouth:
                c.rect(hx - 1, hy + 2, hx + 1, hy + 4, hexc('#1b1c24'))
        c.outline(OUT)
        return c
    inf.add('stand', figure(0)); inf.add('tilt', figure(3)); inf.add('face', figure(0, True)); inf.add('face_open', figure(1, True, True))
    inf.write(f'{out}/sprites/infected.png', f'{out}/sprites/infected.json', {'note': 'tall infected figure, pivot feet'})


C.HEADS.setdefault('tan', (hexc('#d9b48f'), hexc('#b8926d'), hexc('#efd0ae')))


def cast(out):
    C.build_character('janitor', 'tan', 'olive', out, faces=['neutral', 'worried', 'scared', 'shock', 'blink'], arms=['down', 'up', 'reach', 'open'])


if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else 'public'
    hall(o); library(o); door(o); parking(o); props(o); cast(o + '/sprites')
    print('after hours sets + props + cast ->', o)
