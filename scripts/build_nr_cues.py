#!/usr/bin/env python3
"""SFX cues for NIGHT ROAD from word times (mirrors the E anchors in src/film/NightRoad.tsx)."""
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
flick, visor, drop = wf('N03', 6), wf('N11', 15), wf('N12', 3)
car_lit, haz, haz_off = wf('N29', 6), wf('N32', 7), wf('N32', 10)
phone_up, stands, slap, click, station = wf('N37', 2), wf('N41', 5), wf('N42', 1), wf('N43', 3), wf('N44', 6)
buzz, drops, fuel = wf('N50', 2), wf('N55', 2), wf('N56', 2)
kill, buzz_light, light_out = we('N62', -1), wf('N67', 9), wf('N68', 1)
door, dome, slam, faces, dark = wf('N69', 5), wf('N70', 4), wf('N71', 1), wf('N74', 4), wf('N76', 0)
roof, slide, now, reach, back = wf('N78', 1), wf('N80', 1), wf('N83c', 4), wf('N86', 2), wf('N88', 4)
street, home, lock, by_itself = wf('N90', 4), wf('N95', 0), we('N99', -1), wf('N100', 7)
end = we('N101') + 20 * F
length = end + 150 * F

# bed: the approved boxed-in hum waves under everything; one full dropout on "Dark."
waves = [w for w in auto_waves(length, seed=8) if not (dark - 0.2 < w[0] < dark + 1.4)]
ev = [
    # the car itself: road rumble while the engine runs (off at the gas station, back on when you pull out)
    {'t': 0.0, 'fx': 'engine', 'dur': kill + 0.6, 'gain_db': -20},
    {'t': wf('N77', 0) - 0.3, 'fx': 'engine', 'dur': home + 4 - wf('N77', 0), 'gain_db': -19},
    # cold open
    {'t': flick - 2 * F, 'fx': 'tick', 'gain_db': -10}, {'t': flick, 'fx': 'sting', 'gain_db': -12}, {'t': flick + 9 * F, 'fx': 'tick', 'gain_db': -12},
    # detour, truck, card
    {'t': wf('N07', 6), 'fx': 'pop', 'gain_db': -18}, {'t': wf('N08', 3), 'fx': 'pop', 'gain_db': -19},
    {'t': visor - 1.8, 'fx': 'whoosh', 'gain_db': -9}, {'t': visor, 'fx': 'clunk', 'gain_db': -18}, {'t': drop + 7 * F, 'fx': 'tick', 'gain_db': -14},
    {'t': wf('N16', 0), 'fx': 'boom', 'gain_db': -18},
    {'t': wf('N19', 1) - 1.2, 'fx': 'whoosh', 'dur': 2.0, 'gain_db': -16},
    # markers
    {'t': wf('N21', 3), 'fx': 'sting', 'gain_db': -18}, {'t': wf('N23', 8), 'fx': 'boom', 'gain_db': -18},
    {'t': wf('N25', 3), 'fx': 'sting', 'gain_db': -16}, {'t': wf('N26', 3), 'fx': 'boom', 'gain_db': -16},
    {'t': car_lit, 'fx': 'tick', 'gain_db': -12}, {'t': car_lit, 'fx': 'riser', 'dur': 1.4, 'gain_db': -20},
    {'t': wf('N31', 5), 'fx': 'sting', 'gain_db': -13},
    *[{'t': haz + k * 16 * F, 'fx': 'tick', 'gain_db': -14} for k in range(4)],
    {'t': haz_off + 4 * F, 'fx': 'boom', 'gain_db': -16},
    {'t': wf('N35', 0), 'fx': 'whine', 'dur': we('N36') - wf('N35', 0), 'gain_db': -28},
    {'t': wf('N36', 0), 'fx': 'sting', 'gain_db': -15},
    # phone + radio
    {'t': phone_up, 'fx': 'buzz', 'gain_db': -14}, {'t': stands, 'fx': 'sting', 'gain_db': -11},
    {'t': slap, 'fx': 'clunk', 'gain_db': -10},
    {'t': click, 'fx': 'tick', 'gain_db': -9}, {'t': click, 'fx': 'static', 'dur': station - click + 0.4, 'gain_db': -18},
    {'t': wf('N45b', 0) - 0.1, 'fx': 'static', 'dur': we('N45c') - wf('N45b', 0) + 0.3, 'gain_db': -30},
    {'t': wf('N46', 1), 'fx': 'boom', 'gain_db': -17},
    {'t': wf('N48b', 0) - 0.1, 'fx': 'static', 'dur': we('N48b') - wf('N48b', 0) + 0.3, 'gain_db': -30},
    # dad's call
    *[{'t': buzz + k * 0.9, 'fx': 'buzz', 'gain_db': -13} for k in range(4)],
    {'t': drops, 'fx': 'beep', 'gain_db': -20}, {'t': drops + 0.18, 'fx': 'beep', 'gain_db': -20},
    # gas
    {'t': fuel, 'fx': 'chime', 'gain_db': -14},
    {'t': kill, 'fx': 'clunk', 'gain_db': -16},
    {'t': wf('N62', 0), 'fx': 'hum', 'dur': door - wf('N62', 0) + 1.0, 'gain_db': -26},
    {'t': wf('N64', 4), 'fx': 'sting', 'gain_db': -14},
    *[{'t': wf('N66', k), 'fx': 'tick', 'gain_db': -15} for k in (7, 9, 10)],
    {'t': buzz_light, 'fx': 'neon', 'dur': light_out - buzz_light, 'gain_db': -18},
    {'t': light_out, 'fx': 'breaker', 'gain_db': -10}, {'t': wf('N68', 7), 'fx': 'boom', 'gain_db': -12},
    {'t': door, 'fx': 'door', 'gain_db': -14}, {'t': dome, 'fx': 'riser', 'dur': 0.5, 'gain_db': -18},
    {'t': slam, 'fx': 'door', 'gain_db': -6},
    {'t': faces, 'fx': 'sting', 'gain_db': -9},
    {'t': wf('N72', 0), 'fx': 'whine', 'dur': dark - wf('N72', 0), 'gain_db': -24},
    *[{'t': wf('N75', k), 'fx': 'knock', 'gain_db': -14} for k in range(3)],
    # back seat
    {'t': roof, 'fx': 'thump', 'gain_db': -5},
    {'t': slide, 'fx': 'scrape', 'gain_db': -14},
    {'t': wf('N83', 0), 'fx': 'static', 'dur': we('N83c') - wf('N83', 0) + 0.3, 'gain_db': -26},
    {'t': now, 'fx': 'sting', 'gain_db': -13},
    {'t': wf('N84b', 0), 'fx': 'whine', 'dur': we('N88b') - wf('N84b', 0), 'gain_db': -30},
    {'t': wf('N93', 0), 'fx': 'boom', 'gain_db': -15},
    # home
    {'t': lock, 'fx': 'chirp', 'gain_db': -16},
    {'t': by_itself - 2 * F, 'fx': 'tick', 'gain_db': -9}, {'t': by_itself, 'fx': 'sting', 'gain_db': -10},
    {'t': wf('N101', 0), 'fx': 'whine', 'dur': end - wf('N101', 0), 'gain_db': -26},
]
cues = {'bed': {'type': 'liminal', 'waves': waves, 'gain_db': -9, 'cut': end, 'dips': [[dark - 0.05, dark + 1.4]]},
        'events': sorted(ev, key=lambda e: e['t'])}
json.dump(cues, open(sys.argv[2], 'w'), indent=1)
print('night road cues ->', sys.argv[2], len(ev), 'events, length', round(length, 2))
