#!/usr/bin/env python3
"""
verify_project_health.py

Deterministic execution tool to audit project health:
- Checks existence of 3-layer architecture directories (directives, execution, .tmp).
- Checks .gitignore rules for disposable agent skills and intermediate files.
- Validates agent skills manifest integrity.
"""

import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def check_directories():
    required = ["directives", "execution", ".tmp", "src"]
    missing = [d for d in required if not (PROJECT_ROOT / d).is_dir()]
    if missing:
        print(f"FAILED: Missing required directories: {', '.join(missing)}")
        return False
    print("OK: All 3-layer architecture directories exist.")
    return True


def check_gitignore():
    gi = PROJECT_ROOT / ".gitignore"
    if not gi.exists():
        print("FAILED: .gitignore is missing.")
        return False
    lines = gi.read_text(encoding="utf-8").splitlines()
    required_entries = [".tmp/", ".agent/skills/"]
    missing = [e for e in required_entries if not any(e.strip("/") in line for line in lines)]
    if missing:
        print(f"FAILED: Missing entries in .gitignore: {', '.join(missing)}")
        return False
    print("OK: .gitignore includes required disposable and temp directories.")
    return True


def check_skills_manifest():
    manifest_paths = [
        PROJECT_ROOT / ".agents" / "skills" / ".brand-sync-manifest.json",
        PROJECT_ROOT / ".agent" / "skills" / ".brand-sync-manifest.json",
    ]
    found = False
    for mp in manifest_paths:
        if mp.exists():
            try:
                data = json.loads(mp.read_text(encoding="utf-8"))
                version = data.get("brand_version", "unknown")
                skill_count = len([k for k in data.keys() if k != "brand_version"])
                print(f"OK: Found valid skill manifest at {mp.relative_to(PROJECT_ROOT)} (version {version}, {skill_count} skills).")
                found = True
            except Exception as e:
                print(f"FAILED: Corrupt manifest at {mp}: {e}")
                return False
    if not found:
        print("WARNING: No .brand-sync-manifest.json found in .agents/skills or .agent/skills.")
    return found


def main():
    print(f"--- Project Health Audit: {PROJECT_ROOT.name} ---")
    results = [
        check_directories(),
        check_gitignore(),
        check_skills_manifest(),
    ]
    if all(results):
        print("All project health checks passed.")
        sys.exit(0)
    else:
        print("Health check completed with warnings/failures.")
        sys.exit(1)


if __name__ == "__main__":
    main()
