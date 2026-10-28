#!/usr/bin/env python3
"""SFX cues for LIGHTS OUT from the narration word times (mirrors anchors in src/film/LightsOut.tsx)."""
import json, sys
FPS = 30
t = json.load(open(sys.argv[1]))
W = t['words']
def wf(line, i=0):
    ws = [w for w in W if w['line'] == line]
    return round(ws[i]['s'] * FPS) / FPS
def we(line, i=-1):
    ws = [w for w in W if w['line'] == line]
    return round(ws[i]['e'] * FPS) / FPS
fr = 1 / FPS
light_out, turn, finds = wf('L12', 3), wf('L13', 2), wf('L18', 4)
taps = [wf('L24', 2), wf('L24', 3), wf('L24', 3) + 13 * fr, wf('L24', 3) + 26 * fr]
door_win = we('L26') + 14 * fr
choice = wf('L27')
ev = [
    {'t': 0.0, 'fx': 'tick', 'gain_db': -24}, {'t': 0.35, 'fx': 'tick', 'gain_db': -26},
    {'t': wf('L01', 3), 'fx': 'buzz', 'gain_db': -12}, {'t': wf('L01', 3) + 0.05, 'fx': 'alert', 'gain_db': -21},
    {'t': wf('L04', 3), 'fx': 'tick', 'gain_db': -6}, {'t': wf('L04', 6), 'fx': 'tick', 'gain_db': -6},
    {'t': wf('L05', 3), 'fx': 'alert', 'gain_db': -22},
    {'t': light_out, 'fx': 'tick', 'gain_db': -8},
    {'t': turn - 0.8, 'fx': 'riser', 'gain_db': -22}, {'t': turn, 'fx': 'sting', 'gain_db': -11},
    {'t': wf('L15', 2), 'fx': 'alert', 'gain_db': -22},
    {'t': wf('L17', 2), 'fx': 'buzz', 'gain_db': -11},
    {'t': finds - 0.8, 'fx': 'riser', 'gain_db': -20}, {'t': finds, 'fx': 'boom', 'gain_db': -9},
    *[{'t': k, 'fx': 'knock', 'gain_db': -5} for k in taps],
    {'t': door_win + 14 * fr, 'fx': 'boom', 'gain_db': -14},
    {'t': choice + 14 * fr, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 24 * fr, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'gain_db': -25,
                'swell': [[wf('L11'), 2.5], [turn + 1.0, 2.0], [finds, 1.5], [wf('L25'), 2.5]],
                'dips': [[light_out + 0.15, turn - 0.8], [wf('L24', 2) - 0.1, wf('L24', 2) + 1.2], [wf('L26'), door_win]],
                'cut': choice - 0.1},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('cues ->', sys.argv[2], f"({len(ev)} events)")
