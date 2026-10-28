#!/usr/bin/env bash
# NIGHT SHIFT Part 2 audio: narration (audio/ns2_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/home/rayen/clide-studio/.venv/bin/python
$PY scripts/build_ns2_cues.py audio/ns2_raw/timing.json ns2-cues.json
ffmpeg -v error -y -i audio/ns2_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/ns2-narration.wav
LEN=$(python3 -c "import json;w=json.load(open('audio/ns2_raw/timing.json'))['words'];e=[x for x in w if x['line']=='S21'][-1]['e'];print(round(e*30)/30+150/30)")
$PY scripts/sfx_mix.py audio/ns2-narration.wav ns2-cues.json audio/ns2-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/ns2-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/ns2-mix.wav
cp audio/ns2_raw/timing.json src/ns2-timing.json
ffmpeg -hide_banner -i public/audio/ns2-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
