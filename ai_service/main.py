from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recommend, radio
from app.services.hybrid_engine import warmup


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-build AI models on startup
    try:
        warmup()
        print("✅ AI models built successfully")
    except Exception as e:
        print(f"⚠️  AI model warmup failed (will retry on first request): {e}")
    yield


app = FastAPI(
    title="Music Recommendation AI Service",
    version="1.0.0",
    description="AI-powered recommendation engine for the Music Streaming Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(recommend.router)
app.include_router(radio.router)


@app.get("/health")
def health():
    return {"status": "ok"}
