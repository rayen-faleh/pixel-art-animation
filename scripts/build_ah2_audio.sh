#!/usr/bin/env bash
# AFTER HOURS Day 2 audio: narration (audio/ah2_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/home/rayen/clide-studio/.venv/bin/python
$PY scripts/build_ah2_cues.py audio/ah2_raw/timing.json ah2-cues.json
ffmpeg -v error -y -i audio/ah2_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/ah2-narration.wav
LEN=$(python3 -c "import json;w=json.load(open('audio/ah2_raw/timing.json'))['words'];e=[x for x in w if x['line']=='H27'][-1]['e'];print(round(e*30)/30+150/30)")
$PY scripts/sfx_mix.py audio/ah2-narration.wav ah2-cues.json audio/ah2-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/ah2-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/ah2-mix.wav
cp audio/ah2_raw/timing.json src/ah2-timing.json
ffmpeg -hide_banner -i public/audio/ah2-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
