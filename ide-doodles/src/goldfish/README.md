# Little goldfish

Three small pixel fantail goldfish wander together in the top third of the VS Code window, leaving it to chase food. Hold the primary mouse
button in one spot for three seconds to drop a pinch of sinking food, with no progress bar. Fish chase
and eat the pellets, then go back to wandering. Each hold dispenses once; release
and hold again for another pinch. Moving more than six pixels, releasing early,
pressing Escape, or leaving the window cancels feeding. Editor input passes through outside the fish.

Drag any fish individually to the bottom of the window and release to give it
two thin, rounded pixel legs that hang straight from and blend into its belly.
It strolls along the floor, pauses, and turns at the window edges while the others swim.
Fish evolve only into sheep. Old bird/frog saves migrate to the sheep path without losing progress.

On the sheep branch, over five minutes of visible, unheld time on land, it changes through representative
evolutionary body plans: lobe-finned fish, early tetrapod, early amniote, early
synapsid, cynodont, small early mammal, early even-toed ungulate, early ruminant,
wild sheep, and domestic woolly sheep. Each transition takes about 30 seconds.
The initial walking goldfish is fanciful: goldfish are not sheep ancestors, and
these forms summarize branches across generations, not a known chain of fossil species.
The final woolly coat represents domestication and selective breeding.
The final standing pose matches frame 0 of `../sheep/sheep-pixel.png` exactly:
compact hornless body, ivory scalloped fleece, gray face, and short feet. The last
two forms use that same silhouette with a slimmer torso, longer legs, and darker
coat. Solid pixel silhouettes morph between milestones; there are no translucent
crossfades. During the last two minutes, animals grow to the pasture sheep's 3x
pixel scale. Floor placement and dragging account for the changing size.
Feet use solid ends without individual toe pixels. Eyes stay dark and visible
through intermediate morphs, and the original sheep's eye is retained at the end.
Background: [fish-to-tetrapod locomotion](https://pmc.ncbi.nlm.nih.gov/articles/PMC10964964/),
[cynodont origins within Synapsida](https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/ar.25394),
[even-toed ungulates](https://animaldiversity.org/accounts/Artiodactyla/), and
[wild-to-domestic sheep coat changes](https://pmc.ncbi.nlm.nih.gov/articles/PMC10763062/).
Reduced motion slows walking. Before evolution finishes, releasing an animal above the floor
resets it to a swimming fish. Escape or an interrupted
drag restores its previous position; dragging never dispenses food.

At five minutes a sheep-branch animal permanently joins the real pasture flock. Its canvas
copy stops drawing and the shared sheep controller takes over: grazing, waddling,
naps, pickup with a parachute landing, flower foraging, disco, and running/jumping.
It joins an already active disco or race, stays visible on narrow windows, and
reloads as the same sheep rather than becoming a goldfish again. Older saves of
completed sheep also migrate into the flock. A race or interrupted pickup restores
the animal to its pasture home on reload.

Fish positions, land/water state, and evolution progress are saved locally every
second, on release, and when leaving the window. Reloading restores each animal
and fits it to the current window. Evolution resumes from the saved age without
counting time spent closed. Reloading mid-drag restores the pre-drag position.
If local storage is unavailable or invalid, the default three fish still work.

`goldfish.js` is self-contained and is included by `../../apply.py`, including the
automatic source watcher and restore workflow. Apply and reload VS Code to see it.
Regenerate walking atlases after renderer changes with `node ide-doodles/src/goldfish/export-walking.cjs`. Test with `node --test ide-doodles/src/goldfish/*.test.cjs`.

No external dependencies or network requests. Animation suspends while hidden, and reduced motion slows idle swimming. Uneaten food expires and pellet counts are capped.

Each fish has 16 cached swimming sprites (48 total), with body waves, forked
tails and moving fins. Fish keep their full side profile when turning, flipping
left/right with a gentle tilt as they swim up and down. Local separation, predictive
avoidance, alignment and cohesion let them swim around one another. Steering has
a bounded turn rate, soft window boundaries and tail-beat-driven push/glide speed.
The school shares a changing pseudorandom destination, with individual drift and
distance-based attraction to keep stragglers nearby. Each fish occasionally releases
a faint mouth bubble (every 12–26 seconds), which drifts upward and fades away.
At feeding time they choose separate pellets when possible anywhere in the window,
then swim back to the top third after feeding.

Research: [Reynolds' Boids](https://www.red3d.com/cwr/boids/),
[hughsk/boids](https://github.com/hughsk/boids), and
[Yuka](https://github.com/Mugen87/yuka). This tiny overlay implements its own
time-based steering using the Boids principles; no library code is bundled.

Feeding plays a soft pop when pellets appear, followed by one short two-bubble glub as swimming fish approach. Both use the existing pasture mute button; walking creatures do not trigger the swimming sound.
# Animal accessories

Lowering the disco ball gives swimming fish and every evolving stage blue sunglasses that follow the face. Completed sheep keep the flock’s dancing disco mode. Rain intensity above 50% gives every animal a small pixel umbrella; umbrellas disappear at 50% or below. Both live weather and the rain slider drive this, and rain accessories can appear during disco mode.
