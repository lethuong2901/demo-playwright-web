#!/usr/bin/env python3
"""Trích nội dung sơ đồ draw.io nhúng trong trang Confluence thành text/markdown.

Sơ đồ draw.io trên Confluence (macro `drawio`) không có nội dung nào trong body
của trang — toàn bộ shape/label/mũi tên nằm trong file đính kèm (mxfile XML, có
thể bị nén deflate+base64, hoặc nhúng trong .png/.svg). Vì vậy nếu chỉ đọc
`markdown` do `confluence_fetch.py` trả về thì **mất trắng** mọi sơ đồ.

Script này tải attachment của sơ đồ, giải nén, parse mxGraphModel và in ra:
- danh sách thành phần (shape có label, giữ quan hệ cha/con swimlane/container)
- danh sách luồng/quan hệ (mũi tên `A → B`, kèm label trên mũi tên nếu có)

Dùng sau khi `confluence_fetch.py` báo có `diagrams`:

    python3 drawio_extract.py --base-url URL --page-id 12345                 # mọi sơ đồ của trang
    python3 drawio_extract.py --base-url URL --page-id 12345 --name "Flow"   # 1 sơ đồ
    python3 drawio_extract.py --file ./local.drawio                          # file local
    python3 drawio_extract.py --base-url URL --page-id 12345 --format json
"""

import argparse
import base64
import json
import os
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import confluence_fetch as cf  # noqa: E402


# ---------------------------------------------------------------------------
# Lấy mxfile XML từ nhiều kiểu container (.drawio/.xml, .png, .svg)
# ---------------------------------------------------------------------------

def _unwrap_png(data):
    """draw.io nhúng mxfile XML vào tEXt chunk 'mxfile' của file .png."""
    out = []
    i = 8  # bỏ PNG signature
    while i + 8 <= len(data):
        length = int.from_bytes(data[i:i + 4], 'big')
        ctype = data[i + 4:i + 8]
        body = data[i + 8:i + 8 + length]
        if ctype in (b'tEXt', b'iTXt', b'zTXt'):
            key, _, rest = body.partition(b'\x00')
            if key.lower() in (b'mxfile', b'mxgraphmodel'):
                if ctype == b'zTXt':
                    try:
                        rest = zlib.decompress(rest.lstrip(b'\x00'))
                    except zlib.error:
                        pass
                elif ctype == b'iTXt':
                    rest = rest.split(b'\x00')[-1]
                out.append(rest.decode('utf-8', errors='replace'))
        if ctype == b'IEND':
            break
        i += 12 + length
    text = '\n'.join(out)
    return urllib.parse.unquote(text) if text and '%3C' in text else text


def _unwrap_svg(text):
    """SVG do draw.io xuất giữ nguồn trong attribute content="&lt;mxfile...&gt;"."""
    m = re.search(r'content="([^"]+)"', text)
    if not m:
        return ''
    import html as html_module
    return html_module.unescape(m.group(1))


def to_mxfile_xml(data):
    """Trả về chuỗi XML mxfile/mxGraphModel từ bytes của attachment."""
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return _unwrap_png(data)
    text = data.decode('utf-8', errors='replace').lstrip()
    if text.startswith('<?xml') and '<svg' in text[:2000] or text.startswith('<svg'):
        inner = _unwrap_svg(text)
        if inner:
            return inner
    return text


def decode_diagram(payload):
    """Giải nội dung 1 thẻ <diagram> → mxGraphModel XML.

    Nội dung có thể là XML thô, hoặc base64(deflate(urlencoded XML)) — định dạng
    nén mặc định của draw.io.
    """
    payload = (payload or '').strip()
    if not payload:
        return ''
    if payload.lstrip().startswith('<'):
        return payload
    try:
        raw = base64.b64decode(payload)
    except Exception:
        return ''
    for decompress in (lambda b: zlib.decompress(b, -15), zlib.decompress):
        try:
            text = decompress(raw).decode('utf-8', errors='replace')
        except Exception:
            continue
        return urllib.parse.unquote(text)
    return ''


# ---------------------------------------------------------------------------
# mxGraphModel → cấu trúc node/edge
# ---------------------------------------------------------------------------

def _clean_label(value):
    if not value:
        return ''
    import html as html_module
    text = re.sub(r'<br\s*/?>', ' / ', value, flags=re.I)
    text = re.sub(r'<[^>]+>', '', text)
    text = html_module.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()


def parse_graph(model_xml):
    """Trả về (nodes, edges) từ mxGraphModel XML.

    nodes: {id: {'label', 'parent', 'style'}}; edges: list {'source','target','label'}
    """
    try:
        root = ET.fromstring(model_xml)
    except ET.ParseError:
        return {}, []

    cells = []  # (id, label, parent, style, is_edge, source, target)

    def _add(cid, label, attrs):
        cells.append((
            cid,
            _clean_label(label),
            attrs.get('parent', ''),
            attrs.get('style', '') or '',
            attrs.get('edge') == '1',
            attrs.get('source', ''),
            attrs.get('target', ''),
        ))

    def _walk(el):
        """Đi sâu nhưng không duyệt lại <mxCell> nằm trong <object> (đã gộp vào object)."""
        for child in el:
            tag = child.tag.split('}')[-1]
            if tag in ('object', 'UserObject'):
                inner = next((c for c in child if c.tag.split('}')[-1] == 'mxCell'), None)
                attrs = dict(inner.attrib) if inner is not None else {}
                cid = child.get('id') or attrs.get('id') or ''
                label = child.get('label') or child.get('name') or attrs.get('value') or ''
                _add(cid, label, attrs)
                continue  # mxCell con đã được gộp — không duyệt tiếp
            if tag == 'mxCell':
                attrs = dict(child.attrib)
                if attrs.get('id'):
                    _add(attrs['id'], attrs.get('value', ''), attrs)
                continue  # bên trong mxCell chỉ còn mxGeometry/mxPoint
            _walk(child)

    _walk(root)

    nodes, edges, edge_ids = {}, [], set()
    for cid, label, parent, style, is_edge, src, tgt in cells:
        if is_edge:
            edge_ids.add(cid)
            edges.append({'id': cid, 'source': src, 'target': tgt, 'label': label})
        elif label or style:
            nodes[cid] = {'label': label, 'parent': parent, 'style': style}
        # cell không label, không style = root/layer của mxGraphModel → bỏ

    # Label của mũi tên có thể là cell con riêng (style edgeLabel, parent = id mũi tên)
    for cid, info in list(nodes.items()):
        if info['parent'] in edge_ids and info['label']:
            for e in edges:
                if e['id'] == info['parent']:
                    e['label'] = ' / '.join(x for x in (e['label'], info['label']) if x)
            nodes.pop(cid, None)

    for e in edges:
        e['source_label'] = nodes.get(e['source'], {}).get('label', '') or e['source'] or '?'
        e['target_label'] = nodes.get(e['target'], {}).get('label', '') or e['target'] or '?'
    return nodes, edges


def graph_to_markdown(name, page_name, nodes, edges):
    labeled = {k: v for k, v in nodes.items() if v['label']}
    unlabeled = len(nodes) - len(labeled)

    lines = [f'### Sơ đồ: {name}' + (f' — trang `{page_name}`' if page_name else '')]

    # Thành phần, giữ 1 cấp lồng (swimlane / container)
    lines.append('')
    lines.append('**Thành phần:**')
    children = {}
    tops = []
    for cid, info in labeled.items():
        p = info['parent']
        if p in labeled:
            children.setdefault(p, []).append(cid)
        else:
            tops.append(cid)
    if not labeled:
        lines.append('- (không có shape nào có label)')
    for cid in tops:
        lines.append(f'- {labeled[cid]["label"]}')
        for kid in children.get(cid, []):
            lines.append(f'  - {labeled[kid]["label"]}')
    nested = {k for v in children.values() for k in v}
    for cid in labeled:
        if cid not in tops and cid not in nested:
            lines.append(f'- {labeled[cid]["label"]}')
    if unlabeled:
        lines.append(f'- _(+{unlabeled} shape không có label — thường là khung/icon trang trí)_')

    lines.append('')
    lines.append('**Luồng / quan hệ:**')
    if not edges:
        lines.append('- (không có mũi tên nối)')
    for e in edges:
        label = f' — _{e["label"]}_' if e['label'] else ''
        lines.append(f'- {e["source_label"]} → {e["target_label"]}{label}')
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Nguồn dữ liệu: attachment Confluence hoặc file local
# ---------------------------------------------------------------------------

def _is_drawio_attachment(att):
    t = (att.get('title') or '').lower()
    mt = (att.get('media_type') or '').lower()
    return (t.endswith(('.drawio', '.drawio.xml', '.drawio.png', '.drawio.svg'))
            or 'mxfile' in mt or 'jgraph' in mt
            or (t.endswith(('.xml', '.png', '.svg')) and 'drawio' in t))


def pick_attachments(attachments, name):
    """Chọn attachment chứa nguồn sơ đồ. `name` rỗng → mọi attachment kiểu draw.io."""
    if name:
        wanted = cf.drawio_source_candidates(name)
        by_title = {a['title']: a for a in attachments}
        # Ưu tiên nguồn XML trước .png/.svg (png/svg chỉ có XML nhúng nếu export từ draw.io)
        ordered = [c for c in wanted if not c.lower().endswith(('.png', '.svg'))] + \
                  [c for c in wanted if c.lower().endswith(('.png', '.svg'))]
        picked = [by_title[c] for c in ordered if c in by_title]
        return picked[:1] or [a for a in attachments if name.lower() in (a['title'] or '').lower()][:1]
    return [a for a in attachments if _is_drawio_attachment(a)]


def extract_one(name, data):
    xml_text = to_mxfile_xml(data)
    diagrams = re.findall(r'<diagram\b([^>]*)>(.*?)</diagram>', xml_text, re.DOTALL)
    results = []
    if not diagrams and '<mxGraphModel' in xml_text:
        diagrams = [('', xml_text)]
    for attrs, payload in diagrams:
        page_m = re.search(r'name="([^"]*)"', attrs)
        page_name = page_m.group(1) if page_m else ''
        model = decode_diagram(payload)
        if '<mxGraphModel' not in model:
            results.append({'diagram': name, 'page': page_name, 'error': 'không giải được nội dung sơ đồ'})
            continue
        nodes, edges = parse_graph(model)
        results.append({
            'diagram':  name,
            'page':     page_name,
            'nodes':    [{'id': k, **v} for k, v in nodes.items()],
            'edges':    edges,
            'markdown': graph_to_markdown(name, page_name, nodes, edges),
        })
    if not results:
        results.append({'diagram': name, 'page': '', 'error':
                        'không tìm thấy mxfile/mxGraphModel trong attachment (có thể chỉ là ảnh thường)'})
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base-url')
    ap.add_argument('--page-id')
    ap.add_argument('--url', help='Link trang Confluence (thay cho --page-id)')
    ap.add_argument('--name', default='', help='Tên sơ đồ (diagramName trong macro drawio)')
    ap.add_argument('--file', help='File .drawio/.xml/.png/.svg local, bỏ qua Confluence')
    ap.add_argument('--env-file', default=cf.DEFAULT_ENV_FILE)
    ap.add_argument('--format', choices=['md', 'json'], default='md')
    args = ap.parse_args()

    if args.file:
        with open(args.file, 'rb') as f:
            results = extract_one(os.path.basename(args.file), f.read())
    else:
        if not args.base_url or not (args.page_id or args.url):
            print(json.dumps({'error': 'Cần --base-url và --page-id/--url, hoặc --file'},
                             ensure_ascii=False))
            sys.exit(1)
        cands, keys = cf.resolve_auth_candidates(args.base_url, args.env_file)
        if not cands:
            print(json.dumps({
                'error': 'missing_credential',
                'env_file': args.env_file,
                'fill_one_of': [keys[0], f'{keys[1]} + {keys[2]}'],
                'hint': 'Điền vào file credential (không dán vào chat), rồi chạy lại.',
            }, ensure_ascii=False))
            sys.exit(3)
        cf._AUTH['candidates'] = cands

        page_id = args.page_id or cf.extract_page_id(args.url)
        attachments = cf.fetch_attachments(args.base_url, None, page_id)
        picked = pick_attachments(attachments, args.name)
        if not picked:
            print(json.dumps({
                'error': 'not_found',
                'message': 'Không thấy attachment nào chứa sơ đồ draw.io trên trang này',
                'attachments': [a['title'] for a in attachments],
            }, ensure_ascii=False, indent=2))
            sys.exit(4)
        results = []
        for att in picked:
            data = cf.download_bytes(att['download_url'], None)
            results += extract_one(att['title'], data)

    if args.format == 'json':
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(r.get('markdown') or f'### Sơ đồ: {r["diagram"]}\n\n⚠️ {r.get("error")}')
            print()


if __name__ == '__main__':
    main()
