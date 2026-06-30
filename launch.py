#!/usr/bin/env python3
"""One-click Spectra launcher — installs deps, builds UI if needed, opens browser."""

from __future__ import annotations

import importlib.util
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"
REQUIREMENTS = BACKEND / "requirements.txt"
HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"


def log(message: str) -> None:
    print(message, flush=True)


def has_python_deps() -> bool:
    for module in ("fastapi", "uvicorn", "psutil", "aiosqlite"):
        if importlib.util.find_spec(module) is None:
            return False
    return True


def install_python_deps() -> None:
    log("Installing Python dependencies (first run only)...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS)],
        cwd=BACKEND,
        check=True,
    )


def has_frontend_build() -> bool:
    return (DIST / "index.html").is_file()


def build_frontend() -> None:
    if not shutil.which("npm"):
        raise RuntimeError(
            "Node.js is required once to build the UI. Install from https://nodejs.org "
            "and run Spectra again."
        )

    log("Building the UI (first run only)...")
    subprocess.run(["npm", "install"], cwd=FRONTEND, check=True)
    subprocess.run(["npm", "run", "build"], cwd=FRONTEND, check=True)


def open_browser_when_ready() -> None:
    import urllib.error
    import urllib.request

    for _ in range(60):
        try:
            with urllib.request.urlopen(f"{URL}/health", timeout=1):
                webbrowser.open(URL)
                return
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.5)


def main() -> int:
    log("Starting Spectra...")

    if not has_python_deps():
        install_python_deps()

    if not has_frontend_build():
        build_frontend()

    log(f"Spectra is running at {URL}")
    log("Leave this window open while you use the app. Close it to stop Spectra.")

    threading.Thread(target=open_browser_when_ready, daemon=True).start()

    subprocess.run(
        [sys.executable, "run.py"],
        cwd=BACKEND,
        check=True,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        log(f"Spectra failed to start (exit code {exc.returncode}).")
        raise SystemExit(exc.returncode) from exc
    except KeyboardInterrupt:
        log("\nSpectra stopped.")
        raise SystemExit(0)
    except Exception as exc:
        log(f"Error: {exc}")
        raise SystemExit(1) from exc
