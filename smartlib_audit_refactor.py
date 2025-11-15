#!/usr/bin/env python3
"""
smartlib_audit_refactor.py

Usage:
  python smartlib_audit_refactor.py --audit /path/to/project
  python smartlib_audit_refactor.py --refactor /path/to/project

This tool audits a static Smart Library project (HTML/CSS/JS) and makes a first-pass safe refactor:
- Extracts inline <script> into /js/pages.js (per page)
- Extracts inline <style> into /css/inline_styles.css
- Inserts script includes for /js/app.js and /js/auth.js if missing
- Creates templates/header.html and adds a header placeholder comment to each HTML file
- Produces audit_report.json and audit_summary.txt
- Backups modified files as .bak
"""

import os, sys, argparse, json, shutil, re
from pathlib import Path
from bs4 import BeautifulSoup

def list_html_files(root):
    html_files=[]
    for p in Path(root).rglob("*.html"):
        html_files.append(str(p))
    return sorted(html_files)

def safe_backup(path):
    bak = str(path) + ".bak"
    if not os.path.exists(bak):
        shutil.copy2(path, bak)
    return bak

def read_file(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def detect_inline_scripts_and_styles(html_text):
    soup = BeautifulSoup(html_text, "html.parser")
    scripts = soup.find_all("script")
    inline_scripts = []
    external_scripts = []
    for s in scripts:
        src = s.get("src")
        if src:
            external_scripts.append(src)
        else:
            code = s.string or ""
            if code.strip():
                inline_scripts.append(code)
    styles = soup.find_all("style")
    inline_styles = [s.string or "" for s in styles if (s.string or "").strip()]
    # find inline event handlers e.g. onclick="..."
    inline_handlers = []
    for tag in soup.find_all():
        for attr in tag.attrs:
            if re.match(r'on\w+', attr, flags=re.I):
                inline_handlers.append({ "tag": str(tag.name), "attr": attr, "value": tag.attrs[attr] })
    return {
        "inline_scripts": inline_scripts,
        "external_scripts": external_scripts,
        "inline_styles": inline_styles,
        "inline_handlers": inline_handlers
    }

def scan_localstorage_keys(js_text):
    # naive scan for localStorage.getItem / setItem string keys
    keys = set()
    for match in re.finditer(r'localStorage\.getItem\(\s*[\'"]([^\'"]+)[\'"]\s*\)', js_text):
        keys.add(match.group(1))
    for match in re.finditer(r'localStorage\.setItem\(\s*[\'"]([^\'"]+)[\'"]\s*,', js_text):
        keys.add(match.group(1))
    return list(keys)

def analyze_project(root):
    report = {"files":{}, "summary": {"html_count":0,"js_count":0,"css_count":0}}
    html_files = list_html_files(root)
    report["summary"]["html_count"] = len(html_files)
    for html_path in html_files:
        html_text = read_file(html_path)
        info = detect_inline_scripts_and_styles(html_text)
        # broken links: find anchor hrefs with local targets that don't exist
        soup = BeautifulSoup(html_text, "html.parser")
        anchors = soup.find_all("a", href=True)
        broken_links=[]
        for a in anchors:
            href = a['href'].strip()
            if href.startswith("http") or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            # relative path
            target = os.path.normpath(os.path.join(os.path.dirname(html_path), href))
            if not os.path.exists(target):
                broken_links.append(href)
        # find inline admin checks, e.g. admin password 'admin@1234'
        admin_hardcoded = False
        if "admin@1234" in html_text or "admin' , 'admin@1234" in html_text:
            admin_hardcoded = True
        report["files"][html_path] = {
            "inline_scripts_count": len(info["inline_scripts"]),
            "external_scripts": info["external_scripts"],
            "inline_styles_count": len(info["inline_styles"]),
            "inline_handlers_count": len(info["inline_handlers"]),
            "broken_links": broken_links,
            "admin_hardcoded": admin_hardcoded
        }
    # scan JS files
    js_files = []
    for p in Path(root).rglob("*.js"):
        js_files.append(str(p))
    report["summary"]["js_count"] = len(js_files)
    js_key_map = {}
    for js_path in js_files:
        txt = read_file(js_path)
        keys = scan_localstorage_keys(txt)
        js_key_map[js_path] = keys
    report["localStorage_keys"] = js_key_map
    # CSS count
    css_files = []
    for p in Path(root).rglob("*.css"):
        css_files.append(str(p))
    report["summary"]["css_count"] = len(css_files)
    return report

def write_report(report, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    write_file(os.path.join(out_dir,"audit_report.json"), json.dumps(report, indent=2))
    # Create human summary
    lines=[]
    lines.append("SMART LIBRARY AUDIT REPORT")
    lines.append("SUMMARY:")
    lines.append(f"  HTML files scanned: {report['summary']['html_count']}")
    lines.append(f"  JS files scanned: {report['summary']['js_count']}")
    lines.append(f"  CSS files scanned: {report['summary']['css_count']}")
    lines.append("")
    for f, info in report["files"].items():
        lines.append(f"FILE: {f}")
        lines.append(f"  Inline <script> blocks: {info['inline_scripts_count']}")
        lines.append(f"  Inline <style> blocks: {info['inline_styles_count']}")
        lines.append(f"  Inline event handlers: {info['inline_handlers_count']}")
        if info['broken_links']:
            lines.append(f"  Broken links: {info['broken_links']}")
        if info['admin_hardcoded']:
            lines.append(f"  WARNING: admin credentials appear hardcoded in this file")
        lines.append("")
    write_file(os.path.join(out_dir,"audit_summary.txt"), "\n".join(lines))
    print("Wrote audit to", out_dir)

def safe_refactor(root, out_dir):
    # Extract inline scripts/styles; create js/pages.js (append)
    pages_js_path = os.path.join(root, "js", "pages.js")
    inline_styles_path = os.path.join(root, "css", "inline_styles.css")
    os.makedirs(os.path.dirname(pages_js_path), exist_ok=True)
    os.makedirs(os.path.dirname(inline_styles_path), exist_ok=True)
    pages_js_accumulator = []
    styles_accumulator = []
    edits = []
    for html_path in list_html_files(root):
        txt = read_file(html_path)
        soup = BeautifulSoup(txt, "html.parser")
        inline_scripts = soup.find_all("script", src=False)
        extracted = []
        for s in inline_scripts:
            code = (s.string or "").strip()
            if code:
                pages_js_accumulator.append(f"// From {os.path.relpath(html_path, root)}\n{code}\n\n")
                extracted.append(code)
            s.extract()  # remove from HTML
        inline_styles = soup.find_all("style")
        for st in inline_styles:
            code = (st.string or "").strip()
            if code:
                styles_accumulator.append(f"/* From {os.path.relpath(html_path, root)} */\n{code}\n\n")
            st.extract()
        # Insert header placeholder comment if not present
        head = soup.head
        if head:
            header_comment = soup.new_string("<!-- HEADER_INJECTED_BY_UI_JS -->")
            # If header placeholder not present, insert at top of body
            body = soup.body
            if body and "<!-- HEADER_INJECTED_BY_UI_JS -->" not in txt:
                body.insert(0, header_comment)
        # Ensure we add app.js and auth.js includes
        script_srcs = [s.get("src") for s in soup.find_all("script") if s.get("src")]
        requires = []
        if "/js/app.js" not in " ".join(script_srcs) and "js/app.js" not in " ".join(script_srcs):
            requires.append("/js/app.js")
        if "/js/auth.js" not in " ".join(script_srcs) and "js/auth.js" not in " ".join(script_srcs):
            requires.append("/js/auth.js")
        for r in requires:
            new_s = soup.new_tag("script", src=r)
            soup.body.append(new_s)
        new_html = str(soup)
        safe_backup(html_path)
        write_file(html_path, new_html)
        edits.append({"file": html_path, "extracted_scripts": len(extracted), "inserted_includes": requires})
    # write accumulators
    if pages_js_accumulator:
        with open(pages_js_path, "a", encoding="utf-8") as f:
            f.write("\n".join(pages_js_accumulator))
    if styles_accumulator:
        with open(inline_styles_path, "a", encoding="utf-8") as f:
            f.write("\n".join(styles_accumulator))
    # create templates/header.html if not exists
    templates_dir = os.path.join(root, "templates")
    os.makedirs(templates_dir, exist_ok=True)
    header_path = os.path.join(templates_dir, "header.html")
    if not os.path.exists(header_path):
        header_html = """<!-- Reusable header (cursor-inserted) -->
<header class='card header'>
  <div><a href='/index.html' style='text-decoration:none;color:inherit'><h2>Smart Library</h2></a><div class='meta'>Static demo</div></div>
  <nav class='nav'>
    <a class='btn' href='/index.html'>Home</a>
    <a class='btn' href='/books.html'>Books</a>
    <a class='btn' href='/about.html'>About</a>
    <a class='btn' href='/login.html'>Login</a>
  </nav>
</header>
"""
        write_file(header_path, header_html)
    # report
    ref_report = {"edits": edits, "pages_js": pages_js_path, "styles_file": inline_styles_path, "header_template": header_path}
    write_file(os.path.join(out_dir, "refactor_report.json"), json.dumps(ref_report, indent=2))
    print("Refactor done. Report written to", out_dir)
    return ref_report

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", help="Run audit on project directory")
    parser.add_argument("--refactor", help="Run safe refactor on project directory")
    parser.add_argument("--out", default="smartlib_audit_out", help="Output directory for reports")
    opts = parser.parse_args()
    if opts.audit:
        report = analyze_project(opts.audit)
        write_report(report, opts.out)
    elif opts.refactor:
        # run audit first
        report = analyze_project(opts.refactor)
        write_report(report, opts.out)
        ref = safe_refactor(opts.refactor, opts.out)
        print("Safe refactor report:", ref)
    else:
        parser.print_help()

if __name__=="__main__":
    main()
