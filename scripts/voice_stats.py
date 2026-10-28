"""Median F0, speaking rate and level of a narration take (rough voice descriptor)."""
import sys, json, numpy as np, soundfile as sf, librosa
for path in sys.argv[1:]:
    y, sr = sf.read(path, dtype='float32')
    f0, vf, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr, frame_length=1024)
    f0 = f0[vf]
    tj = json.load(open(path.replace('narration_dry.wav', 'timing.json')))
    n = len(tj['words']); speech = sum(l['e'] - l['s'] for l in tj['lines'])
    print(f"{path}: medianF0={np.nanmedian(f0):.0f}Hz  p10-p90={np.nanpercentile(f0,10):.0f}-{np.nanpercentile(f0,90):.0f}  wpm(speech only)={n/speech*60:.0f}")
