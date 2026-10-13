from pathlib import Path
import re
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
TERMINAL = ('this._commandService=commands;get staticTitle(){return this._staticTitle}async rename(e){this._setTitle(e,0)}'
            'this.onTitleChanged=this._onTitleChanged.event;'
            'this._lastLayoutDimensions&&this.layout(this._lastLayoutDimensions);'
            'this._wrapperElement.xterm=t.raw;let i=t.attachToElement(e);')


class RestoreTests(unittest.TestCase):
    def test_v135_statusbar_preserves_other_heights(self):
        from restore_support import restore_statusbar
        current = ('static{this.HEIGHT=22}static{this.FLOATING_BOTTOM_PADDING=6}'
                   'get floatingBottomPadding(){return this.getId()==="workbench.parts.statusbar"'
                   '&&this.layoutService.isFloatingPanelsEnabled()?yK.FLOATING_BOTTOM_PADDING:0}')
        unrelated = 'static{this.HEIGHT=22}static{this.SCROLLBAR_SIZES={default:3,large:8}}'
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / 'workbench.js'
            path.write_text(unrelated + current)
            restore_statusbar(path, root)
            expected = unrelated + current.replace('HEIGHT=22', 'HEIGHT=160')
            self.assertEqual(path.read_text(), expected)
            restore_statusbar(path, root)
            self.assertEqual(path.read_text(), expected)
            self.assertEqual(len(list((root / 'backups').glob('*'))), 1)

    def test_paper_is_behind_text_and_grass_is_clipped(self):
        import base64
        from restore_support import restore_foundation
        old = '<html><body></body><!-- vscode-background-start old -->foreground overlay<!-- vscode-background-end --></html>'
        restored = restore_foundation(old, ROOT)
        self.assertNotIn('foreground overlay', restored)
        self.assertIn('background-image:var(--doodles-paper)', restored)
        self.assertIn('clip-path:inset(calc(100% - 28px) 0 0)', restored)
        self.assertNotIn('transition:1s', restored)
        assets = re.findall(r'data:image/svg\+xml;base64,([^"\)]+)', restored)
        paper, grass = [base64.b64decode(asset).decode() for asset in assets]
        self.assertIn('fill="url(#paper)"', paper)
        self.assertNotIn('<rect', grass)
        self.assertNotIn('data:image/jpeg', grass)
        self.assertIn('data:image/png', grass)
        self.assertIn('grass-breeze', grass)
        self.assertEqual(restore_foundation(restored, ROOT), restored)

    def test_terminal_bridge_restore_and_idempotence(self):
        from restore_support import restore_terminal_goals, terminal_goal_bridge
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / 'workbench.js'
            path.write_text(TERMINAL)
            restore_terminal_goals(path, root, check=True)
            self.assertEqual(path.read_text(), TERMINAL)
            restore_terminal_goals(path, root)
            restored = path.read_text()
            self.assertIn('this._wrapperElement.pastureGoal=', restored)
            self.assertIn('getTitle:()=>this.staticTitle||""', restored)
            self.assertNotIn("doodlesPrepareTerminal", restored)
            old = restored.replace("/* doodles-terminal-goal-bridge */",
                                   "/* doodles-terminal-goal-bridge */window.doodlesPrepareTerminal?.(this._wrapperElement.xterm);")
            self.assertEqual(terminal_goal_bridge(old), restored)
            restore_terminal_goals(path, root)
            self.assertEqual(path.read_text(), restored)
            self.assertEqual(len(list((root / 'backups').glob('*'))), 1)
        for script in ('unknown layout', TERMINAL + TERMINAL):
            with self.assertRaises(RuntimeError):
                terminal_goal_bridge(script)

    def test_current_statusbar_layout(self):
        from restore_support import restore_statusbar
        current = 'tryVisibility,this.hoverDelegate=this._register(this.instantiationService.createInstance(Wg,"element",{instantHover:!0,dynamicDelay(g){if(typeof g=="function"||Li(g)||CNe(g)&&typeof g.markdown=="function"||KNo(g))return 500}},(g,f)=>({persistence:{hideOnKeyDown:!0,sticky:f},appearance:{maxHeightRatio:.9}}))),this.registerListeners()}static{this.HEIGHT=22}static{this.FLOATING_BOTTOM_PADDING=6}static{this.COMPACT_DENSITY_FLOATING_BOTTOM_PADDING=4}get floatingBottomPadding(){return this.getId()!=="workbench.parts.statusbar"||!this.layoutService.isFloatingPanelsEnabled()?0:this.layoutService.isModernUICompact()?uU.COMPACT_DENSITY_FLOATING_BOTTOM_PADDING:uU.FLOATING_BOTTOM_PADDING}get minimumHeight(){return uU.HEIGHT+this.floatingBottomPadding}get maximumHeight(){return uU.HEIGHT+this.floatingBottomPadding}registerListeners(){this._register(this.onDidChangeEntryVisibility(()=>this.updateCompactEntries())),this._register(this.contextService.onDidChangeWorkbenchState(()=>this.updateStyles()));let e=()=>{this.element&'
        for height in (22, 86, 160):
            with self.subTest(height=height), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                js = root / 'workbench.js'
                original = 'class Other {static HEIGHT=22;}' + current.replace('this.HEIGHT=22', f'this.HEIGHT={height}')
                js.write_text(original)
                restore_statusbar(js, root)
                self.assertEqual(js.read_text(), original.replace(f'this.HEIGHT={height}', 'this.HEIGHT=160'))
                restore_statusbar(js, root)
                self.assertEqual(len(list((root / 'backups').glob('*'))), 0 if height == 160 else 1)

    def test_clean_updated_workbench_and_repeat_apply(self):
        clean = '<html><head><meta http-equiv="Content-Security-Policy" content="script-src self;"></head><body><script src="./workbench.js" type="module"></script></body></html>'
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / 'out/vs/code/electron-browser/workbench/workbench.html'
            page.parent.mkdir(parents=True)
            page.write_text(clean + '<!-- margin-snowglobe-start -->old statue<!-- margin-snowglobe-end -->'
                            '<!-- string-lights-start -->old lights<!-- string-lights-end -->'
                            '<!-- dark-mode-start -->old dark mode<!-- dark-mode-end -->')
            js = root / 'out/vs/workbench/workbench.desktop.main.js'
            js.parent.mkdir(parents=True)
            js.write_text('class Test {static HEIGHT=22;static ID="workbench.parts.statusbar";}' + TERMINAL)
            (root / 'backups').mkdir()
            (root / 'src').symlink_to(ROOT / 'src', target_is_directory=True)
            (root / 'daylight-sky').symlink_to(ROOT / 'daylight-sky', target_is_directory=True)
            source = (ROOT / 'apply.py').read_text().replace('HERE = Path(__file__).resolve().parent', 'HERE = Path(' + repr(str(root)) + ')')
            source = source.replace("Path.home() / '.vscode/extensions/local-custom.daylight-sky-0.0.1/extension.js'", "HERE / 'installed-sky.js'")
            (root / 'installed-sky.js').write_text('old extension')
            source = re.sub(r'^W = Path\(.*$', lambda _: 'W = Path(' + repr(str(page)) + ')', source, flags=re.M)
            original_argv = sys.argv
            try:
                sys.argv = ['apply.py', '--no-reload']
                for run in range(2):
                    with self.assertRaises(SystemExit) as exit:
                        exec(compile(source, str(ROOT / 'apply.py'), 'exec'), {'__file__': str(ROOT / 'apply.py')})
                    self.assertEqual(exit.exception.code, 0)
                    if run == 0:
                        first = page.read_bytes()
                    else:
                        self.assertEqual(page.read_bytes(), first)
            finally:
                sys.argv = original_argv
            html = page.read_text()
            self.assertEqual((root / 'installed-sky.js').read_bytes(), (ROOT / 'daylight-sky/extension.js').read_bytes())
            self.assertNotIn('margin-snowglobe', html)
            self.assertNotIn('<!-- string-lights-start -->', html)
            self.assertNotIn('<!-- dark-mode-start -->', html)
            self.assertIn('setDarkMode:enabled=>', js.read_text())
            self.assertEqual((root / 'appearance.js').read_bytes(), (ROOT / 'src/world/host-appearance.js').read_bytes())
            self.assertNotIn('<!-- evolution-assets-start -->', html)
            self.assertEqual(html.count('<!-- terminal-eyes-start -->'), 1)
            self.assertEqual(html.count('<!-- doodles-world-start -->'), 1)
            self.assertLess(html.index('<!-- doodles-world-start -->'), min(html.index('<!-- '+name+'-start -->') for name in ('terminal-eyes', 'pixel-disco', 'pasture-run', 'ktown-weather')))
            for name in ['ktown-weather', 'neutral-focus-dim', 'pasture-audio', 'pasture-sheep', 'pasture-fireflies', 'pixel-disco', 'pasture-flowers', 'pasture-run', 'terminal-goals', 'pixel-goldfish', 'night-sky', 'cozy-mode']:
                self.assertEqual(html.count('<!-- ' + name + '-start -->'), 1)
            self.assertIn('static HEIGHT=160', js.read_text())
            self.assertIn('<script src="./workbench.js" type="module"></script>', html)
            self.assertIn("script-src 'unsafe-inline'", html)
            self.assertIn('this._wrapperElement.pastureGoal=', js.read_text())
            self.assertEqual(len(list((root / 'backups').glob('*.before-*'))), 4)


if __name__ == '__main__':
    unittest.main()
