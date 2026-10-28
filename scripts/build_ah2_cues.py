#!/usr/bin/env python3
"""SFX cues for AFTER HOURS Day 2 from word times (mirrors the E anchors in src/film/AfterHours2.tsx)."""
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
knock = wf('H02', 3)
knocks = [knock, knock + 7 * F, knock + 14 * F, wf('H02', 6), wf('H02', 6) + 7 * F]
r104, off104, r106, r108, r110 = wf('H11', 8), wf('H11', 12), wf('H12', 0), wf('H12', 1), wf('H13', 3)
click, red, stop, cough, dark, run, quiet = wf('H14', 0), wf('H14', 5), wf('H15', 1), wf('H16', 5), wf('H17', 2), wf('H17', 5), wf('H18', 3)
allc, maya, dont, star, every, hears = wf('H19', 10), wf('H20b', 0), wf('H23', 3), wf('H24', 13), wf('H25', 8), wf('H26', 2)
choice, end = wf('H27', 0) - 2 * F, we('H27') + 30 * F
length = end + 120 * F

# hum bed (approved): the one full dropout is the held breath, "You stop breathing" -> the cough
waves = [w for w in auto_waves(length, seed=9) if not (stop - 0.3 < w[0] < cough + 0.5)]
ev = [
    {'t': 0.0, 'fx': 'tick', 'gain_db': -16},
    *[{'t': k, 'fx': 'knock', 'gain_db': -8} for k in knocks],
    {'t': wf('H03', 3), 'fx': 'boom', 'gain_db': -20},
    {'t': wf('H06', 5), 'fx': 'sting', 'gain_db': -16},
    {'t': wf('H08', 13), 'fx': 'boom', 'gain_db': -16},
    {'t': wf('H09', 8), 'fx': 'sting', 'gain_db': -16},
    *[{'t': x, 'fx': 'tick', 'gain_db': -10} for x in (r104, r106, r108)],
    {'t': r104 + 0.05, 'fx': 'static', 'dur': off104 - r104, 'gain_db': -26},
    {'t': r106 + 0.05, 'fx': 'static', 'dur': 0.5, 'gain_db': -28}, {'t': r108 + 0.05, 'fx': 'static', 'dur': 0.5, 'gain_db': -28},
    {'t': r110, 'fx': 'boom', 'gain_db': -14},
    {'t': click, 'fx': 'tick', 'gain_db': -6}, {'t': red, 'fx': 'sting', 'gain_db': -12},
    {'t': red + 0.1, 'fx': 'static', 'dur': dark - red - 0.1, 'gain_db': -36},
    {'t': cough, 'fx': 'knock', 'gain_db': -14},
    {'t': dark, 'fx': 'tick', 'gain_db': -10},
    {'t': run - 0.1, 'fx': 'steps', 'dur': 1.4, 'gain_db': -8},
    {'t': quiet, 'fx': 'boom', 'gain_db': -13},
    {'t': allc, 'fx': 'tick', 'gain_db': -6}, {'t': allc, 'fx': 'static', 'dur': 1.0, 'gain_db': -16}, {'t': allc, 'fx': 'sting', 'gain_db': -10},
    {'t': maya - 0.1, 'fx': 'static', 'dur': we('H20b') - maya + 0.3, 'gain_db': -28},
    {'t': wf('H21', 2), 'fx': 'boom', 'gain_db': -15},
    {'t': wf('H22', 2), 'fx': 'pop', 'gain_db': -15}, *[{'t': wf('H22', k), 'fx': 'pop', 'gain_db': -16} for k in (5, 8, 13)],
    {'t': dont, 'fx': 'pop', 'gain_db': -15},
    *[{'t': star + k * 0.22, 'fx': 'beep', 'gain_db': -20} for k in range(3)],
    {'t': hears, 'fx': 'sting', 'gain_db': -12},
    {'t': wf('H24', 0), 'fx': 'whine', 'dur': end - wf('H24', 0), 'gain_db': -26},
    {'t': choice + 12 * F, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 20 * F, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -10, 'cut': end, 'dips': [[stop + 0.4, cough - 0.2]]},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('after hours 2 cues ->', sys.argv[2], len(ev), 'events, length', round(length, 2))
