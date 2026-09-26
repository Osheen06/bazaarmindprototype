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

try:
    from server import app
except Exception as exc:
    import traceback
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    app = FastAPI(title="BazaarMind Startup Fallback")

    @app.api_route("/{rest_of_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    async def startup_error(rest_of_path: str):
        return PlainTextResponse(f"BazaarMind Backend Startup Error:\n\n{tb}", status_code=500)

