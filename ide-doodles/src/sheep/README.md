# Grazing sheep sprites

Generated with AI image tools. Historical notes name an imagegen CLI fallback; the exact model/version is not independently verified. Magenta background removed using the bundled chroma-key helper. Four poses were cropped and aligned into sheep-grazing.png (512×96; four 128×96 frames).

Four small sheep occupy the existing bottom 64px grass strip. They are click-through and hidden from accessibility navigation, with staggered grazing loops. Reduced-motion mode uses a still grazing pose; narrow windows show two sheep. The installed script embeds the PNG so there are no network requests during animation.

Installed copy: ~/Library/Application Support/Code/User/background-assets/sheep/. Workbench HTML contains the pasture-sheep-start/end block. Reload Window to apply. A VS Code update may reset the injection. Remove that marked block to remove the sheep.

## Generation prompt

Create a production sprite sheet with exactly four full-body illustrations of the SAME adorable little woolly sheep, in a precise 2 by 2 grid of equal 512 by 512 cells. All four sheep face RIGHT, strict side view, same body dimensions, same hoof baseline inside each cell, ample empty margin. Top left: standing with head level. Top right: head lowered to graze. Bottom left: head lowered farther, nibbling. Bottom right: head halfway raised chewing. Style: delicate cozy storybook game sprite, softly painted ivory scalloped fluffy wool, muted slate gray face and short legs, tiny dot eye, subtle warm gray outlines, gentle pastel shading. Readable when reduced to only 55 pixels wide. Short legs and round compact body, no horns. Background: completely uniform bright chroma magenta RGB 255 0 255; no magenta in sheep. No floor, no grass, no cast shadows, no scenery, no lettering, no grid lines. Each animal completely separate with no overlap. These are four animation poses of one consistent character, not different sheep.

Updated flock: all four sheep use the same 92×69px frame, behind the grass (z-index 999, grass 1000). They pause to graze, walk 48px with a subtle waddle, turn, and return on staggered 56–74 second cycles. Movement is clamped to the window edges and stops for reduced-motion preferences.

Pixel-art update: sheep-pixel.png is the active 128×24 sprite sheet (four 32×24 poses), displayed at 3× nearest-neighbor scale with a shared 12-color palette. Grass is rendered on a 400×16 grid and embedded into paper-and-grass.svg. Sheep remain behind the grass, with grazing and two-state stepped walking. The grass is now static pixel art. Original assets are retained.

Disco mode keeps the regular sheep with pixel sunglasses. They use their head-up pose and normal strolling/waddling motion; picked-up sheep keep their dangling behavior. There is no separate dancing sprite. Disco colors cover the whole pasture.

Completed goldfish evolution now adds a sheep through the same factory as the
original flock. `window.doodlesPasture.addSheep({id,x,direction})` is idempotent by
ID; `snapshot(id)` reports its pasture position for the goldfish save. The factory
supplies all native sheep behaviors and emits `pasture-sheep-added` so an active
race can include new members. `pasture-ready` allows saved sheep to restore in
either script load order. Evolved sheep stay visible in narrow windows.
