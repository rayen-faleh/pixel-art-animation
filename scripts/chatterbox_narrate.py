#!/usr/bin/env python3
"""Chatterbox narration + faster-whisper word alignment for script.json.

Each script line is one Chatterbox take. Every take is transcribed and checked
against the script: a take that does not match (similarity < MIN_SIM) is
regenerated with a new seed. Takes are cached by text + voice + settings + seed.
Alignment maps the script's words onto whisper's word timestamps with a sequence
diff. Words whisper heard differently get their time span shared out and are
flagged `approx`. Lines with fx (radio / muffled) are filtered AFTER alignment.

Usage (needs a python with chatterbox-tts + faster-whisper, e.g. clide-studio/.venv):
  python scripts/chatterbox_narrate.py script.json audio/raw [--ref voice.wav]
      [--exaggeration 0.55] [--cfg 0.4] [--lines L01,L02] [--tag name]
Writes <out>/narration.wav (24 kHz mono, fx applied), <out>/narration_dry.wav,
<out>/timing.json.
"""
import argparse, difflib, hashlib, json, re, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

SR = 24000
LEAD_S = 0.12
MIN_SIM = 0.86
FX = {
    'radio': 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4dB,'
             'aecho=0.7:0.45:35|70:0.25|0.12',
    'muffled': 'lowpass=f=1100,highpass=f=120,aecho=0.8:0.7:18|40:0.35|0.2,volume=1.5',
    # other characters from the narrator's own take: pitch-shifted, duration kept (asetrate + atempo)
    'janitor': 'asetrate=20400,aresample=24000,atempo=1.1765,aecho=0.8:0.6:90|170:0.35|0.2,lowpass=f=3500',
    'mimic': 'asetrate=18720,aresample=24000,atempo=1.2821,flanger=delay=3:depth=4:speed=0.3,'
             'aecho=0.8:0.7:120|260:0.4|0.3,lowpass=f=3000',
    'friend': 'asetrate=30000,aresample=24000,atempo=0.8,lowpass=f=1000,highpass=f=160,aecho=0.8:0.7:18|40:0.35|0.2,volume=1.6',
    # NIGHT ROAD: Dad = narrator pitched down ~2 semitones (0.88) with room / phone / close-mic treatments
    'dad': 'asetrate=21120,aresample=24000,atempo=1.13636,bass=g=3:f=110,aecho=0.8:0.45:60|130:0.22|0.12',
    'dad_phone': 'asetrate=21120,aresample=24000,atempo=1.13636,highpass=f=300,lowpass=f=3400,'
                 'acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4dB,aecho=0.6:0.3:12:0.2,volume=3.6,alimiter=limit=0.9',
    'dad_back': 'asetrate=21120,aresample=24000,atempo=1.13636,bass=g=4:f=110,flanger=delay=2:depth=1.5:speed=0.15,'
                'aecho=0.8:0.55:25|55:0.3|0.18,lowpass=f=5000',
    # DON'T REPLY: little brother = narrator pitched up ~3.5 semitones, small bright room
    'brother': 'asetrate=29400,aresample=24000,atempo=0.81633,highpass=f=140,aecho=0.8:0.4:30|60:0.2|0.1',
    # NIGHT ROAD radio show: host a little lower, caller higher, both through the radio chain
    'host': 'asetrate=22560,aresample=24000,atempo=1.06383,highpass=f=320,lowpass=f=3300,'
            'acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4dB,aecho=0.7:0.4:35|70:0.2|0.1,volume=2.0,alimiter=limit=0.9',
    'caller': 'asetrate=28320,aresample=24000,atempo=0.84746,highpass=f=380,lowpass=f=3000,'
              'acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4dB,aecho=0.7:0.45:35|70:0.25|0.12,volume=1.9,alimiter=limit=0.9',
}


def parse_line(text):
    """-> display words [{t, say, key, brk}] and the spoken text."""
    words = []
    for tok in text.split():
        brk = tok.endswith('/'); tok = tok.rstrip('/')
        key = None
        m = re.search(r'\*([yrg])$', tok)
        if m:
            key, tok = m.group(1), tok[:m.start()]
        m = re.fullmatch(r'\[(.+?)=(.+?)\](.*)', tok)
        if m:
            shown, say = m.group(1).replace('_', ' ') + m.group(3), m.group(2).replace('_', ' ') + m.group(3)
        else:
            shown = say = tok
        w = {'t': shown, 'say': say}
        if key: w['key'] = key
        if brk: w['brk'] = True
        words.append(w)
    return words, ' '.join(w['say'] for w in words)


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def trim(wav, thresh_db=-42, pad_s=0.05):
    idx = np.where(np.abs(wav) > 10 ** (thresh_db / 20))[0]
    if not len(idx):
        return wav
    p = int(pad_s * SR)
    out = wav[max(idx[0] - p, 0): idx[-1] + p].copy()
    f = int(0.006 * SR); out[:f] *= np.linspace(0, 1, f); out[-f:] *= np.linspace(1, 0, f)
    return out


def align(words, heard):
    """words: display words with 'say'; heard: [(word, start, end)]. Returns words with s/e and similarity."""
    toks = []  # (display index, normalized spoken token, length)
    for i, w in enumerate(words):
        for t in w['say'].split():
            n = norm(t)
            if n:
                toks.append((i, n))
    H = [(norm(h[0]), h[1], h[2]) for h in heard]
    H = [h for h in H if h[0]]
    sm = difflib.SequenceMatcher(None, [t[1] for t in toks], [h[0] for h in H], autojunk=False)
    times = [None] * len(toks); approx = [False] * len(toks)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                times[i1 + k] = (H[j1 + k][1], H[j1 + k][2])
        elif tag == 'replace':
            s0, e0 = H[j1][1], H[j2 - 1][2]
            lens = [max(1, len(toks[k][1])) for k in range(i1, i2)]; tot = sum(lens); cur = s0
            for n, k in enumerate(range(i1, i2)):
                nxt = cur + (e0 - s0) * lens[n] / tot
                times[k] = (cur, nxt); approx[k] = True; cur = nxt
    # deleted tokens (not heard): pin between neighbours
    for k in range(len(toks)):
        if times[k] is None:
            prev = next((times[j][1] for j in range(k - 1, -1, -1) if times[j]), 0.0)
            nxt = next((times[j][0] for j in range(k + 1, len(toks)) if times[j]), prev)
            times[k] = (prev, max(prev, nxt)); approx[k] = True
    out = []
    for i, w in enumerate(words):
        ks = [k for k, t in enumerate(toks) if t[0] == i]
        o = {kk: v for kk, v in w.items() if kk != 'say'}
        o['s'] = min(times[k][0] for k in ks); o['e'] = max(times[k][1] for k in ks)
        if any(approx[k] for k in ks): o['approx'] = True
        out.append(o)
    full = difflib.SequenceMatcher(None, ''.join(t[1] for t in toks), ''.join(h[0] for h in H), autojunk=False)
    return out, full.ratio()


def stretch(wav, tempo):
    """Pitch-preserving tempo change (ffmpeg atempo)."""
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / 'a.wav', Path(d) / 'b.wav'
        sf.write(a, wav, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', f'atempo={tempo}', '-ar', str(SR), '-ac', '1', str(b)], check=True)
        out, _ = sf.read(b, dtype='float32')
    return out


def apply_fx(wav, fx):
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / 'a.wav', Path(d) / 'b.wav'
        sf.write(a, wav, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', FX[fx], '-ar', str(SR), '-ac', '1', str(b)], check=True)
        out, _ = sf.read(b, dtype='float32')
    n = len(wav)
    out = np.pad(out, (0, max(0, n - len(out))))[:n]
    f = int(0.02 * SR); out[-f:] *= np.linspace(1, 0, f)
    return out.astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script'); ap.add_argument('out')
    ap.add_argument('--ref', default=None); ap.add_argument('--exaggeration', type=float, default=0.55)
    ap.add_argument('--cfg', type=float, default=0.4); ap.add_argument('--temperature', type=float, default=0.8)
    ap.add_argument('--seed', type=int, default=11); ap.add_argument('--tries', type=int, default=4)
    ap.add_argument('--tempo', type=float, default=1.0); ap.add_argument('--lines', default=None); ap.add_argument('--cache', default='audio/cache')
    a = ap.parse_args()

    import torch
    from chatterbox.tts import ChatterboxTTS
    from faster_whisper import WhisperModel
    lines = json.load(open(a.script))['lines']
    if a.lines:
        keep = set(a.lines.split(',')); lines = [l for l in lines if l['id'] in keep]
    tts = ChatterboxTTS.from_pretrained(device='cuda')
    asr = WhisperModel('small.en', device='cuda', compute_type='float16')
    cache = Path(a.cache); cache.mkdir(parents=True, exist_ok=True)
    voice_id = hashlib.sha1(Path(a.ref).read_bytes()).hexdigest()[:10] if a.ref else 'default'

    dry, wet, words, line_meta, report = [], [], [], [], []
    t = LEAD_S
    dry.append(np.zeros(int(LEAD_S * SR), np.float32)); wet.append(dry[-1])
    for ln in lines:
        dwords, spoken = parse_line(ln['text'])
        best = None
        for attempt in range(a.tries):
            seed = ln.get('seed', a.seed) + attempt * 1000  # per-line 'seed' re-rolls a bad take
            key = hashlib.sha1(json.dumps([spoken, voice_id, a.exaggeration, a.cfg, a.temperature, seed]).encode()).hexdigest()[:16]
            f = cache / f'{key}.wav'
            if f.exists():
                wav, _ = sf.read(f, dtype='float32')
            else:
                torch.manual_seed(seed)
                wav = tts.generate(spoken, audio_prompt_path=a.ref, exaggeration=a.exaggeration,
                                   cfg_weight=a.cfg, temperature=a.temperature).squeeze(0).cpu().numpy().astype(np.float32)
                wav = trim(wav)
                sf.write(f, wav, SR)
            if a.tempo != 1.0:
                wav = stretch(wav, a.tempo)
            # faster-whisper treats a raw array as 16 kHz; feed it 16 kHz or every timestamp is 1.5x late
            segs, _ = asr.transcribe(resample_poly(wav, 2, 3).astype(np.float32), language='en', word_timestamps=True, beam_size=5,
                                     initial_prompt=spoken, condition_on_previous_text=False)
            heard = [(w.word, w.start, w.end) for s in segs for w in s.words]
            aligned, sim = align(dwords, heard)
            dur = len(wav) / SR
            # reject takes with long garbage tails (> 0.8 s after the last word)
            tail_ok = not heard or dur - heard[-1][2] < 0.8
            cand = (sim if tail_ok else sim - 0.5, wav, aligned, sim, ' '.join(h[0].strip() for h in heard), seed)
            if best is None or cand[0] > best[0]:
                best = cand
            if sim >= MIN_SIM and tail_ok:
                break
        _, wav, aligned, sim, heard_txt, seed = best
        report.append({'id': ln['id'], 'sim': round(sim, 3), 'seed': seed, 'said': spoken, 'heard': heard_txt})
        print(f"{ln['id']} sim={sim:.2f} seed={seed} | {heard_txt}", file=sys.stderr)
        w_fx = apply_fx(wav, ln['fx']) if ln.get('fx') else wav
        for w in aligned:
            words.append({**w, 's': round(w['s'] + t, 3), 'e': round(w['e'] + t, 3), 'line': ln['id']})
        line_meta.append({'id': ln['id'], 's': round(t, 3), 'e': round(t + len(wav) / SR, 3), 'fx': ln.get('fx')})
        pause = np.zeros(int(ln.get('pause', 0.3) * SR), np.float32)
        dry += [wav, pause]
        wet += [w_fx, pause]  # same length as the dry take, so timings hold
        t += len(wav) / SR + len(pause) / SR

    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    sf.write(out / 'narration_dry.wav', np.concatenate(dry), SR)
    sf.write(out / 'narration.wav', np.concatenate(wet), SR)
    json.dump({'provenance': f'chatterbox-tts, voice {a.ref or "default"}, exaggeration {a.exaggeration}, cfg {a.cfg}, '
                             f'temperature {a.temperature}; word times from faster-whisper small.en word_timestamps',
               'tempo': a.tempo, 'units': 'seconds', 'duration': round(t, 3), 'lines': line_meta, 'words': words},
              open(out / 'timing.json', 'w'), indent=1)
    json.dump(report, open(out / 'report.json', 'w'), indent=1)
    print(f'{len(words)} words, {t:.2f}s -> {out}')


if __name__ == '__main__':
    main()
