#!/usr/bin/env python3
"""Boxed-in hum bed: a heavy electrical hum that throbs, dies out, and comes back at a
slightly different pitch, in a small dead room, with a trace of static. Synthesised, no samples.

Shaped on the reference short (story-blueprint.md):
  root      E1 41.2 Hz family; other waves step to D#1/F1/F#1 and back
  bass      sub-octave + a detuned twin of the root, so the low end beats (~0.7 Hz throb)
  vibration 6-8 Hz buzz tremolo on the 2nd-5th harmonics (transformer rattle), saturated so
            phone speakers carry it
  waves     one swell every ~8-10 s (reference low band swells on a 7.7-9.9 s period)
  room      short, small and close (boxed in), not a big hall; narrow stereo
  static    faint crackle/hiss far under the hum, slightly up in the gaps

liminal_hum(length, waves=None) -> stereo float array at SR. waves = [(start, dur, hz)]; when
None they are generated from `seed`. `python3 liminal_hum.py out.wav` writes the sample.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000


def _lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def _hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def _bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def _room(x, secs=0.35, seed=2):
    """Small dead room: very short dark reflections, so the hum presses in instead of washing out."""
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros((len(x) + n - 1, 2))
    for ch in range(2):
        ir = _lp(r.standard_normal(n) * np.exp(-t / (secs / 6)), 500)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(x[:, ch], ir)
    return out[:len(x)]


ROOTS = [41.2, 38.9, 43.65, 41.2, 46.25, 41.5, 38.9, 41.2]   # E1, D#1, F1, E1, F#1, E1 sharp...


def auto_waves(length, seed=4):
    r = np.random.default_rng(seed)
    waves, at, k = [], 0.0, 0
    while at < length:
        dur = r.uniform(7.0, 9.5)
        waves.append((at, dur, ROOTS[k % len(ROOTS)] * r.uniform(0.997, 1.003)))
        at += dur + r.uniform(0.4, 1.4)                         # gap: room floor + static only
        k += 1
    return waves


def one_wave(dur, f0, r):
    """Swell in, throb, die out (amplitude down, pitch sags, buzz closes first)."""
    rise, fall = r.uniform(1.8, 2.8), r.uniform(1.6, 2.4)
    n = int(dur * SR); t = np.arange(n) / SR
    die = np.clip((t - (dur - fall)) / fall, 0, 1)            # 0 -> 1 over the die-out
    amp = np.minimum(1, t / rise) ** 1.5 * (1 - die) ** 2
    pitch = f0 * (1 + 0.002 * np.sin(2 * np.pi * 0.21 * t)) * (1 - 0.035 * die ** 2)
    rate = r.uniform(6.0, 8.0)                                  # rattle speed for this wave
    rattle = 1 - 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t)) ** 2
    out = np.zeros((n, 2))
    for ch, det in ((0, 1.0008), (1, 0.9992)):
        ph = 2 * np.pi * np.cumsum(pitch * det) / SR
        twin = 2 * np.pi * np.cumsum(pitch * det + 0.7) / SR    # beats against the root: slow throb
        sub = 0.9 * np.sin(0.5 * ph) + 1.0 * np.sin(ph) + 0.8 * np.sin(twin)
        buzz = sum(a * np.sin(h * ph + h) for h, a in ((2, 0.8), (3, 0.6), (4, 0.4), (5, 0.25)))
        buzz = np.tanh(2.2 * buzz) * rattle * (1 - 0.8 * die)   # gritty, vibrating, fades first
        out[:, ch] = np.tanh(0.9 * sub) + 0.55 * buzz
    return _lp(out, 300, 4) * amp[:, None]


def liminal_hum(length, waves=None, seed=4, static_db=-34, floor_db=-14):
    r = np.random.default_rng(seed + 100)
    n = int(length * SR); t = np.arange(n) / SR
    waves = waves or auto_waves(length, seed)
    hum = np.zeros((n, 2)); present = np.zeros(n)
    for at, dur, f0 in waves:
        w = one_wave(dur, f0, r)
        i = int(at * SR); j = min(n, i + len(w))
        hum[i:j] += w[:j - i]
        present[i:j] = np.maximum(present[i:j], np.abs(w[:j - i, 0]))
    hum = 0.85 * hum + 0.35 * _room(hum)
    present = _lp(present, 2) / (present.max() + 1e-9)

    # room floor: the box never goes fully quiet - a low 28-90 Hz rumble between waves
    floor = _bp(r.standard_normal((n, 2)), 28, 90, 3)
    floor[:, 1] = 0.7 * floor[:, 1] + 0.3 * floor[:, 0]
    # static: faint crackle + a little high hiss, slightly up in the gaps
    crack = np.zeros((n, 2))
    for i in np.flatnonzero(r.random(n) < 7 / SR):              # ~7 crackles a second
        k = int(r.integers(8, 40)); a = r.uniform(0.3, 1.0) * r.choice([-1, 1])
        m = min(k, n - i)
        crack[i:i + m] += a * np.exp(-np.arange(m) / (k / 4))[:, None]
    static = _bp(crack, 1000, 6000) + 0.15 * _bp(r.standard_normal((n, 2)), 3000, 8000)
    static *= (1 + 1.0 * (1 - np.clip(present * 3, 0, 1)))[:, None]

    rms = lambda x: np.sqrt(np.mean(x ** 2)) + 1e-9
    out = hum / rms(hum) * 0.25
    out += floor / rms(floor) * 0.25 * 10 ** (floor_db / 20)
    out += static / rms(static) * 0.25 * 10 ** (static_db / 20)
    out = _hp(out, 18)                                           # keep DC/infra out
    mid, side = (out[:, 0] + out[:, 1]) / 2, (out[:, 0] - out[:, 1]) / 2
    side *= 0.2                                                  # narrow: it sits right on you
    out = np.stack([mid + side, mid - side], 1)
    return out * np.minimum(1, t / 0.8)[:, None]


def sample(path, length=45.0):
    x = liminal_hum(length)
    x /= np.abs(x).max() / 0.7
    import soundfile as sf
    sf.write(path, x, SR)


if __name__ == '__main__':
    sample(sys.argv[1] if len(sys.argv) > 1 else 'audio/hum_raw.wav')
