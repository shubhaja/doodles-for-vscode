# Third-party notices

## simplex-noise

Procedural clouds use simplex-noise 4.0.3 by Jonas Wagner, MIT licensed.

- Source: https://github.com/jwagner/simplex-noise.js
- License: [LICENSE.simplex-noise](ide-doodles/src/weather/vendor/LICENSE.simplex-noise)
- Files: `simplex-noise.cjs` and the browser wrapper `simplex-noise.js`. The portable package bundles the wrapper into `media/ktown-weather.js` and includes the license as `media/LICENSE.simplex-noise`.

## Cozy audio

The campfire/night loop mixes two recordings, both listed as CC0 on their source pages (verified 2026-10-12):

- **Fireplace Sound loop**, PagDev: https://opengameart.org/content/fireplace-sound-loop
- **cricket sounds**, syncopika: https://opengameart.org/content/cricket-sounds
- CC0 terms: https://creativecommons.org/publicdomain/zero/1.0/

The mix is looped, filtered and level-adjusted. It is included as `cozy-loop.ogg` and embedded in `pasture-audio.js`. Credits are retained even though CC0 does not require attribution. Other short effects and disco audio are synthesized by project code. See `ide-doodles/src/world/audio/README.md` for rebuilding.

## Weather and geocoding services

- Weather data: Open-Meteo, CC BY 4.0, https://open-meteo.com/ and https://creativecommons.org/licenses/by/4.0/. The UI credits Open-Meteo. Weather values are transformed into visual effects.
- Location search: Photon, https://photon.komoot.io/, using OpenStreetMap data (© OpenStreetMap contributors), https://www.openstreetmap.org/copyright. The UI identifies the providers. No map tiles or geocoding dataset are distributed.

No affiliation or endorsement by these providers is implied. Service availability and policies are outside this project's control.
