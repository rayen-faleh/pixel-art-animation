#!/usr/bin/env python3
"""Synthesised horror-short sound kit + mixer (all original, no samples).

Usage: python3 sfx_mix.py narration.wav cues.json out.wav [--length 15.0]
cues.json: {"bed": {"gain_db": -22, "swell": [[10.0, 3.0]], "cut": 13.7},
            "events": [{"t": 2.85, "fx": "buzz", "gain_db": -10}, ...]}
fx: buzz, alert, knock, sting, boom, riser, pop, tick
"""
import argparse, json
import numpy as np, soundfile as sf

SR = 48000
rng = np.random.default_rng(11)


def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
    return e


def lowpass(x, cutoff):
    # one-pole low-pass, deterministic
    a = np.exp(-2 * np.pi * cutoff / SR); y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y


def fx_buzz():
    out = []
    for _ in range(2):
        n = int(0.28 * SR); t = np.arange(n) / SR
        w = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.6 + np.sin(2 * np.pi * 75 * t) * 0.4
        w = lowpass(w, 900) * np.minimum(1, t / 0.01) * np.minimum(1, (0.28 - t) / 0.02)
        out += [w, np.zeros(int(0.12 * SR))]
    return np.concatenate(out)


def fx_alert():
    out = []
    for k in range(3):
        n = int(0.32 * SR); t = np.arange(n) / SR
        w = 0.5 * np.sin(2 * np.pi * 853 * t) + 0.5 * np.sin(2 * np.pi * 960 * t)
        out += [w * np.minimum(1, t / 0.01) * np.minimum(1, (0.32 - t) / 0.02), np.zeros(int(0.08 * SR))]
    return np.concatenate(out)


def fx_knock():
    n = int(0.25 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (140 - 60 * t / 0.25) * t) * env(n, 0.001, 0.05)
    click = lowpass(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.012) * 0.8
    return body + click


def fx_boom(dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (55 - 20 * t / dur) * t) * env(n, 0.004, 0.6) + lowpass(rng.standard_normal(n), 300) * env(n, 0.002, 0.15) * 0.6


def fx_sting(dur=1.8):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((311.1, 0), (329.6, 1), (466.2, 2), (493.9, .5)))
    tone = lowpass(s / 4, 2500) * env(n, 0.01, 0.7)
    return tone * 0.7 + fx_boom(dur) * 0.8


def fx_riser(dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = lowpass(rng.standard_normal(n), 1200) * (t / dur) ** 2
    return noise * 0.6 + np.sin(2 * np.pi * (200 + 600 * (t / dur) ** 2) * t) * (t / dur) ** 3 * 0.3


def fx_pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (520 + 380 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.04)


def fx_tick():
    n = int(0.05 * SR)
    return lowpass(rng.standard_normal(n), 4000) * env(n, 0.0003, 0.006)


FX = {'buzz': fx_buzz, 'alert': fx_alert, 'knock': fx_knock, 'sting': fx_sting, 'boom': fx_boom,
      'riser': fx_riser, 'pop': fx_pop, 'tick': fx_tick}


def bed(length, swells, cut):
    n = int(length * SR); t = np.arange(n) / SR
    d = 0.55 * np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 55.7 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.2 * t))
    d += lowpass(rng.standard_normal(n), 220) * 0.6
    g = np.minimum(1, t / 0.8)
    for at, dur in swells:
        g *= 1 + 1.2 * np.clip(1 - np.abs(t - at) / dur, 0, 1)
    if cut is not None:
        g *= np.clip(1 - (t - cut) / 0.25, 0, 1)
    return d * g


def db(x):
    return 10 ** (x / 20)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('narration'); ap.add_argument('cues'); ap.add_argument('out')
    ap.add_argument('--length', type=float, default=None)
    a = ap.parse_args()
    voice, vsr = sf.read(a.narration)
    if voice.ndim > 1: voice = voice.mean(1)
    if vsr != SR:  # linear resample (narration is speech; fine for a mix)
        idx = np.arange(int(len(voice) * SR / vsr)) * vsr / SR
        voice = np.interp(idx, np.arange(len(voice)), voice)
    cues = json.load(open(a.cues))
    L = a.length or len(voice) / SR + 0.5
    mix = np.zeros(int(L * SR))
    mix[:len(voice)] += voice[:len(mix)]
    b = cues.get('bed')
    if b:
        mix += bed(L, b.get('swell', []), b.get('cut')) * db(b.get('gain_db', -22))
    for ev in cues.get('events', []):
        s = FX[ev['fx']]() * db(ev.get('gain_db', -10))
        i = int(ev['t'] * SR); j = min(len(mix), i + len(s))
        if i < len(mix):
            mix[i:j] += s[:j - i]
    # gentle limiter: soft clip above -1 dBFS
    lim = db(-1.0)
    mix = np.where(np.abs(mix) > lim * 0.8, np.sign(mix) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(mix) - lim * 0.8) / (lim * 0.2))), mix)
    sf.write(a.out, np.stack([mix, mix], 1).astype(np.float32), SR)
    print(f'mixed {L:.2f}s -> {a.out}')


if __name__ == '__main__':
    main()
