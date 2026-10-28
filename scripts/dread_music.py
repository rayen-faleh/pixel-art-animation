#!/usr/bin/env python3
"""Eerie melodic background score, synthesised (no samples, no licence, no Content ID).

Layers (all in one key, E minor with Phrygian/borrowed colour):
  pad        slow-attack detuned triangle chords, low-passed, one chord per bar
  musicbox   sparse broken-music-box lullaby: bell tines with slow pitch wobble, long reverb
  drone      E1 + fifth underneath everything (quiet; the floor of the old bed)
  heartbeat  lub-dub thumps on the beat in 'tension' sections
  strings    high E/F/B cluster with tremolo, fading in through 'tension' sections
  swell      reversed noise rise into a section, cut dead on the downbeat

A score is a list of sections; each section is a list of bars (chord, melody) plus flags.
render(score) -> stereo float array at SR. `python3 dread_music.py out.wav` writes the sample.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 66
BAR = 4 * 60 / BPM                     # 3.636 s
STEP = BAR / 8                         # melody is written in eighth notes
rng = np.random.default_rng(5)

CHORDS = {                             # MIDI voicings, kept low so the voice sits above them
    'Em': [40, 47, 52, 55], 'C': [36, 43, 47, 52], 'Am': [33, 45, 48, 52], 'B': [35, 42, 47, 51],
    'F': [41, 48, 53, 57], 'Cm': [36, 43, 48, 51], 'Em/F': [40, 47, 53, 55],
}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def _lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def _bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def _reverb(x, secs=3.2, seed=1):
    """Stereo reverb: convolution with decaying, low-passed noise (different per channel)."""
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros((len(x) + n - 1, 2))
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-t / (secs / 5))
        ir = _lp(ir, 3500); ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(x[:, ch], ir)
    return out[:len(x)]


def _add(buf, sig, at, pan=0.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if i >= len(buf) or j <= i:
        return
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    buf[i:j, 0] += sig[:j - i] * l; buf[i:j, 1] += sig[:j - i] * r


def tri(f, t, n_harm=9):
    out = np.zeros_like(t)
    for k in range(n_harm):
        h = 2 * k + 1
        if h * f > 4000:
            break
        out += ((-1) ** k) * np.sin(2 * np.pi * h * f * t) / h ** 2
    return out * 8 / np.pi ** 2


def pad_chord(notes, dur):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 1.4) * np.clip((dur + 2.5 - t) / 2.5, 0, 1)
    s = np.zeros(n)
    for m in notes:
        for det in (-0.06, 0.0, 0.07):                     # semitone fractions: chorus-y
            s += tri(hz(m + det), t + rng.uniform(0, 0.01))
    return _lp(s * env / (len(notes) * 3), 900)


def tine(m, dur=2.2):
    """Music-box note: bright attack, inharmonic overtone, slow wow so it sounds worn out."""
    n = int(dur * SR); t = np.arange(n) / SR
    wow = 1 + 0.0045 * np.sin(2 * np.pi * 0.7 * t + rng.uniform(0, 6))
    ph = 2 * np.pi * hz(m) * np.cumsum(wow) / SR
    s = np.sin(ph) + 0.28 * np.sin(2 * ph) * np.exp(-t / 0.25) + 0.12 * np.sin(5.43 * ph) * np.exp(-t / 0.08)
    return s * np.minimum(1, t / 0.003) * np.exp(-t / 0.75)


def heartbeat():
    out = []
    for amp, f0 in ((1.0, 62), (0.7, 55)):
        n = int(0.22 * SR); t = np.arange(n) / SR
        f = f0 * (1 + 0.6 * np.exp(-t / 0.03))
        out += [amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07), np.zeros(int(0.12 * SR))]
    return np.concatenate(out)


def swell(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = _bp(rng.standard_normal(n), 300, 2400) * (t / dur) ** 3
    return x / (np.abs(x).max() + 1e-9)


def render(score, length, dropouts=(), cut=None, button=None):
    """score: list of sections {'bars': [(chord, [8 eighth-note MIDI or None])...], 'pad': bool,
    'tension': (from, to) 0..1, 'swell_in': bool}. dropouts: [(t, dur[, back])]; cut: hard stop time;
    button: (t, midi) single music-box note left ringing after the cut."""
    n = int(length * SR); t = np.arange(n) / SR
    pad = np.zeros((n, 2)); box = np.zeros((n, 2)); low = np.zeros((n, 2)); hit = np.zeros((n, 2))
    ten = np.zeros(n)
    at = 0.0; k = 0
    for sec in score:
        if sec.get('swell_in'):
            _add(hit, swell() * 0.35, at - 2.0)
        t0, t1 = sec.get('tension', (0, 0))
        nb = len(sec['bars'])
        for b, (chord, mel) in enumerate(sec['bars']):
            if sec.get('pad', True) and chord:
                _add(pad, pad_chord(CHORDS[chord], BAR), at)
            for s, m in enumerate(mel):
                if m is not None:
                    _add(box, tine(m), at + s * STEP + rng.uniform(-0.012, 0.012), pan=0.35 * (-1) ** k)
                    k += 1
            lv = t0 + (t1 - t0) * b / max(1, nb - 1)
            i, j = int(at * SR), int((at + BAR) * SR)
            ten[i:j] = np.linspace(t0 + (t1 - t0) * b / nb, t0 + (t1 - t0) * (b + 1) / nb, j - i)[:len(ten[i:j])]
            if lv > 0.3:
                for beat in range(4):
                    _add(hit, heartbeat() * (0.5 + 0.5 * lv), at + beat * BAR / 4)
            at += BAR
    # drone floor
    for mult, amp in ((1, 1.0), (1.5, 0.45), (2, 0.4)):
        for ch, det in ((0, 1.0015), (1, 0.9985)):
            low[:, ch] += amp * np.sin(2 * np.pi * hz(28) * mult * det * t)
    low = np.tanh(low) * 0.5
    # strings cluster, tremolo, rises with tension
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)
    st = sum(np.sin(2 * np.pi * hz(m) * t + 0.004 * np.sin(2 * np.pi * 5.5 * t) * hz(m)) for m in (76, 77, 83))
    strings = np.stack([st, st], 1) * (trem * ten ** 1.5)[:, None] * 0.05

    mix = 1.4 * pad + 0.42 * _reverb(box) + 0.16 * box + 0.33 * low + 0.6 * hit + _reverb(strings, 2.0, 3) * 0.8 + strings * 0.4
    g = np.minimum(1, t / 1.5)
    for a, d, *back in dropouts:                           # 0.05 s out, back over `back` s (default 1.5)
        bk = back[0] if back else 1.5
        g *= 1 - np.clip((t - a) / 0.05, 0, 1) * np.clip((a + d + bk - t) / bk, 0, 1)
    if cut is not None:
        g *= t < cut
    mix *= g[:, None]
    if button:
        bt, bm = button
        one = np.zeros((n, 2)); _add(one, tine(bm, 4.0), bt)
        mix += 0.5 * _reverb(one, 4.0, 9) + 0.2 * one
    return mix


R = None
SAMPLE = [
    {'bars': [('Em', [71, 76, 79, 78, 76, R, 71, R]),
              ('C', [72, 71, 70, 71, R, R, R, R]),
              ('Am', [69, 72, 76, 74, 72, R, 69, R]),
              ('B', [70, R, 71, R, 63, R, R, R])]},
    {'swell_in': True, 'tension': (0.0, 0.25),
     'bars': [('Em', [83, 79, 76, 79, 78, R, R, R]),
              ('F', [77, 76, 77, 76, R, R, 71, R])]},
    {'pad': False, 'bars': [(None, [75, 72, 67, R, 75, 74, R, R])]},          # after the dropout: box alone
    {'tension': (0.35, 1.0),
     'bars': [('Em', [83, R, 82, R, 81, R, 80, R]),
              ('Em/F', [79, R, 78, R, 77, R, 76, R]),
              ('Em', [R] * 8),
              ('Em/F', [76, 77, 76, 77, 76, 77, R, R])]},
]


def sample(path):
    L = 11 * BAR + 4.5
    drop = 6 * BAR                                         # start of the box-alone bar
    x = render(SAMPLE, L, dropouts=[(drop - 0.85, 0.85, 0.03)], cut=11 * BAR, button=(11 * BAR + 0.3, 71))
    x /= np.abs(x).max() / 0.7
    import soundfile as sf
    sf.write(path, x, SR)


if __name__ == '__main__':
    sample(sys.argv[1] if len(sys.argv) > 1 else 'audio/music_raw.wav')
