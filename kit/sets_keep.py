"""KEEP PRETENDING: 16:9 set placeholders (240x135 art px, 8x -> 1920x1080). Replaced by the ChatGPT plates
(`kit/ingest_kp.json`, same names); positions below are what src/film/KeepPretending.tsx uses, so re-check
them against the new plates when they arrive.

  kp_apartment  floor y 112. Fridge x 6-24; counter x 24-70 (top y 88), sink x 38-52; shelf y 64 x 56-74 with
                the PET CAM at (66, 64); table x 76-96 (top y 96), YOUR CHAIR x 96-104; sofa x 110-162 (seat y 98);
                window x 118-154 y 32-70; floor lamp x 168; FRONT DOOR x 186-208 y 46-112 (chain, deadbolt);
                key hooks (212, 76); hallway opening x 220-240.
  kp_bedroom    floor y 112. Shelf (8-30, 44) with the PET CAM at (20, 44); nightstand x 34-52 (top 94);
                bed x 58-178: pillow x 62-80 (top 82), mattress top y 88, duvet x 80-176; window x 94-142 y 28-64;
                bedroom door x 196-218 y 46-112, open gap x 196-202.
  kp_bathroom   sink counter x 88-152 (top y 92); MIRROR x 94-146 y 30-80; towel rail x 168-190 y 58.
  kp_shelter    day. Counter x 8-100 (top y 86), monitor x 18-38, bell x 70; bulletin board x 104-126 y 36-60;
                cages 3x3 x 132-228 y 30-108 (32x26 each); Pepper's cage = row 1, col 1 (x 164-196, y 56-82).
  kp_street     day. Shelter front x 30-130 (glass doors x 62-98, canopy y 40), sidewalk y 100-118, kerb y 118,
                bench x 150-176, tree x 196.

Usage: python3 kit/sets_keep.py public
"""
import random, sys
from pixelkit import Canvas, hexc

W_, H_ = 240, 135
OUT = hexc('#14151b')


def floor_planks(cv, y0, c0, c1, line):
    cv.vgradient(0, y0, W_ - 1, H_ - 1, [c0, c1])
    for y in range(y0 + 4, H_, 6):
        cv.hline(0, W_ - 1, y, line)
        off = (y * 7) % 23
        for x in range(off, W_, 23):
            cv.vline(x, y - 5, y - 1, line)


def wall(cv, y1, top, bot, base=None):
    cv.vgradient(0, 0, W_ - 1, y1, [top, bot])
    if base:
        cv.rect(0, y1 - 2, W_ - 1, y1, base)


def apartment(out):
    cv = Canvas(W_, H_)
    wall(cv, 112, hexc('#3b4258'), hexc('#2c3245'), hexc('#202433'))
    floor_planks(cv, 113, hexc('#4a3a30'), hexc('#3a2c24'), hexc('#2c211b'))
    # kitchen: tiles behind counter
    for y in range(60, 88, 4):
        cv.hline(24, 74, y, hexc('#3f4a5a'))
    cv.rect(6, 50, 24, 112, hexc('#c9ccd2')); cv.rect(6, 50, 24, 51, hexc('#e3e5e8')); cv.hline(6, 24, 74, hexc('#8a8e96'))
    cv.rect(21, 56, 22, 70, hexc('#8a8e96')); cv.rect(21, 78, 22, 92, hexc('#8a8e96')); cv.rect(7, 52, 8, 110, hexc('#e3e5e8'))
    cv.rect(26, 38, 72, 56, hexc('#6a5442')); cv.vline(49, 38, 56, hexc('#4b3a2e')); cv.hline(26, 72, 56, hexc('#4b3a2e'))
    cv.rect(46, 46, 47, 50, hexc('#c9b48a')); cv.rect(51, 46, 52, 50, hexc('#c9b48a'))
    cv.rect(56, 64, 74, 65, hexc('#5a4636'))                    # shelf for the pet cam
    cv.rect(24, 88, 72, 90, hexc('#9a9488')); cv.rect(24, 91, 72, 112, hexc('#5f4a3a'))
    for x in (40, 56):
        cv.vline(x, 92, 111, hexc('#4b3a2e'))
    cv.rect(38, 88, 52, 89, hexc('#6e7480')); cv.rect(44, 83, 45, 87, hexc('#9aa0aa')); cv.rect(44, 83, 48, 84, hexc('#9aa0aa'))
    # table + chairs
    cv.rect(76, 96, 96, 98, hexc('#6b4f3a')); cv.vline(79, 99, 112, hexc('#4b3a2e')); cv.vline(93, 99, 112, hexc('#4b3a2e'))
    cv.rect(97, 84, 99, 112, hexc('#4b3a2e')); cv.rect(97, 102, 105, 104, hexc('#5a4334')); cv.vline(105, 104, 112, hexc('#4b3a2e'))
    cv.rect(70, 84, 72, 112, hexc('#4b3a2e')); cv.rect(66, 102, 72, 104, hexc('#5a4334')); cv.vline(66, 104, 112, hexc('#4b3a2e'))
    # window + blinds (night roofs)
    cv.rect(116, 30, 156, 72, hexc('#5a4a3c'))
    cv.vgradient(118, 32, 154, 70, [hexc('#0b1020'), hexc('#18213a')])
    rnd = random.Random(4)
    x = 118
    while x < 154:
        w = rnd.randint(5, 10); h = rnd.randint(6, 16)
        cv.rect(x, 70 - h, min(154, x + w), 70, hexc('#0a0d16'))
        if rnd.random() < 0.5:
            cv.put(x + 2, 70 - h + 3, hexc('#3a3a2a'))
        x += w + 1
    for y in range(32, 52, 3):
        cv.hline(118, 154, y, hexc('#8a8a82'))
    cv.vline(136, 32, 70, hexc('#5a4a3c'))
    # sofa
    cv.rect(108, 82, 164, 98, hexc('#3f5a5e')); cv.rect(108, 98, 164, 108, hexc('#355054'))
    cv.rect(104, 88, 112, 110, hexc('#2f4a4e')); cv.rect(160, 88, 168, 110, hexc('#2f4a4e'))
    cv.vline(136, 84, 97, hexc('#2c4245')); cv.hline(112, 160, 99, hexc('#2c4245'))
    cv.rect(110, 108, 112, 112, hexc('#201a16')); cv.rect(160, 108, 162, 112, hexc('#201a16'))
    cv.rect(144, 93, 158, 97, hexc('#7a5e6e')); cv.hline(144, 158, 95, hexc('#5e4656'))       # folded blanket
    cv.rect(124, 104, 148, 106, hexc('#5a4334'))                                               # coffee table
    # floor lamp (off)
    cv.vline(172, 50, 111, hexc('#2a2c33')); cv.rect(166, 42, 178, 50, hexc('#bfb39a')); cv.rect(168, 111, 176, 112, hexc('#2a2c33'))
    # front door
    cv.rect(184, 44, 210, 112, hexc('#2a2420')); cv.rect(186, 46, 208, 112, hexc('#6a4e3a'))
    cv.rect(189, 50, 205, 74, hexc('#5f4534')); cv.rect(189, 80, 205, 106, hexc('#5f4534'))
    cv.rect(203, 78, 204, 80, hexc('#c9b48a')); cv.rect(202, 70, 205, 71, hexc('#9aa0aa'))          # knob, deadbolt
    cv.line(196, 64, 203, 68, hexc('#9aa0aa'))                                                   # chain
    cv.rect(211, 74, 217, 76, hexc('#5a4334'))                                                   # key rail
    # hallway opening
    cv.rect(220, 46, 239, 112, hexc('#0c0e14')); cv.rect(218, 44, 220, 112, hexc('#2a2420'))
    cv.save(f'{out}/sets/kp_apartment_bg.png')


def bedroom(out):
    cv = Canvas(W_, H_)
    wall(cv, 112, hexc('#323a52'), hexc('#262c3e'), hexc('#1c2030'))
    floor_planks(cv, 113, hexc('#45362d'), hexc('#352920'), hexc('#281e18'))
    cv.rect(8, 44, 30, 45, hexc('#5a4636'))                                                     # high shelf
    cv.rect(92, 26, 144, 66, hexc('#4e4034')); cv.rect(94, 28, 142, 64, hexc('#a9a69c'))
    for y in range(29, 64, 2):
        cv.hline(94, 142, y, hexc('#8c897f'))
    cv.rect(34, 94, 52, 112, hexc('#5a4334')); cv.hline(34, 52, 102, hexc('#45342a')); cv.rect(42, 98, 44, 99, hexc('#c9b48a'))
    cv.rect(39, 82, 47, 88, hexc('#bfb39a')); cv.rect(42, 88, 44, 93, hexc('#2a2c33'))          # lamp (off)
    cv.rect(56, 68, 62, 106, hexc('#4b3a2e'))                                                   # headboard
    cv.rect(58, 92, 178, 104, hexc('#4b3a2e')); cv.vline(176, 104, 112, hexc('#3a2c24')); cv.vline(60, 104, 112, hexc('#3a2c24'))
    cv.rect(62, 88, 178, 92, hexc('#c8c4b8'))                                                   # sheet edge
    cv.rect(62, 82, 82, 88, hexc('#e2ddd0')); cv.hline(62, 82, 82, hexc('#f0ece2'))             # pillow
    cv.vgradient(80, 84, 178, 94, [hexc('#5d6f8f'), hexc('#46567a')])                           # duvet
    for x in range(90, 176, 14):
        cv.line(x, 85, x + 5, 93, hexc('#3f4e6e'))
    cv.rect(194, 44, 220, 112, hexc('#2a2420')); cv.rect(196, 46, 202, 112, hexc('#07080c'))   # door ajar
    cv.rect(202, 46, 218, 112, hexc('#64493a')); cv.rect(205, 52, 215, 74, hexc('#59412f')); cv.rect(205, 80, 215, 106, hexc('#59412f'))
    cv.rect(203, 78, 204, 80, hexc('#c9b48a'))
    cv.save(f'{out}/sets/kp_bedroom_bg.png')


def bathroom(out):
    cv = Canvas(W_, H_)
    cv.rect(0, 0, W_ - 1, 112, hexc('#3c4a50'))
    for y in range(0, 112, 6):
        cv.hline(0, W_ - 1, y, hexc('#33404a'))
        for x in range((y // 6 % 2) * 6, W_, 12):
            cv.vline(x, y, y + 5, hexc('#33404a'))
    cv.vgradient(0, 113, W_ - 1, H_ - 1, [hexc('#2f3638'), hexc('#262c2e')])
    cv.rect(92, 28, 148, 82, hexc('#8a8e96')); cv.vgradient(94, 30, 146, 80, [hexc('#24304a'), hexc('#1a2236')])
    cv.line(100, 34, 108, 30, hexc('#33405e')); cv.line(98, 40, 112, 30, hexc('#2c3854'))
    cv.rect(88, 92, 152, 95, hexc('#d6d6cf')); cv.rect(110, 90, 130, 92, hexc('#b8bcc0'))
    cv.rect(118, 86, 119, 89, hexc('#9aa0aa')); cv.rect(118, 86, 122, 86, hexc('#9aa0aa'))
    cv.rect(90, 96, 150, 112, hexc('#5f6a6e')); cv.vline(120, 97, 111, hexc('#4a5458')); cv.rect(116, 102, 117, 104, hexc('#c9b48a')); cv.rect(123, 102, 124, 104, hexc('#c9b48a'))
    cv.hline(166, 192, 58, hexc('#9aa0aa')); cv.rect(170, 59, 188, 84, hexc('#7a6a8e')); cv.hline(170, 188, 80, hexc('#665878'))
    cv.save(f'{out}/sets/kp_bathroom_bg.png')


def shelter(out):
    cv = Canvas(W_, H_)
    wall(cv, 112, hexc('#a8bfa4'), hexc('#93ab90'), hexc('#6f8670'))
    cv.vgradient(0, 113, W_ - 1, H_ - 1, [hexc('#c4c0b4'), hexc('#a9a597')])
    for x in range(0, W_, 12):
        cv.vline(x, 113, H_ - 1, hexc('#9e9a8c'))
    for x in (40, 120, 200):
        cv.rect(x - 14, 2, x + 14, 5, hexc('#e8e6de'))                                        # tube lights (off)
    cv.rect(104, 36, 126, 60, hexc('#a7835a')); cv.rect(106, 38, 124, 58, hexc('#c9a87a'))
    for (x, y) in ((108, 40), (116, 44), (110, 50)):
        cv.rect(x, y, x + 6, y + 6, hexc('#f0eee6'))
    cv.rect(8, 86, 100, 89, hexc('#b07e4c')); cv.rect(10, 90, 98, 112, hexc('#8e6238')); cv.hline(10, 98, 100, hexc('#7a5230'))
    cv.rect(18, 70, 38, 84, hexc('#2a2c33')); cv.rect(20, 72, 36, 82, hexc('#14161c')); cv.rect(26, 84, 30, 86, hexc('#2a2c33'))
    cv.rect(68, 84, 72, 85, hexc('#c9b048')); cv.put(70, 83, hexc('#c9b048'))
    for r in range(3):
        for c in range(3):
            x0, y0 = 132 + c * 32, 30 + r * 26
            cv.rect(x0, y0, x0 + 30, y0 + 24, hexc('#8e96a2')); cv.rect(x0 + 2, y0 + 2, x0 + 28, y0 + 22, hexc('#3a4048'))
            for x in range(x0 + 4, x0 + 28, 3):
                cv.vline(x, y0 + 2, y0 + 22, hexc('#b8c0ca'))
            cv.rect(x0 + 11, y0 + 18, x0 + 19, y0 + 22, hexc('#f0eee6'))                       # card holder
    cv.save(f'{out}/sets/kp_shelter_bg.png')


def street(out):
    cv = Canvas(W_, H_)
    cv.vgradient(0, 0, W_ - 1, 60, [hexc('#7fb3e0'), hexc('#a9cdea')])
    cv.rect(0, 30, 28, 100, hexc('#b49c84')); cv.rect(132, 24, W_ - 1, 100, hexc('#9a8a7c'))
    cv.rect(30, 36, 130, 100, hexc('#d8cbb4'))
    for x in (140, 170, 200, 228):
        cv.rect(x, 36, x + 16, 56, hexc('#4c6a86')); cv.hline(x, x + 16, 46, hexc('#7a90a6'))
    cv.rect(52, 36, 108, 44, hexc('#5a7a66')); cv.line(52, 44, 56, 48, hexc('#4a6a56')); cv.line(108, 44, 104, 48, hexc('#4a6a56'))
    cv.rect(62, 52, 98, 100, hexc('#3e5464')); cv.rect(64, 54, 79, 100, hexc('#6f92aa')); cv.rect(81, 54, 96, 100, hexc('#6f92aa'))
    cv.line(66, 58, 72, 52, hexc('#a9c4d6')); cv.line(83, 60, 90, 53, hexc('#a9c4d6'))
    cv.rect(34, 52, 56, 72, hexc('#6f92aa')); cv.rect(104, 52, 126, 72, hexc('#6f92aa'))
    cv.rect(0, 100, W_ - 1, 118, hexc('#c2bdb2'))
    for x in range(0, W_, 20):
        cv.vline(x, 100, 118, hexc('#aaa598'))
    cv.rect(0, 118, W_ - 1, 120, hexc('#8a857a')); cv.rect(0, 121, W_ - 1, H_ - 1, hexc('#55585e'))
    cv.rect(150, 92, 176, 94, hexc('#6b4f3a')); cv.rect(150, 86, 176, 88, hexc('#6b4f3a')); cv.vline(152, 95, 100, hexc('#2a2c33')); cv.vline(174, 95, 100, hexc('#2a2c33'))
    cv.rect(195, 60, 198, 100, hexc('#5a4334'))
    for (x, y, r) in ((196, 52, 12), (188, 58, 8), (205, 58, 8)):
        cv.disc(x, y, r, hexc('#4f7a46'))
    cv.disc(192, 48, 5, hexc('#6a9a5c'))
    cv.rect(10, 112, 58, 126, hexc('#7a2e2e')); cv.rect(18, 104, 48, 112, hexc('#6a2626')); cv.rect(22, 106, 44, 111, hexc('#8fb0c6'))
    cv.disc(20, 127, 4, hexc('#1c1d22')); cv.disc(48, 127, 4, hexc('#1c1d22'))
    cv.save(f'{out}/sets/kp_street_bg.png')


if __name__ == '__main__':
    o = sys.argv[1] if len(sys.argv) > 1 else 'public'
    apartment(o); bedroom(o); bathroom(o); shelter(o); street(o)
    print('keep pretending sets ->', o + '/sets')
