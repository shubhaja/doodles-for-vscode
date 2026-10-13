"""Package the local refresh command without external dependencies."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

HERE = Path(__file__).resolve().parent
pkg = json.loads((HERE / 'package.json').read_text())
target = HERE / f"{pkg['name']}-{pkg['version']}.vsix"
manifest = f'''<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
<Metadata><Identity Language="en-US" Id="{pkg['name']}" Version="{pkg['version']}" Publisher="{pkg['publisher']}"/>
<DisplayName>Doodles Refresh</DisplayName><Description xml:space="preserve">Apply doodles and reload the current window.</Description>
<Tags/><Categories>Other</Categories><GalleryFlags/><Properties>
<Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.90.0"/>
<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui"/>
</Properties></Metadata>
<Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/>
<Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
<Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/></Assets>
</PackageManifest>'''
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    archive.writestr('extension.vsixmanifest', manifest)
    archive.writestr('[Content_Types].xml', '''<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="json" ContentType="application/json"/><Default Extension="js" ContentType="application/javascript"/>
<Default Extension="md" ContentType="text/markdown"/><Default Extension="vsixmanifest" ContentType="text/xml"/></Types>''')
    for name in ('package.json', 'extension.js', 'README.md'):
        archive.write(HERE / name, 'extension/' + name)
print(target)
