# Contributing

This is an experimental personal project. Bug reports and focused PRs are welcome; discuss large features in an issue first. Include what changed, why, and how you checked it. PRs are reviewed when the maintainer has time.

## Check a change

From the repository root, with Python 3 and a recent Node.js:

```sh
python3 ide-doodles/doodles-ext/build.py
node --test ide-doodles/src/**/*.test.cjs ide-doodles/daylight-sky/*.test.cjs ide-doodles/refresh-ext/*.test.js ide-doodles/doodles-ext/test/*.test.js
python3 -m unittest discover -s ide-doodles -p 'test_*.py'
python3 ide-doodles/doodles-ext/test/test_dim.py
```

The last command covers legacy shell hooks and requires zsh. Automated checks use simulated hosts; they do not replace trying the VSIX in a fresh VS Code profile. Check dragging, mode changes, mute, weather off/on, reload and uninstall. Do not run `apply.py` unless you intend to modify your local VS Code application.

Edit shared behavior in `ide-doodles/src/`, not copied `doodles-ext/media/` files. If changing the fish renderer, regenerate walking atlases with `node ide-doodles/src/goldfish/export-walking.cjs`. Keep personal settings, screenshots, application backups, tokens and recordings out of commits.

## Rights and scope

Contributions to project-owned code are under MIT; include source/license details for third-party material and disclose substantial AI assistance. See [ASSETS.md](ASSETS.md). Do not submit employer/client material or private data. No company affiliation is implied by this personal project.
