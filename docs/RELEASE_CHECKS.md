# v0.3.1 experimental release checks

- Clean official VS Code 1.141.0, macOS arm64, separate user-data and extensions directories.
- VSIX installation and CLI uninstall succeeded in the isolated profile. Pasture renders sheep and grass with weather disabled by default.
- Cozy campfire, Disco ball and God-mode eyes visually verified. Shared mute control changes state. New product screenshot contains only the empty release-test window and scenery.
- Exported source passes all 81 JavaScript, 7 Python restore/watcher and 4 shell-hook tests.
- Automated checks cover mode switching, race/jump behavior, dragging, weather and location handling, saved state, source packaging and legacy integrations. See CONTRIBUTING.md for commands.

## Known limitations

- Experimental visual prototype; minor animation/layout bugs are expected.
- Windows, Linux and browser hosts have not been manually tested.
- Manual verification of race controls, drag/reload behavior and weather interactions is incomplete; these currently rely on automated simulated-host tests. Audible output has not been independently assessed.
- The VSIX provides a pasture panel, not the whole-window experiment. Goldfish/evolution and terminal overlays are available only in that experimental source path.
- Whole-window application patches are macOS-specific, can trigger VS Code integrity warnings, and may need repairs after VS Code updates. They are not installed by the VSIX.
- Network-dependent weather/location search may fail or be rate-limited. No account or API key is required for the extension.

Contributions are welcome, particularly fresh-install and cross-platform reports. Fix installation failures or interference with editor input before adding features.
