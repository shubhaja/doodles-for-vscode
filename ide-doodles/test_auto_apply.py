import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('auto_apply', Path(__file__).with_name('auto-apply.py'))
auto = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auto)


class AutoApplyTests(unittest.TestCase):
    def test_applies_once_after_quiet_period_without_reloading(self):
        # Two observations of the same source trigger one apply; the installed
        # page changes afterward and must not trigger an endless apply loop.
        values = iter([b'before', b'before', b'source', b'after', b'source', b'after'])
        with patch.object(auto, 'fingerprint', side_effect=lambda *args: next(values)), \
             patch.object(auto.time, 'monotonic', side_effect=[0, 2, 2, 4]), \
             patch.object(auto.time, 'sleep', side_effect=[None, None, KeyboardInterrupt]), \
             patch.object(auto.subprocess, 'run', return_value=Mock(returncode=0, stdout='', stderr='')) as run:
            with self.assertRaises(KeyboardInterrupt):
                auto.watch()
        run.assert_called_once()
        self.assertEqual(run.call_args.args[0][-1], '--no-reload')

    def test_failed_apply_is_retried_without_another_edit(self):
        with patch.object(auto, 'fingerprint', return_value=b'same'), \
             patch.object(auto.time, 'monotonic', side_effect=[0, 2, 2, 33, 33]), \
             patch.object(auto.time, 'sleep', side_effect=[None, None, KeyboardInterrupt]), \
             patch.object(auto.subprocess, 'run', return_value=Mock(returncode=1, stdout='', stderr='failed')) as run:
            with self.assertRaises(KeyboardInterrupt):
                auto.watch()
        self.assertEqual(run.call_count, 2)


if __name__ == '__main__':
    unittest.main()
