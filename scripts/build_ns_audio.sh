#!/usr/bin/env bash
# NIGHT SHIFT audio: narration (audio/ns_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
python3.12 scripts/build_ns_cues.py audio/ns_raw/timing.json ns-cues.json
ffmpeg -v error -y -i audio/ns_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/ns-narration.wav
LEN=$(python3 -c "import json;print(json.load(open('audio/ns_raw/timing.json'))['duration']+80/30)")
/home/rayen/clide-studio/.venv/bin/python scripts/sfx_mix.py audio/ns-narration.wav ns-cues.json audio/ns-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/ns-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/ns-mix.wav
cp audio/ns_raw/timing.json src/ns-timing.json
ffmpeg -hide_banner -i public/audio/ns-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
