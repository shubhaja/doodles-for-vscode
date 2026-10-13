# Cozy campfire

Six pixel-art poses authored in code with AI assistance are held for 180 ms each, with no interpolation or scaling
between them. A broad shared flame body has an asymmetric crown, short shifting tips,
small notches, and changing gold patches. Two small dark crossed logs sit below the ember bed.
The SVGs use a 32×40 pixel grid displayed at 3×; reduced motion holds frame zero,
and hidden windows pause the loop.

Visual references reviewed for compact bases and stepped flame silhouettes:

- Stardew Valley's campfire: https://stardewvalleywiki.com/Campfire
- SMStudios' animated pixel campfire: https://simon-develop.itch.io/2d-campfire-free

The artwork here is authored directly in `cozy-mode.js`; reference sprites are
not bundled or copied. Sound is fire and quiet crickets only, without music.
See `audio/README.md` for source credits and rebuild instructions.
