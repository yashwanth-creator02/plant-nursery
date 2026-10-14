#!/usr/bin/env python3
"""
run_typecheck.py

Deterministic execution tool to run TypeScript compilation check and output clean error summaries.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def main():
    print("Running TypeScript compiler check (tsc --noEmit)...")
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        shell=True,
    )
    if result.returncode == 0:
        print("Type check passed cleanly with 0 errors.")
        sys.exit(0)
    else:
        print("Type check errors found:")
        print(result.stdout or result.stderr)
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()
