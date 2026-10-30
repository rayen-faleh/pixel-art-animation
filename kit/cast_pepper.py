"""KEEP PRETENDING placeholders (code-drawn), same frame names as kit/ingest_kp.json so the ChatGPT
sheets replace them 1:1 (`python3.12 kit/ingest.py kit/ingest_kp.json`).

  pepper        28x40 cell, pivot [14, 39]: sit sit_side loaf sleep walk0-3 stand4 rub eat lookback sit_back
                lie crouch blink | rise0 rise1 up up_side upwalk0 upwalk1 up_back up_tilt |
                bed_person chair mirror0-2 talk content dark. Side views face RIGHT (flip in Remotion).
                Scale: the hero is ~34 px tall; Pepper sits ~16, stands upright ~26, mirror2 ~34.
  pepper_busts  64x64 close-ups: calm half closed slits talk smile
  smile_busts   64x64 human close-ups: hero hero_smile dana marcus june (all but `hero` wear THE smile)
  kp_props      32x32 props: petcam bowl bowl_full mug phone phone_cracked scrunchie key_tag wristband
                carrier carrier_open key_hooks

Usage: python3 kit/cast_pepper.py public/sprites
"""
import sys
from pixelkit import Canvas, Atlas, hexc

OUT = hexc('#14151b')
FUR, FUR_D, FUR_L = hexc('#62677a'), hexc('#41444f'), hexc('#7a8094')
WHITE, WHITE_D = hexc('#e8e4d8'), hexc('#bdb8aa')
EYE, PUPIL, NOSE = hexc('#c3d64a'), hexc('#14151b'), hexc('#2a2c33')
MOUTH = hexc('#1c1d24')


def ell(cv, cx, cy, rx, ry, c):
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            if ((x - cx) / max(rx, .5)) ** 2 + ((y - cy) / max(ry, .5)) ** 2 <= 1.0:
                cv.put(x, y, c)


# ------------------------------------------------------------------ world-scale cat parts
def head_front(cv, cx, cy, eyes='open', mouth=None, tilt=0, dark=False):
    body = FUR_D if dark else FUR
    ell(cv, cx, cy, 5, 4.5, body)
    for s in (-1, 1):                                  # ears
        ex = cx + s * 3 + tilt * s * 0
        cv.rect(ex - (1 if s < 0 else 0), cy - 6, ex + (0 if s < 0 else 1), cy - 4, body)
        cv.put(ex, cy - 7, body)
    if dark:
        for s in (-2, 2):
            cv.put(cx + s, cy, EYE); cv.put(cx + s + (1 if s > 0 else -1), cy, EYE)
        return
    cv.rect(cx - 5, cy - 4, cx - 4, cy + 1, FUR_L) if not dark else None
    ell(cv, cx, cy + 2.5, 2.5, 1.8, WHITE)            # muzzle
    cv.put(cx, cy + 1, NOSE)
    for s in (-1, 1):
        ex = cx + s * 2 + (1 if s > 0 else -1) * 0
        x0 = ex - 1 if s < 0 else ex
        if eyes == 'open':
            cv.rect(x0, cy - 1, x0 + 1, cy, EYE); cv.put(x0 + (1 if s < 0 else 0), cy, PUPIL)
        elif eyes == 'slits':
            cv.rect(x0, cy - 1, x0 + 1, cy, EYE); cv.vline(x0 + (1 if s < 0 else 0), cy - 1, cy, PUPIL)
        elif eyes == 'half':
            cv.rect(x0, cy, x0 + 1, cy, EYE); cv.hline(x0, x0 + 1, cy - 1, FUR_D)
        else:                                          # closed
            cv.hline(x0, x0 + 1, cy, OUT)
    if mouth == 'talk':
        cv.rect(cx - 1, cy + 3, cx + 1, cy + 4, MOUTH)
    elif mouth == 'smile':
        cv.put(cx - 2, cy + 3, MOUTH); cv.hline(cx - 1, cx + 1, cy + 4, MOUTH); cv.put(cx + 2, cy + 3, MOUTH)


def head_side(cv, cx, cy, eyes='open', down=0):
    ell(cv, cx, cy + down, 4.5, 4, FUR)
    cv.rect(cx - 2, cy - 6 + down, cx - 1, cy - 4 + down, FUR)
    cv.rect(cx + 1, cy - 6 + down, cx + 2, cy - 4 + down, FUR_D)
    ell(cv, cx + 4, cy + 2 + down, 2, 1.6, WHITE)
    cv.put(cx + 5, cy + 1 + down, NOSE)
    if eyes == 'open':
        cv.rect(cx + 2, cy - 1 + down, cx + 3, cy + down, EYE); cv.put(cx + 3, cy + down, PUPIL)
    else:
        cv.hline(cx + 2, cx + 3, cy + down, OUT)


def head_back(cv, cx, cy):
    ell(cv, cx, cy, 5, 4.5, FUR_D)
    for s in (-1, 1):
        ex = cx + s * 3
        cv.rect(ex - (1 if s < 0 else 0), cy - 6, ex + (0 if s < 0 else 1), cy - 4, FUR_D)


def tail(cv, pts, c=FUR_D):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        cv.thick(x0, y0, x1, y1, 0.9, c)


def sit_front(cv, eyes='open', mouth=None, base=39, cx=14):
    tail(cv, [(cx + 5, base - 1), (cx + 9, base - 2), (cx + 10, base - 6)])
    ell(cv, cx, base - 5, 6, 5, FUR)
    ell(cv, cx, base - 6, 2.5, 4, WHITE)               # bib
    cv.rect(cx - 4, base - 1, cx - 2, base, WHITE); cv.rect(cx + 2, base - 1, cx + 4, base, WHITE)
    head_front(cv, cx, base - 13, eyes, mouth)


def quad_side(cv, legs=(0, 0, 0, 0), base=39, cx=13, head='up', eyes='open', tail_up=True):
    """Cat on four legs, side view facing right. legs = x offsets for back-near, back-far, front-near, front-far."""
    by = base - 7
    xs = [cx - 5, cx - 3, cx + 4, cx + 6]
    for i, (x, d) in enumerate(zip(xs, legs)):
        c = FUR_D if i % 2 else FUR
        cv.line(x, by + 1, x + d, base - 1, c); cv.line(x + 1, by + 1, x + 1 + d, base - 1, c)
        cv.put(x + d, base, WHITE); cv.put(x + 1 + d, base, WHITE)
    ell(cv, cx, by, 7, 3.5, FUR)
    ell(cv, cx + 5, by + 1, 2, 2, WHITE)
    tail(cv, [(cx - 7, by - 1), (cx - 10, by - 5), (cx - 10, by - 9)] if tail_up else [(cx - 7, by), (cx - 11, by + 2), (cx - 12, base - 1)])
    if head == 'up':
        head_side(cv, cx + 7, by - 5, eyes)
    else:                                              # down (eating)
        head_side(cv, cx + 8, by + 1, eyes)


def upright(cv, h=26, view='front', legs=0, tilt=0, mouth=None, eyes='open', dark=False, cx=14, base=39):
    """Standing on the back legs like a person. h = top of ears to feet."""
    body = FUR_D if dark else FUR
    hip = base - 6
    head_cy = base - h + 7
    # legs
    for s in (-1, 1):
        off = s * legs if view == 'side' else 0
        x = cx + s * 2 if view != 'side' else cx + off
        cv.rect(x - 1, hip, x, base - 1, body)
        cv.rect(x - 1, base, x + (1 if view == 'side' else 0), base, WHITE if not dark else body)
    # torso
    top = head_cy + 4
    ell(cv, cx, (top + hip) / 2, 4 if view != 'side' else 3.5, (hip - top) / 2 + 1, body)
    if view == 'front' and not dark:
        ell(cv, cx, (top + hip) / 2 - 1, 2, (hip - top) / 2 - 1, WHITE)
    # arms hanging
    if view != 'back' or True:
        for s in ((-1, 1) if view != 'side' else (1,)):
            ax = cx + s * 4 if view != 'side' else cx + 1
            cv.rect(ax - (1 if s < 0 else 0), top + 1, ax + (0 if s < 0 else 1) - (1 if view == 'side' else 0), hip - 1, body)
            if not dark:
                cv.put(ax, hip, WHITE)
    tail(cv, [(cx, hip), (cx - 4 if view != 'front' else cx + 5, base - 2), (cx - 6 if view != 'front' else cx + 7, base - 1)], FUR_D if not dark else body)
    hx = cx + tilt
    if view == 'front':
        head_front(cv, hx, head_cy, eyes, mouth, dark=dark)
    elif view == 'side':
        head_side(cv, cx + 1, head_cy, eyes)
    else:
        head_back(cv, hx, head_cy)


def cat_frames():
    F = {}

    def new():
        return Canvas(28, 40)

    def done(name, cv):
        cv.outline(OUT); F[name] = cv

    cv = new(); sit_front(cv); done('sit', cv)
    cv = new()                                         # sit side
    tail(cv, [(8, 38), (4, 38), (3, 35)]); ell(cv, 12, 32, 5, 6, FUR); ell(cv, 15, 33, 2, 4, WHITE)
    cv.rect(13, 38, 16, 39, WHITE); head_side(cv, 15, 24); done('sit_side', cv)
    cv = new(); ell(cv, 13, 35, 8, 4, FUR); ell(cv, 18, 37, 2, 1.5, WHITE); tail(cv, [(6, 37), (10, 39), (16, 39)])
    head_side(cv, 18, 29); done('loaf', cv)
    cv = new(); ell(cv, 14, 35, 8, 4.5, FUR); ell(cv, 14, 33, 5, 2.5, FUR_D); tail(cv, [(6, 37), (12, 39), (19, 38)])
    ell(cv, 18, 35, 3.5, 3, FUR); cv.hline(18, 19, 35, OUT); cv.rect(20, 37, 21, 37, WHITE); done('sleep', cv)
    for i, legs in enumerate([(-2, 1, 2, -1), (0, 0, 0, 0), (2, -1, -2, 1), (0, 0, 0, 0)]):
        cv = new(); quad_side(cv, legs, tail_up=i == 3 or i == 1); done(f'walk{i}', cv)
    cv = new()                                         # stand on four legs, facing viewer
    for x in (9, 11, 17, 19):
        cv.rect(x, 33, x, 38, FUR_D if x in (11, 17) else FUR); cv.put(x, 39, WHITE)
    ell(cv, 14, 31, 7, 4, FUR); ell(cv, 14, 31, 3, 3, WHITE); head_front(cv, 14, 25); done('stand4', cv)
    cv = new(); quad_side(cv, eyes='closed'); done('rub', cv)
    cv = new(); quad_side(cv, head='down', tail_up=False); done('eat', cv)
    cv = new(); tail(cv, [(9, 38), (5, 38)]); ell(cv, 14, 34, 6, 5, FUR_D); head_side(cv, 13, 26); done('lookback', cv)
    cv = new(); tail(cv, [(14, 38), (19, 38), (21, 36)]); ell(cv, 14, 34, 6, 5, FUR_D); head_back(cv, 14, 26); done('sit_back', cv)
    cv = new(); ell(cv, 13, 36, 9, 3, FUR); ell(cv, 14, 37, 4, 1.5, WHITE); tail(cv, [(4, 37), (1, 38)])
    head_side(cv, 22, 34); done('lie', cv)
    cv = new(); quad_side(cv, (0, 0, 0, 0), base=39, head='up', tail_up=False)
    done('crouch', cv)
    cv = new(); sit_front(cv, eyes='closed'); done('blink', cv)
    # upright set
    cv = new()                                         # rise0: sitting up, paws lifted
    tail(cv, [(19, 38), (23, 38)]); ell(cv, 14, 33, 5, 6, FUR); ell(cv, 14, 33, 2.5, 4, WHITE)
    cv.rect(10, 29, 11, 30, WHITE); cv.rect(17, 29, 18, 30, WHITE); cv.rect(11, 38, 13, 39, WHITE); cv.rect(15, 38, 17, 39, WHITE)
    head_front(cv, 14, 21); done('rise0', cv)
    cv = new(); upright(cv, h=23); done('rise1', cv)
    cv = new(); upright(cv, h=26); done('up', cv)
    cv = new(); upright(cv, h=26, view='side'); done('up_side', cv)
    cv = new(); upright(cv, h=26, view='side', legs=2); done('upwalk0', cv)
    cv = new(); upright(cv, h=26, view='side', legs=-2); done('upwalk1', cv)
    cv = new(); upright(cv, h=26, view='back'); done('up_back', cv)
    cv = new(); upright(cv, h=26, tilt=2); done('up_tilt', cv)
    # uncanny set
    cv = new()                                         # on its back like a person, arm over the eyes
    ell(cv, 14, 35, 9, 3.5, FUR); ell(cv, 14, 34, 5, 2, WHITE); cv.rect(23, 36, 26, 37, FUR_D); cv.rect(26, 36, 27, 37, WHITE)
    ell(cv, 4, 34, 4, 4, FUR); cv.rect(1, 29, 2, 30, FUR); cv.thick(10, 33, 4, 32, 0.8, FUR_D); cv.rect(3, 31, 4, 32, WHITE)
    done('bed_person', cv)
    cv = new()                                         # sitting in a chair like a person
    ell(cv, 12, 32, 4, 7, FUR); ell(cv, 13, 31, 2, 4, WHITE); cv.rect(12, 38, 18, 39, FUR); cv.rect(18, 38, 19, 39, WHITE)
    cv.thick(14, 28, 21, 30, 0.7, FUR); cv.rect(21, 30, 22, 30, WHITE); head_front(cv, 12, 20, tilt=0); done('chair', cv)
    for i, h in enumerate((26, 30, 34)):
        cv = new(); upright(cv, h=h, view='back'); done(f'mirror{i}', cv)
    cv = new(); upright(cv, h=26, mouth='talk'); done('talk', cv)
    cv = new(); sit_front(cv, eyes='closed'); cv.put(12, 25, FUR_L); done('content', cv)
    cv = new(); upright(cv, h=30, dark=True); done('dark', cv)
    return F


# ------------------------------------------------------------------ busts (64x64)
def pepper_bust(eyes='open', mouth=None):
    cv = Canvas(64, 64)
    ell(cv, 32, 60, 22, 12, FUR); ell(cv, 32, 60, 9, 10, WHITE)
    ell(cv, 32, 32, 21, 18, FUR)
    for s in (-1, 1):
        for i in range(12):
            cv.hline(32 + s * 12 - (6 - i // 2) * 1, 32 + s * 12 + (6 - i // 2) * 1, 16 - i, FUR)
        for i in range(7):
            cv.hline(32 + s * 12 - (3 - i // 2), 32 + s * 12 + (3 - i // 2), 15 - i, FUR_D)
    cv.rect(13, 22, 18, 30, FUR_L)
    ell(cv, 32, 41, 9, 7, WHITE)
    cv.rect(31, 36, 33, 37, NOSE); cv.put(32, 38, NOSE)
    for s in (-1, 1):
        ex = 32 + s * 9
        if eyes in ('open', 'slits'):
            ell(cv, ex, 30, 4, 3.5, EYE)
            if eyes == 'open':
                ell(cv, ex, 30, 1.5, 3, PUPIL); cv.put(ex - 1, 28, WHITE)
            else:
                cv.vline(ex, 27, 33, PUPIL)
        elif eyes == 'half':
            ell(cv, ex, 31, 4, 2, EYE); cv.rect(ex - 4, 27, ex + 4, 30, FUR_D); cv.rect(ex - 1, 31, ex, 32, PUPIL)
        else:
            cv.line(ex - 4, 30, ex, 31, OUT); cv.line(ex, 31, ex + 4, 30, OUT)
    if mouth == 'talk':
        ell(cv, 32, 44, 3, 3, MOUTH)
    elif mouth == 'smile':
        cv.line(23, 41, 27, 44, MOUTH); cv.hline(27, 37, 44, MOUTH); cv.line(37, 44, 41, 41, MOUTH)
    else:
        cv.line(29, 40, 32, 41, MOUTH); cv.line(32, 41, 35, 40, MOUTH)
    cv.outline(OUT)
    return cv


SKIN, SKIN_D = hexc('#ece6d4'), hexc('#cfc6ae')


def human_bust(shirt, hair=None, smile=True, beard=None, glasses=False, bun=False, ponytail=False):
    cv = Canvas(64, 64)
    if ponytail:
        cv.thick(44, 22, 52, 40, 2.5, hair)
    ell(cv, 32, 61, 24, 11, shirt)
    tilt = 2 if smile else 0
    ell(cv, 32 + tilt, 30, 19, 19, SKIN); ell(cv, 38 + tilt, 36, 10, 10, SKIN_D); ell(cv, 32 + tilt, 30, 17, 17, SKIN)
    if hair:
        for y in range(11, 22):
            for x in range(13, 52):
                if (x - 32 - tilt) ** 2 + (y - 30) ** 2 <= 19 ** 2 and y < 18 + abs(x - 32 - tilt) // 4:
                    cv.put(x, y, hair)
    if bun:
        ell(cv, 32 + tilt, 9, 6, 5, hair)
    if beard:
        for y in range(38, 48):
            for x in range(18, 48):
                if (x - 32 - tilt) ** 2 + (y - 30) ** 2 <= 18 ** 2:
                    cv.put(x, y, beard)
        ell(cv, 32 + tilt, 41, 5, 2, SKIN)
    for s in (-1, 1):
        ex = 32 + tilt + s * 7
        cv.rect(ex - 1, 28, ex + 1, 31, OUT); cv.put(ex, 28, WHITE)
        if glasses:
            for a in range(-4, 5):
                cv.put(ex + a, 25, OUT); cv.put(ex + a, 34, OUT)
            cv.vline(ex - 4, 25, 34, OUT); cv.vline(ex + 4, 25, 34, OUT)
    my = 40
    if smile:                                          # THE smile: too wide, too even
        cv.line(20 + tilt, my - 3, 24 + tilt, my, MOUTH); cv.hline(24 + tilt, 40 + tilt, my, MOUTH); cv.line(40 + tilt, my, 44 + tilt, my - 3, MOUTH)
    else:
        cv.hline(29, 35, my, MOUTH)
    cv.outline(OUT)
    return cv


# ------------------------------------------------------------------ props (32x32, bottom-centred)
def props():
    P = {}

    def new():
        return Canvas(32, 32)

    def done(n, cv):
        cv.outline(OUT); P[n] = cv

    cv = new(); cv.rect(12, 27, 19, 31, hexc('#d9d9d2')); cv.rect(15, 23, 16, 26, hexc('#b8b8b0'))
    ell(cv, 15.5, 17, 7, 6.5, hexc('#ececE4')); ell(cv, 15.5, 18, 3, 3, hexc('#1b1d26')); cv.put(14, 17, hexc('#4a5070'))
    done('petcam', cv)
    for n, full in (('bowl', False), ('bowl_full', True)):
        cv = new(); ell(cv, 16, 28, 10, 3, hexc('#8a3b34')); cv.rect(7, 28, 25, 31, hexc('#8a3b34')); ell(cv, 16, 27, 8, 1.5, hexc('#3a1c1c'))
        if full:
            for x in range(9, 24, 2):
                cv.put(x, 26, hexc('#7a5634')); cv.put(x + 1, 27, hexc('#5c3f26'))
        done(n, cv)
    cv = new(); cv.rect(10, 20, 19, 31, hexc('#d8d2c2')); cv.rect(20, 23, 22, 28, hexc('#d8d2c2')); cv.rect(11, 20, 18, 21, hexc('#3a2a20')); done('mug', cv)
    for n, crack in (('phone', False), ('phone_cracked', True)):
        cv = new(); cv.rect(6, 22, 25, 31, hexc('#1d1f27')); cv.rect(8, 23, 23, 30, hexc('#0d0f16'))
        if crack:
            cv.line(9, 24, 15, 27, hexc('#5b6070')); cv.line(15, 27, 22, 25, hexc('#5b6070')); cv.line(15, 27, 13, 30, hexc('#5b6070'))
        done(n, cv)
    cv = new(); ell(cv, 16, 26, 7, 5, hexc('#3b2a4a')); ell(cv, 16, 26, 3, 2, (0, 0, 0, 0)); done('scrunchie', cv)
    cv = new(); ell(cv, 10, 22, 4, 4, hexc('#b9b9b0')); ell(cv, 10, 22, 2, 2, (0, 0, 0, 0)); cv.rect(13, 22, 24, 23, hexc('#c9a64a'))
    cv.rect(21, 24, 22, 25, hexc('#c9a64a')); cv.rect(18, 24, 19, 24, hexc('#c9a64a')); ell(cv, 8, 28, 4, 3.5, hexc('#e8e2c9')); done('key_tag', cv)
    cv = new(); ell(cv, 16, 26, 10, 5, hexc('#f0efe8')); ell(cv, 16, 26, 8, 3, (0, 0, 0, 0)); cv.rect(14, 29, 19, 31, hexc('#dcdad0')); done('wristband', cv)
    for n, open_ in (('carrier', False), ('carrier_open', True)):
        cv = new(); cv.rect(3, 13, 28, 31, hexc('#8e96a6')); cv.rect(5, 11, 26, 13, hexc('#8e96a6')); cv.rect(12, 8, 19, 10, hexc('#5d6575'))
        cv.rect(7, 16, 24, 29, hexc('#14151b'))
        if not open_:
            for x in range(8, 24, 3):
                cv.vline(x, 16, 29, hexc('#c6c9d0'))
        else:
            cv.rect(24, 16, 25, 29, hexc('#c6c9d0'))
        done(n, cv)
    cv = new(); cv.rect(4, 18, 27, 21, hexc('#6b4a33'))
    for x in (8, 15, 22):
        cv.rect(x, 22, x + 1, 25, hexc('#a9a9a2')); cv.put(x + 2, 25, hexc('#a9a9a2'))
    done('key_hooks', cv)
    return P


def main(out):
    import os
    F = cat_frames()
    a = Atlas(28, 40, [14, 39], cols=8)
    for n, cv in F.items():
        a.add(n, cv)
    a.write(f'{out}/pepper.png', f'{out}/pepper.json', {'note': 'code placeholder (kit/cast_pepper.py)'})
    b = Atlas(64, 64, [32, 63], cols=6)
    for n, e, m in (('calm', 'open', None), ('half', 'half', None), ('closed', 'closed', None), ('slits', 'slits', None),
                    ('talk', 'open', 'talk'), ('smile', 'open', 'smile')):
        b.add(n, pepper_bust(e, m))
    b.write(f'{out}/pepper_busts.png', f'{out}/pepper_busts.json')
    s = Atlas(64, 64, [32, 63], cols=5)
    s.add('hero', human_bust(hexc('#6b6f7c'), smile=False))
    s.add('hero_smile', human_bust(hexc('#6b6f7c')))
    s.add('dana', human_bust(hexc('#b78a2e'), hair=hexc('#2a1d17'), ponytail=True))
    s.add('marcus', human_bust(hexc('#26304a'), hair=hexc('#5a3a24'), beard=hexc('#5a3a24')))
    s.add('june', human_bust(hexc('#6a4a5a'), hair=hexc('#a9a6a0'), glasses=True, bun=True))
    s.write(f'{out}/smile_busts.png', f'{out}/smile_busts.json')
    p = Atlas(32, 32, [16, 31], cols=6)
    for n, cv in props().items():
        p.add(n, cv)
    p.write(f'{out}/kp_props.png', f'{out}/kp_props.json')
    print('pepper', len(F), 'frames; busts, smile busts, props ->', out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'public/sprites')
