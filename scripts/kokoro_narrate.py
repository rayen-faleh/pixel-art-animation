#!/usr/bin/env python3
"""Kokoro (ONNX) narration with real word timings and per-sentence pauses.

Word times come from Kokoro's own predicted phoneme durations (1 unit = 600 samples
= 25 ms at 24 kHz), exposed from the ONNX graph. No guessing, no even splits.

Usage:
  python3 kokoro_narrate.py script.json out_dir [--models DIR] [--voice am_onyx] [--speed 1.2]

script.json: {"sentences": [ [word, ...]  or  {"words": [word, ...], "pause": 0.45}, ... ]}
  word = {"t": "Your"} / {"t": "mess.", "key": "r", "brk": true}
  pause = silence (s) after that sentence; default GAP_S. Horror pacing uses 0.3-0.7 s.
  t     = on-screen word (punctuation allowed)
  say   = optional spoken form fed to TTS ("1,284" -> "twelve eighty-four")
  key   = caption keyword, brk = caption phrase ends after this word
Writes out_dir/narration.wav (24 kHz mono) and out_dir/timing.json.
"""
import argparse, json, os, sys
import numpy as np, soundfile as sf, onnx, onnxruntime as ort
from kokoro_onnx import Kokoro

SR, UNIT = 24000, 600            # samples per duration unit
DUR_TENSOR = '/encoder/Clip_output_0'
LEAD_S, TAIL_S, GAP_S = 0.04, 0.10, 0.06   # default gap; use per-sentence "pause" for dread
PUNCT = set(' ;:,.!?¡¿—–-…"«»“”()[]')


def dur_model(models):
    src = os.path.join(models, 'kokoro-v1.0.onnx')
    dst = os.path.join(models, 'kokoro-v1.0-dur.onnx')
    if not os.path.exists(dst):
        m = onnx.load(src)
        m.graph.output.append(onnx.helper.make_tensor_value_info(DUR_TENSOR, onnx.TensorProto.FLOAT, None))
        onnx.save(m, dst)
    return ort.InferenceSession(dst)


def groups(k, text):
    ph = k.tokenizer.phonemize(text, 'en-us').strip()
    return [g for g in ph.split(' ') if g]


def _strip(s):
    return ''.join(c for c in s if c not in PUNCT and c not in 'ˈˌ')


def _lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def align_words(word_ph, groups_ph):
    """DP: map words to sentence phoneme groups. espeak merges short words ("for the"
    -> one group) and splits long ones; allow 1:1, 1:n (n<=4) and n:1 (n<=3)."""
    W, G = [_strip(w) for w in word_ph], [_strip(g) for g in groups_ph]
    INF = float('inf'); n, m = len(W), len(G)
    dp = [[INF] * (m + 1) for _ in range(n + 1)]; bk = {}
    dp[0][0] = 0
    moves = [(1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (3, 1)]
    for i in range(n + 1):
        for j in range(m + 1):
            if dp[i][j] == INF:
                continue
            for a, b in moves:
                if i + a > n or j + b > m:
                    continue
                x, y = ''.join(W[i:i + a]), ''.join(G[j:j + b])
                c = dp[i][j] + _lev(x, y) / max(1, len(x), len(y))
                if c < dp[i + a][j + b]:
                    dp[i + a][j + b] = c; bk[(i + a, j + b)] = (a, b)
    if dp[n][m] == INF:
        sys.exit('Could not align words to phonemes; add "say" forms.')
    spans, i, j = [], n, m
    while i or j:
        a, b = bk[(i, j)]; spans.append((i - a, a, j - b, b)); i, j = i - a, j - b
    return spans[::-1], W, dp[n][m] / max(1, n)


def synth_sentence(k, sess, words, voice, speed):
    spoken = [w.get('say', w['t']) for w in words]
    ph_groups = groups(k, ' '.join(spoken))
    ph = ' '.join(ph_groups)
    spans, Wst, avg_cost = align_words([''.join(groups(k, s)) for s in spoken], ph_groups)
    if avg_cost > 0.5:
        print(f'warning: weak alignment ({avg_cost:.2f}) in "{" ".join(spoken)}"', file=sys.stderr)
    vocab = k.tokenizer.vocab
    toks, char_kind = [], []          # char_kind: group index or -1 for space/punct
    gi = 0
    for ch in ph:
        if ch == ' ':
            gi += 1
        if ch not in vocab:
            continue
        toks.append(vocab[ch])
        char_kind.append(-1 if ch in PUNCT else gi)
    if len(toks) > 510:
        sys.exit('Sentence too long for Kokoro (510 tokens); split it.')
    style = k.get_voice_style(voice)[len(toks)].reshape(1, 256).astype(np.float32)
    audio, dur = sess.run(None, {'tokens': np.array([[0, *toks, 0]], np.int64), 'style': style,
                                 'speed': np.array([speed], np.float32)})
    dur = dur.ravel()
    starts = np.concatenate([[0], np.cumsum(dur)[:-1]])   # in units, incl. leading pad
    gs, ge = {}, {}
    for i, g in enumerate(char_kind):
        if g < 0:
            continue
        s, e = starts[i + 1], starts[i + 1] + dur[i + 1]    # +1 skips the leading pad
        gs[g] = min(gs.get(g, s), s); ge[g] = max(ge.get(g, e), e)
    out = []
    for wi, a, gj, b in spans:
        s0 = min(gs[g] for g in range(gj, gj + b) if g in gs)
        e0 = max(ge[g] for g in range(gj, gj + b) if g in ge)
        if a == 1:
            out.append({**words[wi], 's': s0 * UNIT / SR, 'e': e0 * UNIT / SR})
            continue
        # merged short words share one group: split by their phoneme lengths (marked approx)
        lens = [max(1, len(Wst[wi + x])) for x in range(a)]; tot = sum(lens); cur = s0
        for x in range(a):
            nxt = cur + (e0 - s0) * lens[x] / tot
            out.append({**words[wi + x], 's': cur * UNIT / SR, 'e': nxt * UNIT / SR, 'approx': True}); cur = nxt
    return audio.astype(np.float32), out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('script'); ap.add_argument('out')
    ap.add_argument('--models', default=os.path.join(os.path.dirname(__file__), 'models'))
    ap.add_argument('--voice', default='am_onyx'); ap.add_argument('--speed', type=float, default=1.0)
    a = ap.parse_args()
    k = Kokoro(os.path.join(a.models, 'kokoro-v1.0.onnx'), os.path.join(a.models, 'voices-v1.0.bin'))
    sess = dur_model(a.models)
    sentences = json.load(open(a.script))['sentences']
    pieces, words, t = [], [], 0.0
    for sent in sentences:
        pause = GAP_S
        if isinstance(sent, dict):
            pause, sent = sent.get('pause', GAP_S), sent['words']
        audio, ws = synth_sentence(k, sess, sent, a.voice, a.speed)
        a0 = max(0, int((ws[0]['s'] - LEAD_S) * SR)); a1 = min(len(audio), int((ws[-1]['e'] + TAIL_S) * SR))
        clip = audio[a0:a1].copy()
        f = int(0.008 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)  # click-free joins
        off = t - a0 / SR
        for w in ws:
            words.append({k2: v for k2, v in w.items() if k2 != 'say'} | {'s': round(w['s'] + off, 3), 'e': round(w['e'] + off, 3)})
        pieces += [clip, np.zeros(int(pause * SR), np.float32)]
        t += len(clip) / SR + pause
    full = np.concatenate(pieces)
    os.makedirs(a.out, exist_ok=True)
    sf.write(os.path.join(a.out, 'narration.wav'), full, SR)
    json.dump({'provenance': f'kokoro-onnx v1.0, voice {a.voice}, speed {a.speed}, durations from {DUR_TENSOR}',
               'units': 'seconds', 'duration': round(len(full) / SR, 3), 'words': words},
              open(os.path.join(a.out, 'timing.json'), 'w'), indent=1)
    print(f'{len(words)} words, {len(full)/SR:.2f}s -> {a.out}')


if __name__ == '__main__':
    main()
