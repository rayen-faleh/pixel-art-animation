"""NIGHT SHIFT Part 3: the store aisle seen low from the end of the counter (160x240, kit density).

One-point perspective, VP (80, 108). Near frame: x 0..159, ceiling y 0, floor y 239; far wall at z = FAR_Z.
screen = VP + (near - VP) / z.  Floor point at depth z: y = 108 + 131 / z.
  left wall   snack shelves
  right wall  storefront: the roller shutter down to knee height (gap at the bottom glows; lit in Remotion),
              the door frame at z = DOOR_Z with the chime sensor box (LED drawn in Remotion)
  far wall    the beer cooler (three glass doors)
Lighting is added in Remotion.
"""
import random, sys
from pixelkit import Canvas, hexc

SW, SH = 160, 240
VPX, VPY = 80, 108
FAR_Z = 5.0
DOOR_Z = (2.25, 2.75)
SENSOR = (2.3, 96)        # depth, wall height of the chime sensor


def mix(c, k, fog=(8, 10, 18)):
    return tuple(int(c[i] * (1 - k) + fog[i] * k) for i in range(3)) + (255,)


def aisle(out):
    rnd = random.Random(8)
    cv = Canvas(SW, SH)
    snack = [hexc(c)[:3] for c in ('#c8323c', '#2f6ad0', '#e0b030', '#3a9a5a', '#c87a2a', '#8a4ad0')]
    for y in range(SH):
        for x in range(SW):
            cands = []
            if y > VPY: cands.append(('floor', (SH - 1 - VPY) / (y - VPY)))
            if y < VPY: cands.append(('ceil', VPY / (VPY - y)))
            if x < VPX: cands.append(('left', VPX / (VPX - x)))
            if x > VPX: cands.append(('right', (SW - 1 - VPX) / (x - VPX)))
            kind, z = min(cands, key=lambda c: c[1]) if cands else ('far', FAR_Z)
            if z > FAR_Z:
                kind, z = 'far', FAR_Z
            fog = min(0.85, (z - 1) / 5.5)
            wy = VPY + (y - VPY) * z          # height on the near frame (0 ceiling .. 239 floor)
            wx = VPX + (x - VPX) * z
            if kind == 'floor':
                u, v = int((wx + 400) // 18), int(z * 3)
                c = (34, 37, 46) if (u + v) % 2 else (27, 29, 37)
            elif kind == 'ceil':
                c = (21, 24, 38)
                if abs(z - 1.6) < 0.08 or abs(z - 3.0) < 0.1:
                    c = (60, 64, 80) if abs(wx - 80) < 30 else c
            elif kind == 'left':
                c = (30, 34, 50)
                band = int(wy) % 34
                if 40 < wy < 205:
                    if band < 3:
                        c = (70, 60, 50)
                    elif band < 20:
                        k = (int(z * 7) + int(wy // 34)) % 6
                        c = snack[k] if (int(z * 14) % 3) else (40, 36, 34)
            elif kind == 'right':
                c = (14, 20, 34)                                              # glass (night) high up
                if wy > 62:
                    c = (88, 93, 108) if int(wy) % 3 == 0 else (70, 75, 89)  # shutter slats
                if wy > 226:
                    c = (150, 160, 175)                                       # the lit gap at knee height
                if DOOR_Z[0] <= z <= DOOR_Z[1]:
                    c = (55, 60, 80) if (z < DOOR_Z[0] + 0.06 or z > DOOR_Z[1] - 0.06) else c
            else:  # far wall + the beer cooler
                c = (26, 30, 46)
                if 70 < x < 92 and 82 < y < 132:
                    door = (x - 70) // 7
                    edge = (x - 70) % 7 == 0
                    c = (60, 66, 84) if edge else ((30, 52, 74) if (y + door) % 5 else snack[(door + y // 6) % 6])
                    if y < 86:
                        c = (40, 44, 58)
            cv.put(x, y, mix(c, fog))
    # chime sensor box on the door frame (right wall)
    z, wy = SENSOR
    sx, sy = int(VPX + (SW - 1 - VPX) / z), int(VPY + (wy - VPY) / z)
    cv.rect(sx - 3, sy - 2, sx, sy + 2, hexc('#c9ccd6')); cv.rect(sx - 2, sy - 1, sx - 1, sy + 1, hexc('#8a8d96'))
    cv.save(f'{out}/sets/ns_aisle_bg.png')
    print('sensor at', sx, sy)


if __name__ == '__main__':
    aisle(sys.argv[1] if len(sys.argv) > 1 else '../public')
