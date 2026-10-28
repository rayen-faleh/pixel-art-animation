"""NIGHT ROAD: 16:9 sets, props and cast (all code-drawn). Stage is 240x135 art px (8x -> 1920x1080).

  nr_road       forward view of Route 9: sky, tree line, black fields, road to VP (120, 46).
                Depth z: ground y = 46 + 89/z, x = 120 + wx/z (road half-width 70 at z = 1).
                Dashes, headlights and everything on the road are added in Remotion.
  nr_cab_bg/fg  inside the car from the back seat: headliner + dome light, windshield / side windows
                TRANSPARENT (road shows through), mirror, wheel top, dash + radio. fg = front seat backs.
  nr_side_bg    side view of the road at night (sky, field, road 96..112); nr_side_far = tree line strip
                (480 wide, tiles) that scrolls slowly behind.
  nr_gas_bg/fg  gas station: canopy (lights added in Remotion), pumps, store, pad edge at y 100.
  nr_porch_bg   Dad's house at 2 AM: porch, door, porch lamp, driveway.
  nr_rear_bg    inside looking back: back seat, rear window TRANSPARENT.
  nr_card       insert: Dad's card on the passenger seat (rules 1-6, torn bottom).
  nr_strip      insert: the torn-off strip tucked in the visor (rule 7).
  nr_dome       insert: dome light + OFF / DOOR / ON switch.
  nr_radio      insert: radio faceplate (LED window left dark, digits drawn in Remotion).
  nr_mirror     insert: rear-view mirror frame, glass TRANSPARENT; nr_mirror_in = what it shows.
  sedan         96x36 cell, pivot [48, 35]: side, side_open, rear, rear_ours (one taillight out)
  pale          16x46 cell, pivot [8, 45]: side, front, look, step (the figures)
  nr_props      40x32 cell, pivot [20, 31]: marker_N, pump, hand_reach, hand_flat, hand_thumb,
                visor_up, visor_down, phone_down, phone_up, glasses
  dad           cast: hero rig, older head, brown jacket, glasses
"""
import random, sys
import characters as C
from pixelkit import Canvas, Atlas, hexc, text3x5, FONT3x5

W_, H_ = 240, 135
OUT = hexc('#0b0c11')
VPX, VPY = 120, 46
FONT3x5.update({"'": '010010000000000', ',': '000000000010100', '/': '001001010100100', '#': '101111101111101'})


def gy(z):
    return VPY + 89 / z


def gx(wx, z):
    return VPX + wx / z


def sky(cv, y1, rnd, stars=40):
    cv.vgradient(0, 0, W_ - 1, y1, [hexc('#03050b'), hexc('#070b16'), hexc('#0d1322')])
    for _ in range(stars):
        cv.put(rnd.randrange(W_), rnd.randrange(int(y1 * 0.8)), hexc('#56607a' if rnd.random() < 0.7 else '#8a94ad'))


def treeline(cv, x0, x1, base, rnd, c=hexc('#05080a'), hmax=9):
    h = 3
    for x in range(x0, x1):
        h = max(1, min(hmax, h + rnd.choice((-1, 0, 0, 1))))
        if rnd.random() < 0.04:
            h = min(hmax + 4, h + 4)
        cv.vline(x, base - h, base, c)


# ---------------------------------------------------------------- road (forward view)
def road(out):
    rnd = random.Random(9)
    cv = Canvas(W_, H_)
    sky(cv, VPY, rnd)
    treeline(cv, 0, W_, VPY, rnd)
    for y in range(VPY + 1, H_):
        z = 89 / (y - VPY)
        half, sh = 70 / z, 84 / z
        k = min(1, 1.6 / z)                    # nearer rows a touch lighter (residual sky light)
        for x in range(W_):
            d = abs(x - VPX)
            b = (((x * 7 + y * 13) % 5) == 0)
            if d <= half:
                c = (16 + int(6 * k), 17 + int(6 * k), 21 + int(7 * k), 255)
                if half - 1.2 / z <= d <= half:  # faded white edge line
                    c = (52, 54, 60, 255) if z < 8 else c
            elif d <= sh:
                c = (20, 21, 23, 255)
            else:
                c = (8, 12, 10, 255) if b else (10, 14, 11, 255)
            cv.put(x, y, c)
    # telephone poles on the left shoulder (posts get thinner with distance)
    for z in (1.6, 2.6, 4.2, 7.0, 11.0):
        x = int(gx(-120, z)); y = int(gy(z)); h = int(60 / z)
        cv.rect(x, y - h, x + max(0, int(2 / z)), y, hexc('#0c0f12'))
        cv.hline(x - int(8 / z), x + int(8 / z), y - h + 1, hexc('#0c0f12'))
    cv.save(f'{out}/sets/nr_road.png')


# ---------------------------------------------------------------- cab (inside, from the back seat)
WS_TOP, WS_BOT = 20, 66            # windshield top / bottom y
WS = lambda y: (40 - (y - WS_TOP) * 18 / (WS_BOT - WS_TOP), 200 + (y - WS_TOP) * 18 / (WS_BOT - WS_TOP))
CAB_DOME = (120, 9)
CAB_RADIO = (120, 79)
CAB_HERO = (72, 111)               # hero pivot (feet hidden by the seat)


def cab(out):
    bg = Canvas(W_, H_)
    head, seam = hexc('#191a21'), hexc('#14151b')
    bg.rect(0, 0, W_ - 1, H_ - 1, hexc('#111217'))
    bg.vgradient(0, 0, W_ - 1, 20, [hexc('#1d1e26'), head])
    for x in range(0, W_, 22):
        bg.vline(x, 2, 18, seam)
    # dome light fixture
    cx, cy = CAB_DOME
    bg.rect(cx - 9, cy - 3, cx + 9, cy + 3, hexc('#24252e')); bg.rect(cx - 7, cy - 2, cx + 7, cy + 2, hexc('#3b3c46'))
    bg.hline(cx - 6, cx + 6, cy - 1, hexc('#4a4b55'))
    bg.rect(cx + 11, cy - 1, cx + 14, cy + 1, hexc('#2b2c35'))          # switch
    # visor hinge rail (visors themselves are props)
    bg.hline(46, 98, 19, hexc('#22232b')); bg.hline(142, 194, 19, hexc('#22232b'))
    # windshield: transparent trapezoid
    for y in range(WS_TOP, WS_BOT + 1):
        l, r = WS(y)
        for x in range(int(l), int(r) + 1):
            bg.px[x, y] = (0, 0, 0, 0)
    # A-pillars
    for y in range(WS_TOP - 2, 92):
        l, r = WS(min(y, WS_BOT + 26))
        for k in range(8):
            bg.put(int(l) - 1 - k, y, hexc('#16171d') if k < 6 else hexc('#1d1e25'))
            bg.put(int(r) + 1 + k, y, hexc('#16171d') if k < 6 else hexc('#1d1e25'))
    # side windows (transparent slivers at both edges)
    for y in range(24, 64):
        for x in range(0, max(0, 14 - (y - 24) // 6)):
            bg.px[x, y] = (0, 0, 0, 0)
        for x in range(min(W_, 226 + (y - 24) // 6), W_):
            bg.px[x, y] = (0, 0, 0, 0)
    # mirror stem + body (glass dark; mirror inserts show content)
    bg.rect(119, 20, 121, 24, hexc('#22232b'))
    bg.rect(104, 24, 136, 32, hexc('#1b1c22')); bg.rect(106, 25, 134, 31, hexc('#0e1118'))
    bg.hline(107, 133, 25, hexc('#20263a'))
    # dashboard
    bg.rect(0, 66, W_ - 1, 92, hexc('#0f1014'))
    bg.hline(0, W_ - 1, 66, hexc('#1e2027')); bg.hline(0, W_ - 1, 67, hexc('#17181e'))
    bg.rect(44, 70, 100, 82, hexc('#0b0c10'))                            # cluster hood shadow
    for gxx in (58, 86):                                                  # two gauges (lit in Remotion)
        bg.disc(gxx, 77, 5, hexc('#16181f')); bg.disc(gxx, 77, 4, hexc('#0b0d12'))
    rx, ry = CAB_RADIO
    bg.rect(rx - 14, ry - 5, rx + 14, ry + 5, hexc('#1a1b21')); bg.rect(rx - 10, ry - 3, rx + 4, ry + 1, hexc('#0a0d0b'))
    bg.disc(rx + 9, ry - 1, 2, hexc('#2c2d35'))
    for x in range(rx - 10, rx + 5, 3):
        bg.rect(x, ry + 3, x + 1, ry + 4, hexc('#2a2b33'))
    # steering wheel (top arc + spokes peek over the seat)
    for a in range(0, 360, 2):
        import math
        t = math.radians(a)
        for r in (19, 20, 21):
            bg.put(int(72 + r * math.cos(t)), int(92 + r * math.sin(t)), hexc('#08090c'))
    bg.save(f'{out}/sets/nr_cab_bg.png')

    fg = Canvas(W_, H_)
    seat, seat_d, seat_h = hexc('#20222b'), hexc('#191a21'), hexc('#2a2c37')
    def seatback(x0, x1):
        for y in range(94, H_):
            inset = max(0, 6 - (y - 94)) if y < 100 else 0
            fg.hline(x0 + inset, x1 - inset, y, seat)
        fg.hline(x0 + 6, x1 - 6, 94, seat_h)
        for y in range(98, H_, 9):
            fg.hline(x0 + 3, x1 - 3, y, seat_d)
        fg.rect(x1 - 6, 100, x1, H_ - 1, seat_d)
    seatback(40, 104); seatback(136, 200)
    fg.rect(108, 104, 132, H_ - 1, hexc('#15161c'))                      # console
    fg.rect(117, 96, 123, 108, hexc('#1c1d24')); fg.disc(120, 95, 3, hexc('#26272f'))   # gear lever
    fg.save(f'{out}/sets/nr_cab_fg.png')


# ---------------------------------------------------------------- rear view (inside, looking back)
REAR_WIN = (52, 22, 188, 64)


def rear(out):
    cv = Canvas(W_, H_)
    cv.rect(0, 0, W_ - 1, H_ - 1, hexc('#121318'))
    cv.vgradient(0, 0, W_ - 1, 20, [hexc('#1b1c23'), hexc('#16171d')])
    x0, y0, x1, y1 = REAR_WIN
    for y in range(y0, y1 + 1):
        ins = (y1 - y) * 10 // (y1 - y0)
        for x in range(x0 + ins, x1 - ins + 1):
            cv.px[x, y] = (0, 0, 0, 0)
    cv.rect(30, 64, 210, 72, hexc('#16171c'))                            # rear deck
    cv.hline(30, 210, 64, hexc('#1f2027'))
    # back seat bench + headrests
    for y in range(72, H_):
        cv.hline(18, 222, y, hexc('#1e2029') if y < 104 else hexc('#191a22'))
    for x in (70, 120, 170):
        cv.vline(x, 74, 102, hexc('#16171e'))
    cv.hline(18, 222, 104, hexc('#13141a'))
    cv.hline(22, 218, 73, hexc('#272934'))
    cv.save(f'{out}/sets/nr_rear_bg.png')


# ---------------------------------------------------------------- side view of the road
def side(out):
    rnd = random.Random(4)
    bg = Canvas(W_, H_)
    sky(bg, 74, rnd, stars=60)
    bg.rect(0, 74, W_ - 1, 95, hexc('#0a0e0c'))
    for _ in range(140):
        bg.put(rnd.randrange(W_), rnd.randrange(75, 95), hexc('#0e1410'))
    bg.rect(0, 95, W_ - 1, 96, hexc('#1a1b1f'))                          # far shoulder
    bg.rect(0, 97, W_ - 1, 112, hexc('#16171c'))                         # road
    bg.hline(0, W_ - 1, 97, hexc('#34363c')); bg.hline(0, W_ - 1, 112, hexc('#34363c'))
    bg.rect(0, 113, W_ - 1, H_ - 1, hexc('#0b0f0c'))
    for _ in range(300):
        x, y = rnd.randrange(W_), rnd.randrange(114, H_)
        bg.vline(x, y - rnd.randrange(1, 4), y, hexc('#101712'))
    bg.save(f'{out}/sets/nr_side_bg.png')
    far = Canvas(480, H_)
    rnd2 = random.Random(5)
    treeline(far, 0, 480, 74, rnd2, c=hexc('#060a09'), hmax=12)
    far.save(f'{out}/sets/nr_side_far.png')
    # near grass strip in front of the road (field shots: things stand up behind it)
    gr = Canvas(480, H_)
    for x in range(480):
        h = 4 + int(3 * abs(((x * 37) % 11) - 5) / 5)
        gr.vline(x, H_ - 1 - h - 20, H_ - 1, hexc('#070a08'))
        if x % 3 == 0:
            gr.vline(x, H_ - 1 - h - 24 - (x % 5), H_ - 1 - h - 20, hexc('#070a08'))
    gr.save(f'{out}/sets/nr_grass.png')


# ---------------------------------------------------------------- gas station
GAS_LIGHTS = [(58, 25), (98, 25), (142, 25), (182, 25)]
GAS_PAD = 100


def gas(out):
    rnd = random.Random(12)
    bg = Canvas(W_, H_)
    sky(bg, 70, rnd, stars=30)
    treeline(bg, 0, W_, 70, rnd)
    bg.rect(0, 71, W_ - 1, GAS_PAD - 1, hexc('#07090a'))                 # the black lot
    bg.vgradient(0, GAS_PAD, W_ - 1, H_ - 1, [hexc('#2a2c31'), hexc('#34363b'), hexc('#2c2e33')])
    for x in range(0, W_, 30):
        bg.vline(x, GAS_PAD, H_ - 1, hexc('#26282d'))
    bg.hline(0, W_ - 1, GAS_PAD, hexc('#3d3f45'))
    # store on the right
    bg.rect(198, 52, 239, GAS_PAD + 4, hexc('#22242b')); bg.rect(198, 50, 239, 53, hexc('#2e3038'))
    bg.rect(204, 64, 232, 88, hexc('#0d1016')); bg.rect(204, 64, 232, 65, hexc('#3a3d47'))
    bg.vline(218, 64, 88, hexc('#22242b'))
    bg.rect(222, 76, 228, 82, hexc('#1a1d24'))                            # empty register
    text3x5(bg, 205, 56, 'GAS FOOD', hexc('#5c5f69'))
    # canopy columns + roof
    for x in (52, 188):
        bg.rect(x, 24, x + 3, GAS_PAD + 2, hexc('#9a9ca3')); bg.vline(x + 3, 24, GAS_PAD + 2, hexc('#7b7d84'))
    bg.rect(26, 12, 214, 22, hexc('#d9d9d6')); bg.rect(26, 20, 214, 23, hexc('#a62a2f'))
    bg.hline(26, 214, 12, hexc('#f0f0ec')); bg.hline(26, 214, 24, hexc('#55575d'))
    text3x5(bg, 104, 14, 'ROUTE 9 GAS', hexc('#3a3c42'))
    for lx, ly in GAS_LIGHTS:
        bg.rect(lx - 9, ly - 1, lx + 9, ly, hexc('#c9ccd2'))
    # pump island (behind the car)
    bg.rect(84, 92, 156, 98, hexc('#46484f'))
    bg.save(f'{out}/sets/nr_gas_bg.png')
    fg = Canvas(W_, H_)                                                   # front kerb of the pad
    fg.rect(0, 126, W_ - 1, H_ - 1, hexc('#24262b'))
    fg.hline(0, W_ - 1, 126, hexc('#45474d'))
    fg.save(f'{out}/sets/nr_gas_fg.png')


# ---------------------------------------------------------------- porch
def porch(out):
    rnd = random.Random(21)
    bg = Canvas(W_, H_)
    sky(bg, 60, rnd, stars=30)
    treeline(bg, 0, W_, 60, rnd, hmax=16)
    bg.rect(0, 60, W_ - 1, H_ - 1, hexc('#0b100d'))
    # house
    for i in range(30):
        bg.hline(6 + i * 2, 138 - i * 2, 40 - i, hexc('#191b22'))
    bg.rect(8, 40, 136, 104, hexc('#2c3140'))
    for y in range(42, 104, 3):
        bg.hline(8, 136, y, hexc('#262a37'))
    bg.rect(20, 50, 44, 68, hexc('#0f131c')); bg.rect(21, 51, 43, 67, hexc('#1a2236')); bg.vline(32, 51, 67, hexc('#0f131c'))
    bg.rect(98, 50, 122, 68, hexc('#0f131c')); bg.rect(99, 51, 121, 67, hexc('#1a2236')); bg.vline(110, 51, 67, hexc('#0f131c'))
    bg.rect(62, 72, 80, 104, hexc('#2a1f1c')); bg.rect(64, 74, 78, 104, hexc('#3d2c25'))   # door
    bg.put(76, 89, hexc('#c9a76a'))
    bg.rect(84, 76, 87, 80, hexc('#2e2a22')); bg.rect(85, 77, 86, 79, hexc('#e8d9a8'))      # porch lamp
    # porch deck, roof, posts, steps
    bg.rect(4, 70, 140, 72, hexc('#1e2028'))
    for x in (8, 134):
        bg.rect(x, 72, x + 2, 104, hexc('#3a3d47'))
    bg.rect(4, 104, 140, 108, hexc('#3a3026')); bg.hline(4, 140, 104, hexc('#4c3f32'))
    for k in range(3):
        bg.rect(60 - k * 2, 108 + k * 4, 82 + k * 2, 111 + k * 4, hexc('#3a3026'))
        bg.hline(60 - k * 2, 82 + k * 2, 108 + k * 4, hexc('#4c3f32'))
    # driveway
    for y in range(104, H_):
        bg.hline(150 - (y - 104) // 2, 239, y, hexc('#1f2024'))
    bg.save(f'{out}/sets/nr_porch_bg.png')


# ---------------------------------------------------------------- inserts
INK, PAPER, PAPER_D, RULE = hexc('#26315a'), hexc('#d8cfb4'), hexc('#bfb497'), hexc('#a9b6cf')
CARD = (22, 10, 218, 118)          # card box on nr_card (bottom edge torn)
CARD_LINES = ['NIGHT ROAD', "1. NEVER TURN ON THE INSIDE LIGHT.", "2. DON'T STOP FOR ANYONE AT A MILE MARKER.",
              "3. RADIO CHANGES BY ITSELF? LEAVE IT ON.", "4. PHONE FACE DOWN. SCREENS COUNT.",
              "5. IF YOU STOP, STOP UNDER A LIGHT.", "6. SOMETHING ON THE ROOF? DON'T BRAKE."]
CARD_Y = [16, 32, 45, 58, 71, 84, 97]   # baseline tops of each line (rule n at CARD_Y[n])


def handwrite(cv, x, y, s, rnd, c=INK):
    for word in s.split(' '):
        dy = rnd.choice((0, 0, 0, 1))
        x = text3x5(cv, x, y + dy, word, c) + 3
    return x


def fabric(cv, rnd, base=hexc('#1f2129'), alt=hexc('#24262f')):
    for y in range(H_):
        for x in range(W_):
            cv.put(x, y, alt if (x + y * 3) % 7 == 0 or rnd.random() < 0.05 else base)


def card(out):
    rnd = random.Random(7)
    cv = Canvas(W_, H_)
    fabric(cv, rnd)
    x0, y0, x1, y1 = CARD
    tear = [y1 - 4 + rnd.choice((0, 1, 2, 3, 4)) for _ in range(x1 - x0 + 1)]
    for x in range(x0 + 2, x1 + 3):                                       # shadow
        cv.vline(x, y0 + 2, tear[min(len(tear) - 1, x - x0)] + 2, hexc('#121318'))
    for x in range(x0, x1 + 1):
        cv.vline(x, y0, tear[x - x0], PAPER)
        cv.put(x, tear[x - x0], PAPER_D)
    for y in range(28, y1 - 6, 13):
        cv.hline(x0 + 4, x1 - 4, y + 7, RULE)
    cv.vline(x0 + 12, y0 + 2, y1 - 6, hexc('#c98e8e'))
    cv.hline(x0 + 1, x1 - 1, 62, PAPER_D)                                 # old fold
    handwrite(cv, x0 + 74, CARD_Y[0], CARD_LINES[0], rnd)
    cv.hline(x0 + 72, x0 + 118, CARD_Y[0] + 7, INK)
    for i in range(1, 7):
        handwrite(cv, x0 + 16, CARD_Y[i], CARD_LINES[i], rnd)
    cv.save(f'{out}/sets/nr_card.png')

    st = Canvas(W_, H_)                                                   # visor underside + strip
    for y in range(H_):
        for x in range(W_):
            st.put(x, y, hexc('#2a2b33') if (x // 2 + y) % 9 else hexc('#25262e'))
    st.rect(0, 0, W_ - 1, 8, hexc('#1c1d24'))
    sx0, sy0, sx1, sy1 = 34, 42, 206, 86
    top = [sy0 + rnd.choice((0, 1, 2, 3)) for _ in range(sx1 - sx0 + 1)]
    for x in range(sx0, sx1 + 1):
        st.vline(x + 2, top[x - sx0] + 2, sy1 + 2, hexc('#17181d'))
    for x in range(sx0, sx1 + 1):
        st.vline(x, top[x - sx0], sy1, PAPER)
        st.put(x, top[x - sx0], PAPER_D)
    handwrite(st, sx0 + 10, 54, '7. I WILL NEVER ASK YOU', rnd)
    handwrite(st, sx0 + 22, 68, 'TO TURN ON THE LIGHT.', rnd)
    st.hline(sx0 + 20, sx0 + 110, 76, INK)
    st.save(f'{out}/sets/nr_strip.png')


def dome(out):
    cv = Canvas(W_, H_)
    for y in range(H_):
        for x in range(W_):
            cv.put(x, y, hexc('#1b1c23') if (x * 3 + y * 5) % 11 else hexc('#18191f'))
    cv.vgradient(0, 0, W_ - 1, 20, [hexc('#121318'), hexc('#1b1c23')])
    # big fixture
    cv.rect(70, 40, 170, 86, hexc('#25262f')); cv.rect(72, 42, 168, 84, hexc('#2e2f39'))
    cv.rect(80, 48, 160, 78, hexc('#3d3f49'))
    for y in range(50, 77, 3):
        cv.hline(82, 158, y, hexc('#464853'))
    cv.hline(80, 160, 48, hexc('#575a66'))
    # 3-way switch
    cv.rect(178, 52, 214, 74, hexc('#22232b')); cv.rect(180, 54, 212, 72, hexc('#14151a'))
    text3x5(cv, 180, 44, 'OFF', hexc('#8a8d96')); text3x5(cv, 191, 77, 'DOOR', hexc('#8a8d96')); text3x5(cv, 204, 44, 'ON', hexc('#8a8d96'))
    cv.save(f'{out}/sets/nr_dome.png')


DOME_SW = {'off': 184, 'door': 196, 'on': 208}    # switch knob x positions (y 56..70)


def radio(out):
    cv = Canvas(W_, H_)
    cv.rect(0, 0, W_ - 1, H_ - 1, hexc('#101115'))
    cv.vgradient(0, 0, W_ - 1, 30, [hexc('#0b0c0f'), hexc('#121318')])
    cv.rect(36, 34, 204, 104, hexc('#1b1c22')); cv.rect(38, 36, 202, 102, hexc('#23242c'))
    cv.rect(58, 46, 150, 74, hexc('#070a08'))                             # LED window
    cv.hline(58, 150, 46, hexc('#2f3138'))
    for i in range(6):
        x = 58 + i * 16
        cv.rect(x, 82, x + 12, 92, hexc('#2d2f37')); cv.hline(x, x + 12, 82, hexc('#3b3d46'))
        text3x5(cv, x + 5, 85, str(i + 1), hexc('#6d717b'))
    cv.disc(176, 60, 15, hexc('#15161b')); cv.disc(176, 60, 13, hexc('#2f3139')); cv.disc(176, 60, 9, hexc('#3a3c45'))
    cv.rect(175, 48, 177, 53, hexc('#9a9ca5'))
    text3x5(cv, 166, 80, 'TUNE', hexc('#6d717b'))
    cv.save(f'{out}/sets/nr_radio.png')


MIRROR = (44, 30, 196, 92)


def mirror(out):
    cv = Canvas(W_, H_)
    cv.rect(0, 0, W_ - 1, H_ - 1, (0, 0, 0, 0))
    cv.vgradient(0, 0, W_ - 1, 22, [hexc('#16171d'), hexc('#1d1e25')])     # headliner strip; below is windshield (transparent)
    cv.rect(114, 12, 126, 28, hexc('#22232b'))
    x0, y0, x1, y1 = MIRROR
    cv.rect(x0 - 5, y0 - 5, x1 + 5, y1 + 5, hexc('#1a1b21'))
    cv.rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3, hexc('#26272f'))
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            cv.px[x, y] = (0, 0, 0, 0)
    for k in range(4):                                                    # round the corners
        for dx, dy in ((0, 0), (1, 0), (0, 1)):
            pass
    cv.save(f'{out}/sets/nr_mirror.png')
    # what the mirror shows: back seat top + rear window with the road behind
    m = Canvas(W_, H_)
    rnd = random.Random(31)
    m.rect(x0, y0, x1, y1, hexc('#14151b'))
    wx0, wx1, wy0, wy1 = x0 + 22, x1 - 22, y0 + 6, y0 + 40
    for y in range(wy0, wy1):
        ins = (wy1 - y) // 4
        for x in range(wx0 + ins, wx1 - ins):
            m.put(x, y, hexc('#070a12') if y < wy0 + 18 else hexc('#0b0f0c'))
    for _ in range(14):
        m.put(rnd.randrange(wx0 + 6, wx1 - 6), rnd.randrange(wy0 + 1, wy0 + 15), hexc('#4b5570'))
    for y in range(wy0 + 18, wy1):                                         # road behind, converging
        half = (y - wy0 - 17) * 2.2
        m.hline(int(120 - half), int(120 + half), y, hexc('#15161b'))
    m.rect(x0, wy1, x1, y1, hexc('#1e2029'))                               # back seat
    for x in (84, 120, 156):
        m.vline(x, wy1 + 2, y1, hexc('#16171e'))
    m.hline(x0, x1, wy1, hexc('#272934'))
    m.save(f'{out}/sets/nr_mirror_in.png')


MIRROR_ROAD_Y = MIRROR[1] + 24     # ground line in the mirror's rear window where far things stand


# ---------------------------------------------------------------- sprites
def sedan(out):
    at = Atlas(96, 36, [48, 35], cols=8)
    body, sh, dk, win, chrome = hexc('#6b6f78'), hexc('#555962'), hexc('#3c3f46'), hexc('#0f131c'), hexc('#9a9ea7')
    tyre, rim = hexc('#0c0d10'), hexc('#4a4d55')

    def side(open_=False, lit=False):
        cv = Canvas(96, 36)
        cv.rect(4, 17, 91, 29, body)                                    # lower body
        cv.rect(4, 27, 91, 29, sh)
        cv.hline(6, 89, 21, chrome)
        for i in range(12):                                             # cabin (roofline)
            cv.hline(22 + max(0, 10 - i) * 1, 70 - max(0, 8 - i) // 2, 5 + i, body)
        wc = hexc('#d8b067') if lit else win
        for y in range(7, 16):
            for x in range(26 + max(0, 15 - y), 68 - max(0, 14 - y) // 2):
                if x not in (45, 46):
                    cv.put(x, y, wc)
        cv.rect(45, 6, 46, 16, sh)
        if open_:                                                        # front door swung open toward camera
            cv.rect(26, 16, 44, 29, (0, 0, 0, 0)); cv.rect(27, 17, 44, 28, hexc('#c49a58') if lit else hexc('#1a1b20'))
            cv.rect(14, 13, 26, 31, body); cv.rect(15, 14, 25, 20, wc); cv.rect(14, 29, 26, 31, sh)
        cv.rect(88, 18, 91, 21, hexc('#5a1218'))                         # tail lamp (dark; glow in Remotion)
        cv.rect(4, 18, 6, 20, hexc('#c9c6b2'))                           # head lamp
        for wx in (20, 76):
            cv.disc(wx, 29, 6, tyre); cv.disc(wx, 29, 3, rim); cv.put(wx, 29, tyre)
        cv.outline(OUT)
        return cv

    def rear_(ours=False, lit=False):
        cv = Canvas(96, 36)
        cv.rect(26, 14, 69, 30, body); cv.rect(26, 27, 69, 30, sh)
        for i in range(9):
            cv.hline(32 + max(0, 4 - i), 63 - max(0, 4 - i), 5 + i, body)
        for y in range(7, 14):
            for x in range(34 + max(0, 9 - y), 62 - max(0, 9 - y)):
                cv.put(x, y, hexc('#d8b067') if lit else win)
        if lit:
            cv.disc(48, 12, 3, hexc('#2b1f16')); cv.rect(45, 13, 51, 14, hexc('#2b1f16'))
        cv.rect(27, 17, 33, 20, hexc('#5a1218'))
        cv.rect(62, 17, 68, 20, hexc('#1c1214') if ours else hexc('#5a1218'))
        cv.rect(41, 21, 55, 24, hexc('#c9c6b2')); cv.rect(42, 22, 54, 23, hexc('#3a3d45'))  # plate
        cv.rect(27, 30, 32, 33, tyre); cv.rect(63, 30, 68, 33, tyre)
        cv.outline(OUT)
        return cv
    at.add('side', side()); at.add('side_lit', side(lit=True)); at.add('side_open', side(open_=True, lit=True))
    at.add('rear', rear_()); at.add('rear_lit', rear_(lit=True)); at.add('rear_ours', rear_(ours=True))
    at.write(f'{out}/sprites/sedan.png', f'{out}/sprites/sedan.json', {'note': 'NIGHT ROAD gray sedan'})


def pale(out):
    at = Atlas(16, 46, [8, 45], cols=8)
    skin, skin_d, shirt, shirt_d, pants = hexc('#c9ccd1'), hexc('#a7abb3'), hexc('#d9dbd6'), hexc('#b4b7b2'), hexc('#2a2c33')

    def fig(view='side', step=0):
        cv = Canvas(16, 46)
        cv.rect(6, 33, 7, 44 - step, pants); cv.rect(9, 33, 10, 44, pants)
        cv.rect(5, 15, 11, 33, shirt); cv.vline(10, 15, 33, shirt_d)
        cv.rect(4, 16, 4, 31, shirt_d); cv.rect(12, 16, 12, 31, shirt_d)      # arms flat at the sides
        cv.put(4, 32, skin); cv.put(12, 32, skin)
        cv.rect(6, 12, 10, 14, skin_d)                                      # long neck
        cv.disc(8, 7, 4, skin)
        cv.vline(11, 4, 10, skin_d)
        if view == 'front' or view == 'look':
            ex = 1 if view == 'look' else 0
            cv.put(6 + ex, 7, hexc('#ffffff')); cv.put(10 + ex, 7, hexc('#ffffff'))
            cv.put(6 + ex, 8, hexc('#1b1c24')); cv.put(10 + ex, 8, hexc('#1b1c24'))
        else:                                                               # profile facing right
            cv.put(11, 6, hexc('#ffffff')); cv.put(11, 7, hexc('#1b1c24'))
        cv.outline(OUT)
        return cv
    at.add('side', fig('side')); at.add('front', fig('front')); at.add('look', fig('look')); at.add('step', fig('side', 2))
    at.write(f'{out}/sprites/pale.png', f'{out}/sprites/pale.json', {'note': 'NIGHT ROAD figures'})


def props(out):
    at = Atlas(40, 32, [20, 31], cols=10)
    rnd = random.Random(2)

    def marker(n):
        cv = Canvas(40, 32)
        cv.rect(19, 12, 20, 31, hexc('#6b6f78'))
        cv.rect(15, 0, 24, 13, hexc('#1f6b3e')); cv.rect(16, 1, 23, 12, hexc('#2a8a52'))
        text3x5(cv, 16, 1, 'MI', hexc('#e8f0ea'))
        s = str(n)
        text3x5(cv, 20 - (len(s) * 4 - 1) // 2, 7, s, hexc('#ffffff'))
        return cv
    for n in (1, 12, 13, 14, 20, 30, 31, 40):
        at.add(f'marker_{n}', marker(n))

    def pump():
        cv = Canvas(40, 32)
        cv.rect(12, 2, 28, 31, hexc('#b8bcc4')); cv.rect(13, 3, 27, 30, hexc('#d6d9de'))
        cv.rect(15, 6, 25, 12, hexc('#0d1a12')); cv.rect(14, 15, 26, 18, hexc('#a62a2f'))
        cv.rect(28, 12, 31, 20, hexc('#2a2b31')); cv.vline(30, 20, 29, hexc('#14151a'))
        cv.outline(OUT)
        return cv
    at.add('pump', pump())
    skin, sleeve = hexc('#f1ece2'), hexc('#6b7286')

    def hand(kind):
        cv = Canvas(40, 32)
        if kind == 'reach':                       # from bottom right, index finger forward
            cv.rect(26, 22, 39, 31, sleeve); cv.disc(22, 21, 5, skin); cv.rect(11, 18, 20, 20, skin)
        elif kind == 'flat':                      # palm down, slapping
            cv.rect(28, 20, 39, 31, sleeve); cv.rect(10, 16, 28, 24, skin); cv.rect(8, 17, 10, 22, skin)
        elif kind == 'thumb':                     # thumb up toward a switch
            cv.rect(26, 22, 39, 31, sleeve); cv.disc(22, 22, 5, skin); cv.rect(19, 10, 22, 18, skin)
        cv.outline(OUT)
        return cv
    for k in ('reach', 'flat', 'thumb'):
        at.add(f'hand_{k}', hand(k))

    def visor(down):
        cv = Canvas(40, 32)
        if down:
            cv.rect(2, 0, 37, 14, hexc('#2c2d36')); cv.rect(3, 1, 36, 13, hexc('#34353f')); cv.hline(3, 36, 13, hexc('#24252d'))
        else:
            cv.rect(2, 0, 37, 3, hexc('#2c2d36'))
        cv.outline(OUT)
        return cv
    at.add('visor_up', visor(False)); at.add('visor_down', visor(True))

    def phone(up):
        cv = Canvas(40, 32)
        cv.rect(12, 8, 28, 30, hexc('#15161a'))
        if up:
            cv.rect(13, 9, 27, 29, hexc('#7fb4e6')); cv.rect(14, 12, 26, 15, hexc('#e8f2ff'))
        else:
            cv.rect(18, 10, 22, 13, hexc('#2a2b30'))
        cv.outline(OUT)
        return cv
    at.add('phone_down', phone(False)); at.add('phone_up', phone(True))
    at.write(f'{out}/sprites/nr_props.png', f'{out}/sprites/nr_props.json', {'note': 'NIGHT ROAD props'})


def dad(out):
    head = (hexc('#e9dfcf'), hexc('#cbbfac'), hexc('#fbf6ec'))
    cloth = C.CLOTHES['brown']
    gl = hexc('#2a2c33')
    at = Atlas(C.CW, C.CH, C.PIVOT, cols=16)
    faces = ['neutral', 'worried', 'scared', 'blink']

    def glasses(cv, dy, ox=0):
        cy = 10 + dy
        for x0 in (11 + ox, 17 + ox):
            cv.hline(x0, x0 + 3, cy - 2, gl); cv.hline(x0, x0 + 3, cy + 2, gl)
            cv.vline(x0, cy - 2, cy + 2, gl); cv.vline(x0 + 3, cy - 2, cy + 2, gl)
        cv.hline(15 + ox, 16 + ox, cy - 1, gl)
        for x in range(9, 24):                                            # grey hair band
            if cv.get(x, 2 + dy)[3] and cv.get(x, 2 + dy)[:3] != OUT[:3]:
                cv.put(x, 2 + dy, hexc('#9a9aa0')); cv.put(x, 3 + dy, hexc('#b2b2b6'))
    for ar in ('down', 'reach'):
        for fc in faces:
            for bob in (0, 1):
                fr = C.build_frame(head, cloth, ar, fc, bob); glasses(fr, bob)
                at.add(f'{ar}.{fc}.b{bob}', fr)
    for fc in faces:
        for bob in (0, 1):
            b0 = C.build_frame(head, cloth, 'down', fc, bob, view='back'); at.add(f'turn0.{fc}.b{bob}', b0)
            t1 = C.build_frame(head, cloth, 'down', fc, bob, view='turn', ox=7); glasses(t1, bob, 7); at.add(f'turn1.{fc}.b{bob}', t1)
            t2 = C.build_frame(head, cloth, 'down', fc, bob, view='turn', ox=4); glasses(t2, bob, 4); at.add(f'turn2.{fc}.b{bob}', t2)
        for k in range(4):
            wfr = C.build_frame(head, cloth, 'down', fc, [0, 1, 0, 1][k], legs='walk', walk=k); glasses(wfr, [0, 1, 0, 1][k])
            at.add(f'walk{k}.{fc}.b0', wfr)
    at.write(f'{out}/sprites/dad.png', f'{out}/sprites/dad.json', {'character': 'dad', 'naming': '<arms|turnN|walkN>.<face>.b<0|1>'})


if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else '../public'
    for fn in (road, cab, rear, side, gas, porch, card, dome, radio, mirror, sedan, pale, props, dad):
        fn(o)
    print('night road sets ->', o)
