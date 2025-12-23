import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.template_store import ensure_default_template
from app.routes import api_router

APP_TITLE = "Intimacy Tool (Local-first)"

def create_app() -> FastAPI:
    app = FastAPI(title=APP_TITLE)

    init_db()
    ensure_default_template()

    app.include_router(api_router, prefix="/api")

    # Serve static frontend
    web_dir = os.path.join(os.path.dirname(__file__), "..", "web")
    web_dir = os.path.abspath(web_dir)
    app.mount("/", StaticFiles(directory=web_dir, html=True), name="web")

    return app

app = create_app()

def run() -> None:
    import uvicorn
    host = os.environ.get("INTIMACY_TOOL_HOST", "127.0.0.1")
    port = int(os.environ.get("INTIMACY_TOOL_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)


