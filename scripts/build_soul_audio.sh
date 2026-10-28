#!/usr/bin/env bash
# SOUL FOR SALE audio: narration (audio/soul_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
python3.12 scripts/build_soul_cues.py audio/soul_raw/timing.json soul-cues.json
ffmpeg -v error -y -i audio/soul_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/soul-narration.wav
LEN=$(python3 -c "import json;print(json.load(open('audio/soul_raw/timing.json'))['duration']+50/30)")
/home/rayen/clide-studio/.venv/bin/python scripts/sfx_mix.py audio/soul-narration.wav soul-cues.json audio/soul-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/soul-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/soul-mix.wav
cp audio/soul_raw/timing.json src/soul-timing.json
ffmpeg -hide_banner -i public/audio/soul-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
