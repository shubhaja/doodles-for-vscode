# Cozy campfire soundtrack

`cozy-loop.ogg` is a 64-second stereo loop, bundled into `pasture-audio.js` so
Cozy works offline in both the injected workbench and the extension webview.

Both sources are CC0, as listed on their OpenGameArt pages (checked
2026-09-28):

| Layer | Recording and creator | Source |
| --- | --- | --- |
| Fire | Fireplace Sound loop — PagDev | https://opengameart.org/content/fireplace-sound-loop |
| Night | cricket sounds — syncopika | https://opengameart.org/content/cricket-sounds |

CC0: https://creativecommons.org/publicdomain/zero/1.0/

There is no music. Fire and crickets are repeated, mixed softly together,
and crossfaded for two seconds across the 64-second ambience
boundary. The crickets have a high-pass filter to soften low recording noise.
Target loudness before mixing: fire −28 LUFS, crickets −37 LUFS.
Playback fades in and follows the pasture mute button, mode selection, and
window visibility. If decoding is unavailable, the quiet synthesized fire is
retained as a fallback.

To download the original recordings, rebuild the mix, and update the embedded
audio, run `python3 ide-doodles/src/world/audio/build.py` from the workspace root.
Requires curl and FFmpeg (with libvorbis). Original downloads are cached in
`.tools/cozy-audio-sources/`; they are not part of the shipped extension.
