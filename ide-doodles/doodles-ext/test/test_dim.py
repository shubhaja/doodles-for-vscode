"""Regression checks for the legacy shell hook; run with python3 test/test_dim.py."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[2] / "src/terminal/term-dim"

class BackgroundTest(unittest.TestCase):
    def run_background(self, fixture, override=""):
        text = SOURCE.read_text()
        function = text[text.index("theme_bg() {"):text.index("\nfind_owner()")]
        # Isolate the resolver from real user settings without changing HOME.
        function = function.replace("$HOME", str(fixture))
        return subprocess.run(
            ["zsh", "-c", function + "\ntheme_bg"],
            env={**os.environ, "DOODLES_TERMINAL_BACKGROUND": override},
            text=True, capture_output=True)

    def test_missing_settings_never_invent_black(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            result = self.run_background(Path(tmp).resolve())
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, "")

    def test_explicit_color(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            result = self.run_background(Path(tmp).resolve(), "#d6edf9")
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout.strip(), "#d6edf9")

    def test_invalid_color_is_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            result = self.run_background(Path(tmp).resolve(), "#123456;echo bad")
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, "")

    def test_reads_actual_terminal_override(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            root = Path(tmp).resolve()
            settings = root / "Library/Application Support/Code/User/settings.json"
            settings.parent.mkdir(parents=True)
            settings.write_text('{"workbench.colorCustomizations":{"terminal.background":"#c3e4f7"}}')
            result = self.run_background(root)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout.strip(), "#c3e4f7")

if __name__ == "__main__":
    unittest.main()
