"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ice_forecast
from app.api import route
from app.api import export

from app.api import icebergs

app = FastAPI(
    title="Antarctic Navigation Decision Support API",
    description="Sea-ice forecasting, iceberg trajectory prediction, and route optimization for Antarctic research vessels",
    version="0.1.0",
)

# Allow the frontend (running on localhost:3000 during dev) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://antartica-ice.vercel.app",
        "https://antartica-ice-git-main-manashprasad94-9469s-projects.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(icebergs.router, prefix="/api")
app.include_router(ice_forecast.router, prefix="/api")
app.include_router(route.router, prefix="/api")
app.include_router(export.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "message": "Antarctic Navigation Decision Support API is running"}