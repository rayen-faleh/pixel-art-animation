#!/usr/bin/env python3
"""SFX cues for NIGHT SHIFT Part 2 from word times (mirrors the E anchors in src/film/NightShift2.tsx)."""
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
skip, stops, turns, click, hum_stop = wf('S08', 4), wf('S10', 3), wf('S11', 5), wf('S13', 4), wf('S17', 2)
hands = [wf('S16', 2), wf('S16', 9), wf('S16', 12)]
choice, end = wf('S21', 0) - 2 * F, we('S21') + 30 * F
length = end + 120 * F

# the bed: approved hum waves; the one full dropout is the moment the music dies
waves = [w for w in auto_waves(length, seed=12) if not (stops - 0.3 < w[0] < we('S10') + 1.6)]
ev = [
    # his car stereo through the shutter: muffled bass that skips, then drags, then dies
    {'t': 0.0, 'fx': 'bass', 'dur': skip, 'gain_db': -20},
    {'t': skip + 0.25, 'fx': 'bass', 'dur': wf('S09', 0) - skip - 0.25, 'gain_db': -22},
    {'t': wf('S09', 0), 'fx': 'bass', 'dur': stops - wf('S09', 0), 'gain_db': -25},
    {'t': skip, 'fx': 'tick', 'gain_db': -12},
    {'t': 0.0, 'fx': 'skitter', 'dur': 2.0, 'gain_db': -26},
    {'t': wf('S06', 3), 'fx': 'sting', 'gain_db': -17}, {'t': wf('S07', 8), 'fx': 'boom', 'gain_db': -17},
    {'t': stops, 'fx': 'tick', 'gain_db': -10},
    {'t': turns, 'fx': 'sting', 'gain_db': -10}, {'t': turns, 'fx': 'skitter', 'dur': 0.6, 'gain_db': -18},
    {'t': wf('S12', 0), 'fx': 'boom', 'gain_db': -17},
    # the cooler: click, then five minutes of compressor hum (cut to the line timing)
    {'t': click, 'fx': 'clunk', 'gain_db': -9}, {'t': click + 0.1, 'fx': 'belt', 'dur': hum_stop - click - 0.1, 'gain_db': -16},
    {'t': click + 0.1, 'fx': 'hum', 'dur': hum_stop - click - 0.1, 'gain_db': -24},
    *[{'t': h, 'fx': 'skitter', 'dur': 0.9, 'gain_db': -17} for h in hands], {'t': hands[0], 'fx': 'sting', 'gain_db': -12},
    {'t': hum_stop, 'fx': 'tick', 'gain_db': -12},
    {'t': wf('S17', 9), 'fx': 'skitter', 'dur': 1.2, 'gain_db': -22},
    {'t': wf('S18', 2), 'fx': 'boom', 'gain_db': -16},
    {'t': wf('S19', 6), 'fx': 'sting', 'gain_db': -15},
    {'t': wf('S20', 0), 'fx': 'whine', 'dur': end - wf('S20', 0), 'gain_db': -26},
    {'t': choice + 12 * F, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 20 * F, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -10, 'cut': end, 'dips': [[stops + 0.05, we('S10') + 1.3]]},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('night shift 2 cues ->', sys.argv[2], len(ev), 'events, length', round(length, 2))
