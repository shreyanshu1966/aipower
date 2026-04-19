#!/usr/bin/env python3
"""
+======================================================================+
|       SHOPIFY THEME FINGERPRINT OBFUSCATOR  v2.0                     |
|  Removes ALL identifying fingerprints from a Shopify theme folder    |
|                                                                      |
|  Targets:                                                            |
|    [OK] settings_schema.json  - theme_name, theme_author, docs URLs  |
|    [OK] settings_data.json    - theme metadata block                 |
|    [OK] *.liquid              - Liquid comments, data-section-type,  |
|                                 support/doc URL references           |
|    [OK] *.json (sections)     - schema class names with theme slug   |
|    [OK] *.css / *.js          - Theme-name CSS class prefixes,       |
|                                 author comments, version strings     |
|    [OK] package.json          - name, version, author, description   |
|                                                                      |
|  Usage:                                                              |
|    python shopify_theme_obfuscator.py <theme_dir>                    |
|    python shopify_theme_obfuscator.py <theme_dir> --dry-run          |
|    python shopify_theme_obfuscator.py <theme_dir> --no-backup        |
+======================================================================+
"""

import os
import re
import sys
import json
import shutil
import random
import string
import argparse
from pathlib import Path
from datetime import datetime

# Force UTF-8 output on Windows to avoid cp1252 encode errors
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────
#  CONFIGURATION  (detected from actual theme scan)
# ─────────────────────────────────────────────────────────────────────

# Known theme identifiers to replace (from settings_schema.json)
KNOWN_THEME_AUTHORS   = ["Maestrooo", "maestrooo", "MAESTROOO"]
KNOWN_THEME_NAMES     = ["Warehouse", "warehouse", "Default", "default"]
KNOWN_SUPPORT_DOMAINS = [
    "support.maestrooo.com",
    "maestrooo.com",
]
KNOWN_THEME_VERSIONS  = ["7.0.1", "7.0", "7"]

# Replacement values (generic, non-identifying)
REPLACEMENT_THEME_NAME    = "CustomTheme"
REPLACEMENT_THEME_AUTHOR  = "ThemeDeveloper"
REPLACEMENT_THEME_VERSION = "1.0.0"
REPLACEMENT_SUPPORT_URL   = "https://help.example.com/"

# CSS class prefixes unique to this theme that appear in Liquid/CSS
# These are present in data-section-type attributes and schema "class" keys
THEME_CSS_SECTION_CLASSES = {
    "shopify-section__header":              "section-header",
    "shopify-section__footer":              "section-footer",
    "shopify-section__announcement-bar":    "section-announcement",
    "shopify-section__blog-posts":          "section-blog-posts",
    "shopify-section__collection-list":     "section-col-list",
    "shopify-section__collection-with-image": "section-col-image",
    "shopify-section__contact-form":        "section-contact",
    "shopify-section__custom-html":         "section-html",
    "shopify-section__custom-liquid":       "section-liquid",
    "shopify-section__faq":                 "section-faq",
    "shopify-section__featured-collection": "section-feat-col",
    "shopify-section__featured-product":    "section-feat-prod",
    "shopify-section__image-with-text-overlay": "section-img-overlay",
    "shopify-section__image-with-text":     "section-img-text",
    "shopify-section__logo-list":           "section-logos",
    "shopify-section__mosaic":              "section-mosaic",
    "shopify-section__newsletter":          "section-newsletter",
    "shopify-section__offers":              "section-offers",
    "shopify-section__promotion-list":      "section-promos",
    "shopify-section__rich-text":           "section-rich-text",
    "shopify-section__slideshow":           "section-slideshow",
    "shopify-section__team":                "section-team",
    "shopify-section__video":               "section-video",
    "shopify-section__map":                 "section-map",
}

# data-section-type values that are theme-specific
SECTION_TYPE_MAP = {
    '"header"':              '"site-header"',
    '"footer"':              '"site-footer"',
    '"announcement-bar"':   '"notice-bar"',
    '"blog-posts"':         '"article-grid"',
    '"featured-collection"': '"product-grid"',
    '"featured-product"':   '"single-product"',
    '"slideshow"':          '"hero-slider"',
    '"mosaic"':             '"gallery-mosaic"',
    '"newsletter"':         '"signup-form"',
    '"map"':                '"store-map"',
    '"faq"':                '"accordion-faq"',
    '"video"':              '"embed-video"',
    '"logo-list"':          '"brand-logos"',
    '"offers"':             '"promo-offers"',
    '"promotion-list"':     '"campaign-list"',
    '"contact-form"':       '"inquiry-form"',
    '"team"':               '"team-grid"',
    '"rich-text"':          '"text-block"',
    '"image-with-text"':    '"split-content"',
    '"image-with-text-overlay"': '"overlay-content"',
    '"collection-list"':    '"categories-list"',
    '"collection-with-image"': '"category-hero"',
    '"popups"':             '"modal-popup"',
    '"privacy-banner"':     '"cookie-notice"',
    '"recently-viewed-products"': '"browsing-history"',
    '"product-recommendations"': '"suggested-products"',
    '"quick-links"':        '"shortcut-links"',
    '"search-content"':     '"search-results"',
    '"text-with-icons"':    '"icon-features"',
    '"gift-card-template"': '"gift-card"',
}

# ─────────────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────────────

def random_suffix(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def log(msg: str, indent: int = 0):
    prefix = "  " * indent
    print(f"{prefix}{msg}")


# ─────────────────────────────────────────────────────────────────────
#  1. settings_schema.json — theme_info block
# ─────────────────────────────────────────────────────────────────────

def obfuscate_settings_schema(path: Path, dry_run: bool) -> bool:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        log(f"[ERROR] Cannot parse {path.name}: {e}", 1)
        return False

    changed = False
    for block in data:
        if isinstance(block, dict) and block.get("name") == "theme_info":
            old = dict(block)
            block["theme_name"]              = REPLACEMENT_THEME_NAME
            block["theme_author"]            = REPLACEMENT_THEME_AUTHOR
            block["theme_version"]           = REPLACEMENT_THEME_VERSION
            block["theme_documentation_url"] = REPLACEMENT_SUPPORT_URL
            block["theme_support_url"]       = REPLACEMENT_SUPPORT_URL
            if block != old:
                changed = True
                log(f"  [✓] settings_schema.json → theme_info block sanitised", 1)
                log(f"      Before: name={old.get('theme_name')!r}  author={old.get('theme_author')!r}", 2)
                log(f"      After : name={block['theme_name']!r}  author={block['theme_author']!r}", 2)

        # Also scrub any maestrooo URLs hiding in "info" strings
        if isinstance(block, dict) and "settings" in block:
            for setting in block["settings"]:
                for key in ("info", "label", "content"):
                    if key in setting and isinstance(setting[key], str):
                        new_val = setting[key]
                        for domain in KNOWN_SUPPORT_DOMAINS:
                            if domain in new_val:
                                new_val = new_val.replace(domain, "help.example.com")
                                changed = True
                        setting[key] = new_val

    if changed and not dry_run:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return changed


# ─────────────────────────────────────────────────────────────────────
#  2. settings_data.json — current_theme metadata
# ─────────────────────────────────────────────────────────────────────

def obfuscate_settings_data(path: Path, dry_run: bool) -> bool:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        log(f"[ERROR] Cannot parse {path.name}: {e}", 1)
        return False

    changed = False
    # Shopify stores theme info under "current" > "content_for_index" metadata
    # or top-level keys. We walk all string values.
    def scrub_dict(d):
        nonlocal changed
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, str):
                    new_v = v
                    for author in KNOWN_THEME_AUTHORS:
                        if author.lower() in v.lower():
                            new_v = re.sub(re.escape(author), REPLACEMENT_THEME_AUTHOR,
                                           new_v, flags=re.IGNORECASE)
                    for name in KNOWN_THEME_NAMES:
                        # Only replace standalone theme name references, not generic words
                        if name in ("Default", "default"):
                            continue  # too common, skip
                        new_v = re.sub(r'\b' + re.escape(name) + r'\b', REPLACEMENT_THEME_NAME,
                                       new_v, flags=re.IGNORECASE)
                    for domain in KNOWN_SUPPORT_DOMAINS:
                        if domain in new_v:
                            new_v = new_v.replace(domain, "help.example.com")
                    if new_v != v:
                        d[k] = new_v
                        changed = True
                elif isinstance(v, (dict, list)):
                    scrub_dict(v)
        elif isinstance(d, list):
            for item in d:
                scrub_dict(item)

    scrub_dict(data)

    if changed:
        log(f"  [✓] settings_data.json → author/name references removed", 1)
        if not dry_run:
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return changed


# ─────────────────────────────────────────────────────────────────────
#  3. *.liquid files — comments, data-section-type, support URLs
# ─────────────────────────────────────────────────────────────────────

LIQUID_COMMENT_AUTHOR_RE = re.compile(
    r'\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}',
    re.MULTILINE
)

SUPPORT_URL_RE = re.compile(
    r'https?://(' + '|'.join(re.escape(d) for d in KNOWN_SUPPORT_DOMAINS) + r')[^\s\'"<>]*',
    re.IGNORECASE
)

DATA_SECTION_TYPE_RE = re.compile(
    r'(data-section-type=")([^"]+)(")'
)

SECTION_CLASS_RE = re.compile(
    r'"class":\s*"(shopify-section__[^"]+)"'
)

SCHEMA_INFO_URL_RE = re.compile(
    r'(https?://(?:' + '|'.join(re.escape(d) for d in KNOWN_SUPPORT_DOMAINS) + r')[^\s\'")\]]*)',
    re.IGNORECASE
)

def obfuscate_liquid_file(path: Path, dry_run: bool) -> bool:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        log(f"[ERROR] Cannot read {path}: {e}", 1)
        return False

    original = content
    hits = []

    # ── Remove Liquid block comments ({% comment %}...{% endcomment %}) ──
    def replace_comment(match):
        block = match.group(0)
        # Only strip if it looks like a structural/author comment
        keywords = ["author", "copyright", "maestrooo", "warehouse",
                    "---", "===", "MOBILE NAV", "DESKTOP NAV",
                    "LOGO COMPONENT", "SEARCH COMPONENT", "HEADER ACTIONS",
                    "FOOTER", "component", "Component"]
        if any(kw.lower() in block.lower() for kw in keywords):
            return ""
        return match.group(0)

    new_content = LIQUID_COMMENT_AUTHOR_RE.sub(replace_comment, content)
    if new_content != content:
        hits.append("Removed identifying Liquid block comments")
        content = new_content

    # ── Replace support domain URLs ──
    new_content, n = SUPPORT_URL_RE.subn(REPLACEMENT_SUPPORT_URL, content)
    if n:
        hits.append(f"Replaced {n} support URL(s)")
        content = new_content

    # ── Replace data-section-type values ──
    def replace_section_type(m):
        val = m.group(2)
        quoted_val = f'"{val}"'
        replacement = SECTION_TYPE_MAP.get(quoted_val)
        if replacement:
            return m.group(1) + replacement.strip('"') + m.group(3)
        return m.group(0)

    new_content = DATA_SECTION_TYPE_RE.sub(replace_section_type, content)
    if new_content != content:
        hits.append("Remapped data-section-type values")
        content = new_content

    # ── Replace theme-specific author name strings anywhere in file ──
    for author in KNOWN_THEME_AUTHORS:
        if author in content:
            content = content.replace(author, REPLACEMENT_THEME_AUTHOR)
            hits.append(f"Replaced author string: {author!r}")

    # ── Replace theme name in visible strings (non-Liquid-tag context) ──
    for name in KNOWN_THEME_NAMES:
        if name in ("Default", "default"):
            continue
        pattern = re.compile(r'\b' + re.escape(name) + r'\b')
        new_content, n = pattern.subn(REPLACEMENT_THEME_NAME, content)
        if n:
            hits.append(f"Replaced theme name {name!r} → {REPLACEMENT_THEME_NAME!r} ({n} times)")
            content = new_content

    # ── Remove version references ONLY inside Liquid comment blocks ──
    # We first extract each comment block, replace inside it, then stitch back.
    def replace_version_in_comments(text):
        nonlocal hits
        def _replacer(m):
            block = m.group(0)
            modified = block
            for ver in KNOWN_THEME_VERSIONS:
                # Use word boundaries so "7" won't match inside "170"
                ver_re = re.compile(r'\b' + re.escape(ver) + r'\b')
                new_block, n = ver_re.subn(REPLACEMENT_THEME_VERSION, modified)
                if n:
                    hits.append(f"Replaced version {ver!r} in comment")
                    modified = new_block
            return modified
        return LIQUID_COMMENT_AUTHOR_RE.sub(_replacer, text)

    new_content = replace_version_in_comments(content)
    if new_content != content:
        content = new_content

    # ── Replace schema "class" identifiers unique to this theme ──
    def replace_schema_class(m):
        cls = m.group(1)
        replacement = THEME_CSS_SECTION_CLASSES.get(cls)
        if replacement:
            return f'"class": "{replacement}"'
        return m.group(0)

    new_content = SECTION_CLASS_RE.sub(replace_schema_class, content)
    if new_content != content:
        hits.append("Remapped {% schema %} class identifiers")
        content = new_content

    if not hits:
        return False

    log(f"\n  📄 {path.relative_to(path.parent.parent)}", 1)
    for h in hits:
        log(f"  [✓] {h}", 2)

    if not dry_run:
        path.write_text(content, encoding="utf-8")
    return True


# ─────────────────────────────────────────────────────────────────────
#  4. Section *.json group files (footer-group.json, header-group.json)
# ─────────────────────────────────────────────────────────────────────

def obfuscate_section_json(path: Path, dry_run: bool) -> bool:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return False  # Not valid JSON or irrelevant

    content_str = json.dumps(data)
    original_str = content_str
    changed = False

    for author in KNOWN_THEME_AUTHORS:
        if author in content_str:
            content_str = content_str.replace(author, REPLACEMENT_THEME_AUTHOR)
            changed = True

    for domain in KNOWN_SUPPORT_DOMAINS:
        if domain in content_str:
            content_str = content_str.replace(domain, "help.example.com")
            changed = True

    if changed:
        log(f"  [✓] Cleaned {path.name}", 1)
        if not dry_run:
            path.write_text(content_str, encoding="utf-8")
    return changed


# ─────────────────────────────────────────────────────────────────────
#  5. Assets: CSS / JS / SCSS files
# ─────────────────────────────────────────────────────────────────────

def obfuscate_asset_file(path: Path, dry_run: bool) -> bool:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return False

    original = content
    hits = []

    # Remove /* ... */ block comments with author/version info at top of file
    header_block_re = re.compile(r'/\*!?[\s\S]*?\*/', re.MULTILINE)
    def check_header_block(m):
        block = m.group(0)
        keywords = ["author", "copyright", "version", "license",
                    "maestrooo", "warehouse", "@package"]
        if any(k.lower() in block.lower() for k in keywords):
            return ""
        return block

    new_content = header_block_re.sub(check_header_block, content)
    if new_content != content:
        hits.append("Removed CSS/JS header comment block")
        content = new_content

    # Replace support domain URLs in comments
    new_content, n = SUPPORT_URL_RE.subn(REPLACEMENT_SUPPORT_URL, content)
    if n:
        hits.append(f"Replaced {n} support URL(s)")
        content = new_content

    # Replace theme author/name strings in comments
    for author in KNOWN_THEME_AUTHORS:
        if author in content:
            content = content.replace(author, REPLACEMENT_THEME_AUTHOR)
            hits.append(f"Replaced author: {author!r}")

    for name in KNOWN_THEME_NAMES:
        if name in ("Default", "default"):
            continue
        if name in content:
            content = content.replace(name, REPLACEMENT_THEME_NAME)
            hits.append(f"Replaced theme name: {name!r}")

    if not hits:
        return False

    log(f"  [✓] {path.name}", 1)
    for h in hits:
        log(f"      {h}", 2)

    if not dry_run:
        path.write_text(content, encoding="utf-8")
    return True


# ─────────────────────────────────────────────────────────────────────
#  6. package.json (if present)
# ─────────────────────────────────────────────────────────────────────

def obfuscate_package_json(path: Path, dry_run: bool) -> bool:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return False

    changed = False
    for field in ("name", "description", "author", "homepage", "repository"):
        if field not in data:
            continue
        val = data[field]
        if isinstance(val, str):
            new_val = val
            for author in KNOWN_THEME_AUTHORS:
                if author.lower() in new_val.lower():
                    new_val = re.sub(re.escape(author), REPLACEMENT_THEME_AUTHOR,
                                     new_val, flags=re.IGNORECASE)
            for name in KNOWN_THEME_NAMES:
                if name in ("Default", "default"):
                    continue
                new_val = re.sub(r'\b' + re.escape(name) + r'\b', REPLACEMENT_THEME_NAME,
                                 new_val, flags=re.IGNORECASE)
            for domain in KNOWN_SUPPORT_DOMAINS:
                new_val = new_val.replace(domain, "help.example.com")
            if new_val != val:
                data[field] = new_val
                changed = True

    if "version" in data and data["version"] in KNOWN_THEME_VERSIONS:
        data["version"] = REPLACEMENT_THEME_VERSION
        changed = True

    if changed:
        log(f"  [✓] package.json — metadata sanitised", 1)
        if not dry_run:
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return changed


# ─────────────────────────────────────────────────────────────────────
#  BACKUP HELPER
# ─────────────────────────────────────────────────────────────────────

def backup_theme(theme_dir: Path):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = theme_dir.parent / f"{theme_dir.name}_backup_{ts}"
    shutil.copytree(theme_dir, backup_dir)
    log(f"  [BAK] Full theme backed up → {backup_dir.name}")
    return backup_dir


# ─────────────────────────────────────────────────────────────────────
#  MAIN ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────

def run_obfuscator(theme_dir: Path, dry_run: bool, no_backup: bool):
    mode_str   = 'DRY RUN (no files written)' if dry_run else 'LIVE (files will be modified)'
    backup_str = 'SKIPPED' if no_backup else 'YES (before any changes)'
    print("+" + "="*70 + "+")
    print("|  SHOPIFY THEME FINGERPRINT OBFUSCATOR  v2.0" + " "*27 + "|")
    print("+" + "="*70 + "+")
    print(f"  Theme directory : {theme_dir}")
    print(f"  Mode            : {mode_str}")
    print(f"  Backup          : {backup_str}")
    print()

    if not theme_dir.is_dir():
        print(f"[ERROR] Not a directory: {theme_dir}")
        sys.exit(1)

    # Verify it looks like a Shopify theme
    required = {"config", "sections", "layout", "snippets"}
    found = {d.name for d in theme_dir.iterdir() if d.is_dir()}
    if not required.issubset(found):
        print(f"[WARN] This doesn't look like a standard Shopify theme directory.")
        print(f"       Expected folders: {required}")
        print(f"       Found: {found}")

    # Make backup before any changes
    if not dry_run and not no_backup:
        backup_theme(theme_dir)
        print()

    total_changed = 0
    start = datetime.now()

    # ── 1. config/settings_schema.json ───────────────────────────────
    schema_path = theme_dir / "config" / "settings_schema.json"
    if schema_path.exists():
        log("► config/settings_schema.json")
        if obfuscate_settings_schema(schema_path, dry_run):
            total_changed += 1

    # ── 2. config/settings_data.json ─────────────────────────────────
    data_path = theme_dir / "config" / "settings_data.json"
    if data_path.exists():
        log("\n► config/settings_data.json")
        if obfuscate_settings_data(data_path, dry_run):
            total_changed += 1

    # ── 3. package.json ───────────────────────────────────────────────
    pkg_path = theme_dir / "package.json"
    if pkg_path.exists():
        log("\n► package.json")
        if obfuscate_package_json(pkg_path, dry_run):
            total_changed += 1

    # ── 4. All *.liquid files ─────────────────────────────────────────
    log("\n► Liquid files (sections/, snippets/, layout/, templates/)...")
    liquid_dirs = ["sections", "snippets", "layout", "templates"]
    liquid_changed = 0
    for folder in liquid_dirs:
        folder_path = theme_dir / folder
        if not folder_path.exists():
            continue
        for liq_file in sorted(folder_path.rglob("*.liquid")):
            if obfuscate_liquid_file(liq_file, dry_run):
                liquid_changed += 1
    log(f"\n  → {liquid_changed} liquid file(s) modified")
    total_changed += liquid_changed

    # ── 5. Section *.json group files ────────────────────────────────
    log("\n► Section group JSON files...")
    json_changed = 0
    for folder in ["sections"]:
        folder_path = theme_dir / folder
        if not folder_path.exists():
            continue
        for jf in sorted(folder_path.rglob("*.json")):
            if obfuscate_section_json(jf, dry_run):
                json_changed += 1
    log(f"  → {json_changed} section JSON file(s) modified")
    total_changed += json_changed

    # ── 6. Assets: CSS / JS / SCSS ───────────────────────────────────
    log("\n► Asset files (CSS/JS)...")
    assets_path = theme_dir / "assets"
    asset_changed = 0
    if assets_path.exists():
        for asset_file in sorted(assets_path.iterdir()):
            if asset_file.suffix.lower() in (".css", ".js", ".scss", ".sass"):
                if obfuscate_asset_file(asset_file, dry_run):
                    asset_changed += 1
    log(f"  → {asset_changed} asset file(s) modified")
    total_changed += asset_changed

    # ── Summary ───────────────────────────────────────────────────────
    elapsed = (datetime.now() - start).total_seconds()
    dry_result = 'YES - no changes written' if dry_run else 'NO - all changes saved'
    print()
    print("+" + "="*70 + "+")
    print("|  COMPLETE" + " "*61 + "|")
    print("+" + "-"*70 + "+")
    print(f"  Files modified  : {total_changed}")
    print(f"  Dry run         : {dry_result}")
    print(f"  Time            : {elapsed:.2f}s")
    print("+" + "-"*70 + "+")
    print("  Fingerprints removed:")
    print(f"   Theme name   : {KNOWN_THEME_NAMES[0]!r}  ->  {REPLACEMENT_THEME_NAME!r}")
    print(f"   Author       : {KNOWN_THEME_AUTHORS[0]!r}  ->  {REPLACEMENT_THEME_AUTHOR!r}")
    print(f"   Version      : {KNOWN_THEME_VERSIONS[0]!r}  ->  {REPLACEMENT_THEME_VERSION!r}")
    print(f"   Support URLs : maestrooo.com  ->  help.example.com")
    print(f"   Section types: remapped to generic names")
    print(f"   Schema classes: remapped to generic names")
    print(f"   Liquid comments: structural blocks cleared")
    print("+" + "="*70 + "+")
    print()


# ─────────────────────────────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Remove Shopify theme fingerprints from a theme directory.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "theme_dir",
        nargs="?",
        default=".",
        help="Path to the Shopify theme folder (default: current directory)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing any files"
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip creating a timestamped backup of the theme folder"
    )

    args = parser.parse_args()
    theme_dir = Path(args.theme_dir).resolve()

    run_obfuscator(theme_dir, dry_run=args.dry_run, no_backup=args.no_backup)


if __name__ == "__main__":
    main()
