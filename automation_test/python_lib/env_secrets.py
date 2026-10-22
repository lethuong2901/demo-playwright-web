"""Robot Framework variable file — nạp credential chạy test, không hardcode trong repo.

Copy vào automation_test/python_lib/env_secrets.py (autotest-credentials scaffold).
Import DUY NHẤT 1 chỗ: Settings của automation_test/common/common_variables.resource
    Variables    ../python_lib/env_secrets.py

Thứ tự ưu tiên cho mỗi key: biến môi trường (vd Jenkins inject) > file .env > rỗng.
File .env: $AUTOTEST_ENV_FILE nếu có, ngược lại automation_test/.env.
Tập key = key trong automation_test/.env.example ∪ key trong file .env.
"""
import os
import re

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # automation_test/
_KEY_RE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$")


def _parse(path):
    data = {}
    if not path or not os.path.isfile(path):
        return data
    with open(path, encoding="utf-8-sig") as f:  # -sig: .env lưu bằng Notepad (Windows) có BOM
        for line in f:
            if line.lstrip().startswith("#"):
                continue
            m = _KEY_RE.match(line.rstrip("\n"))
            if not m:
                continue
            val = m.group(2).strip()
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            data[m.group(1)] = val
    return data


def get_variables():
    env_file = os.environ.get("AUTOTEST_ENV_FILE") or os.path.join(_ROOT, ".env")
    values = _parse(env_file)
    keys = set(_parse(os.path.join(_ROOT, ".env.example"))) | set(values)
    return {k: os.environ.get(k) or values.get(k, "") for k in sorted(keys)}
