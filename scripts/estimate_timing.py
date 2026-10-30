#!/usr/bin/env python3
"""Provisional timing.json from a script (no audio): ~2.35 words/s + each line's pause. Lets the film be
built and previewed before narration exists; same shape as chatterbox_narrate.py output (words carry
`line`, `t`, `s`, `e`, `key`, `brk`). Replace with the real timing as soon as the narration is generated.

Usage: python3 scripts/estimate_timing.py keep-pretending.script.json src/kp-timing.json
"""
import json, re, sys

WPS = 2.35
LEAD = 0.12


def parse_line(text):
    words = []
    for tok in text.split():
        brk = tok.endswith('/'); tok = tok.rstrip('/')
        key = None
        m = re.search(r'\*([yrg])$', tok)
        if m:
            key, tok = m.group(1), tok[:m.start()]
        m = re.fullmatch(r'\[(.+?)=(.+?)\](.*)', tok)
        shown, say = (m.group(1).replace('_', ' ') + m.group(3), m.group(2).replace('_', ' ') + m.group(3)) if m else (tok, tok)
        w = {'t': shown, 'n': max(1, len(say.split()))}
        if key: w['key'] = key
        if brk: w['brk'] = True
        words.append(w)
    return words


def main(src, dst):
    script = json.load(open(src))
    t = LEAD; words = []; lines = []
    for ln in script['lines']:
        s0 = t
        for w in parse_line(ln['text']):
            d = w.pop('n') / WPS
            words.append({**w, 's': round(t, 3), 'e': round(t + d * 0.92, 3), 'line': ln['id']})
            t += d
        lines.append({'id': ln['id'], 's': round(s0, 3), 'e': round(t, 3), 'fx': ln.get('fx')})
        t += ln.get('pause', 0.3)
    json.dump({'provenance': 'ESTIMATED (scripts/estimate_timing.py), not real narration', 'units': 'seconds',
               'duration': round(t, 3), 'lines': lines, 'words': words}, open(dst, 'w'), indent=1)
    print(f'{len(words)} words, {t / 60:.1f} min (estimated) -> {dst}')


if __name__ == '__main__':
    main(*sys.argv[1:3])
