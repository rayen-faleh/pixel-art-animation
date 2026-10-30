#!/usr/bin/env python3
"""Synthesised horror-short sound kit + mixer (all original, no samples).

Usage: python3 sfx_mix.py narration.wav cues.json out.wav [--length 15.0]
cues.json: {"bed": {"gain_db": -22, "swell": [[10.0, 3.0]], "cut": 13.7},
            "events": [{"t": 2.85, "fx": "buzz", "gain_db": -10}, ...]}
fx: buzz, alert, knock, sting, boom, riser, pop, tick; with optional "dur": hum, rattle, neon, static, shutter, bass, breath, skitter; plus clunk, bang;
     printer, scratch, belt (dur), beep, breaker
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


def _fade(x, a=0.05, r=0.08):
    n = len(x); e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr))
    return x * e


def fx_hum(dur=4.0):
    """Fluorescent tube hum: 120 Hz + harmonics, slight wobble."""
    n = int(dur * SR); t = np.arange(n) / SR
    w = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((120, 0.6), (240, 0.3), (360, 0.15), (480, 0.08)))
    return _fade(w * (1 + 0.08 * np.sin(2 * np.pi * 0.7 * t)), 0.3, 0.02)


def fx_rattle(dur=3.0):
    """Ice machine: low motor + irregular clatter."""
    n = int(dur * SR); t = np.arange(n) / SR
    motor = 0.5 * np.sin(2 * np.pi * 58 * t) + 0.2 * np.sign(np.sin(2 * np.pi * 29 * t))
    clat = np.zeros(n)
    for k in rng.integers(0, n - 3000, int(dur * 9)):
        clat[k:k + 2400] += lowpass(rng.standard_normal(2400), 3000) * env(2400, 0.0005, 0.01)
    return _fade(lowpass(motor, 400) + clat * 0.6, 0.2, 0.02)


def fx_neon(dur=3.0):
    """Sign buzz: gated 100 Hz square, crackly."""
    n = int(dur * SR); t = np.arange(n) / SR
    w = np.sign(np.sin(2 * np.pi * 100 * t)) * (0.6 + 0.4 * (rng.random(n) > 0.002))
    return _fade(lowpass(w, 1800) * 0.5, 0.2, 0.02)


def fx_static(dur=0.6):
    n = int(dur * SR)
    return _fade(lowpass(rng.standard_normal(n), 3500) * 0.7 * (0.6 + 0.4 * np.sin(np.arange(n) / SR * 2 * np.pi * 9)), 0.01, 0.08)


def fx_shutter(dur=2.4):
    """Roller shutter motor: whining grind + slat rattle."""
    n = int(dur * SR); t = np.arange(n) / SR
    whine = np.sin(2 * np.pi * (180 + 40 * t / dur) * t) * 0.4 + np.sign(np.sin(2 * np.pi * 90 * t)) * 0.2
    slats = lowpass(rng.standard_normal(n), 2500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t))) * 0.5
    return _fade(lowpass(whine, 1500) + slats, 0.05, 0.03)


def fx_clunk():
    n = int(0.6 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (90 - 40 * t) * t) * env(n, 0.001, 0.12) + lowpass(rng.standard_normal(n), 900) * env(n, 0.001, 0.05)


def fx_bass(dur=6.0):
    """Car stereo through a closed car: muffled four-on-the-floor kick + bassline."""
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n); beat = 60 / 112
    for k in range(int(dur / beat)):
        i = int(k * beat * SR); m = min(n - i, int(0.25 * SR)); tt = np.arange(m) / SR
        out[i:i + m] += np.sin(2 * np.pi * (75 - 35 * tt / 0.25) * tt) * np.exp(-tt / 0.08)
    notes = [41.2, 41.2, 49.0, 36.7]
    for k in range(int(dur / (beat * 2))):
        i = int(k * beat * 2 * SR); m = min(n - i, int(beat * 2 * SR)); tt = np.arange(m) / SR
        out[i:i + m] += 0.5 * np.sign(np.sin(2 * np.pi * notes[k % 4] * tt)) * np.exp(-tt / 0.6)
    return _fade(lowpass(out, 220), 0.4, 0.3)


def fx_bang():
    """Body hitting a roller shutter: low thud + metallic ring."""
    n = int(1.4 * SR); t = np.arange(n) / SR
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((213, 0.5), (347, 0.35), (523, 0.25), (911, 0.12))) / 3
    return ring * 0.6 + fx_boom(1.4) * 0.7 + lowpass(rng.standard_normal(n), 5000) * env(n, 0.0005, 0.03) * 0.8


def fx_breath(dur=3.0):
    """Fast panting: filtered noise bursts, ~2.2 per second."""
    n = int(dur * SR); t = np.arange(n) / SR
    gate = np.clip(np.sin(2 * np.pi * 2.2 * t), 0, 1) ** 2 + 0.6 * np.clip(-np.sin(2 * np.pi * 2.2 * t), 0, 1) ** 3
    return _fade(lowpass(rng.standard_normal(n), 1400) * gate * 0.7, 0.1, 0.3)


def fx_skitter(dur=1.2):
    n = int(dur * SR); out = np.zeros(n)
    for k in np.sort(rng.integers(0, n - 800, int(dur * 22))):
        out[k:k + 700] += lowpass(rng.standard_normal(700), 2200) * env(700, 0.0003, 0.008)
    return _fade(out, 0.05, 0.1)



def fx_printer(dur=0.9):
    """Thermal receipt printer: stepper whine pulsing per printed line + paper hiss."""
    n = int(dur * SR); t = np.arange(n) / SR
    step = np.sign(np.sin(2 * np.pi * 820 * t)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 11 * t)))
    hiss = lowpass(rng.standard_normal(n), 6000) * 0.25
    return _fade(lowpass(step, 3200) * 0.35 + hiss, 0.01, 0.05)


def fx_scratch(dur=0.8):
    """Pen on paper / coin on a scratch card: bursts of filtered noise."""
    n = int(dur * SR); t = np.arange(n) / SR
    g = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * t + 3 * np.sin(2 * np.pi * 2.3 * t))
    return _fade(lowpass(rng.standard_normal(n), 5000) * g * 0.6, 0.01, 0.05)


def fx_beep():
    n = int(0.11 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1850 * t) * 0.5 * np.minimum(1, (0.11 - t) / 0.01) * np.minimum(1, t / 0.003)


def fx_belt(dur=2.0):
    """Conveyor belt motor: low rumble with roller ticks."""
    n = int(dur * SR); t = np.arange(n) / SR
    hum = np.sin(2 * np.pi * 48 * t) * 0.5 + np.sin(2 * np.pi * 96 * t) * 0.2
    ticks = lowpass(rng.standard_normal(n), 2000) * (np.sin(2 * np.pi * 6 * t) > 0.95) * 0.5
    return _fade(lowpass(hum, 300) + ticks, 0.15, 0.1)


def fx_breaker():
    """Mains breaker: hard clack plus a dying hum tail."""
    n = int(0.9 * SR); t = np.arange(n) / SR
    clack = lowpass(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.02)
    die = np.sin(2 * np.pi * (120 - 60 * t) * t) * np.exp(-t * 5) * 0.4
    return clack + die


# ---- AFTER HOURS ----
def fx_ring():
    """Phone ringtone: two-note warble burst (~1 s), generic."""
    n = int(1.0 * SR); t = np.arange(n) / SR
    f = np.where((t * 12).astype(int) % 2 == 0, 1320, 1050)
    w = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t < 0.8)
    return _fade(w * 0.5, 0.005, 0.03)


def fx_keys():
    """Key ring hitting tile: a few bright metallic tinks."""
    out = np.zeros(int(0.7 * SR))
    for k, (dt, f0) in enumerate(((0, 3100), (0.05, 4200), (0.11, 2700), (0.19, 3600), (0.3, 3900))):
        n = int(0.35 * SR); t = np.arange(n) / SR
        tink = (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 1.51 * t)) * np.exp(-t / 0.06) * (0.9 - k * 0.12)
        i = int(dt * SR); out[i:i + n] += tink[:len(out) - i]
    return out * 0.5


def fx_steps(dur=2.0):
    """Muffled footsteps on the floor above."""
    n = int(dur * SR); out = np.zeros(n)
    for k in range(int(dur / 0.55)):
        m = int(0.12 * SR); t = np.arange(m) / SR
        s = np.sin(2 * np.pi * (70 - 30 * t / 0.12) * t) * np.exp(-t / 0.03)
        i = int((k * 0.55 + 0.03 * np.sin(k)) * SR); out[i:i + m] += s[:n - i]
    return lowpass(out, 300)


def fx_locker():
    """Distant locker door slam: metal clang through the building."""
    n = int(1.6 * SR); t = np.arange(n) / SR
    clang = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((310, 0.35), (467, 0.25), (692, 0.18), (1180, 0.1)))
    hit = lowpass(rng.standard_normal(n), 1500) * env(n, 0.001, 0.03)
    return lowpass(clang * 0.3 + hit, 1600)


def fx_whine(dur=5.0):
    """Thin tension tone rising under the final beat (cut hard by the next event/end)."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 1400 + 120 * t / dur + 5 * np.sin(2 * np.pi * 4.5 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 1.4 * 0.3


# ---- NIGHT ROAD (scipy filters: these run for minutes) ----
def _sos(x, kind, f, order=2):
    from scipy.signal import butter, sosfilt
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)


def fx_engine(dur=10.0):
    """Inside a car at speed: low road rumble, engine drone, faint tyre hiss."""
    n = int(dur * SR); t = np.arange(n) / SR
    rumble = _sos(np.cumsum(rng.standard_normal(n)) * 0.02, 'band', [22, 140]) * 3
    drone = (np.sin(2 * np.pi * 38 * t + 0.3 * np.sin(2 * np.pi * 0.21 * t)) * 0.35 + np.sin(2 * np.pi * 76.4 * t) * 0.15)
    hiss = _sos(rng.standard_normal(n), 'band', [500, 1400]) * 0.05
    return _fade((rumble + drone + hiss) * (1 + 0.1 * np.sin(2 * np.pi * 0.13 * t)), 0.8, 0.6)


def fx_whoosh(dur=2.6):
    """Oncoming truck passing: noise swell with a falling pitch at the pass."""
    n = int(dur * SR); t = np.arange(n) / SR
    e = np.exp(-((t - dur * 0.62) / (dur * 0.2)) ** 2)
    noise = _sos(rng.standard_normal(n), 'band', [120, 1800]) * e
    f = np.where(t < dur * 0.62, 95, 72)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * e * 0.5
    return noise + tone


def fx_chime():
    out = np.zeros(int(1.4 * SR))
    for k, f0 in enumerate((880, 659)):
        m = int(1.0 * SR); t = np.arange(m) / SR
        b = (np.sin(2 * np.pi * f0 * t) + 0.3 * np.sin(2 * np.pi * f0 * 2.01 * t)) * np.exp(-t / 0.3) * 0.5
        i = int(k * 0.32 * SR); out[i:i + m] += b
    return out


def fx_chirp():
    return np.concatenate([fx_beep(), np.zeros(int(0.08 * SR)), fx_beep()]) * 0.8


def fx_door():
    n = int(0.9 * SR); t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (75 - 30 * t) * t) * env(n, 0.001, 0.12)
    latch = _sos(rng.standard_normal(n), 'band', [900, 4000]) * env(n, 0.0005, 0.02) * 0.6
    return thud + latch


def fx_thump():
    n = int(1.2 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (60 - 25 * t) * t) * env(n, 0.002, 0.18)
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.12) for f in (210, 333, 517)) * 0.12
    return body + metal + _sos(rng.standard_normal(n), 'low', 600) * env(n, 0.001, 0.05) * 0.5


def fx_scrape(dur=1.4):
    """Something sliding down glass: squeaky drag."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 700 + 300 * np.sin(2 * np.pi * 3.2 * t) - 200 * t / dur
    sq = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * (rng.random(n) > 0.3))
    return _fade(_sos(sq, 'band', [400, 2500]) * 0.35, 0.05, 0.2)


FX = {'hum': fx_hum, 'rattle': fx_rattle, 'neon': fx_neon, 'static': fx_static, 'shutter': fx_shutter, 'clunk': fx_clunk,
      'bass': fx_bass, 'bang': fx_bang, 'breath': fx_breath, 'skitter': fx_skitter,
      'buzz': fx_buzz, 'alert': fx_alert, 'knock': fx_knock, 'sting': fx_sting, 'boom': fx_boom,
      'riser': fx_riser, 'pop': fx_pop, 'tick': fx_tick,
      'printer': fx_printer, 'scratch': fx_scratch, 'beep': fx_beep, 'belt': fx_belt, 'breaker': fx_breaker,
      'ring': fx_ring, 'keys': fx_keys, 'steps': fx_steps, 'locker': fx_locker, 'whine': fx_whine,
      'engine': fx_engine, 'whoosh': fx_whoosh, 'chime': fx_chime, 'chirp': fx_chirp, 'door': fx_door, 'thump': fx_thump, 'scrape': fx_scrape}



# ---- KEEP PRETENDING ----
def fx_purr(dur=3.0, rate=25.0, breath=0.55):
    """Cat purr: a ~25 Hz pulse train through a low body resonance, louder on the in/out breath."""
    n = int(dur * SR); t = np.arange(n) / SR
    pulses = (np.sin(2 * np.pi * rate * t) > 0.6).astype(float) * rng.uniform(0.7, 1.0, n)
    body = lowpass(pulses + lowpass(rng.standard_normal(n), 400) * 0.25, 600)
    br = 0.55 + 0.45 * np.abs(np.sin(np.pi * breath * t))
    return _fade(body * br * 0.9, 0.3, 0.4)


def fx_purr_wrong(dur=4.0):
    """The purr that's wrong: too slow and too even, like someone saying 'purr'."""
    n = int(dur * SR); t = np.arange(n) / SR
    pulses = (np.sin(2 * np.pi * 11 * t) > 0.2).astype(float)
    voiced = np.sin(2 * np.pi * 98 * t) * 0.35 + np.sin(2 * np.pi * 196 * t) * 0.15
    return _fade(lowpass(pulses * (0.6 + voiced), 700) * 0.9, 0.4, 0.5)


def fx_creak(dur=1.4):
    """Door hinge creak: a stick-slip buzz whose pitch wanders down."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 260 - 90 * t / dur + 25 * np.sin(2 * np.pi * 1.3 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    grain = (rng.random(n) < 0.35).astype(float)
    x = _sos(saw * grain, 'band', [400, 2600]) * (0.5 + 0.5 * np.sin(np.pi * t / dur))
    return _fade(x * 0.6, 0.05, 0.15)


def fx_motor(dur=1.6):
    """Pet-cam pan motor: a thin servo whine with gear ripple."""
    n = int(dur * SR); t = np.arange(n) / SR
    f = 820 + 40 * np.sin(2 * np.pi * 0.7 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t)))
    return _fade(_sos(x, 'band', [500, 3000]) * 0.25, 0.08, 0.12)


def fx_meow(dur=0.9):
    """Distant shelter cry: a voiced vowel sweep (no samples)."""
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = 480 + 260 * np.sin(np.pi * t / dur) * (1 + 0.04 * rng.standard_normal())
    src = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)) * 0.5
    x = _sos(src, 'band', [700, 2400]) * np.sin(np.pi * t / dur) ** 1.5
    return x * 0.35


def fx_pad(dur=0.5):
    """One soft footfall on carpet/wood (pair it: four paws = quick pairs, two legs = slow singles)."""
    n = int(0.16 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (110 - 50 * t / 0.16) * t) * np.exp(-t / 0.035) + lowpass(rng.standard_normal(n), 900) * np.exp(-t / 0.02) * 0.4
    out = np.zeros(int(dur * SR)); out[:n] += s
    return lowpass(out, 700)


FX.update({'purr': fx_purr, 'purr_wrong': fx_purr_wrong, 'creak': fx_creak, 'motor': fx_motor, 'meow': fx_meow, 'pad': fx_pad})

def bed(length, swells, cut, dips=()):
    n = int(length * SR); t = np.arange(n) / SR
    d = 0.55 * np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 55.7 * t) + 0.25 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.2 * t))
    d += lowpass(rng.standard_normal(n), 220) * 0.6
    g = np.minimum(1, t / 0.8)
    for at, dur in swells:
        g *= 1 + 1.2 * np.clip(1 - np.abs(t - at) / dur, 0, 1)
    for a, b in dips:  # silence the bed between a and b (0.08 s in, 0.6 s back)
        g *= 1 - np.clip((t - a) / 0.08, 0, 1) * np.clip((b + 0.6 - t) / 0.6, 0, 1)
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
    if b and b.get('type') == 'liminal':  # boxed-in hum bed (scripts/liminal_hum.py), waves on story anchors
        import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from liminal_hum import liminal_hum
        hb = liminal_hum(L, waves=[tuple(w) for w in b['waves']]).mean(1)
        if b.get('cut') is not None:
            hb *= np.clip(1 - (np.arange(len(hb)) / SR - b['cut']) / 0.05, 0, 1)
        tt = np.arange(len(hb)) / SR
        for a0, b0 in b.get('dips', []):  # full dropout: 0.08 s out, 0.6 s back
            hb *= 1 - np.clip((tt - a0) / 0.08, 0, 1) * np.clip((b0 + 0.6 - tt) / 0.6, 0, 1)
        mix += hb[:len(mix)] / (np.sqrt(np.mean(hb ** 2)) + 1e-9) * 0.25 * db(b.get('gain_db', -6))
    elif b:
        mix += bed(L, b.get('swell', []), b.get('cut'), b.get('dips', [])) * db(b.get('gain_db', -22))
    for ev in cues.get('events', []):
        s = (FX[ev['fx']](ev['dur']) if 'dur' in ev else FX[ev['fx']]()) * db(ev.get('gain_db', -10))
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
