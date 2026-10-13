"""Rebuild the offline Cozy loop from CC0 sources; see README.md for credits."""
import base64
import re
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
CACHE = ROOT / '.tools/cozy-audio-sources'
CACHE.mkdir(parents=True, exist_ok=True)
for name, remote in [('fire', 'fire.wav'), ('night', 'cricketsounds090613.wav')]:
    target = CACHE / f'{name}-original.wav'
    if not target.exists():
        temporary = target.with_suffix('.part')
        subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                        'https://opengameart.org/sites/default/files/' + remote,
                        '-o', str(temporary)], check=True)
        temporary.replace(target)

ffmpeg = shutil.which('ffmpeg')
if not ffmpeg:
    raise SystemExit('FFmpeg is required to rebuild the Cozy soundtrack.')
base = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y']
ambience = CACHE / 'ambience.wav'
subprocess.run(base + ['-stream_loop', '-1', '-i', str(CACHE / 'fire-original.wav'),
    '-stream_loop', '-1', '-i', str(CACHE / 'night-original.wav'), '-filter_complex',
    '[0:a]atrim=duration=66,loudnorm=I=-28:TP=-4:LRA=7,aresample=44100[f];'
    '[1:a]atrim=duration=66,highpass=f=1300,loudnorm=I=-37:TP=-8:LRA=7,aresample=44100[n];'
    '[f][n]amix=inputs=2:normalize=0,asplit=3[mid][head][tail];'
    '[mid]atrim=start=2:end=64,asetpts=PTS-STARTPTS[m];'
    '[head]atrim=end=2,asetpts=PTS-STARTPTS[h];'
    '[tail]atrim=start=64:end=66,asetpts=PTS-STARTPTS[t];'
    '[t][h]acrossfade=d=2:c1=tri:c2=tri[x];[m][x]concat=n=2:v=0:a=1[out]',
    '-map', '[out]', str(ambience)], check=True)
output = HERE / 'cozy-loop.ogg'
subprocess.run(base + ['-i', str(ambience), '-c:a', 'libvorbis', '-q:a', '3', str(output)], check=True)
script = HERE.parent.parent / 'sheep/pasture-audio.js'
encoded = base64.b64encode(output.read_bytes()).decode()
text, count = re.subn(r"const cozyAudioBase64='[^']*';",
                      "const cozyAudioBase64='" + encoded + "';", script.read_text())
assert count == 1, 'Expected one embedded Cozy soundtrack.'
script.write_text(text)
print(f'Embedded {output.stat().st_size:,} bytes of Cozy audio.')
