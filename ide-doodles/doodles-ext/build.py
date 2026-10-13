#!/usr/bin/env python3
"""Build a self-contained VSIX with stdlib only. Does not install or modify VS Code."""
import json
import shutil
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
pkg = json.loads((HERE / "package.json").read_text())
out = HERE / f"{pkg['name']}-{pkg['version']}.vsix"
retired = HERE / "media/dark-mode.js"
if retired.exists(): retired.unlink()
# Explicit inputs prevent old experiments or local files from leaking into a release.
assets = {f"lib/{name}": HERE / "lib" / name for name in ("sky.js", "settings.js", "appearance.js")}
for name in ("scene.js", "scene.css", "pasture.svg"):
    assets[f"media/{name}"] = HERE / "media" / name
for name in ("LICENSE", "ASSETS.md", "THIRD_PARTY_NOTICES.md"):
    assets[name] = ROOT.parent / name
for name in ("package.json", "extension.js", "README.md"):
    assets[name] = HERE / name
for name in ("pasture-audio", "sheep-overlay", "fireflies-overlay", "disco-overlay", "flower-foraging", "sheep-run"):
    assets[f"media/{name}.js"] = ROOT / "src/sheep" / f"{name}.js"
for name in ("modes", "settings", "host-appearance", "night-sky", "cozy-mode"):
    assets[f"media/{name}.js"] = ROOT / "src/world" / f"{name}.js"
assets["lib/appearance.js"] = ROOT / "src/world/host-appearance.js"
assets["media/terminal-eyes.js"] = ROOT / "src/terminal/terminal-eyes.js"
assets["media/ktown-weather.js"] = ROOT / "src/weather/ktown-weather.js"
assets["media/paper-and-grass.svg"] = ROOT / "src/grass/paper-and-grass.svg"
# Stage the same assets for F5 development; source files under src/ remain authoritative.
for name, path in list(assets.items()):
    target = HERE / name
    if path != target:
        shutil.copyfile(path, target)
        if name == 'media/ktown-weather.js':
            target.write_text('\n'.join((ROOT / part).read_text() for part in
                              ['src/weather/vendor/simplex-noise.js', 'src/weather/cloud-field.js', 'src/weather/fine-rain.js', 'src/weather/rain-field.js']) + '\n' + path.read_text())
        assets[name] = target
assets['media/LICENSE.simplex-noise'] = ROOT / 'src/weather/vendor/LICENSE.simplex-noise'
assets['media/LICENSE.cozy-audio.md'] = ROOT / 'src/world/audio/README.md'
# Web extension workers have no Node module loader. Bundle our three CommonJS modules.
modules = {"./lib/appearance": HERE / "lib/appearance.js", "./lib/sky": HERE / "lib/sky.js", "./lib/settings": HERE / "lib/settings.js", "main": HERE / "extension.js"}
bundle = "const factories = {\n" + ",\n".join(json.dumps(name) + ": function(module, exports, require) {\n" + path.read_text() + "\n}" for name, path in modules.items()) + "\n};\n"
bundle += "const nativeRequire = require, cache = {}; function load(name) { if (name === 'vscode') return nativeRequire(name); if (!cache[name]) { const m = cache[name] = {exports:{}}; factories[name](m,m.exports,load); } return cache[name].exports; } module.exports = load('main');\n"
(HERE / "browser.js").write_text(bundle)
assets["browser.js"] = HERE / "browser.js"
manifest = f'''<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
<Metadata><Identity Language="en-US" Id="{escape(pkg['name'])}" Version="{escape(pkg['version'])}" Publisher="{escape(pkg['publisher'])}"/>
<DisplayName>{escape(pkg['displayName'])}</DisplayName><Description xml:space="preserve">{escape(pkg['description'])}</Description>
<Tags/><Categories>Other</Categories><GalleryFlags/><Properties>
<Property Id="Microsoft.VisualStudio.Code.Engine" Value="{escape(pkg['engines']['vscode'])}"/>
<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace"/>
<Property Id="Microsoft.VisualStudio.Code.ExecutesCode" Value="true"/>
<Property Id="Microsoft.VisualStudio.Code.WebExtension" Value="true"/>
</Properties></Metadata>
<Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/>
<Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
<Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/></Assets>
</PackageManifest>'''
types = '''<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/>
<Default Extension="md" ContentType="text/markdown"/><Default Extension="svg" ContentType="image/svg+xml"/>
<Default Extension="png" ContentType="image/png"/><Default Extension="css" ContentType="text/css"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>'''
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
    archive.writestr("extension.vsixmanifest", manifest)
    archive.writestr("[Content_Types].xml", types)
    for name, path in sorted(assets.items()):
        archive.write(path, "extension/" + name)
print(f"Built {out} ({out.stat().st_size:,} bytes)")
