"""Vercel Serverless Function entrypoint for BazaarMind FastAPI backend."""

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
candidates = [
    ROOT_DIR / "backend",
    ROOT_DIR.parent / "backend",
    Path.cwd() / "backend",
    Path.cwd(),
]
for p in candidates:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))

from server import app
