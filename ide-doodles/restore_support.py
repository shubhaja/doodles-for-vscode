"""Restore decoration foundations without replacing the updated VS Code shell."""
from datetime import datetime
import base64
import re
import shutil


def terminal_goal_bridge(script):
    """Expose terminal title operations to the injected per-pane goal inputs."""
    marker = '/* doodles-terminal-goal-bridge */'
    weather = 'window.doodlesPrepareTerminal?.(this._wrapperElement.xterm);'
    # Retire the weather hook from already-patched installations as well.
    script = script.replace(weather, "")
    appearance_marker = '/* doodles-window-appearance */'
    if appearance_marker not in script:
        anchor = re.compile(r'this\._wrapperElement\.xterm=([\w$]+)\.raw;')
        if len(list(anchor.finditer(script))) != 1:
            raise RuntimeError('Window appearance needs review: terminal integration not found.')
        script = anchor.sub(lambda match: match.group() + appearance_marker +
                            'window.doodlesAttachAppearance?.(this._themeService);', script, count=1)
    sky_marker = '/* doodles-sky-bridge */'
    old_set_time = 'setTime:minutes=>this._commandService.executeCommand("daylightSky.setTime",minutes)'
    new_set_time = old_set_time + ',setTimeZone:zone=>this._commandService.executeCommand("daylightSky.setTimeZone",zone)'
    if sky_marker in script and 'setTimeZone:zone=>' not in script:
        script = script.replace(old_set_time, new_set_time)
    dark_bridge = ',setDarkMode:enabled=>this._commandService.executeCommand("daylightSky.setDarkMode",enabled)'
    if sky_marker in script and 'setDarkMode:enabled=>' not in script:
        script = script.replace(new_set_time, new_set_time + dark_bridge)
    new_set_time += dark_bridge
    if sky_marker not in script:
        if 'this._commandService=' not in script:
            raise RuntimeError('Sky controls need review: command service not found. App code left unchanged.')
        anchor = re.compile(r'this\._wrapperElement\.xterm=([\w$]+)\.raw;')
        if len(list(anchor.finditer(script))) != 1:
            raise RuntimeError('Sky controls need review: terminal integration not found. App code left unchanged.')
        script = anchor.sub(lambda match: match.group() + sky_marker +
                            'window.doodlesSky={'
                            'getTime:()=>this._commandService.executeCommand("daylightSky.getTime"),'
                            + new_set_time + '};', script, count=1)
    if marker in script:
        return script
    pattern = re.compile(r'this\._wrapperElement\.xterm=([\w$]+)\.raw;')
    matches = list(pattern.finditer(script))
    required = ('get staticTitle()', 'async rename(', 'this.onTitleChanged=',
                'this._lastLayoutDimensions&&this.layout(this._lastLayoutDimensions)')
    if len(matches) != 1 or not all(part in script for part in required):
        raise RuntimeError('Terminal goals need review: unrecognized VS Code terminal integration. App code left unchanged.')
    bridge = (marker + 'this._wrapperElement.pastureGoal={'
              'getTitle:()=>this.staticTitle||"",'
              'rename:value=>this.rename(value),'
              'onTitleChanged:listener=>this.onTitleChanged(listener),'
              'relayout:()=>{if(this._lastLayoutDimensions)this.layout(this._lastLayoutDimensions)}'
              '};')
    return pattern.sub(lambda match: match.group() + bridge, script, count=1)


def restore_terminal_goals(path, root, check=False):
    script = path.read_text()
    restored = terminal_goal_bridge(script)
    if restored == script:
        return
    if check:
        print('Terminal goal integration needs restoring.')
        return
    backup = root / 'backups' / ('workbench.desktop.main.js.before-goals-' + datetime.now().strftime('%y%m%d-%H%M%S-%f'))
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, backup)
    path.write_text(restored)
    print('Restored terminal goal integration. Backup:', backup.name)


def restore_foundation(html, root):
    if not re.search(r'</html\s*>', html, re.I):
        raise ValueError('Workbench has no closing html tag')
    # Retire Background's full-window foreground overlay. Texture belongs in
    # surface backgrounds; only the bottom 28px of grass may cover the workbench.
    svg = (root / 'src/grass/paper-and-grass.svg').read_text()
    paper = svg.split('<style>', 1)[0] + '</svg>'
    # The clipped foreground must contain only transparent grass. Keeping the
    # paper rect here composites a second texture into a hard-edged bottom band.
    grass = svg[:svg.index('>') + 1] + '<style>' + svg.split('<style>', 1)[1]
    uri = lambda value: 'url("data:image/svg+xml;base64,' + base64.b64encode(value.encode()).decode() + '")'
    block = ('<!-- vscode-background-start doodles-surfaces -->\n<style>\n'
             'body {--doodles-paper:' + uri(paper) + ';}\n'
             'body:not(.doodles-dark),body:not(.doodles-dark) .monaco-workbench .part,'
             'body:not(.doodles-dark) .monaco-editor-background,'
             'body:not(.doodles-dark) .monaco-editor .margin {'
             'background-image:var(--doodles-paper);background-attachment:fixed;}\n'
             'body::after {content:"";position:fixed;inset:0;pointer-events:none;z-index:1000;'
             'clip-path:inset(calc(100% - 28px) 0 0);background-image:' + uri(grass) + ';'
             'background-size:100% 100%;background-repeat:no-repeat;opacity:1;'
             'mix-blend-mode:normal;transition:none;}\n'
             '</style>\n<!-- vscode-background-end -->')
    pattern = r'<!-- vscode-background-start.*?<!-- vscode-background-end -->'
    if re.search(pattern, html, re.S):
        html = re.sub(pattern, lambda _: block, html, flags=re.S)
    else:
        html = re.sub(r'</html\s*>', lambda m: block + '\n' + m.group(), html, count=1, flags=re.I)
    # Match only the CSP meta tag, never JavaScript strings inside decorations.
    def allow_scripts(meta):
        return re.sub(r'(script-src)([^;]*)(;)',
                      lambda m: m.group() if "'unsafe-inline'" in m[2]
                      else m[1] + " 'unsafe-inline'" + m[2] + m[3], meta.group())
    return re.sub(r'<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>',
                  allow_scripts, html, flags=re.I)


def restore_statusbar(path, root):
    script = path.read_text()
    # Anchor to the statusbar class ID: never replace unrelated HEIGHT values.
    pattern = re.compile(r'(static\s+HEIGHT\s*=\s*)(22|86|160)(\s*;\s*static\s+ID\s*=\s*["\']workbench\.parts\.statusbar["\'])')
    matches = list(pattern.finditer(script))
    if not matches:
        # Newer builds emit static initialization blocks and put the ID in
        # floatingBottomPadding instead of an adjacent static field.
        pattern = re.compile(
            r'(static\{this\.HEIGHT=)(22|86|160)'
            r'(\}static\{this\.FLOATING_BOTTOM_PADDING=6\}'
            r'static\{this\.COMPACT_DENSITY_FLOATING_BOTTOM_PADDING=4\}'
            r'get floatingBottomPadding\(\)\{return this\.getId\(\)!=='
            r'"workbench\.parts\.statusbar")')
        matches = list(pattern.finditer(script))
    if not matches:
        # VS Code 1.135 uses a single floating padding and a positive ID check.
        pattern = re.compile(
            r'(static\{this\.HEIGHT=)(22|86|160)'
            r'(\}static\{this\.FLOATING_BOTTOM_PADDING=6\}'
            r'get floatingBottomPadding\(\)\{return this\.getId\(\)==='
            r'"workbench\.parts\.statusbar"&&this\.layoutService\.isFloatingPanelsEnabled\(\))')
        matches = list(pattern.finditer(script))
    if len(matches) != 1:
        diagnostics = root / '.reload-helper/statusbar-layout.txt'
        diagnostics.parent.mkdir(parents=True, exist_ok=True)
        diagnostics.write_text('\n\n'.join(
            script[max(0, m.start() - 500):m.end() + 500]
            for m in re.finditer(r'workbench\.parts\.statusbar', script)))
        print('Status-bar spacing needs review: this VS Code version uses an unfamiliar layout. Left its JavaScript unchanged.')
        raise RuntimeError('Cannot reserve bottom space; status-bar layout did not match. See ' + str(diagnostics))
    if matches[0][2] == '160':
        return
    backup = root / 'backups' / ('workbench.desktop.main.js.before-restore-' + datetime.now().strftime('%y%m%d-%H%M%S-%f'))
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, backup)
    path.write_text(pattern.sub(lambda m: m[1] + '160' + m[3], script, count=1))
    print('Restored grass space. Backup:', backup.name)
