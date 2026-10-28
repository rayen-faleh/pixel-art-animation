#!/usr/bin/env python3
"""SFX cues for SOUL FOR SALE from word times (mirrors the S/E anchors in src/film/SoulForSale.tsx)."""
import json, sys
FPS = 30
t = json.load(open(sys.argv[1])); W = t['words']
def wf(line, i=0):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['s'] * FPS) / FPS
def we(line, i=-1):
    ws = [w for w in W if w['line'] == line]; return round(ws[i]['e'] * FPS) / FPS
cut = lambda line: wf(line) - 3 / FPS
bank1, bank2, back = wf('S04', 1), we('S04') - 4 / FPS, wf('S05')
out2, back2, out3, endless = we('S07') + 2 / FPS, wf('S08') - 2 / FPS, we('S26') - 2 / FPS, cut('S27')
choice = wf('S30'); end = t['duration'] + 50 / FPS
# every payment: same printer feed + the same low thud, so the viewer learns the sound of a cost
pays = [(wf('S10', 1), wf('S10', 5)), (wf('S13', 0) - 4 / FPS, wf('S13', 2)), (wf('S16', 0) - 4 / FPS, wf('S16', 2)),
        (wf('S19', 0) - 4 / FPS, wf('S19', 2)), (wf('S22', 0), wf('S22', 2))]
ev = [
    {'t': 0.0, 'fx': 'hum', 'dur': bank2, 'gain_db': -28},
    {'t': cut('S02'), 'fx': 'pop', 'gain_db': -18},
    *[{'t': wf('S03', 2) + k * (we('S03') - wf('S03', 2)) / 10, 'fx': 'tick', 'gain_db': -20} for k in range(10)],
    {'t': we('S03') + 4 / FPS, 'fx': 'pop', 'gain_db': -14},
    {'t': bank1, 'fx': 'breaker', 'gain_db': -10}, {'t': bank2, 'fx': 'breaker', 'gain_db': -8},
    {'t': back, 'fx': 'neon', 'dur': 0.4, 'gain_db': -20}, {'t': back, 'fx': 'hum', 'dur': out2 - back, 'gain_db': -28},
    {'t': back + 8 / FPS, 'fx': 'belt', 'dur': wf('S05', 6) - back - 8 / FPS, 'gain_db': -18},
    {'t': wf('S05', 7), 'fx': 'sting', 'gain_db': -14},
    {'t': cut('S06'), 'fx': 'printer', 'dur': 0.9, 'gain_db': -16},
    {'t': wf('S07', 3), 'fx': 'scratch', 'dur': 0.5, 'gain_db': -14},
    {'t': out2, 'fx': 'breaker', 'gain_db': -8}, {'t': back2, 'fx': 'neon', 'dur': 0.3, 'gain_db': -22},
    {'t': back2, 'fx': 'hum', 'dur': out3 - back2, 'gain_db': -30},
    {'t': wf('S08', 4), 'fx': 'sting', 'gain_db': -18},
    {'t': wf('S09', 3), 'fx': 'scratch', 'dur': wf('S09', 5) - wf('S09', 3), 'gain_db': -16},
    {'t': wf('S09', 5), 'fx': 'beep', 'gain_db': -16}, {'t': wf('S09', 5) + 0.15, 'fx': 'beep', 'gain_db': -16},
    *[x for a, p in pays for x in ({'t': a, 'fx': 'printer', 'dur': 0.7, 'gain_db': -15}, {'t': p, 'fx': 'boom', 'gain_db': -15})],
    {'t': wf('S14', 5), 'fx': 'beep', 'gain_db': -18}, {'t': wf('S14', 5) + 0.25, 'fx': 'beep', 'gain_db': -18}, {'t': wf('S14', 5) + 0.5, 'fx': 'beep', 'gain_db': -18},
    {'t': wf('S15', 2), 'fx': 'riser', 'dur': wf('S15', 6) - wf('S15', 2), 'gain_db': -20},
    {'t': we('S16') + 2 / FPS, 'fx': 'buzz', 'gain_db': -16},
    {'t': wf('S18', 5), 'fx': 'tick', 'gain_db': -10},
    *[{'t': cut('S20') + k * 0.2, 'fx': 'knock', 'gain_db': -26} for k in range(int((cut('S21') - cut('S20')) / 0.2))],
    {'t': wf('S21', 5), 'fx': 'belt', 'dur': 1.4, 'gain_db': -18},
    {'t': cut('S23'), 'fx': 'neon', 'dur': cut('S25') - cut('S23'), 'gain_db': -32},
    {'t': wf('S24', 6), 'fx': 'sting', 'gain_db': -14},
    {'t': wf('S25', 2), 'fx': 'printer', 'dur': we('S25') - wf('S25', 2) + 1.2, 'gain_db': -15},
    {'t': wf('S25', 10), 'fx': 'boom', 'gain_db': -12},
    {'t': out3, 'fx': 'breaker', 'gain_db': -7},
    {'t': endless, 'fx': 'boom', 'gain_db': -9}, {'t': endless, 'fx': 'hum', 'dur': cut('S28') - endless, 'gain_db': -24},
    {'t': cut('S28'), 'fx': 'belt', 'dur': 1.0, 'gain_db': -18}, {'t': wf('S28', 3), 'fx': 'sting', 'gain_db': -13},
    {'t': cut('S29'), 'fx': 'buzz', 'gain_db': -14}, {'t': wf('S29', 3), 'fx': 'pop', 'gain_db': -14},
    {'t': choice + 12 / FPS, 'fx': 'pop', 'gain_db': -15}, {'t': choice + 22 / FPS, 'fx': 'pop', 'gain_db': -15},
]
cues = {'bed': {'gain_db': -27, 'swell': [[cut('S23'), 4.0], [endless, 3.0]],
                'dips': [[bank2, back], [out2, back2], [out3, endless]], 'cut': choice - 0.1},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('soul cues ->', sys.argv[2], len(ev), 'events')
