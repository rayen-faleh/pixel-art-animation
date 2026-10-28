#!/usr/bin/env bash
# NIGHT ROAD audio: narration (audio/nr_raw) -> cues -> mix -> public + src timing.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=/home/rayen/clide-studio/.venv/bin/python
$PY scripts/build_nr_cues.py audio/nr_raw/timing.json nr-cues.json
ffmpeg -v error -y -i audio/nr_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/nr-narration.wav
LEN=$(python3 -c "import json;w=json.load(open('audio/nr_raw/timing.json'))['words'];e=[x for x in w if x['line']=='N101'][-1]['e'];print(round(e*30)/30+170/30)")
$PY scripts/sfx_mix.py audio/nr-narration.wav nr-cues.json audio/nr-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/nr-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/nr-mix.wav
cp audio/nr_raw/timing.json src/nr-timing.json
ffmpeg -hide_banner -i public/audio/nr-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
