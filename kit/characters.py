"""Pixel character generator: round-head cast, front/turn/back views, arm poses,
faces, 2-frame breathing and a 4-frame walk. Output: one sprite sheet + JSON per
character variant. Frame names: "<arms>.<face>.<bob>" e.g. "phone.scared.b1",
"turn1.creepy.b0" (back -> front: turn0 back, turn1, turn2, then "down.<face>"),
"walk2.neutral.b0".
"""
from pixelkit import Canvas, Atlas, hexc

CW, CH = 32, 40              # cell size (art pixels)
PIVOT = [16, 39]             # feet centre: anchor used by <PixelSprite>
OUT = hexc('#14151b')
EYE = hexc('#1b1c24')
MOUTH_IN = hexc('#7a1f2b')
SWEAT = hexc('#9fd6ff')
PHONE_SCREEN = hexc('#9fd8ff')
PANTS = hexc('#262833')

HEADS = {
    'warm': (hexc('#f1ece2'), hexc('#d2cabb'), hexc('#ffffff')),   # protagonist
    'ghost': (hexc('#b9bdc7'), hexc('#959aa6'), hexc('#d8dbe2')),  # the changed ones
}
CLOTHES = {
    'hoodie': (hexc('#6b7286'), hexc('#545a6b')),
    'olive': (hexc('#4e5a3a'), hexc('#3d472d')),
    'maroon': (hexc('#5c2f38'), hexc('#47232b')),
    'navy': (hexc('#2f3b5c'), hexc('#242d47')),
    'brown': (hexc('#5c4632'), hexc('#473626')),
    'teal': (hexc('#2f5c57'), hexc('#244744')),
    'plum': (hexc('#4b3a5c'), hexc('#3a2c47')),
}

FACES = ['neutral', 'worried', 'scared', 'shock', 'lookup', 'blink', 'creepy', 'smile']
# shoulder -> elbow -> hand for (left, right); y offsets get the breathing dy added.
ARMS = {
    'down':  [((10, 22), (9, 27), (9, 32)), ((22, 22), (23, 27), (23, 32))],
    'phone': [((10, 22), (9, 29), (13, 28)), ((22, 22), (23, 29), (19, 28))],
    'open':  [((10, 22), (6, 22), (2, 17)), ((22, 22), (26, 22), (30, 17))],
    'up':    [((10, 22), (9, 27), (9, 32)), ((22, 22), (26, 15), (26, 7))],
    'cover': [((10, 22), (9, 28), (13, 17)), ((22, 22), (23, 28), (19, 17))],
    'reach': [((10, 22), (9, 27), (9, 32)), ((22, 22), (26, 24), (30, 23))],
}


def head_mask(cx, cy, r=8):
    return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.6


def draw_head(cv, cx, cy, head):
    base, shade, hi = head
    inside = head_mask(cx, cy)
    for y in range(cy - 9, cy + 10):
        for x in range(cx - 9, cx + 10):
            if inside(x, y):
                # light from top-left: crescent shade bottom-right
                lit = (x - cx + 2.6) ** 2 + (y - cy + 2.6) ** 2 <= 8 * 8 + 3
                cv.put(x, y, base if lit else shade)
    cv.put(cx - 4, cy - 5, hi); cv.put(cx - 5, cy - 4, hi); cv.put(cx - 4, cy - 4, hi)


def draw_face(cv, kind, cx, cy, ox, head):
    inside = head_mask(cx, cy, 7)
    def p(x, y, c):
        if inside(x, y):
            cv.put(x, y, c)
    ex = [cx - 3 + ox, cx + 3 + ox]
    w = (255, 255, 255, 255)

    def eye(x, y0, h=3, wd=2, shine=True):
        for yy in range(y0, y0 + h):
            for xx in range(x - wd + 1, x + 1):
                p(xx, yy, EYE)
        if shine:
            p(x - wd + 1, y0, w)

    def brows(lift, slope):  # slope>0: inner ends raised (worry)
        for i, e in enumerate(ex):
            d = -1 if i == 0 else 1
            for k in range(3):
                xx = e - 1 + k if i == 0 else e - 1 + k
                inner = (k == 2) if i == 0 else (k == 0)
                yy = cy - lift - (slope if inner else 0)
                p(xx, yy, EYE)
                if k == 1: p(xx, yy - (slope if slope else 0) * 0, EYE)

    if kind == 'neutral':
        for e in ex: eye(e, cy - 1)
        for x in range(cx - 1 + ox, cx + 2 + ox): p(x, cy + 4, EYE)
    elif kind == 'smile':
        for e in ex: eye(e, cy - 1)
        for x, y in [(-2, 4), (-1, 5), (0, 5), (1, 5), (2, 4)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'worried':
        for e in ex: eye(e, cy - 1)
        brows(4, 1)
        for x, y in [(-2, 5), (-1, 4), (0, 5), (1, 4), (2, 5)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'scared':
        for e in ex: eye(e, cy - 2, h=4, wd=3)
        brows(4, 1)
        for y in range(cy + 3, cy + 7):
            for x in range(cx - 1 + ox, cx + 2 + ox): p(x, y, EYE)
        p(cx + ox, cy + 4, MOUTH_IN); p(cx + ox, cy + 5, MOUTH_IN)
        if inside(cx + 7, cy - 5) or True:
            cv.put(cx + 8, cy - 6, SWEAT); cv.put(cx + 8, cy - 5, SWEAT); cv.put(cx + 7, cy - 5, SWEAT)
    elif kind == 'shock':
        for e in ex:
            p(e, cy, EYE); p(e, cy - 1, EYE)
        brows(5, 0)
        for y in range(cy + 3, cy + 7):
            for x in range(cx + ox, cx + 2 + ox): p(x, y, EYE)
        p(cx + ox, cy + 4, MOUTH_IN); p(cx + 1 + ox, cy + 4, MOUTH_IN)
    elif kind == 'lookup':
        for e in ex: eye(e, cy - 3)
        brows(5, 1)
        for x, y in [(-1, 4), (0, 4), (1, 4), (-1, 5), (1, 5), (0, 6)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'blink':
        for e in ex:
            for x in range(e - 2, e + 1): p(x, cy + 1, EYE)
        brows(3, 1)
        for x, y in [(-2, 5), (-1, 4), (0, 5), (1, 4), (2, 5)]: p(cx + x + ox, cy + y, EYE)
    elif kind == 'creepy':
        bright = (255, 255, 255, 255)
        for e in ex:
            for yy in (cy - 1, cy):
                for xx in (e - 2, e - 1, e): p(xx, yy, bright)
            for xx in (e - 2, e - 1, e): p(xx, cy + 1, head[1])
        for x, y in [(-5, 3), (-4, 4), (-3, 5), (-2, 5), (-1, 5), (0, 5), (1, 5), (2, 5), (3, 5), (4, 4), (5, 3)]:
            p(cx + x + ox, cy + y, EYE)


def draw_arm(cv, sh, el, hd, cloth, head, dy):
    (sx, sy), (exx, ey), (hx, hy) = sh, el, hd
    sy, ey, hy = sy + dy, ey + dy, hy + dy
    cv.thick(sx, sy, exx, ey, 2.2, OUT); cv.thick(exx, ey, hx, hy, 2.2, OUT)
    cv.thick(sx, sy, exx, ey, 1.2, cloth[0]); cv.thick(exx, ey, hx, hy, 1.2, cloth[0])
    cv.disc(hx, hy, 2.2, OUT); cv.disc(hx, hy, 1.3, head[0])


def body(cv, cloth, dy, legs='stand', walk=0):
    base, shade = cloth
    # legs
    if legs == 'stand':
        cv.rect(11, 35, 14, 38, PANTS); cv.rect(18, 35, 21, 38, PANTS)
    elif legs == 'walk':
        l_up, r_up = [(0, 1), (0, 0), (1, 0), (0, 0)][walk]
        cv.rect(11, 35, 14, 38 - l_up, PANTS); cv.rect(18, 35, 21, 38 - r_up, PANTS)
    # torso: rounded shoulders, shade column right, collar shadow under head
    top = 19 + dy
    cv.rect(9, top + 2, 23, 35, base)
    cv.rect(10, top + 1, 22, top + 1, base); cv.rect(11, top, 21, top, base)
    cv.rect(20, top + 2, 23, 35, shade); cv.rect(20, top + 1, 22, top + 1, shade)
    cv.rect(12, top, 20, top + 1, shade)          # collar / head shadow
    cv.rect(13, 31, 19, 31, shade)               # pocket seam


def build_frame(head, cloth, arms='down', face='neutral', dy=0, view='front', ox=0, legs='stand', walk=0):
    b = Canvas(CW, CH)
    body(b, cloth, dy, legs, walk)
    a = ARMS[arms]
    if view == 'front' and arms != 'cover':
        if arms == 'phone':  # phone in both hands, screen faces the character
            b.rect(13, 22 + dy, 19, 31 + dy, OUT); b.rect(14, 23 + dy, 18, 30 + dy, (52, 58, 74, 255)); b.rect(15, 23 + dy, 17, 23 + dy, (90, 98, 120, 255))
        for side in a:
            draw_arm(b, *side, cloth, head, dy)
    elif view != 'front':
        for side in ARMS['down']:
            draw_arm(b, *side, cloth, head, dy)
    b.outline(OUT)
    h = Canvas(CW, CH)
    draw_head(h, 16, 10 + dy, head)
    h.outline(OUT)
    b.paste(h, 0, 0)
    if view != 'back':
        draw_face(b, face, 16, 10 + dy, ox, head)
    if arms == 'cover' and view == 'front':
        for side in a:
            draw_arm(b, *side, cloth, head, dy)
    if arms == 'phone' and view == 'front':
        # screen glow spill on the chin (light source is the phone)
        for x in range(13, 20):
            if b.get(x, 18 + dy)[3] and b.get(x, 18 + dy)[:3] == head[1][:3]:
                b.put(x, 18 + dy, head[0])
    return b


def build_character(name, head_key, cloth_key, out_dir, faces=FACES, arms=list(ARMS)):
    head, cloth = HEADS[head_key], CLOTHES[cloth_key]
    at = Atlas(CW, CH, PIVOT, cols=16)
    for ar in arms:
        for fc in faces:
            for bob in (0, 1):
                at.add(f'{ar}.{fc}.b{bob}', build_frame(head, cloth, ar, fc, bob))
    # turnaround back -> front (front is "down.<face>")
    for fc in faces:
        for bob in (0, 1):
            at.add(f'turn0.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='back'))
            at.add(f'turn1.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='turn', ox=7))
            at.add(f'turn2.{fc}.b{bob}', build_frame(head, cloth, 'down', fc, bob, view='turn', ox=4))
    for fc in faces:
        for k in range(4):
            at.add(f'walk{k}.{fc}.b0', build_frame(head, cloth, 'down', fc, [0, 1, 0, 1][k], legs='walk', walk=k))
    at.write(f'{out_dir}/{name}.png', f'{out_dir}/{name}.json',
             {'character': name, 'head': head_key, 'clothes': cloth_key,
              'faces': faces, 'arms': arms, 'naming': '<arms|turnN|walkN>.<face>.b<0|1>'})
    return at


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/sprites'
    build_character('hero', 'warm', 'hoodie', out)
    for c in ['olive', 'maroon', 'navy', 'brown', 'teal', 'plum']:
        build_character(f'ghost_{c}', 'ghost', c, out)
    print('characters ->', out)
