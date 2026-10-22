#!/usr/bin/env python3
"""Quản lý file credential cho bộ skill autotest-* — KHÔNG BAO GIỜ in giá trị ra stdout.

2 loại file (cùng cơ chế với pqa-final-inspection):
  shared  : ~/.vds/sdlc-config.env      — credential công cụ theo người dùng (Confluence, Jenkins API),
                                           dùng chung với VDS Skill Pack.
  project : automation_test/.env         — credential chạy test theo project (tài khoản app, DB, farm...).

Chưa có file -> tạo mới (quyền 600, O_EXCL) với ĐỦ bộ key chuẩn của autotest (CATALOG), value để trống.
Đã có file   -> chỉ APPEND key còn thiếu (value rỗng) ở cuối file; không bao giờ sửa/xoá dòng đã có,
                không bao giờ điền value.

Usage:
  python3 cred_env.py init  --scope project                       # tạo/bổ sung đủ bộ key chuẩn
  python3 cred_env.py init  --scope shared  --keys VDS_JENKINS_X_USER VDS_JENKINS_X_TOKEN
  python3 cred_env.py check --scope project --keys API_USERNAME API_PASSWORD
          (tự thêm key còn thiếu như init, rồi báo SET/EMPTY/MISSING + in hướng dẫn điền)
  python3 cred_env.py slug  --system confluence --url http://10.254.136.35:8090/pages/...
  python3 cred_env.py scan  --files automation_test/docs/global-data.md automation_test/common/common_variables.resource
  python3 cred_env.py run   --scope shared --curl-user VDS_JENKINS_X_USER:VDS_JENKINS_X_TOKEN -- curl -s -K - https://jenkins.x/api/json
          (--curl-user tự sinh dòng `user = "u:p"` (đã escape) và pipe vào stdin của curl -K -; --keys/--stdin
           cho lệnh khác. Giá trị không nằm trên command line, không cần shell, không có vấn đề quote
           => chạy giống nhau trên Windows PowerShell / cmd / macOS / Linux)
  python3 cred_env.py ignore --path automation_test/docs/global-data.md   # thêm dòng vào .gitignore nếu chưa có

Windows: gọi bằng `python` hoặc `py -3` thay cho `python3`. Script chỉ dùng thư viện chuẩn.

Exit code: 0 = OK / đủ giá trị; 2 = còn key thiếu/rỗng (check) hoặc phát hiện nghi credential (scan);
           1 = lỗi dùng sai.
"""
import argparse
import os
import re
import shutil
import sys
from urllib.parse import urlparse

# Console Windows mặc định cp1252/cp437 -> in tiếng Việt sẽ UnicodeEncodeError. Ép UTF-8.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOADER_TEMPLATE = os.path.join(SKILL_DIR, "templates", "env_secrets.py")
LOADER_TARGET = os.path.join("automation_test", "python_lib", "env_secrets.py")

SHARED_FILE = os.path.join(os.path.expanduser("~"), ".vds", "sdlc-config.env")
PROJECT_FILE = os.path.join("automation_test", ".env")
PROJECT_EXAMPLE = os.path.join("automation_test", ".env.example")
GITIGNORE_ENTRY = "automation_test/.env"

HEADER = {
    "shared": (
        "# ~/.vds/sdlc-config.env — credential công cụ, dùng chung cho VDS Skill Pack.\n"
        "# Điền giá trị sau dấu '=' (không cần dấu nháy). KHÔNG dán giá trị này vào chat.\n"
    ),
    "project": (
        "# automation_test/.env — credential chạy test của project này (đã gitignore, KHÔNG commit).\n"
        "# Điền giá trị sau dấu '=' (không cần dấu nháy). KHÔNG dán giá trị này vào chat.\n"
        "# Biến môi trường cùng tên (vd Jenkins inject) sẽ ghi đè giá trị trong file này khi chạy.\n"
        "# Danh sách key (không có giá trị) được commit ở automation_test/.env.example.\n"
    ),
}

# Bộ key chuẩn — ghi sẵn khi tạo file lần đầu. (tên nhóm, chú thích, [key...])
CATALOG = {
    "project": [
        ("Web login — autotest-rf-web", "chỉ điền nếu app web cần đăng nhập; nhiều role -> thêm WEB_<ROLE>_USERNAME/_PASSWORD",
         ["WEB_USERNAME", "WEB_PASSWORD"]),
        ("API login — autotest-rf-api", "USERNAME/PASSWORD cho endpoint login, hoặc API_KEY nếu auth bằng API key",
         ["API_USERNAME", "API_PASSWORD", "API_KEY"]),
        ("App login — autotest-rf-android / autotest-rf-ios", "tài khoản đăng nhập app; nhiều role -> APP_<ROLE>_USERNAME/_PASSWORD",
         ["APP_USERNAME", "APP_PASSWORD"]),
        ("Device farm — autotest-rf-android / autotest-rf-ios", "chỉ điền nếu chạy trên device farm (MCloud)",
         ["FARM_USERNAME", "FARM_ACCESS_KEY"]),
        ("Database — autotest-rf-db", "chỉ điền nếu TC có kiểm tra/chuẩn bị dữ liệu DB",
         ["DB_USER", "DB_PASS"]),
        ("SSH tunnel tới DB — autotest-rf-db", "chỉ điền nếu DB phải đi qua SSH tunnel; DB_TUNNEL_SSH_KEY = đường dẫn file private key",
         ["DB_TUNNEL_SSH_USER", "DB_TUNNEL_SSH_KEY"]),
        ("OTP — TOTP secret", "chỉ điền nếu TC có bước OTP dạng TOTP (Google Authenticator)",
         ["TOTP_SECRET"]),
        ("Proxy công ty — autotest-rf-web", "chỉ điền nếu proxy ra internet cần đăng nhập (URL proxy không kèm user/pass nằm ở global-data.md)",
         ["PROXY_USERNAME", "PROXY_PASSWORD"]),
    ],
    "shared": [
        ("Confluence — autotest-project-docs (+ VDS Skill Pack)",
         "mỗi host 1 bộ; điền TOKEN (Personal Access Token) HOẶC USER + PASSWORD",
         ["VDS_CONFLUENCE_DIGITAL_VN_USER", "VDS_CONFLUENCE_DIGITAL_VN_PASSWORD", "VDS_CONFLUENCE_DIGITAL_VN_TOKEN",
          "VDS_CONFLUENCE_10_254_136_35_USER", "VDS_CONFLUENCE_10_254_136_35_PASSWORD", "VDS_CONFLUENCE_10_254_136_35_TOKEN",
          "VDS_CONFLUENCE_10_254_136_32_USER", "VDS_CONFLUENCE_10_254_136_32_PASSWORD", "VDS_CONFLUENCE_10_254_136_32_TOKEN"]),
    ],
}

KEY_RE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$")


def parse_env(path):
    """Trả về dict key -> value (đã bỏ nháy bao ngoài). Không in gì."""
    data = {}
    if not os.path.isfile(path):
        return data
    with open(path, encoding="utf-8-sig") as f:  # -sig: .env lưu bằng Notepad (Windows) có BOM
        for line in f:
            if line.lstrip().startswith("#"):
                continue
            m = KEY_RE.match(line.rstrip("\n"))
            if not m:
                continue
            val = m.group(2).strip()
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            data[m.group(1)] = val
    return data


def resolve_path(scope, override):
    if override:
        return override
    return SHARED_FILE if scope == "shared" else PROJECT_FILE


def _create_exclusive(path, content, mode=0o600):
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, mode=0o700, exist_ok=True)
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, mode)  # mode bị bỏ qua trên Windows (dùng ACL thư mục user)
    with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def _ensure_gitignore(entry=GITIGNORE_ENTRY, also_covered=(".env", "**/.env")):
    path = ".gitignore"
    raw = ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            raw = f.read()
    lines = [l.strip() for l in raw.splitlines()]
    entry = entry.replace("\\", "/")
    covered = {entry, "/" + entry, "automation_test/", "automation_test", *also_covered}
    if covered & set(lines):
        return False
    with open(path, "a", encoding="utf-8", newline="\n") as f:
        if raw and not raw.endswith("\n"):
            f.write("\n")
        f.write(entry + "\n")
    return True


def _ensure_loader():
    """Copy env_secrets.py vào automation_test/python_lib/ nếu chưa có (không ghi đè)."""
    if os.path.isfile(LOADER_TARGET) or not os.path.isfile(LOADER_TEMPLATE):
        return False
    os.makedirs(os.path.dirname(LOADER_TARGET), exist_ok=True)
    shutil.copyfile(LOADER_TEMPLATE, LOADER_TARGET)
    return True


def _sync_example(keys, comment):
    """automation_test/.env.example: chỉ tên key, không có giá trị — để commit."""
    if not os.path.isfile(PROJECT_EXAMPLE):
        body = _catalog_text("project", keys, comment).replace(HEADER["project"], "")
        _create_exclusive(PROJECT_EXAMPLE, "# Danh sách key credential (KHÔNG có giá trị) — điền giá trị thật ở automation_test/.env.\n" + body, mode=0o644)
        return list(parse_env(PROJECT_EXAMPLE))
    existing = parse_env(PROJECT_EXAMPLE)
    missing = [k for k in keys if k not in existing]
    if missing:
        with open(PROJECT_EXAMPLE, "a", encoding="utf-8", newline="\n") as f:
            f.write(f"\n# ── {comment or 'Bổ sung'}\n")
            for k in missing:
                f.write(f"{k}=\n")
    return missing


def _catalog_text(scope, extra_keys, comment):
    """Nội dung file mới: đủ bộ key chuẩn + key được yêu cầu thêm (nếu ngoài catalog)."""
    out, known = [HEADER[scope]], set()
    for title, note, keys in CATALOG[scope]:
        out.append(f"\n# ── {title}\n# {note}\n" + "".join(f"{k}=\n" for k in keys))
        known.update(keys)
    extra = [k for k in extra_keys if k not in known]
    if extra:
        out.append(f"\n# ── {comment or 'Bổ sung'}\n" + "".join(f"{k}=\n" for k in extra))
    return "".join(out)


def ensure_keys(scope, path, keys, comment, is_default_path):
    """Tạo file (đủ catalog) nếu chưa có; có rồi thì append key còn thiếu. Trả về list thông điệp."""
    msgs = []
    if not os.path.isfile(path):
        _create_exclusive(path, _catalog_text(scope, keys, comment))
        total = len(parse_env(path))
        msgs.append(f"CREATED {path} (quyền 600) — ghi sẵn {total} key chuẩn, mọi value để trống.")
    else:
        if os.name == "posix" and os.stat(path).st_mode & 0o077:
            os.chmod(path, 0o600)  # file user tự tạo thường là 644 -> ai trên máy cũng đọc được
            msgs.append(f"CHMOD {path} -> 600 (trước đó người khác trên máy đọc được).")
        existing = parse_env(path)
        missing = [k for k in keys if k not in existing]
        if missing:
            with open(path, "a", encoding="utf-8", newline="\n") as f:
                f.write(f"\n# ── {comment or 'Bổ sung'}\n" + "".join(f"{k}=\n" for k in missing))
            msgs.append(f"APPENDED {path} — thêm {len(missing)} key rỗng: {', '.join(missing)} "
                        f"(không sửa dòng đã có).")
    if scope == "project" and is_default_path:
        catalog_keys = [k for _, _, ks in CATALOG["project"] for k in ks]
        added = _sync_example(list(dict.fromkeys(catalog_keys + keys)), comment)
        if added:
            msgs.append(f"EXAMPLE {PROJECT_EXAMPLE} — thêm {len(added)} tên key (không có giá trị, được phép commit).")
        if _ensure_gitignore():
            msgs.append(f"GITIGNORE thêm '{GITIGNORE_ENTRY}' vào .gitignore")
        if _ensure_loader():
            msgs.append(f"LOADER copy {LOADER_TARGET} (variable file nạp .env cho Robot Framework)")
    return msgs


def cmd_init(args):
    path = resolve_path(args.scope, args.file)
    keys = list(dict.fromkeys(args.keys or []))
    if os.path.isfile(path) and not keys:
        keys = [k for _, _, ks in CATALOG[args.scope] for k in ks]
    msgs = ensure_keys(args.scope, path, keys, args.comment, not args.file)
    print("\n".join(msgs) if msgs else f"EXISTS {path} — đã có đủ key.")
    return 0


def cmd_check(args):
    path = resolve_path(args.scope, args.file)
    keys = list(dict.fromkeys(args.keys))
    for m in ensure_keys(args.scope, path, keys, args.comment, not args.file):
        print(m)
    data = parse_env(path)
    todo = []
    print(f"FILE {path}")
    for k in keys:
        if os.environ.get(k):
            state = "SET (biến môi trường)"
        elif data.get(k, "") == "" or data[k].lower() in {"placeholder", "changeme", "your_password", "your_username", "..."}:
            state = "EMPTY"
            todo.append(k)
        else:
            state = "SET"
        print(f"  {k}: {state}")
    if todo:
        print("\nHƯỚNG DẪN (chuyển nguyên cho user):")
        print(f"  Mở file {path} bằng editor, điền giá trị ngay sau dấu '=' cho các key sau (không cần dấu nháy):")
        for k in todo:
            print(f"    {k}=")
        print("  Không dán giá trị vào chat. Điền xong báo \"xong\" để kiểm tra lại.")
    return 2 if todo else 0


def cmd_run(args):
    path = resolve_path(args.scope, args.file)
    data = parse_env(path)
    args.keys = list(args.keys or [])
    if args.curl_user:
        if ":" not in args.curl_user:
            print("--curl-user cần dạng USER_KEY:PASS_KEY", file=sys.stderr)
            return 1
        ukey, pkey = args.curl_user.split(":", 1)
        args.keys += [ukey, pkey]
    if not args.keys:
        print("Cần --keys hoặc --curl-user", file=sys.stderr)
        return 1
    missing = [k for k in args.keys if not (os.environ.get(k) or data.get(k))]
    if missing:
        print(f"MISSING trong {path}: {', '.join(missing)} — không chạy lệnh.", file=sys.stderr)
        return 2
    cmd = args.command[1:] if args.command and args.command[0] == "--" else args.command
    if not cmd:
        print("Thiếu lệnh cần chạy sau '--'", file=sys.stderr)
        return 1
    env = dict(os.environ)
    for k in args.keys:
        env[k] = os.environ.get(k) or data[k]
    stdin_data = None
    if args.curl_user:
        esc = lambda v: v.replace("\\", "\\\\").replace('"', '\\"')
        stdin_data = f'user = "{esc(env[ukey])}:{esc(env[pkey])}"\n'
    elif args.stdin is not None:
        stdin_data = re.sub(r"\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}", lambda m: env.get(m.group(1), ""), args.stdin) + "\n"
    import subprocess
    exe = shutil.which(cmd[0]) or cmd[0]  # Windows: tìm đúng curl.exe/... theo PATHEXT
    # Output lệnh con đi thẳng vào chat của agent -> che mọi giá trị vừa nạp (kể cả khi lệnh con lỡ in ra).
    secrets = sorted({env[k] for k in args.keys if len(env[k]) >= 4}, key=len, reverse=True)
    proc = subprocess.Popen([exe] + cmd[1:], env=env, text=True, encoding="utf-8", errors="replace",
                            stdin=subprocess.PIPE if stdin_data is not None else None,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if stdin_data is not None:
        proc.stdin.write(stdin_data)
        proc.stdin.close()
    for line in proc.stdout:
        for s in secrets:
            line = line.replace(s, "***")
        sys.stdout.write(line)
        sys.stdout.flush()
    return proc.wait()


def cmd_ignore(args):
    for pth in args.path:
        print(("GITIGNORE thêm '" + pth + "'") if _ensure_gitignore(pth, ()) else ("GITIGNORE đã có '" + pth + "'"))
    return 0


def host_slug(system, url):
    host = urlparse(url if "://" in url else "http://" + url).hostname or url
    prefix = system.lower() + "."
    if host.lower().startswith(prefix):
        host = host[len(prefix):]
    return re.sub(r"[^A-Za-z0-9]", "_", host).upper()


def cmd_slug(args):
    slug = host_slug(args.system, args.url)
    base = f"VDS_{args.system.upper()}_{slug}"
    print(f"{base}_USER {base}_PASSWORD {base}_TOKEN")
    return 0


_CRED_WORD = r"(password|passwd|\bpass\b|token|secret|access[_ -]?key|api[_ -]?key|private[_ -]?key)"
SUSPECT_RES = [
    # markdown / yaml / .env / python:  Password: `x`, **Password:** `x`, password = "x", | Password | x |
    # khoảng giữa từ khoá và dấu phân cách chỉ cho phép ký tự "nhãn" ngắn (vd "_1", " **") — tránh bắt câu văn xuôi
    re.compile(r"(?i)" + _CRED_WORD + r"[\w*` \-]{0,8}[:=|][*\s`'\"]*([^\s`|*'\",]{3,})"),
    # Robot Framework Variables section:  ${API_PASSWORD}    literal
    re.compile(r"(?i)\$\{\w*" + _CRED_WORD + r"\w*\}\s{2,}([^\s#]{3,})"),
]
SAFE_VALUES = re.compile(r"^(?-i:[A-Z][A-Z0-9_]*)$|^(\$\{.*\}|%\{.*\}|<.*>|\.\.\.|none|null|empty|\$\{EMPTY\}|placeholder.*|your_.*|x+|\*+|field|token|password|access_token|accesstoken)$", re.I)


def cmd_scan(args):
    """Tìm dòng NGHI chứa credential literal — chỉ in file:dòng + tên key, KHÔNG in giá trị."""
    import glob
    hits = 0
    # PowerShell/cmd không tự mở rộng mẫu như data/*.yaml — script tự glob để chạy giống nhau trên mọi OS
    paths = [m for p in args.files for m in (sorted(glob.glob(p)) or [p])]
    for path in paths:
        if not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            for no, line in enumerate(f, 1):
                for rx in SUSPECT_RES:
                    m = rx.search(line)
                    if not m or SAFE_VALUES.match(m.group(2).strip("'\",")):
                        continue
                    hits += 1
                    print(f"SUSPECT {path}:{no} — '{m.group(1)}' có giá trị literal (đã ẩn)")
                    break
    if not hits:
        print("CLEAN — không thấy credential literal.")
    return 2 if hits else 0


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("init", "check"):
        s = sub.add_parser(name)
        s.add_argument("--scope", choices=["shared", "project"], required=True)
        s.add_argument("--keys", nargs="+", required=(name == "check"),
                       help="init: bỏ trống = đủ bộ key chuẩn (CATALOG)")
        s.add_argument("--file", help="(dev/debug) đường dẫn khác thay cho mặc định")
        s.add_argument("--comment", help="chú thích nhóm cho key được append (vd 'Jenkins API — autotest-rf-jenkins')")
    s = sub.add_parser("slug")
    s.add_argument("--system", required=True, help="confluence | jenkins | ...")
    s.add_argument("--url", required=True)
    s = sub.add_parser("scan")
    s.add_argument("--files", nargs="+", required=True)
    s = sub.add_parser("run")
    s.add_argument("--scope", choices=["shared", "project"], required=True)
    s.add_argument("--keys", nargs="+")
    s.add_argument("--curl-user", help="USER_KEY:PASS_KEY — pipe `user = \"u:p\"` vào stdin cho curl -K -")
    s.add_argument("--file", help="(dev/debug) đường dẫn khác thay cho mặc định")
    s.add_argument("--stdin", help="template pipe vào stdin lệnh con, {{KEY}} được thay bằng giá trị (vd cho curl -K -)")
    s.add_argument("command", nargs=argparse.REMAINDER, help="-- <lệnh> ...")
    s = sub.add_parser("ignore")
    s.add_argument("--path", nargs="+", required=True, help="đường dẫn (tương đối từ root project) cần gitignore")
    args = p.parse_args()
    return {"init": cmd_init, "check": cmd_check, "slug": cmd_slug, "scan": cmd_scan,
            "run": cmd_run, "ignore": cmd_ignore}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
