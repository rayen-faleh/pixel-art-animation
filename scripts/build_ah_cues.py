#!/usr/bin/env python3
"""SFX cues for AFTER HOURS from word times (mirrors the S/E anchors in src/film/AfterHours.tsx)."""
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
scream, stop, crackle = wf('A01', 16), wf('A03', 2), wf('A05', 2)
lights = [wf('A03', 6), wf('A03', 7), wf('A03', 9), we('A03') - 2 * F]
decline, text_out, reply, decline2 = wf('A10', 0) + 4 * F, wf('A10', 1) + 6 * F, wf('A10', 5), wf('A11', 5)
keys, gone, mimic, turns = wf('A12c', 2), we('A12c') + 4 * F, wf('A13b', 0), wf('A14', 1)
drop, face, knock = wf('A14', 6) + 5 * F, wf('A14', 9) + 4 * F, wf('A16', 1)
knocks = [knock, knock + 7 * F, knock + 14 * F, we('A16b') + 2 * F, we('A16b') + 9 * F]
choice, end = wf('A18') - 2 * F, we('A18') + 12 * F
length = end + 105 * F

# hum bed: the building's heat hum dies on "stop", silence through "the whole building", then it breathes again
resume = crackle - 0.4
waves = [(0.0, stop + 1.8, 41.2)] + [(a + resume, d, hz) for a, d, hz in auto_waves(length - resume, seed=6)]

ev = [
    {'t': scream, 'fx': 'alert', 'gain_db': -9}, {'t': scream, 'fx': 'buzz', 'gain_db': -14},
    {'t': wf('A02', 0) - 3 * F, 'fx': 'pop', 'gain_db': -18},
    *[{'t': x, 'fx': 'breaker', 'gain_db': -12 + k} for k, x in enumerate(lights)],
    {'t': 18.3, 'fx': 'steps', 'dur': 1.6, 'gain_db': -12},
    {'t': 19.95, 'fx': 'locker', 'gain_db': -9},
    {'t': crackle, 'fx': 'static', 'dur': 0.7, 'gain_db': -14},
    {'t': wf('A05b', 0) - 0.1, 'fx': 'static', 'dur': we('A05b') - wf('A05b', 0) + 0.3, 'gain_db': -27},
    {'t': we('A05b') + 2 * F, 'fx': 'tick', 'gain_db': -14},
    {'t': wf('A06', 6), 'fx': 'boom', 'gain_db': -18},
    {'t': 30.6, 'fx': 'clunk', 'gain_db': -16},
    {'t': wf('A08', 6), 'fx': 'boom', 'gain_db': -16},
    *[{'t': wf('A09', 2) + k * 1.2, 'fx': 'ring', 'gain_db': -15} for k in range(3)],
    {'t': decline, 'fx': 'pop', 'gain_db': -16}, {'t': text_out, 'fx': 'pop', 'gain_db': -17}, {'t': reply, 'fx': 'pop', 'gain_db': -13},
    *[{'t': wf('A11', 0) + 6 * F + k * 1.2, 'fx': 'ring', 'gain_db': -14} for k in range(2)],
    {'t': decline2, 'fx': 'pop', 'gain_db': -15},
    {'t': keys - 0.08, 'fx': 'keys', 'gain_db': -6},
    {'t': gone - 2 * F, 'fx': 'boom', 'gain_db': -12},
    {'t': mimic, 'fx': 'sting', 'gain_db': -17},
    {'t': turns, 'fx': 'sting', 'gain_db': -14},
    {'t': drop + 4 * F, 'fx': 'clunk', 'gain_db': -11},
    {'t': face, 'fx': 'sting', 'gain_db': -11},
    *[{'t': k, 'fx': 'knock', 'gain_db': -7} for k in knocks],
    {'t': wf('A17', 0), 'fx': 'whine', 'dur': end - wf('A17', 0), 'gain_db': -24},
    {'t': choice + 12 * F, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 20 * F, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -8, 'cut': end},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('after hours cues ->', sys.argv[2], len(ev), 'events, length', round(length, 2))
