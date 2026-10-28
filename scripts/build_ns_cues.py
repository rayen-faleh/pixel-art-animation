#!/usr/bin/env python3
"""SFX cues for NIGHT SHIFT from word times (mirrors the E/S anchors in src/film/NightShift.tsx)."""
import json, sys
FPS = 30
t = json.load(open(sys.argv[1])); W = t['words']
def wf(line, i=0):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['s'] * FPS) / FPS
def we(line, i=-1):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['e'] * FPS) / FPS
hum_off, ice_off = wf('N07', 1), wf('N07', 5)
roll, jam = wf('N09', 0), wf('N10', 1)
bass, bang = wf('N12', 1), wf('N16', 6)
breath, press = wf('N18', 0), wf('N20', 1)
choice = wf('N26'); end = t['duration'] + 80 / FPS
ev = [
    {'t': 0.0, 'fx': 'hum', 'dur': hum_off, 'gain_db': -27}, {'t': 0.0, 'fx': 'neon', 'dur': hum_off, 'gain_db': -36},
    {'t': 0.0, 'fx': 'rattle', 'dur': ice_off, 'gain_db': -31},
    {'t': wf('N02', 1), 'fx': 'hum', 'dur': 1.2, 'gain_db': -22}, {'t': wf('N02', 4), 'fx': 'rattle', 'dur': 1.4, 'gain_db': -24},
    {'t': wf('N02', 8), 'fx': 'neon', 'dur': 1.3, 'gain_db': -26},
    {'t': wf('N05', 3), 'fx': 'static', 'dur': 0.7, 'gain_db': -15}, {'t': we('N06'), 'fx': 'static', 'dur': 0.4, 'gain_db': -20},
    {'t': hum_off, 'fx': 'tick', 'gain_db': -8}, {'t': ice_off, 'fx': 'clunk', 'gain_db': -18},
    {'t': wf('N08', 2) - 0.1, 'fx': 'tick', 'gain_db': -6},
    {'t': roll, 'fx': 'shutter', 'dur': jam - roll, 'gain_db': -13}, {'t': jam, 'fx': 'clunk', 'gain_db': -7},
    {'t': bass, 'fx': 'bass', 'dur': choice - bass, 'gain_db': -21},
    {'t': wf('N13', 8), 'fx': 'skitter', 'dur': 0.8, 'gain_db': -18}, {'t': wf('N13', 8), 'fx': 'tick', 'gain_db': -14},
    {'t': wf('N15', 8), 'fx': 'skitter', 'dur': 1.4, 'gain_db': -14},
    {'t': bang - 0.7, 'fx': 'riser', 'dur': 0.7, 'gain_db': -20}, {'t': bang, 'fx': 'bang', 'gain_db': -6},
    {'t': breath, 'fx': 'breath', 'dur': press - breath, 'gain_db': -17},
    {'t': wf('N19', 2), 'fx': 'sting', 'gain_db': -13}, {'t': wf('N19', 3), 'fx': 'skitter', 'dur': 1.0, 'gain_db': -20},
    {'t': wf('N21', 1), 'fx': 'skitter', 'dur': 0.8, 'gain_db': -22},
    {'t': wf('N22', 6), 'fx': 'skitter', 'dur': 2.5, 'gain_db': -17},
    {'t': wf('N23', 3), 'fx': 'static', 'dur': 0.5, 'gain_db': -22}, {'t': we('N24'), 'fx': 'static', 'dur': 0.3, 'gain_db': -24},
    {'t': wf('N25', 4), 'fx': 'tick', 'gain_db': -16},
    {'t': choice + 14 / FPS, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 24 / FPS, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'gain_db': -27, 'swell': [[jam, 1.5], [bang + 1, 2.0], [wf('N19', 2), 3.0]],
                'dips': [[jam + 0.5, bass - 0.2], [wf('N20', 1), wf('N21', 1)]], 'cut': choice - 0.1},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('ns cues ->', sys.argv[2], len(ev), 'events')
