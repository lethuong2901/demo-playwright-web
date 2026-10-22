#!/usr/bin/env python3
"""
confluence_fetch.py — Fetch a Confluence page and convert to clean Markdown.

Usage:
  python confluence_fetch.py --base-url http://host:8090 --url <page-url>
  python confluence_fetch.py --base-url http://host:8090 --page-id 123456

Credential: tự đọc từ ~/.vds/sdlc-config.env (xem .claude/skills/autotest-credentials/SKILL.md),
biến môi trường cùng tên ghi đè giá trị trong file. Thứ tự thử:
  VDS_CONFLUENCE_<HOST_SLUG>_TOKEN (Bearer)  ->  VDS_CONFLUENCE_<HOST_SLUG>_USER + _PASSWORD (Basic)
  ->  legacy VDS_CONFLUENCE_TOKEN (Bearer)  ->  legacy VDS_CONFLUENCE_USER + VDS_CONFLUENCE_TOKEN (Basic)
Không bao giờ in giá trị credential. Không có cờ nhận token trên dòng lệnh — chỉ đọc từ file/biến môi trường.

Output: JSON to stdout
  { "page_id": "...", "title": "...", "url": "...", "markdown": "..." }
"""

import sys
import json
import re
import argparse
import urllib.request
import urllib.parse
import html as html_module
import os
import base64
import urllib.error
from html.parser import HTMLParser

# Console Windows mặc định cp1252 -> in JSON tiếng Việt (ensure_ascii=False) sẽ lỗi. Ép UTF-8.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass

DEFAULT_ENV_FILE = os.path.join(os.path.expanduser('~'), '.vds', 'sdlc-config.env')
_AUTH = {'candidates': [], 'chosen': None}


# ---------------------------------------------------------------------------
# Page ID extraction
# ---------------------------------------------------------------------------

def extract_page_id(url):
    """Pull the numeric Confluence page ID from various URL forms."""
    # ?pageId=123456
    m = re.search(r'[?&]pageId=(\d+)', url)
    if m:
        return m.group(1)
    # /pages/123456/Title  (Confluence Cloud style)
    m = re.search(r'/pages/(\d+)', url)
    if m:
        return m.group(1)
    # bare numeric string
    if re.fullmatch(r'\d+', url.strip()):
        return url.strip()
    return None


# ---------------------------------------------------------------------------
# Table helpers (rowspan / colspan aware)
# ---------------------------------------------------------------------------

def _span(value):
    """colspan/rowspan attribute → int ≥ 1 (Confluence sometimes writes '' or '0')."""
    try:
        n = int(str(value).strip())
    except (TypeError, ValueError):
        return 1
    return n if n >= 1 else 1


def _cell_text(raw):
    """Flatten one cell's markdown into a single table-safe line.

    Multi-line cell content (paragraphs, lists, nested table) becomes `<br>`
    separated instead of being crushed into one blank-separated blob, and `|` is
    escaped so a cell containing a pipe can't split the row into extra columns.
    """
    text = raw.replace('|', '\\|')
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [ln.strip() for ln in text.split('\n')]
    lines = [ln for ln in lines if ln]
    return '<br>'.join(lines).strip()


def _build_grid(rows):
    """Expand rows with rowspan/colspan into a dense grid.

    Returns (grid, merges, n_rows, n_cols) where grid maps (row, col) → text and
    every position covered by a merged cell carries that cell's text. Follows the
    HTML table model: a cell takes the next free column of its row, so a rowspan
    coming from an earlier row no longer shifts the cells of the rows below it
    (the old renderer ignored spans entirely, which is what mixed rows up).
    """
    grid, occupied, merges = {}, set(), []
    for r, row in enumerate(rows):
        c = 0
        for cell in row:
            while (r, c) in occupied:
                c += 1
            rs, cs = cell['rowspan'], cell['colspan']
            for dr in range(rs):
                for dc in range(cs):
                    occupied.add((r + dr, c + dc))
                    grid[(r + dr, c + dc)] = cell['text']
            if rs > 1 or cs > 1:
                merges.append((r, c, rs, cs, cell['text']))
            c += cs
    n_rows = max([r for r, _ in occupied], default=-1) + 1
    n_rows = max(n_rows, len(rows))
    n_cols = max([c for _, c in occupied], default=-1) + 1
    return grid, merges, n_rows, n_cols


# ---------------------------------------------------------------------------
# HTML → Markdown converter
# ---------------------------------------------------------------------------

class _HTMLToMD(HTMLParser):
    """Single-pass HTML → Markdown converter tuned for Confluence storage format.

    Design goal: never silently drop authored content. Confluence storage format
    wraps most rich content in macros (`ac:structured-macro`) whose real text often
    lives inside a CDATA section (`<![CDATA[...]]>`) — Python's HTMLParser routes
    CDATA to `unknown_decl()`, NOT `handle_data()`, so a naive parser that only
    implements `handle_data()` silently loses code blocks, link labels, etc.
    Only macros that are purely auto-generated listings (toc, children, pagetree...)
    are intentionally skipped — everything else is rendered, even if unlabeled.
    """

    # Truly non-content tags — safe to drop entirely.
    SKIP_TAGS = {'style', 'script', 'head', 'ac:task-id'}

    # Macros whose "content" is auto-generated by Confluence itself (not authored
    # text) — skipping loses nothing meaningful. Attachments are fetched separately.
    MACRO_SKIP_NAMES = {
        'toc', 'anchor', 'children', 'pagetree', 'recently-updated',
        'gallery', 'attachments', 'contentbylabel', 'livesearch', 'include',
    }

    MACRO_LABELS = {
        'info': 'ℹ️ Info',
        'note': '📝 Note',
        'warning': '⚠️ Warning',
        'tip': '💡 Tip',
    }

    # Diagram macros that render an image from an attachment instead of inline text
    # (draw.io / Gliffy). Their authored content lives in the attachment, so the
    # macro is recorded in `diagrams` and a loud placeholder is written into the
    # markdown — never silently dropped.
    DIAGRAM_MACRO_NAMES = {
        'drawio', 'drawio-board', 'drawio-inline', 'drawio-dynamic',
        'drawioshapes', 'gliffy',
    }

    BLOCK_TAGS = {'p', 'div', 'section', 'article', 'blockquote', 'figure'}
    HEADING_TAGS = {'h1': '#', 'h2': '##', 'h3': '###', 'h4': '####', 'h5': '#####', 'h6': '######'}

    def __init__(self, base_url=''):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url.rstrip('/')
        self._out = []
        self._tag_stack = []      # (tag, attrs_dict)
        self._skip_depth = 0      # depth inside a skipped subtree
        self._list_stack = []     # ('ul'|'ol', counter)
        self._in_pre = False
        self._in_code = False
        self._emphasis_stack = []  # [(marker_kind, sink_list, index_of_opening_marker)] — lets us
                                    # drop empty **/*/` markers precisely instead of a fragile regex
        # Tables are a stack: Confluence nests tables inside cells, and a single
        # `_in_table` flag made the inner </table> end the outer one (rows then got
        # merged/shifted). Each frame keeps its own rows + spans.
        self._table_stack = []    # [{'rows': [[cell,...]], 'pending_nl': int}]
        self._cell_stack = []     # stack of cell text buffers (innermost cell last)
        self._cell_meta = []      # parallel to _cell_stack: {'th', 'colspan', 'rowspan'}
        self._pending_newlines = 0

        # Diagram macros found in this page (draw.io / Gliffy) — content lives in
        # an attachment, so the caller must extract it separately.
        self.diagrams = []

        # Macro / parameter tracking
        self._macro_stack = []        # [{'name':..., 'params':{}, 'header_emitted':bool, 'had_body':bool}]
        self._capturing_param = None    # name of ac:parameter currently being captured
        self._param_buf = []

        # ac:link / ac:image tracking
        self._link_target = None
        self._link_fallback_text = ''
        self._link_had_text = False
        self._image_alt = None

        # ac:task-status tracking
        self._capturing_task_status = False
        self._task_status_buf = []
        self._task_status = None

    # ---- helpers -----------------------------------------------------------

    def _sink(self):
        """Where output goes right now: the innermost open table cell, else the page.

        Without this, markup emitted by tag handlers (`**`, `[`…`](url)`, list
        bullets) went to the page while the cell's plain text went to the cell —
        i.e. table content leaked out of the table and cells lost their formatting.
        """
        return self._cell_stack[-1] if self._cell_stack else self._out

    def _flush_newlines(self):
        if self._pending_newlines:
            self._sink().append('\n' * self._pending_newlines)
            self._pending_newlines = 0

    def _nl(self, n=1):
        self._pending_newlines = max(self._pending_newlines, n)

    def _write(self, text):
        if not text:
            return
        self._flush_newlines()
        self._sink().append(text)

    def _attrs(self, attrs):
        return dict(attrs)

    def _open_emphasis(self, kind, marker):
        self._write(marker)
        sink = self._sink()
        self._emphasis_stack.append((kind, sink, len(sink) - 1))

    def _close_emphasis(self, kind, marker):
        """Close a strong/em/code marker, dropping it entirely if it wrapped nothing
        (empty <strong></strong> etc.) instead of leaving a bare '**'/'*'/'`' behind.
        Precise index-based removal — avoids the fragile regex-based cleanup that used
        to also strip valid '**bold**' markers (two adjacent '*' from real bold text
        look identical to an "empty italic" pattern once flattened to a string)."""
        if self._emphasis_stack and self._emphasis_stack[-1][0] == kind:
            _, sink, open_idx = self._emphasis_stack.pop()
            content = ''.join(sink[open_idx + 1:])
            if content.strip():
                self._write(marker)
            else:
                del sink[open_idx:]
        else:
            self._write(marker)

    def _inside(self, tag_name):
        return any(t[0] == tag_name for t in self._tag_stack)

    def _enclosing_special(self):
        """Nearest ac:image / ac:link ancestor, used to interpret ri:* tags."""
        for t, _ in reversed(self._tag_stack):
            if t in ('ac:image', 'ac:link'):
                return 'image' if t == 'ac:image' else 'link'
        return None

    # ---- tag handlers: start -------------------------------------------------

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs_dict = self._attrs(attrs)
        self._tag_stack.append((tag, attrs_dict))

        if self._skip_depth:
            self._skip_depth += 1
            return

        if tag == 'ac:structured-macro':
            name = attrs_dict.get('ac:name', '')
            if name in self.MACRO_SKIP_NAMES:
                self._skip_depth += 1
                return
            self._macro_stack.append({'name': name, 'params': {}, 'header_emitted': False, 'had_body': False})
            if name in self.MACRO_LABELS:
                self._nl(2)
                self._write(f'**{self.MACRO_LABELS[name]}**')
                self._nl(1)
            return

        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
            return

        if tag in self.HEADING_TAGS:
            self._nl(2)
            self._write(self.HEADING_TAGS[tag] + ' ')

        elif tag in self.BLOCK_TAGS:
            self._nl(2)

        elif tag == 'br':
            self._write('  \n')

        elif tag == 'hr':
            self._nl(2)
            self._write('---')
            self._nl(2)

        elif tag in ('strong', 'b'):
            self._open_emphasis('strong', '**')

        elif tag in ('em', 'i'):
            self._open_emphasis('em', '*')

        elif tag == 'code':
            if not self._in_pre:
                self._open_emphasis('code', '`')
                self._in_code = True

        elif tag == 'pre':
            self._nl(2)
            self._write('```')
            self._nl(1)
            self._in_pre = True

        elif tag in ('ul', 'ol'):
            self._list_stack.append((tag, 0))
            self._nl(1)

        elif tag == 'li':
            if self._list_stack:
                kind, counter = self._list_stack[-1]
                indent = '  ' * (len(self._list_stack) - 1)
                if kind == 'ul':
                    prefix = f'{indent}- '
                else:
                    counter += 1
                    self._list_stack[-1] = (kind, counter)
                    prefix = f'{indent}{counter}. '
                self._nl(1)
                self._write(prefix)

        elif tag == 'a':
            self._write('[')

        elif tag == 'table':
            self._nl(2)
            # Remember the page-level pending newlines: the table markdown is only
            # written at </table>, and cells reset the counter while buffering.
            self._table_stack.append({'rows': [], 'pending_nl': self._pending_newlines})
            self._pending_newlines = 0

        elif tag in ('thead', 'tbody', 'tfoot', 'colgroup', 'col'):
            pass

        elif tag == 'tr':
            if self._table_stack:
                self._table_stack[-1]['rows'].append([])

        elif tag in ('th', 'td'):
            if self._table_stack:
                if not self._table_stack[-1]['rows']:
                    self._table_stack[-1]['rows'].append([])  # <td> without <tr>
                self._cell_stack.append([])
                self._cell_meta.append({
                    'th': tag == 'th',
                    'colspan': _span(attrs_dict.get('colspan')),
                    'rowspan': _span(attrs_dict.get('rowspan')),
                    'pending_nl': self._pending_newlines,
                })
                self._pending_newlines = 0

        elif tag == 'img':
            alt = attrs_dict.get('alt', 'image')
            src = attrs_dict.get('src', '')
            self._write(f'![{alt}]({src})')

        elif tag == 'time':
            dt = attrs_dict.get('datetime', '')
            if dt:
                self._write(dt)

        # ---- Confluence macro internals ----

        elif tag == 'ac:parameter':
            if self._macro_stack:
                self._capturing_param = attrs_dict.get('ac:name', '')
                self._param_buf = []

        elif tag == 'ac:plain-text-body':
            macro = self._macro_stack[-1] if self._macro_stack else None
            if macro:
                macro['had_body'] = True
                if macro['name'] == 'code':
                    lang = macro['params'].get('language', '')
                    self._nl(2)
                    self._write('```' + lang)
                    self._nl(1)
                    self._in_pre = True

        elif tag == 'ac:rich-text-body':
            macro = self._macro_stack[-1] if self._macro_stack else None
            if macro:
                macro['had_body'] = True
                if macro['name'] in ('expand', 'panel') and not macro['header_emitted']:
                    title = macro['params'].get('title', '')
                    self._nl(2)
                    if macro['name'] == 'expand':
                        self._write(f'**▸ {title}**' if title else '**▸ Expand**')
                    else:
                        self._write(f'**[Panel] {title}**' if title else '**[Panel]**')
                    self._nl(1)
                    macro['header_emitted'] = True

        elif tag == 'ac:image':
            self._image_alt = attrs_dict.get('ac:alt') or attrs_dict.get('ac:title') or 'image'

        elif tag == 'ac:link':
            self._link_target = None
            self._link_fallback_text = ''
            self._link_had_text = False
            self._write('[')

        elif tag == 'ri:attachment':
            filename = attrs_dict.get('ri:filename', 'attachment')
            ctx = self._enclosing_special()
            if ctx == 'image':
                self._write(f'![{self._image_alt or "image"}](attachment:{filename})')
            elif ctx == 'link':
                self._link_target = f'attachment:{filename}'
                self._link_fallback_text = filename
            else:
                self._write(f'[attachment: {filename}]')

        elif tag == 'ri:url':
            value = attrs_dict.get('ri:value', '')
            ctx = self._enclosing_special()
            if ctx == 'image':
                self._write(f'![{self._image_alt or "image"}]({value})')
            elif ctx == 'link':
                self._link_target = value
                self._link_fallback_text = value

        elif tag == 'ri:page':
            title = attrs_dict.get('ri:content-title', '')
            if self._enclosing_special() == 'link':
                self._link_target = f'page:{title}' if title else None
                self._link_fallback_text = title

        elif tag == 'ri:user':
            key = attrs_dict.get('ri:userkey') or attrs_dict.get('ri:username', '')
            label = f'@{key}' if key else '@user'
            if self._enclosing_special() == 'link':
                self._link_target = None
                self._link_fallback_text = label
            else:
                self._write(label)

        elif tag == 'ac:emoticon':
            fallback = attrs_dict.get('ac:emoji-fallback') or attrs_dict.get('ac:name', '')
            if fallback:
                self._write(fallback)

        elif tag == 'ac:task-list':
            self._list_stack.append(('ul', 0))
            self._nl(1)

        elif tag == 'ac:task':
            if self._list_stack:
                indent = '  ' * (len(self._list_stack) - 1)
                self._nl(1)
                self._write(f'{indent}- ')
            self._task_status = None

        elif tag == 'ac:task-status':
            self._capturing_task_status = True
            self._task_status_buf = []

        elif tag == 'ac:task-body':
            checkbox = '[x] ' if self._task_status == 'complete' else '[ ] '
            self._write(checkbox)

    # ---- tag handlers: end ---------------------------------------------------

    def _emit_diagram(self, macro):
        """Record a draw.io/Gliffy macro and write a visible placeholder.

        The diagram's real content (shape labels, flow between shapes) is stored in
        a page attachment, not in the page body — writing a placeholder guarantees
        the caller sees that something is missing instead of reading a page that
        looks complete but has a diagram-shaped hole in it.
        """
        p = macro['params']
        name = (p.get('diagramName') or p.get('diagramDisplayName')
                or p.get('name') or p.get('board') or '')
        self.diagrams.append({
            'macro':         macro['name'],
            'diagram_name':  name,
            'owner_page_id': p.get('pageId') or None,
            'params':        {k: v for k, v in p.items() if v},
        })
        self._nl(2)
        label = name or '(không rõ tên)'
        self._write(
            f'**[SƠ ĐỒ {macro["name"]}: {label}]** — '
            'nội dung sơ đồ nằm trong file đính kèm của trang, KHÔNG có trong markdown này. '
            'Phải trích bằng `drawio_extract.py` trước khi tổng hợp docs.'
        )
        self._nl(2)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self._tag_stack and self._tag_stack[-1][0] == tag:
            _, saved_attrs = self._tag_stack.pop()
        else:
            saved_attrs = {}

        if self._skip_depth:
            self._skip_depth -= 1
            return

        if tag == 'ac:structured-macro':
            macro = self._macro_stack.pop() if self._macro_stack else None
            if macro:
                name = macro['name']
                if name == 'status':
                    title = macro['params'].get('title', '')
                    if title:
                        self._write(f'**[{title}]**')
                elif name == 'jira':
                    key = macro['params'].get('key') or macro['params'].get('jql', '')
                    if key:
                        self._write(f'`{key}`')
                elif name in self.DIAGRAM_MACRO_NAMES:
                    self._emit_diagram(macro)
                elif name in self.MACRO_LABELS or name in ('expand', 'panel'):
                    self._nl(2)
                elif not macro['had_body'] and macro['params']:
                    parts = '; '.join(f'{k}: {v}' for k, v in macro['params'].items() if v)
                    if parts:
                        self._write(f'**[{name}]** {parts}')
            return

        if tag in self.SKIP_TAGS:
            return

        if tag in self.HEADING_TAGS:
            self._nl(2)

        elif tag in self.BLOCK_TAGS:
            self._nl(2)

        elif tag in ('strong', 'b'):
            self._close_emphasis('strong', '**')

        elif tag in ('em', 'i'):
            self._close_emphasis('em', '*')

        elif tag == 'code':
            if self._in_code:
                self._close_emphasis('code', '`')
                self._in_code = False

        elif tag == 'pre':
            self._nl(1)
            self._write('```')
            self._nl(2)
            self._in_pre = False

        elif tag in ('ul', 'ol'):
            if self._list_stack:
                self._list_stack.pop()
            self._nl(2)

        elif tag == 'li':
            self._nl(1)

        elif tag == 'a':
            href = saved_attrs.get('href', '')
            if href.startswith('/'):
                href = self.base_url + href
            self._write(f']({href})')

        elif tag in ('th', 'td'):
            if self._cell_stack:
                buf = self._cell_stack.pop()
                meta = self._cell_meta.pop()
                self._pending_newlines = 0
                if self._table_stack:
                    self._table_stack[-1]['rows'][-1].append({
                        'text':    _cell_text(''.join(buf)),
                        'th':      meta['th'],
                        'colspan': meta['colspan'],
                        'rowspan': meta['rowspan'],
                    })

        elif tag == 'tr':
            pass  # row already appended at <tr>; keep empty rows instead of dropping them

        elif tag == 'table':
            if self._table_stack:
                frame = self._table_stack.pop()
                md = self._table_markdown(frame['rows'])
                self._pending_newlines = max(self._pending_newlines, frame['pending_nl'])
                if self._cell_stack:
                    # Nested table: keep it inside the parent cell, don't break the
                    # row. Flattening/escaping happens once, when the parent cell
                    # closes — doing it here too would double-escape the pipes.
                    self._pending_newlines = 0
                    self._write(md)
                else:
                    self._write(md)
                    self._nl(2)

        elif tag == 'ac:parameter':
            if self._macro_stack and self._capturing_param is not None:
                value = ''.join(self._param_buf).strip()
                self._macro_stack[-1]['params'][self._capturing_param] = value
            self._capturing_param = None
            self._param_buf = []

        elif tag == 'ac:plain-text-body':
            macro = self._macro_stack[-1] if self._macro_stack else None
            if macro and macro['name'] == 'code':
                self._nl(1)
                self._write('```')
                self._nl(2)
                self._in_pre = False

        elif tag == 'ac:link':
            if not self._link_had_text and self._link_fallback_text:
                self._write(self._link_fallback_text)
            target = self._link_target or ''
            self._write(f']({target})')
            self._link_target = None
            self._link_fallback_text = ''
            self._link_had_text = False

        elif tag == 'ac:image':
            self._image_alt = None

        elif tag == 'ac:task-status':
            self._capturing_task_status = False
            self._task_status = ''.join(self._task_status_buf).strip()

        elif tag in ('ac:task-list',):
            if self._list_stack:
                self._list_stack.pop()
            self._nl(2)

        elif tag == 'ac:task':
            self._nl(1)

    # ---- text content ---------------------------------------------------------

    def handle_data(self, data):
        self._handle_text(data)

    def unknown_decl(self, data):
        # HTMLParser routes <![CDATA[...]]> here (NOT handle_data). Confluence uses
        # CDATA for code-macro bodies and link display text, so this must be handled
        # or that content is silently lost. `data` is "CDATA[<raw content>" (the
        # leading marker included, closing "]]" already stripped by the parser).
        if data.startswith('CDATA['):
            self._handle_text(data[len('CDATA['):])

    def _handle_text(self, data):
        if self._skip_depth:
            return

        if self._capturing_param is not None:
            self._param_buf.append(data)
            return

        if self._capturing_task_status:
            self._task_status_buf.append(data)
            return

        if self._inside('ac:link') and data.strip():
            self._link_had_text = True

        # Inside a table but outside any cell = layout whitespace between <tr>/<td>.
        if self._table_stack and not self._cell_stack and not data.strip():
            return

        if self._in_pre:
            self._write(data)
            return

        # Collapse whitespace outside pre/code
        text = re.sub(r'[ \t]+', ' ', data)
        if text.strip():
            self._write(text)
        elif text == ' ':
            self._write(' ')

    def _table_markdown(self, rows):
        """Render rows (with rowspan/colspan metadata) as a GFM table.

        Merged cells are expanded onto every position they cover, so each output
        row stays aligned with the header and can be read on its own — a reader
        (human or agent) never has to guess which row an omitted value belonged to.
        Empty rows/cells are preserved: a blank line in the source table carries
        meaning (group separator) and dropping it used to shift the rows below it.
        """
        if not rows:
            return ''
        grid, merges, n_rows, n_cols = _build_grid(rows)
        if n_cols == 0:
            return ''

        def line(r):
            cells = [grid.get((r, c), '') for c in range(n_cols)]
            return '| ' + ' | '.join(cells) + ' |'

        # Header: leading rows made entirely of <th>. Several header rows (merged
        # headers) are folded into one with " / ", because GFM allows only one.
        header_count = 0
        for row in rows:
            if row and all(c['th'] for c in row):
                header_count += 1
            else:
                break
        header_count = min(header_count, n_rows)

        out = []
        if header_count:
            head = []
            for c in range(n_cols):
                parts, seen = [], set()
                for r in range(header_count):
                    v = grid.get((r, c), '')
                    if v and v not in seen:
                        seen.add(v)
                        parts.append(v)
                head.append(' / '.join(parts))
            out.append('| ' + ' | '.join(head) + ' |')
            body_start = header_count
        else:
            # No <th> at all: synthesise a header instead of promoting the first
            # data row (GFM needs a header row, and eating row 1 loses data).
            out.append('| ' + ' | '.join(f'Cột {c + 1}' for c in range(n_cols)) + ' |')
            body_start = 0
        out.append('|' + '|'.join([' --- '] * n_cols) + '|')
        out += [line(r) for r in range(body_start, n_rows)]

        if merges:
            out.append('')
            out.append('> **Ô gộp (merge) trong bảng trên** — giá trị đã được lặp lại ở mọi dòng/cột '
                       'mà ô gộp phủ, để mỗi dòng đọc được độc lập:')
            for r, c, rs, cs, text in merges[:30]:
                label = text if text else '(ô trống)'
                span = []
                if rs > 1:
                    span.append(f'{rs} dòng (dòng {r + 1}–{r + rs})')
                if cs > 1:
                    span.append(f'{cs} cột (cột {c + 1}–{c + cs})')
                out.append(f'> - `{label}`: gộp ' + ' × '.join(span))
            if len(merges) > 30:
                out.append(f'> - _(+{len(merges) - 30} ô gộp khác)_')
        return '\n'.join(out)

    def get_markdown(self):
        self._flush_newlines()
        md = ''.join(self._out)
        # Normalise blank lines (max 2 consecutive)
        md = re.sub(r'\n{3,}', '\n\n', md)
        return md.strip()


def html_to_markdown_full(raw_html, base_url=''):
    """Return (markdown, diagrams) — diagrams are draw.io/Gliffy macros found."""
    parser = _HTMLToMD(base_url=base_url)
    parser.feed(raw_html)
    return parser.get_markdown(), parser.diagrams


def html_to_markdown(raw_html, base_url=''):
    return html_to_markdown_full(raw_html, base_url=base_url)[0]


# ---------------------------------------------------------------------------
# Confluence REST API fetch
# ---------------------------------------------------------------------------

def _read_env_file(path):
    data = {}
    if not os.path.isfile(path):
        return data
    with open(path, encoding='utf-8-sig') as f:  # -sig: file lưu bằng Notepad (Windows) có BOM
        for line in f:
            if line.lstrip().startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = re.sub(r'^export\s+', '', k.strip()).strip()
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
                v = v[1:-1]
            data[k] = v
    return data


def host_slug(base_url):
    host = urllib.parse.urlparse(base_url).hostname or base_url
    if host.lower().startswith('confluence.'):
        host = host[len('confluence.'):]
    return re.sub(r'[^A-Za-z0-9]', '_', host).upper()


def resolve_auth_candidates(base_url, env_file):
    """Trả về (danh sách header Authorization để thử, danh sách tên key đã tìm)."""
    file_vals = _read_env_file(env_file)
    val = lambda k: os.environ.get(k) or file_vals.get(k, '')
    p = f'VDS_CONFLUENCE_{host_slug(base_url)}'
    basic = lambda u, pw: 'Basic ' + base64.b64encode(f'{u}:{pw}'.encode()).decode()
    cands = []
    if val(f'{p}_TOKEN'):
        cands.append(f'Bearer {val(p + "_TOKEN")}')
    if val(f'{p}_USER') and val(f'{p}_PASSWORD'):
        cands.append(basic(val(p + '_USER'), val(p + '_PASSWORD')))
    if val(f'{p}_USER') and val(f'{p}_TOKEN'):
        cands.append(basic(val(p + '_USER'), val(p + '_TOKEN')))
    if val('VDS_CONFLUENCE_TOKEN'):
        cands.append(f'Bearer {val("VDS_CONFLUENCE_TOKEN")}')
        if val('VDS_CONFLUENCE_USER'):
            cands.append(basic(val('VDS_CONFLUENCE_USER'), val('VDS_CONFLUENCE_TOKEN')))
    keys = [f'{p}_TOKEN', f'{p}_USER', f'{p}_PASSWORD']
    return cands, keys


def _get(base_url, token, path):
    """Internal GET helper — returns parsed JSON or raises.

    `token` giữ trong chữ ký để không đổi các hàm gọi; nếu rỗng thì dùng credential đã
    resolve từ file (thử lần lượt các candidate cho tới khi không còn 401/403)."""
    headers_to_try = [f'Bearer {token}'] if token else (
        [_AUTH['chosen']] if _AUTH['chosen'] else list(_AUTH['candidates']))
    last_err = None
    for auth in headers_to_try:
        req = urllib.request.Request(f'{base_url}{path}', headers={'Authorization': auth})
        try:
            resp = urllib.request.urlopen(req, timeout=15)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403) and not token and not _AUTH['chosen']:
                last_err = e
                continue
            raise
        if not token:
            _AUTH['chosen'] = auth
        return json.loads(resp.read().decode('utf-8'))
    raise last_err or RuntimeError('Không có credential Confluence để gọi API')


def fetch_children(base_url, token, page_id, limit=50):
    """Return a list of {id, title} for all direct child pages."""
    children = []
    start = 0
    while True:
        try:
            data = _get(base_url, token,
                        f'/rest/api/content/{page_id}/child/page?limit={limit}&start={start}')
        except Exception:
            break
        results = data.get('results', [])
        for r in results:
            children.append({'id': r['id'], 'title': r.get('title', '')})
        if len(results) < limit:
            break
        start += limit
    return children


def fetch_attachments(base_url, token, page_id, limit=100):
    """Return a list of {title, media_type, file_size, download_url} for page attachments.

    Binary content isn't fetched here (only metadata) — the caller decides whether
    to download/convert (e.g. .xlsx, .pdf, .docx) or just surface the file to the user.
    """
    attachments = []
    start = 0
    while True:
        try:
            data = _get(base_url, token,
                        f'/rest/api/content/{page_id}/child/attachment?limit={limit}&start={start}&expand=version')
        except Exception:
            break
        results = data.get('results', [])
        for r in results:
            download = r.get('_links', {}).get('download', '')
            attachments.append({
                'title': r.get('title', ''),
                'media_type': r.get('metadata', {}).get('mediaType', ''),
                'file_size': r.get('extensions', {}).get('fileSize'),
                'download_url': (base_url + download) if download else None,
            })
        if len(results) < limit:
            break
        start += limit
    return attachments


def download_bytes(url, token=None):
    """Download an attachment (binary) using the same credential resolution as _get."""
    headers_to_try = [f'Bearer {token}'] if token else (
        [_AUTH['chosen']] if _AUTH['chosen'] else list(_AUTH['candidates']))
    last_err = None
    for auth in headers_to_try:
        req = urllib.request.Request(url, headers={'Authorization': auth})
        try:
            resp = urllib.request.urlopen(req, timeout=30)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403) and not token and not _AUTH['chosen']:
                last_err = e
                continue
            raise
        if not token:
            _AUTH['chosen'] = auth
        return resp.read()
    raise last_err or RuntimeError('Không có credential Confluence để tải attachment')


# Attachment titles that can hold a draw.io diagram source for macro `name`.
def drawio_source_candidates(name):
    name = (name or '').strip()
    if not name:
        return []
    base = name
    for ext in ('.drawio', '.xml', '.png', '.svg'):
        if base.lower().endswith(ext):
            base = base[: -len(ext)]
            break
    cands = [name, base, base + '.drawio', base + '.xml', base + '.drawio.xml',
             base + '.svg', base + '.png']
    return list(dict.fromkeys(cands))


def resolve_title_to_id(base_url, token, title, space_key=None):
    """Best-effort: resolve a page title (no content-id available) to a page ID via CQL search."""
    try:
        q = f'title={urllib.parse.quote(title)}&type=page&limit=1'
        if space_key:
            q += f'&spaceKey={urllib.parse.quote(space_key)}'
        data = _get(base_url, token, f'/rest/api/content?{q}')
        results = data.get('results', [])
        if results:
            return results[0]['id']
    except Exception:
        pass
    return None


def extract_referenced_links(html_body, current_page_id):
    """Find pages referenced *inside the content* of a page (not the tree hierarchy):
    - Native Confluence page-link macros: <ac:link><ri:page .../></ac:link>
    - Plain <a href="..."> links pointing at another Confluence page URL

    Returns a list of {id, title, space_key, text} — id may be None if it could not be
    determined from the raw HTML (caller may try to resolve titles separately).
    """
    refs = {}

    def _attr(tag_str, name):
        m = re.search(rf'{name}="([^"]*)"', tag_str)
        return html_module.unescape(m.group(1)) if m else None

    # 1. Native page-link macros
    for block in re.finditer(r'<ac:link\b[^>]*>(.*?)</ac:link>', html_body, re.DOTALL):
        inner = block.group(1)
        page_tag_m = re.search(r'<ri:page\b[^>]*/?>', inner)
        if not page_tag_m:
            continue  # link to an attachment/user/url, not a page
        page_tag = page_tag_m.group(0)
        content_id = _attr(page_tag, 'ri:content-id')
        content_title = _attr(page_tag, 'ri:content-title')
        space_key = _attr(page_tag, 'ri:space-key')
        if content_id and content_id == current_page_id:
            continue
        text_m = re.search(r'<!\[CDATA\[(.*?)\]\]>', inner, re.DOTALL)
        text = html_module.unescape(text_m.group(1)).strip() if text_m else (content_title or '')
        key = content_id or ('title', content_title, space_key)
        if key not in refs:
            refs[key] = {'id': content_id, 'title': content_title, 'space_key': space_key, 'text': text}

    # 2. Plain hyperlinks to other Confluence pages (pasted URL, not the picker macro)
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html_body, re.DOTALL):
        href, inner_html = m.group(1), m.group(2)
        pid = extract_page_id(href)
        if not pid or pid == current_page_id:
            continue
        text = html_module.unescape(re.sub(r'<[^>]+>', '', inner_html)).strip()
        if pid not in refs:
            refs[pid] = {'id': pid, 'title': None, 'space_key': None, 'text': text}

    return list(refs.values())


def fetch_page(base_url, token, page_id):
    try:
        data = _get(base_url, token,
                    f'/rest/api/content/{page_id}?expand=body.storage,ancestors,space')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {'error': f'HTTP {e.code}: {body[:300]}'}
    except Exception as e:
        return {'error': str(e)}

    title     = data.get('title', '')
    html_body = data.get('body', {}).get('storage', {}).get('value', '')
    space_key = data.get('space', {}).get('key', '')
    ancestors = [a.get('title', '') for a in data.get('ancestors', [])]
    page_url  = f'{base_url}/pages/viewpage.action?pageId={page_id}'
    markdown, diagrams = html_to_markdown_full(html_body, base_url=base_url)

    # Tree discovery: always list direct child pages, regardless of whether this
    # page itself has content — a non-empty page can still be a parent with
    # related child docs (e.g. a feature overview page with business-scenario /
    # detail-design children). is_index marks the special case where THIS page's
    # own body is empty and only its children carry real content.
    children = fetch_children(base_url, token, page_id)
    is_index = (not markdown.strip()) and bool(children)

    # In-content discovery: links/macros inside the body that point at other pages.
    referenced = extract_referenced_links(html_body, page_id)
    for ref in referenced:
        if not ref['id'] and ref['title']:
            ref['id'] = resolve_title_to_id(base_url, token, ref['title'], ref.get('space_key'))
        ref['resolved'] = bool(ref['id'])

    # File attachments (Excel/PDF/images/diagrams) — metadata only, not downloaded.
    attachments = fetch_attachments(base_url, token, page_id)

    # Link each draw.io macro to the attachment holding its source, so the caller
    # can extract the diagram content instead of skipping it.
    att_by_title = {a['title']: a for a in attachments}
    for d in diagrams:
        owner = d.get('owner_page_id') or page_id
        match = None
        for cand in drawio_source_candidates(d.get('diagram_name')):
            if cand in att_by_title and not cand.lower().endswith('.png'):
                match = att_by_title[cand]
                break
        d['owner_page_id'] = owner
        d['source_attachment'] = match['title'] if match else None
        d['download_url'] = match['download_url'] if match else None
        d['extract_command'] = (
            'python3 .claude/skills/autotest-project-docs/scripts/drawio_extract.py '
            f'--base-url "{base_url}" --page-id {owner} --name "{d.get("diagram_name") or ""}"'
        )

    # Diagrams embedded as plain attached .drawio files (no macro on the page).
    macro_sources = {d['source_attachment'] for d in diagrams if d['source_attachment']}
    for a in attachments:
        t = a['title'] or ''
        is_drawio_file = (t.lower().endswith(('.drawio', '.drawio.xml'))
                          or 'mxfile' in (a.get('media_type') or '').lower()
                          or 'jgraph' in (a.get('media_type') or '').lower())
        if is_drawio_file and t not in macro_sources:
            diagrams.append({
                'macro':             None,
                'diagram_name':      t,
                'owner_page_id':     page_id,
                'params':            {},
                'source_attachment': t,
                'download_url':      a['download_url'],
                'extract_command': (
                    'python3 .claude/skills/autotest-project-docs/scripts/drawio_extract.py '
                    f'--base-url "{base_url}" --page-id {page_id} --name "{t}"'
                ),
            })

    result = {
        'page_id':         page_id,
        'title':           title,
        'space':           space_key,
        'ancestors':       ancestors,
        'url':             page_url,
        'markdown':        markdown,
        'is_index':        is_index,
        'children':        children,
        'referenced_pages': referenced,
        'attachments':     attachments,
        'diagrams':        diagrams,
    }

    return result


def fetch_pages_combined(base_url, token, page_ids):
    """Fetch multiple pages and return a list of individual results."""
    results = []
    for pid in page_ids:
        r = fetch_page(base_url, token, pid)
        if 'error' not in r:
            results.append(r)
    return results


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--env-file', default=DEFAULT_ENV_FILE,
                        help='(dev/debug) file credential khác thay cho ~/.vds/sdlc-config.env')
    parser.add_argument('--page-ids', nargs='+',
                        help='One or more numeric page IDs to fetch and combine')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--url', help='Full Confluence page URL (single page)')
    group.add_argument('--page-id', help='Numeric Confluence page ID (single page)')
    args = parser.parse_args()

    cands, keys = resolve_auth_candidates(args.base_url, args.env_file)
    if not cands:
        print(json.dumps({
            'error': 'missing_credential',
            'env_file': args.env_file,
            'env_file_exists': os.path.isfile(args.env_file),
            'fill_one_of': [keys[0], f'{keys[1]} + {keys[2]}'],
            'hint': 'Điền vào file credential (không dán vào chat), rồi chạy lại.',
        }, ensure_ascii=False))
        sys.exit(3)
    _AUTH['candidates'] = cands

    if args.page_ids:
        result = fetch_pages_combined(args.base_url, None, args.page_ids)
    else:
        page_id = args.page_id or (extract_page_id(args.url) if args.url else None)
        if not page_id:
            print(json.dumps({'error': 'Provide --url, --page-id, or --page-ids'}))
            sys.exit(1)
        result = fetch_page(args.base_url, None, page_id)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
