#!/usr/bin/env python3
"""Continuous dread music bed, synthesised (no samples, no licence, no Content ID).

Spec from story-blueprint.md §2.6, measured off the reference short:
  drone   root + fifth + octaves (E1 41.2 Hz by default), L/R detuned so it beats slowly,
          soft-saturated so phone speakers still hear it, nothing above ~600 Hz
  air     brown noise band 60-400 Hz with a slow filter drift
  tension 0..1 curve: adds a minor-second rub and more air as it rises
  room    store hum (60/120/180 Hz + tube buzz) that spins down at `room_cut`
  dropout everything to silence for a beat, once ("you can hear yourself breathe")
  whine   thin ~1.45 kHz tone rising under the final dilemma, cut hard

dread_bed(...) returns a stereo float array (n, 2) at SR. `python3 dread_bed.py out.wav`
writes the 40 s audition sample.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000


def _lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def _bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def _curve(points, t):
    """Piecewise-linear curve [(time, value), ...] sampled at t."""
    if not points:
        return np.zeros_like(t)
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def dread_bed(length, root=41.2, tension=(), room_cut=None, room=True, dropouts=(), whine=None, seed=7):
    rng = np.random.default_rng(seed)
    n = int(length * SR); t = np.arange(n) / SR
    ten = _curve(list(tension), t)
    out = np.zeros((n, 2))

    # drone: root, fifth, octave, octave+fifth, 2 octaves; each with its own slow swell
    for k, (mult, amp) in enumerate([(1, 1.0), (1.5, 0.55), (2, 0.6), (3, 0.32), (4, 0.18)]):
        f = root * mult
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * rng.uniform(0.025, 0.09) * t + rng.uniform(0, 6.3))
        for ch, det in ((0, 1.0016), (1, 0.9984)):
            out[:, ch] += amp * lfo * np.sin(2 * np.pi * f * det * t + k)
    # minor-second rub one octave up (F over E): only audible as tension rises
    rub = root * 2 * 16 / 15
    for ch, det in ((0, 1.002), (1, 0.998)):
        out[:, ch] += 0.35 * ten * np.sin(2 * np.pi * rub * det * t)
    out = np.tanh(out * 0.9)                                   # harmonics for small speakers
    for ch in range(2):
        out[:, ch] = _lp(out[:, ch], 600, 4)

    # air: brown noise, two bands crossfaded by a slow drift
    for ch in range(2):
        b = np.cumsum(rng.standard_normal(n)); b -= _lp(b, 8)   # brown, DC removed
        b /= np.abs(b).max() + 1e-9
        lo, hi = _bp(b, 50, 160), _bp(b, 140, 420)
        drift = 0.5 + 0.5 * np.sin(2 * np.pi * 0.04 * t + ch)
        out[:, ch] += (0.9 * lo * (1 - drift) + 1.4 * hi * drift) * (0.5 + 0.9 * ten)

    g = np.minimum(1, t / 1.2)                                  # fade in
    for a, d in dropouts:                                       # 0.05 s out, 1.2 s back
        g *= 1 - np.clip((t - a) / 0.05, 0, 1) * np.clip((a + d + 1.2 - t) / 1.2, 0, 1)
    out *= g[:, None]

    if room:                                                    # store hum + tube buzz, spins down
        cut = room_cut if room_cut is not None else length
        speed = np.where(t < cut, 1.0, np.clip(1 - (t - cut) / 0.45, 0, 1))
        ph = 2 * np.pi * 60 * np.cumsum(speed) / SR
        hum = 0.5 * np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)
        buzz = _bp(np.sign(np.sin(2 * ph)) * 0.5 + rng.standard_normal(n) * 0.05, 900, 3200)
        lvl = np.where(t < cut, 1.0, speed ** 2) * np.minimum(1, t / 0.3)
        r = (0.32 * hum + 0.05 * buzz) * lvl
        out += np.stack([r, r * 0.92], 1)

    if whine:                                                   # (start, end): rises, hard cut
        a, b = whine
        w = np.clip((t - a) / (b - a), 0, 1) ** 1.6 * (t < b)
        f = 1450 + 6 * np.sin(2 * np.pi * 4.5 * t)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * w * 0.07
        out += np.stack([s, s * 0.8], 1)
    return out


def sample(path):
    """40 s audition: store on (0-12) -> power cut -> dread -> one dropout -> tension + whine -> hard cut."""
    L = 40.0
    x = dread_bed(L, room_cut=12.0, dropouts=[(18.5, 0.7)],
                  tension=[(0, 0.0), (12, 0.15), (22, 0.3), (36, 1.0), (38, 1.0)], whine=(28.0, 38.0))
    t = np.arange(len(x)) / SR
    x *= (t < 38.0)[:, None]                                    # end card: silence
    x /= np.abs(x).max() / 0.7
    import soundfile as sf
    sf.write(path, x, SR)


if __name__ == '__main__':
    sample(sys.argv[1] if len(sys.argv) > 1 else 'audio/bed_sample.wav')
