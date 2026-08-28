import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import HOST, PORT, ENVIRONMENT, CORS_ORIGINS, AUTO_SEED
from app.db import init_db
from app.routes import health, events, forecast, risk
from app.services.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema on startup
    init_db()
    if AUTO_SEED:
        seed_if_empty()
    yield


app = FastAPI(
    title="Weather Intelligence Command Center API",
    lifespan=lifespan
)

# CORS middleware configured via environment variables
allow_credentials = False if "*" in CORS_ORIGINS else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(events.router)
app.include_router(forecast.router)
app.include_router(risk.router)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=(ENVIRONMENT == "development"))
