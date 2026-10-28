#!/usr/bin/env bash
# LIGHTS OUT audio: narration (already generated in audio/raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
python3.12 scripts/build_cues.py audio/raw/timing.json cues.json
ffmpeg -v error -y -i audio/raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/narration.wav
LEN=$(python3 -c "import json;print(json.load(open('audio/raw/timing.json'))['duration']+80/30)")
/home/rayen/clide-studio/.venv/bin/python scripts/sfx_mix.py audio/narration.wav cues.json audio/mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/lights-mix.wav
cp audio/raw/timing.json src/lights-timing.json
ffmpeg -hide_banner -i public/audio/lights-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
