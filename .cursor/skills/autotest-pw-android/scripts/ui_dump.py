#!/usr/bin/env python3
"""Live screen inspection for autotest-pw-android (stdlib only, macOS/Linux/Windows).

Dumps the current Android screen with UiAutomator and prints every meaningful node together with the
Playwright `AndroidSelector` to use in screens/<feature>/<Name>Screen.ts. Optional screenshot.

  python3 ui_dump.py [--serial SERIAL] [--pkg com.app] [--filter text] [--screenshot out.png] [--xml file.xml]

--xml  parse an existing dump instead of calling adb (offline / tests)
Selector priority printed: res (resource-id) > desc (content-desc) > text (exact) > clazz+text.
Exit: 0 OK, 1 adb/dump error.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


ADB_PORT: str | None = None  # --port: adb server riêng của farm (FARM_ADB_PORT, mặc định 5038)


def adb_bin() -> str:
    """adb trên PATH, trong Android SDK, hoặc bản support/stf.ts tự tải về ~/.android/stf/platform-tools."""
    exe = "adb.exe" if os.name == "nt" else "adb"
    home = os.path.expanduser("~")
    sdks = [os.environ.get("ANDROID_HOME"), os.environ.get("ANDROID_SDK_ROOT"),
            os.path.join(home, "Library", "Android", "sdk"), os.path.join(home, "Android", "Sdk"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Android", "Sdk")]
    candidates = [os.environ.get("ADB_PATH"), shutil.which("adb")]
    candidates += [os.path.join(d, "platform-tools", exe) for d in sdks if d]
    candidates.append(os.path.join(home, ".android", "stf", "platform-tools", exe))
    return next((c for c in candidates if c and os.path.isfile(c)), "adb")


def adb(serial: str | None, *args: str, binary: bool = False):
    cmd = [adb_bin()] + (["-P", ADB_PORT] if ADB_PORT else []) + (["-s", serial] if serial else []) + list(args)
    out = subprocess.run(cmd, capture_output=True, check=False)
    if out.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)} → {out.stderr.decode(errors='replace').strip()}")
    return out.stdout if binary else out.stdout.decode(errors="replace")


def dump_xml(serial: str | None) -> str:
    adb(serial, "shell", "uiautomator", "dump", "/sdcard/autotest_ui.xml")
    fd, local = tempfile.mkstemp(suffix=".xml")
    os.close(fd)
    adb(serial, "pull", "/sdcard/autotest_ui.xml", local)
    with open(local, encoding="utf-8") as fh:
        text = fh.read()
    os.remove(local)
    return text


def ts_str(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def selector_for(node: dict[str, str], pkg: str | None, dup: bool = False) -> str:
    res, desc, text, clazz = node["resource-id"], node["content-desc"], node["text"], node["class"]
    if res:
        if dup and (text or desc):
            # resource-id dùng chung cho cả danh sách (vd android:id/text1) → phân biệt bằng text/desc
            extra = f"text: {ts_str(text)}" if text else f"desc: {ts_str(desc)}"
            return f"{{ res: {ts_str(res)}, {extra} }}"
        if pkg and res.startswith(pkg + ":id/"):
            return f"id({ts_str(res.split(':id/', 1)[1])})   // {{ res: {ts_str(res)} }}"
        return f"{{ res: {ts_str(res)} }}"
    if desc:
        return f"{{ desc: {ts_str(desc)} }}" if not dup else f"{{ clazz: {ts_str(clazz)}, desc: {ts_str(desc)} }}"
    if text:
        return f"{{ text: {ts_str(text)} }}" if not dup else f"{{ clazz: {ts_str(clazz)}, text: {ts_str(text)} }}"
    return f"{{ clazz: {ts_str(clazz)} }}  // không có id/desc/text — cần hasChild/hasDescendant hoặc xin dev thêm resource-id"


def center(bounds: str) -> str:
    """'[x1,y1][x2,y2]' → 'cx cy' for stepping through screens during live discovery."""
    nums = [int(n) for n in bounds.replace("][", ",").strip("[]").split(",")]
    return f"{(nums[0] + nums[2]) // 2} {(nums[1] + nums[3]) // 2}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--serial")
    ap.add_argument("--port", help="cổng adb server (máy farm qua stf.ts: 5038, xem dòng in ra của `stf.ts acquire`)")
    ap.add_argument("--pkg", help="app package — chỉ in node của app này và rút gọn id")
    ap.add_argument("--filter", help="chỉ in node có text/desc/id chứa chuỗi này (không phân biệt hoa thường)")
    ap.add_argument("--screenshot")
    ap.add_argument("--xml", help="đọc file dump có sẵn thay vì gọi adb")
    args = ap.parse_args()
    global ADB_PORT
    ADB_PORT = args.port
    try:
        raw = open(args.xml, encoding="utf-8").read() if args.xml else dump_xml(args.serial)
        if args.screenshot:
            with open(args.screenshot, "wb") as fh:
                fh.write(adb(args.serial, "exec-out", "screencap", "-p", binary=True))
    except (RuntimeError, OSError) as exc:
        print(f"ERROR {exc}", file=sys.stderr)
        return 1

    root = ET.fromstring(raw[raw.index("<"):])
    counts: dict[tuple[str, str], int] = {}
    rows = []
    for el in root.iter("node"):
        node = {k: el.get(k, "") for k in ("resource-id", "text", "content-desc", "class", "package", "clickable", "scrollable", "bounds", "enabled", "checked")}
        if args.pkg and node["package"] != args.pkg:
            continue
        if not (node["resource-id"] or node["text"] or node["content-desc"] or node["clickable"] == "true" or node["scrollable"] == "true"):
            continue
        key = ("res", node["resource-id"]) if node["resource-id"] else ("text", node["text"] or node["content-desc"])
        counts[key] = counts.get(key, 0) + 1  # đếm trên TOÀN màn hình, trước khi lọc
        hay = " ".join((node["resource-id"], node["text"], node["content-desc"])).lower()
        if args.filter and args.filter.lower() not in hay:
            continue
        rows.append((node, key))

    print(f"# {len(rows)} node — package filter: {args.pkg or '(none)'}")
    for node, key in rows:
        flags = ",".join(f for f, on in (("click", node["clickable"] == "true"), ("scroll", node["scrollable"] == "true"),
                                          ("disabled", node["enabled"] == "false"), ("checked", node["checked"] == "true")) if on)
        dup = f"  ⚠ trùng x{counts[key]}" if counts[key] > 1 else ""
        label = node["text"] or node["content-desc"] or ""
        print(f"- {node['class'].split('.')[-1]:<14} {label[:40]!r:<44} [{flags}] {node['bounds']}{dup}\n    selector: {selector_for(node, args.pkg, counts[key] > 1)}"
              f"\n    live tap (chỉ để dò, không dùng trong code): adb shell input tap {center(node['bounds'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
