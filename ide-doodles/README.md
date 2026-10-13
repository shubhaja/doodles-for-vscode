# Doodles source guide

Two hosts share scenery code under `src/`:

- **Portable extension:** `doodles-ext/`; supported webview APIs, scenery inside one movable pasture view. Build with `python3 ide-doodles/doodles-ext/build.py` from the repository root.
- **Whole-window experiment:** `apply.py`; macOS VS Code application patches, with fish/evolution, paper/grass, editor-wide atmosphere and terminal goal headers. Requires Daylight Sky for native time controls. This is not the portable extension installer.

## Whole-window development

Run `python3 ide-doodles/apply.py --no-reload`, then **Developer: Reload Window**. `Restore Doodles.command` runs the same apply step. Changes to application files are backed up locally under `backups/`. After a VS Code update, compatibility may need review.

This path can trigger VS Code's installation-integrity warning. To remove all whole-window patches, restore a clean VS Code application and disable the old Background customization and Daylight Sky extension. There is no tested one-click uninstaller yet.

`refresh-ext/` supplies a save/apply/reload shortcut. `auto-apply.py` is an optional developer watcher, not needed by extension users. [RELOAD.md](RELOAD.md) describes these helpers.

## Source map

- `src/sheep/`: sheep, flowers, fireflies, race, disco and audio.
- `src/goldfish/`: swimming, feeding, dragging and fish-to-sheep evolution; whole-window host only.
- `src/world/`: mode switching, settings, Cozy and appearance integration.
- `src/weather/`: cloud/rain renderers, location and time controls.
- `src/terminal/`: goal headers, eyes and legacy terminal hooks.
- `src/grass/`: paper and grass artwork.

[ARCHITECTURE.md](ARCHITECTURE.md) describes shared behavior. Edit `src/`, then rebuild; copied extension media is generated. Snowglobe, ground statue, string lights, bird/frog branches and standalone playgrounds have been removed. Small migration checks remain to clean older installations and preserve saved animals.
