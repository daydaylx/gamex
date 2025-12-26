import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.db import init_db
from app.template_store import ensure_default_template, ensure_comprehensive_template, ensure_psycho_enhanced_template
from app.routes import api_router

APP_TITLE = "Intimacy Tool (Local-first)"

def create_app() -> FastAPI:
    app = FastAPI(title=APP_TITLE)

    # Security: CORS Configuration (local-first, only localhost)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "capacitor://localhost",  # Capacitor mobile app
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Security: Add security headers to all responses
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response: Response = await call_next(request)
        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Content Security Policy (strict)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "  # unsafe-inline needed for inline scripts
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        # XSS Protection (deprecated but still useful for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    init_db()
    ensure_default_template()
    ensure_comprehensive_template()
    ensure_psycho_enhanced_template()

    app.include_router(api_router, prefix="/api")

    # Serve static frontend
    # Monorepo layout: apps/web/web contains the static frontend assets.
    web_dir = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "web")
    web_dir = os.path.abspath(web_dir)
    app.mount("/", StaticFiles(directory=web_dir, html=True), name="web")

    return app

app = create_app()

def run() -> None:
    import uvicorn
    host = os.environ.get("INTIMACY_TOOL_HOST", "127.0.0.1")
    port = int(os.environ.get("INTIMACY_TOOL_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)



