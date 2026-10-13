# Doodles architecture

September 28, 2026. Product basis: [PRODUCT-NOTES.md](PRODUCT-NOTES.md), with settings buttons superseding the earlier proposal for physical mode triggers.

## Boundaries

| Area | Owns | Relationship to modes |
| --- | --- | --- |
| Pets | Identity, habitat, evolution, saved progress and ordinary behavior | Activities temporarily control behavior; exiting releases the same pets |
| World | Location, local time, daylight and weather preferences | Continues across activity changes |
| Modes | One temporary shared activity, or everyday life (`null`) | Shared registration and enter/exit lifecycle |
| Ambience | Sound and temporary lighting | Responds to activity; future music modulation must not choose the activity |
| Decorations | Objects and, eventually, saved placement | Remains independent of activity state |
| Host | Injected workbench or extension webview, assets and storage bridge | Loads the same mode implementations |

The review found direct race-to-disco DOM clicks, three different control lifecycles, global keyboard interception, and a settings shell owned by weather. Those dependencies are removed in this slice. Pet persistence and world preferences retain their existing storage formats; a central object containing every subsystem would add migration risk without improving mode coordination.

## Implemented contract

`src/world/modes.js` owns transient activity state. `register({id, label, enter, exit})` returns an unregister function. Lifecycle callbacks are synchronous: exit releases activity state immediately, even if a decorative closing animation continues. Callbacks must cancel delayed starts on exit. They must not initiate another transition. Failed entry invokes that mode's exit and returns the controller to everyday life.

`activate(id)`, `activate(null)` and `toggle(id)` are the only transition paths. Subscribers receive `{active, modes}` snapshots. Duplicate registration and unknown mode IDs are errors. Unregistering the active mode exits it. Page teardown exits the activity. Modes are transient by default. Cozy opts into restoreOnReload, so a host refresh resumes the selected atmosphere; an explicit exit clears that choice. Teardown releases effects without overwriting the saved choice.

`src/world/settings.js` owns the gear, dropdown, accessible pressed-state buttons, outside-click handling and toolbar mounting. It renders registered modes without knowing their effects. The pet reset control also lives here, independent of weather. Weather appends its own controls to this shell. The controller handles Escape only when the event belongs to world controls; race uses the same input boundary for Space.

Disco (`src/sheep/disco-overlay.js`), race (`src/sheep/sheep-run.js`) and eyes (`src/terminal/terminal-eyes.js`) all register the same lifecycle contract. Disco retains the lowering ball, lighting, sound and dancing; its cardboard control is gone. Race retains gathering, jumping, scoring and retry; its flag is gone. Pressing an active settings button exits to everyday life. Space retries a completed race.

Existing `pasture-disco-change` and `pasture-run-change` events remain as compatibility notifications to pets, foraging and audio. They no longer coordinate modes. Effects still own their animation details; the registry owns exclusivity. Permanent evolution reset is a separate explicit action, and exits a running race before resetting pets.

## Loading and validation

Load modes, then settings, then consumers. `apply.py` places the shared bootstrap before existing injection blocks, including installations with older block ordering. The extension build stages these same source files; previews load them explicitly. Settings remains available with weather disabled. Generated extension media is not the source of record.

Tests cover transition order and failed entry, rapid disco/race/eyes changes, cancelled delayed disco starts, keyboard ownership, pet handoff and persistence, weather controls, and idempotent installation ordering.

## Next separations

The broader product architecture is still incremental. Goldfish and sheep own their existing simulation/storage, weather still combines data fetching with rendering and host palette updates, and decorations do not yet have persisted placement. String lights are retired.

1. Extract a pet roster with persistent IDs and an activity-facing participant interface. Replace race's sheep DOM discovery and goldfish bridge without changing evolution pacing or save data.
2. Extract location/time/weather state from weather rendering. Put editor palette changes behind the host adapter and expose semantic world palette roles.
3. Move storage access behind host adapters using the existing keys before introducing versioned world/pet/placement records.
4. Add decoration placement separately from mode activation. Later object triggers can call the same `toggle(id)` API.
5. Refine God mode behavior beyond its eye effect before adding more modes. Keep music modulation separate from activity selection. Creator packs can eventually use these same interfaces after their asset and behavior boundaries are defined.

This change adds no new growth rules, offline progression, music integration, decoration editor, or creator runtime.

## Cozy atmosphere and host appearance

Cozy mode (src/world/cozy-mode.js) owns the campfire, temporary seating positions, and its shared activity event. The fire is anchored at two-thirds of the viewport width. Sheep keep their pasture homes, face the fire, and spend most of their time seated, with short occasional naps. Late-evolving sheep join the gathering; mode exit restores ordinary behavior.

night-sky.js supplies the starry gradient and temporary dark palette. The terminal bridge attaches this window’s theme service; host-appearance.js selects the built-in dark theme with the preview target, which writes neither settings nor shared theme storage. Both native Light Modern and Dark Modern themes are preloaded. The theme bridge accepts the workbench’s synchronous theme array, and commits native surfaces and the local palette in the same task using the preview target. Everyday life, Race and God mode use a native light theme so headers, focused rows, icons, and editor tokens get a consistent baseline. Generation checks skip superseded requests during rapid switching. Daylight Sky supplies time only; weather CSS and terminal themes apply colors within the renderer. Existing global color snapshots are cleaned up once during migration. Modes, mute, and weather preferences use sessionStorage to survive reloads independently in each window. The portable webview keeps its appearance inside the webview.

The host still reserves 160px for scenery, with native status controls in a 22px strip at its top. Terminal focus no longer adds a colored multiply overlay.

Fire crackling and God mode whooshes use the existing audio service, respect mute, and stop or pause on mode exit and visibility changes. Reduced motion keeps stars and flame steady.

Cozy movement uses a shared frame-driven formation for sheep and canvas-rendered evolving land animals. Travel uses a steady walking speed and pixel-aligned steps, then switches to sitting; positions and facing during the activity do not replace saved pasture homes. Evolution continues, with a continuous handoff into the sheep roster. The flame and logs share one 32×36 pixel grid at 3× scale.

Terminal colors stay under the atmosphere’s control for the whole activity, including new panes and native theme refreshes. Old OSC foreground/background overrides are reset and new OSC color writes are held during Cozy; queries still pass through. Leaving Cozy releases those handlers and restores owned theme values. Mode changes never write global theme settings.

### Surface and contrast rules

`restore_foundation` replaces the legacy Background extension block on both fresh
and existing installs. Paper is a background image on workbench surfaces, never a
full-window foreground veil. The grass overlay is clipped to the bottom 28px.
This matters because palette contrast calculations cannot account for an image
painted over the glyphs after text rendering. Cozy continues to own the starry
surface backgrounds.

Disco shares the native dark appearance with Cozy, using a slow 24-second cycle
of deep violet, magenta and blue surfaces instead of stars. Pale lavender text,
cyan links and pink focus indicators retain at least 7:1 contrast through the
cycle. Its terminal background updates with the surface palette. The ball center
is 135px below the ceiling (previously 270px); its 1.5px rendered cord extends
above the clipped ceiling so it remains attached throughout the drop animation.

Daylight owns explicit foreground/background pairs for menus, notifications,
inputs, buttons and selections, plus native chrome labels that use literal theme
colors. Enabled toolbar icons remain opaque; disabled controls retain their
distinct treatment. Selected activity icons and sidebar headings explicitly use
dark foregrounds; selection uses a pale fill and blue indicator. Both daylight
and the dark modes replace all 16 terminal ANSI entries.
Clock reads allow only one request in flight, and unchanged palettes do not
rewrite the stylesheet. Theme changes still commit through the window-local
appearance adapter, with generation checks for superseded mode requests.

Validation includes every minute of the daylight sky (7:1 primary text contrast),
repeated and delayed Cozy transitions, bright ANSI colors, overlapping clock
reads, unchanged-style suppression, and idempotent migration of the background
layer. Native VS Code visual checks are still necessary after applying: inspect
Search placeholders and empty states, activity icons, panel tabs, menus, editor
tokens and terminal colors in daylight, Cozy, and after rapid mode switching.
