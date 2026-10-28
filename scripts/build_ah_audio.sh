#!/usr/bin/env bash
# AFTER HOURS audio: narration (audio/ah_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/home/rayen/clide-studio/.venv/bin/python
$PY scripts/build_ah_cues.py audio/ah_raw/timing.json ah-cues.json
ffmpeg -v error -y -i audio/ah_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/ah-narration.wav
LEN=$(python3 -c "import json;w=json.load(open('audio/ah_raw/timing.json'))['words'];e=[x for x in w if x['line']=='A18'][-1]['e'];print(round(e*30)/30+117/30)")
$PY scripts/sfx_mix.py audio/ah-narration.wav ah-cues.json audio/ah-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/ah-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/ah-mix.wav
cp audio/ah_raw/timing.json src/ah-timing.json
ffmpeg -hide_banner -i public/audio/ah-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
