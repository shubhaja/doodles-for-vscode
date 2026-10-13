# Doodles

An experimental pasture for VS Code: sheep, flowers, fireflies, Disco, Race, Cozy, God mode, sound, a clock-driven sky and optional weather.

## Install

Install `doodles-0.3.1.vsix` through **Extensions → … → Install from VSIX**, then run **Doodles: Open Pasture**. Move the view between the panel and sidebars using VS Code's view controls. Uninstall through the Extensions view.

Drag sheep and watch them parachute down. Use the gear menu to change modes; select the active mode again to return to everyday life. In Race, Space jumps or retries when the scene has focus. The speaker toggles sound.

The sky commands enable, pause or reset the pasture's sky colors. They do not recolor the editor window. **Doodles: Rename Active Terminal / Set Goal** uses the native terminal rename command.

## Weather

Weather is off by default. Enable `doodles.weather.enabled`; use the gear menu to select a city or adjust cloud, rain and time controls. Searches go to Photon / OpenStreetMap; coordinates go to Open-Meteo. Weather can be unavailable offline. Weather attribution: Open-Meteo, CC BY 4.0.

## Scope and limitations

All scenery stays inside this view. Whole-window goldfish/evolution, editor-wide overlays and terminal goal headers belong to the separate patched experiment. This extension writes no VS Code application files and installs no shell hooks. It does not remove patches from older installations.

The package targets VS Code 1.90+ and includes a web entry point. Cross-platform and web-host behavior need testing. Installation and core visual modes were checked in a clean VS Code 1.141.0 profile on macOS arm64; other hosts remain unverified.

## Development

From the repository root:

```sh
python3 ide-doodles/doodles-ext/build.py
node --test ide-doodles/doodles-ext/test/*.test.js
```

The build uses explicit package inputs and Python's standard library. Edit shared scenery under `ide-doodles/src/`; rebuild to refresh copied media.
