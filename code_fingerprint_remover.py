#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║          CODE FINGERPRINT REMOVER  v1.0                  ║
║  Strips author info, licenses, timestamps & identifiers  ║
╚══════════════════════════════════════════════════════════╝

Usage:
    python code_fingerprint_remover.py <file_or_directory> [options]

Examples:
    python code_fingerprint_remover.py myfile.js
    python code_fingerprint_remover.py ./src --recursive
    python code_fingerprint_remover.py ./src --recursive --dry-run
    python code_fingerprint_remover.py myfile.py --output cleaned_file.py
"""

import os
import re
import sys
import shutil
import argparse
import hashlib
from pathlib import Path
from datetime import datetime

# ─────────────────────────────────────────────────────────────
#  SUPPORTED EXTENSIONS
# ─────────────────────────────────────────────────────────────
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp",
    ".cs", ".go", ".rb", ".php", ".swift", ".kt", ".rs", ".sh",
    ".bash", ".zsh", ".html", ".css", ".scss", ".sass", ".less",
    ".vue", ".liquid", ".md", ".txt", ".json", ".yaml", ".yml",
    ".xml", ".sql", ".r", ".m", ".h", ".hpp"
}

# ─────────────────────────────────────────────────────────────
#  FINGERPRINT PATTERNS TO REMOVE / REDACT
# ─────────────────────────────────────────────────────────────
PATTERNS = [
    # ── Email addresses ──────────────────────────────────────
    (re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'),
     '[EMAIL REDACTED]'),

    # ── Author / @author tags ─────────────────────────────────
    (re.compile(
        r'(//|#|/\*|\*|<!--|--|{#)\s*@?[Aa]uthor[:\s]+.+', re.MULTILINE),
     r'\1 @author [REDACTED]'),

    # ── Copyright lines ───────────────────────────────────────
    (re.compile(
        r'(//|#|/\*|\*|<!--|--|{#)\s*[Cc]opyright\s*[\(©]?.*', re.MULTILINE),
     r'\1 Copyright [REDACTED]'),

    # ── License declaration lines ─────────────────────────────
    (re.compile(
        r'(//|#|/\*|\*|<!--|--|{#)\s*(SPDX-License-Identifier|Licensed under|MIT License|Apache License|GNU General Public|All rights reserved).+',
        re.MULTILINE | re.IGNORECASE),
     r'\1 License: [REDACTED]'),

    # ── Project / package name in common header comments ──────
    (re.compile(
        r'(//|#|/\*|\*)\s*(Project|Package|Module|App|Application):\s*.+',
        re.MULTILINE | re.IGNORECASE),
     r'\1 \2: [REDACTED]'),

    # ── Version strings (e.g.  @version 1.2.3  or  v1.0.0) ──
    (re.compile(
        r'(//|#|/\*|\*)\s*@?[Vv]ersion[:\s]+[\d\.]+', re.MULTILINE),
     r'\1 @version [REDACTED]'),

    # ── Date / timestamp strings in comments ──────────────────
    (re.compile(
        r'(//|#|/\*|\*|<!--|--|{#)\s*(Date|Created|Updated|Modified|Last modified)[:\s]+[\d\-\/\.T: ]+',
        re.MULTILINE | re.IGNORECASE),
     r'\1 \2: [REDACTED]'),

    # ── ISO 8601 timestamps anywhere ─────────────────────────
    (re.compile(
        r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?'),
     '[TIMESTAMP REDACTED]'),

    # ── GitHub / GitLab / Bitbucket repo URLs ─────────────────
    (re.compile(
        r'https?://(github|gitlab|bitbucket)\.com/[A-Za-z0-9_.\-]+/[A-Za-z0-9_.\-]+',
        re.IGNORECASE),
     'https://[REPO REDACTED]'),

    # ── Generic URLs (optional — enabled via flag) ────────────
    # Kept separate; applied conditionally below.

    # ── UUID / GUID ───────────────────────────────────────────
    (re.compile(
        r'\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b'),
     '[UUID REDACTED]'),

    # ── API keys / tokens (common patterns) ───────────────────
    (re.compile(
        r'(api[_-]?key|secret|token|password|passwd|pwd|auth)["\s]*[:=]["\s]*["\']?[A-Za-z0-9+/=\-_\.]{8,}["\']?',
        re.IGNORECASE),
     r'\1 = "[CREDENTIAL REDACTED]"'),

    # ── IP addresses ─────────────────────────────────────────
    (re.compile(
        r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
     '[IP REDACTED]'),

    # ── Phone numbers ─────────────────────────────────────────
    (re.compile(
        r'(\+?\d[\d\s\-\(\)]{7,}\d)'),
     '[PHONE REDACTED]'),

    # ── Windows / Unix absolute file paths in comments ────────
    (re.compile(
        r'(//|#|/\*|\*)\s+([A-Za-z]:\\[^\s,\n]+|/(?:home|Users|root|var|etc)/[^\s,\n]+)',
        re.MULTILINE),
     r'\1 [PATH REDACTED]'),

    # ── SSH public keys ───────────────────────────────────────
    (re.compile(
        r'ssh-(rsa|ed25519|ecdsa)\s+[A-Za-z0-9+/=]{20,}(\s+\S+)?'),
     '[SSH KEY REDACTED]'),

    # ── JWT tokens ───────────────────────────────────────────
    (re.compile(
        r'eyJ[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=\-_]+'),
     '[JWT REDACTED]'),
]

GENERIC_URL_PATTERN = re.compile(
    r'https?://[A-Za-z0-9.\-_/?=&#%+:@]+', re.IGNORECASE)


# ─────────────────────────────────────────────────────────────
#  BLOCK-LEVEL HEADER REMOVAL
# ─────────────────────────────────────────────────────────────
def remove_block_headers(content: str) -> str:
    """Remove large C-style /* ... */ or Python triple-quote header blocks
    that appear at the very top of a file and contain typical header keywords."""
    header_keywords = re.compile(
        r'(author|copyright|license|version|created|project|contributor|email)',
        re.IGNORECASE)

    # C-style block comment at the start
    block_comment = re.match(r'\s*/\*[\s\S]*?\*/', content)
    if block_comment:
        block = block_comment.group(0)
        if header_keywords.search(block):
            content = content[block_comment.end():].lstrip('\n')

    # Python/Bash shebang is kept, but triple-quote docstring at very top removed
    triple_quote = re.match(
        r'(\s*#!.*\n)?\s*("""|\'\'\')[\s\S]*?\2', content)
    if triple_quote:
        block = triple_quote.group(0)
        if header_keywords.search(block):
            content = content[triple_quote.end():].lstrip('\n')

    return content


# ─────────────────────────────────────────────────────────────
#  CORE PROCESSING FUNCTION
# ─────────────────────────────────────────────────────────────
def remove_fingerprints(content: str, strip_urls: bool = False) -> tuple[str, list[str]]:
    """Apply all fingerprint removal patterns and return (cleaned_content, log_entries)."""
    log = []
    original = content

    # Remove block-level headers
    content = remove_block_headers(content)
    if content != original:
        log.append("  [✓] Removed block-level header comment")

    # Apply line-level patterns
    for pattern, replacement in PATTERNS:
        new_content, count = pattern.subn(replacement, content)
        if count:
            log.append(f"  [✓] Replaced {count} match(es) — pattern: {pattern.pattern[:60]}...")
            content = new_content

    # Optional: strip ALL URLs
    if strip_urls:
        new_content, count = GENERIC_URL_PATTERN.subn('[URL REDACTED]', content)
        if count:
            log.append(f"  [✓] Stripped {count} generic URL(s)")
            content = new_content

    return content, log


# ─────────────────────────────────────────────────────────────
#  FILE HANDLER
# ─────────────────────────────────────────────────────────────
def process_file(
    input_path: Path,
    output_path: Path | None = None,
    dry_run: bool = False,
    backup: bool = True,
    strip_urls: bool = False,
    verbose: bool = True,
) -> bool:
    """Process a single file. Returns True if changes were made."""
    if input_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        if verbose:
            print(f"  [SKIP] Unsupported extension: {input_path}")
        return False

    try:
        original_text = input_path.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        print(f"  [ERROR] Cannot read {input_path}: {e}")
        return False

    cleaned_text, log = remove_fingerprints(original_text, strip_urls=strip_urls)

    if cleaned_text == original_text:
        if verbose:
            print(f"  [—] No fingerprints found: {input_path.name}")
        return False

    print(f"\n  📄 {input_path}")
    for entry in log:
        print(entry)

    if dry_run:
        print("  [DRY RUN] No changes written.")
        return True

    dest = output_path if output_path else input_path

    # Backup original
    if backup and dest == input_path:
        backup_path = input_path.with_suffix(input_path.suffix + '.bak')
        shutil.copy2(input_path, backup_path)
        print(f"  [BAK] Backup saved → {backup_path.name}")

    try:
        dest.write_text(cleaned_text, encoding='utf-8')
        print(f"  [SAVED] → {dest}")
    except Exception as e:
        print(f"  [ERROR] Cannot write {dest}: {e}")
        return False

    return True


# ─────────────────────────────────────────────────────────────
#  DIRECTORY WALKER
# ─────────────────────────────────────────────────────────────
def process_directory(
    directory: Path,
    recursive: bool,
    dry_run: bool,
    backup: bool,
    strip_urls: bool,
    verbose: bool,
) -> tuple[int, int]:
    """Walk a directory, processing all supported files. Returns (files_checked, files_changed)."""
    checked = changed = 0
    glob = "**/*" if recursive else "*"

    for file_path in sorted(directory.glob(glob)):
        if file_path.is_file() and not file_path.name.endswith('.bak'):
            checked += 1
            if process_file(file_path, dry_run=dry_run, backup=backup,
                            strip_urls=strip_urls, verbose=verbose):
                changed += 1

    return checked, changed


# ─────────────────────────────────────────────────────────────
#  HASH UTILITY
# ─────────────────────────────────────────────────────────────
def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


# ─────────────────────────────────────────────────────────────
#  CLI ENTRY POINT
# ─────────────────────────────────────────────────────────────
def main():
    banner = """
╔══════════════════════════════════════════════════════════╗
║          CODE FINGERPRINT REMOVER  v1.0                  ║
║  Strips author info, licenses, timestamps & identifiers  ║
╚══════════════════════════════════════════════════════════╝
"""
    print(banner)

    parser = argparse.ArgumentParser(
        description="Remove identifying fingerprints from source code files.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "target",
        help="File or directory to process",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file (only valid when target is a single file)",
        default=None,
    )
    parser.add_argument(
        "-r", "--recursive",
        action="store_true",
        help="Recurse into subdirectories (only when target is a directory)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without writing files",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip creating .bak backup files",
    )
    parser.add_argument(
        "--strip-urls",
        action="store_true",
        help="Also redact ALL http/https URLs (not just repo URLs)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only print summary, suppress per-file detail for unchanged files",
    )

    args = parser.parse_args()
    target = Path(args.target).resolve()

    if not target.exists():
        print(f"[ERROR] Path not found: {target}")
        sys.exit(1)

    start = datetime.now()
    backup = not args.no_backup
    verbose = not args.quiet

    # ── Single file mode ──────────────────────────────────────
    if target.is_file():
        output_path = Path(args.output).resolve() if args.output else None
        changed = process_file(
            target,
            output_path=output_path,
            dry_run=args.dry_run,
            backup=backup,
            strip_urls=args.strip_urls,
            verbose=verbose,
        )
        elapsed = (datetime.now() - start).total_seconds()
        print(f"\n{'─'*50}")
        print(f"  Result : {'Changes made ✓' if changed else 'No changes needed'}")
        print(f"  Time   : {elapsed:.2f}s")
        print(f"{'─'*50}")

    # ── Directory mode ────────────────────────────────────────
    elif target.is_dir():
        if args.output:
            print("[WARN] --output is ignored when processing a directory.")
        checked, changed = process_directory(
            target,
            recursive=args.recursive,
            dry_run=args.dry_run,
            backup=backup,
            strip_urls=args.strip_urls,
            verbose=verbose,
        )
        elapsed = (datetime.now() - start).total_seconds()
        print(f"\n{'═'*50}")
        print(f"  📂 Directory : {target}")
        print(f"  Files checked : {checked}")
        print(f"  Files modified: {changed}")
        print(f"  Dry run       : {'YES' if args.dry_run else 'NO'}")
        print(f"  Time          : {elapsed:.2f}s")
        print(f"{'═'*50}")
    else:
        print(f"[ERROR] Target is neither a file nor directory: {target}")
        sys.exit(1)


if __name__ == "__main__":
    main()
