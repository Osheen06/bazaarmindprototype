"""Vercel Serverless Function entrypoint for BazaarMind FastAPI backend."""

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
backend_dir = ROOT_DIR / "backend" if (ROOT_DIR / "backend").exists() else ROOT_DIR.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from server import app
