#!/usr/bin/env python3
"""SFX cues for DON'T REPLY Day 1 from word times (mirrors the E anchors in src/film/DontReply.tsx)."""
import json, sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from liminal_hum import auto_waves

FPS = 30
t = json.load(open(sys.argv[1])); W = t['words']
def wf(line, i=0):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['s'] * FPS) / FPS
def we(line, i=-1):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['e'] * FPS) / FPS
F = 1 / FPS
beast, jake, buzz1, buzz2, dot, offline = wf('D01', 9), wf('D04', 6), wf('D09', 0), wf('D09', 4), wf('D10', 5), wf('D11', 4)
photo, which, lit, slip, dots, turns, bang = wf('D12', 2), wf('D13', 0), wf('D15', 7), wf('D16', 2), wf('D16', 4), wf('D17', 3), wf('D19', 2)
choice, end = wf('D22') - 2 * F, we('D22') + 14 * F
length = end + 105 * F

# hum bed: approved waves, one full dropout on "Which one is yours?"
waves = [w for w in auto_waves(length, seed=5) if not (which - 0.3 < w[0] < we('D13') + 0.8)]
ev = [
    {'t': 0.0, 'fx': 'hum', 'dur': photo, 'gain_db': -27},                       # the house's morning hum, gone when the photo lands
    {'t': beast, 'fx': 'buzz', 'gain_db': -13}, {'t': beast, 'fx': 'sting', 'gain_db': -19},
    *[{'t': wf('D03', k), 'fx': 'pop', 'gain_db': -17} for k in (1, 4)],
    {'t': wf('D04', 0), 'fx': 'pop', 'gain_db': -16}, {'t': wf('D04', 4), 'fx': 'pop', 'gain_db': -15},
    {'t': jake, 'fx': 'pop', 'gain_db': -14}, {'t': jake, 'fx': 'sting', 'gain_db': -14},
    {'t': wf('D05', 1), 'fx': 'boom', 'gain_db': -18},
    {'t': wf('D07', 6), 'fx': 'boom', 'gain_db': -16},
    {'t': buzz1, 'fx': 'buzz', 'gain_db': -10}, {'t': buzz2, 'fx': 'buzz', 'gain_db': -8},
    {'t': dot, 'fx': 'beep', 'gain_db': -16}, {'t': dot, 'fx': 'riser', 'dur': 0.8, 'gain_db': -18},
    {'t': offline, 'fx': 'tick', 'gain_db': -11},
    {'t': photo, 'fx': 'pop', 'gain_db': -14}, {'t': photo + 0.05, 'fx': 'breaker', 'gain_db': -18},
    {'t': which, 'fx': 'pop', 'gain_db': -15},
    {'t': wf('D14', 1), 'fx': 'tick', 'gain_db': -14},
    {'t': wf('D15', 1), 'fx': 'sting', 'gain_db': -15},
    {'t': slip, 'fx': 'tick', 'gain_db': -8}, {'t': dots, 'fx': 'beep', 'gain_db': -14},
    {'t': turns, 'fx': 'sting', 'gain_db': -10}, {'t': turns, 'fx': 'boom', 'gain_db': -14},
    {'t': bang, 'fx': 'bang', 'gain_db': -9},
    {'t': wf('D20', 0), 'fx': 'whine', 'dur': end - wf('D20', 0), 'gain_db': -26},
    {'t': choice + 12 * F, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 20 * F, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -8, 'cut': end, 'dips': [[which - 0.05, we('D13') + 0.6]]},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print("don't reply cues ->", sys.argv[2], len(ev), 'events, length', round(length, 2))
