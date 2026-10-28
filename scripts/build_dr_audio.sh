#!/usr/bin/env bash
# DON'T REPLY audio: narration (audio/dr_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/home/rayen/clide-studio/.venv/bin/python
$PY scripts/build_dr_cues.py audio/dr_raw/timing.json dr-cues.json
ffmpeg -v error -y -i audio/dr_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/dr-narration.wav
LEN=$(python3 -c "import json;w=json.load(open('audio/dr_raw/timing.json'))['words'];e=[x for x in w if x['line']=='D22'][-1]['e'];print(round(e*30)/30+119/30)")
$PY scripts/sfx_mix.py audio/dr-narration.wav dr-cues.json audio/dr-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/dr-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/dr-mix.wav
cp audio/dr_raw/timing.json src/dr-timing.json
ffmpeg -hide_banner -i public/audio/dr-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
