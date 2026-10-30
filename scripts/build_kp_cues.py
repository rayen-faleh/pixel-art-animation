#!/usr/bin/env python3
"""SFX cues for KEEP PRETENDING from word times (mirrors the E anchors in src/film/KeepPretending.tsx).

Bed: the boxed-in liminal hum (apartment), one full dropout after the whisper ("Hey, buddy."), cut on the
end card. Effects sit on the sounding words: purrs, paws (quick pairs) vs steps (slow singles: two legs),
the door creak, the camera motor, phone buzzes, the shelter cries.
Usage: python3 scripts/build_kp_cues.py audio/kp_raw/timing.json kp-cues.json
"""
import json, sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from liminal_hum import auto_waves

FPS = 30
F = 1 / FPS
t = json.load(open(sys.argv[1])); W = t['words']


def wf(line, i=0):
    ws = [w for w in W if w['line'] == line]; return round(ws[i if i >= 0 else len(ws) + i]['s'] * FPS) / FPS


def we(line, i=-1):
    ws = [w for w in W if w['line'] == line]; return round(ws[i if i >= 0 else len(ws) + i]['e'] * FPS) / FPS


turned, buddy = wf('P05', 2), wf('P07', 2)
stands, lookcam, moved = wf('P33', 3), wf('P39', 4), wf('P43', 0)
behind, lock, spot, check, person = wf('P60', 0), wf('P61', 0), wf('P68', 0), wf('P74', 0), wf('P79', 1)
pan, creak, steps, two, breath, paws = wf('P81', 3), wf('P83', 3), wf('P84', 0), wf('P85', 0), wf('P87', 0), wf('P88', 1)
again1, again2, memo, last = wf('P97', 3), wf('P97', 4), wf('P100', 7), wf('P102', 3)
same, still, dies, whir = wf('P106', 0), wf('P128', 5), wf('P129', 3), wf('P130', 5)
t311, empty, buzz, behindyou, closer, whisper = wf('P133', 0), wf('P140', 3), wf('P141', 3), wf('P143', 4), wf('P151', 0), wf('P153', 0)
you, ret4, crying, reveal, end = wf('P159', 1), wf('P162', 6), wf('P163', 8), wf('P167', 0), wf('P168', 0)
dropout = (we('P153') + 0.1, wf('P154', 0) - 0.15)
length = we('P168') + 45 * F + 150 * F

waves = [w for w in auto_waves(length, seed=21) if not (dropout[0] - 0.4 < w[0] < dropout[1] + 0.4)]
ev = [
    {'t': 0.0, 'fx': 'hum', 'dur': 6.0, 'gain_db': -26},                      # fridge hum under the cold open
    {'t': turned, 'fx': 'sting', 'gain_db': -14},
    {'t': wf('P05', 6), 'fx': 'boom', 'gain_db': -18},
    {'t': we('P09') + 0.2, 'fx': 'boom', 'gain_db': -12},                     # title
    # shelter
    *[{'t': wf('P11', 0) + k * 0.7 + (k % 3) * 0.13, 'fx': 'meow', 'gain_db': -20 - (k % 4) * 2} for k in range(10)],
    {'t': wf('P15', 2), 'fx': 'sting', 'gain_db': -18},
    {'t': wf('P21', 0), 'fx': 'purr', 'dur': 2.4, 'gain_db': -14},
    {'t': wf('P21', 8), 'fx': 'purr', 'dur': 2.0, 'gain_db': -14},
    {'t': we('P22'), 'fx': 'boom', 'gain_db': -20},
    {'t': wf('P26', 4), 'fx': 'sting', 'gain_db': -16},
    {'t': wf('P29', 0), 'fx': 'buzz', 'gain_db': -12},
    # the camera
    *[{'t': wf('P31', 3) + k * 0.24, 'fx': 'pad', 'gain_db': -22} for k in range(8)],
    {'t': stands, 'fx': 'boom', 'gain_db': -14}, {'t': stands, 'fx': 'static', 'dur': 0.3, 'gain_db': -26},
    *[{'t': wf('P35', 0) + k * 0.62, 'fx': 'pad', 'gain_db': -18} for k in range(4)],
    {'t': wf('P36', 0), 'fx': 'whoosh', 'dur': 1.2, 'gain_db': -24},
    {'t': lookcam, 'fx': 'sting', 'gain_db': -10},
    {'t': wf('P41', 2), 'fx': 'purr', 'dur': 2.6, 'gain_db': -14},
    {'t': wf('P42', 2), 'fx': 'buzz', 'gain_db': -12}, {'t': moved, 'fx': 'sting', 'gain_db': -14},
    # dana
    {'t': wf('P46', 0), 'fx': 'beep', 'gain_db': -18},
    *[{'t': wf(l, 0), 'fx': 'pop', 'gain_db': -18} for l in ('P48', 'P51', 'P52', 'P53', 'P54', 'P55', 'P56', 'P57')],
    {'t': wf('P57', 4), 'fx': 'boom', 'gain_db': -16},
    {'t': behind, 'fx': 'sting', 'gain_db': -12},
    {'t': lock, 'fx': 'tick', 'gain_db': -14},
    # the spot
    {'t': wf('P64', 0), 'fx': 'purr', 'dur': 2.8, 'gain_db': -15},
    {'t': spot, 'fx': 'boom', 'gain_db': -14},
    {'t': check, 'fx': 'tick', 'gain_db': -18},
    {'t': person, 'fx': 'sting', 'gain_db': -10},
    {'t': pan - 0.1, 'fx': 'motor', 'dur': 1.8, 'gain_db': -10},
    {'t': creak, 'fx': 'creak', 'dur': 1.5, 'gain_db': -8},
    *[{'t': steps + k * 0.85, 'fx': 'pad', 'gain_db': -10} for k in range(2)],      # two of them. not four.
    {'t': two, 'fx': 'boom', 'gain_db': -14},
    {'t': breath, 'fx': 'breath', 'dur': 3.5, 'gain_db': -26},
    *[{'t': paws + k * 0.11, 'fx': 'pad', 'gain_db': -16} for k in range(4)],
    {'t': paws + 0.8, 'fx': 'purr', 'dur': 3.4, 'gain_db': -13},
    # practice
    {'t': wf('P92', 2), 'fx': 'sting', 'gain_db': -18},
    *[{'t': wf('P93', 0) + k * 0.5, 'fx': 'pop', 'gain_db': -20} for k in range(3)],
    {'t': again1, 'fx': 'thump', 'gain_db': -18}, {'t': again2, 'fx': 'thump', 'gain_db': -16}, {'t': wf('P98', 3), 'fx': 'boom', 'gain_db': -16},
    {'t': memo, 'fx': 'static', 'dur': 2.0, 'gain_db': -30},
    {'t': last, 'fx': 'sting', 'gain_db': -8},
    {'t': same, 'fx': 'boom', 'gain_db': -13},
    # gifts
    *[{'t': wf(l, 3), 'fx': 'thump', 'gain_db': -20} for l in ('P111', 'P112', 'P113', 'P114')],
    {'t': wf('P116', 1), 'fx': 'sting', 'gain_db': -12},
    *[{'t': wf(l, 2), 'fx': 'boom', 'gain_db': -18} for l in ('P122', 'P123', 'P124', 'P125')],
    {'t': wf('P126', 4), 'fx': 'boom', 'gain_db': -12},
    {'t': still, 'fx': 'sting', 'gain_db': -10},
    {'t': dies, 'fx': 'tick', 'gain_db': -14},
    {'t': whir, 'fx': 'motor', 'dur': 2.2, 'gain_db': -10},
    # 3:11
    {'t': wf('P132', 0), 'fx': 'whine', 'dur': whisper - wf('P132', 0), 'gain_db': -28},
    {'t': wf('P135', 6), 'fx': 'purr', 'dur': 3.0, 'gain_db': -14},
    {'t': wf('P138', 2), 'fx': 'clunk', 'gain_db': -16}, {'t': wf('P138', 4), 'fx': 'clunk', 'gain_db': -14},
    {'t': empty, 'fx': 'boom', 'gain_db': -12},
    {'t': buzz, 'fx': 'buzz', 'gain_db': -10},
    {'t': behindyou, 'fx': 'sting', 'gain_db': -8},
    {'t': wf('P146', 0), 'fx': 'whoosh', 'dur': 0.8, 'gain_db': -20},
    {'t': wf('P148', 0), 'fx': 'purr', 'dur': 2.4, 'gain_db': -16},
    {'t': closer, 'fx': 'boom', 'gain_db': -10},
    # ending
    *[{'t': wf('P154', 0) + k * 0.6 + (k % 2) * 0.17, 'fx': 'meow', 'gain_db': -21 - (k % 3) * 2} for k in range(7)],
    {'t': you, 'fx': 'sting', 'gain_db': -10},
    {'t': ret4, 'fx': 'scratch', 'gain_db': -16},
    *[{'t': crying + k * 0.95, 'fx': 'meow', 'gain_db': -12} for k in range(5)],
    {'t': reveal - 0.05, 'fx': 'boom', 'gain_db': -12},
    {'t': we('P167') - 0.2, 'fx': 'purr_wrong', 'dur': 3.0, 'gain_db': -16},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -9, 'cut': end + 4.5, 'dips': [list(dropout)]},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('keep pretending cues ->', sys.argv[2], len(ev), 'events, length', round(length, 2))
