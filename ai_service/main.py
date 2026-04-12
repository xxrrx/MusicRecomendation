from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Music Recommendation AI Service",
    version="1.0.0",
    description="AI-powered recommendation engine for the Music Streaming Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Routers will be registered here as they are built
# from routers import recommend, radio
# app.include_router(recommend.router)
# app.include_router(radio.router)
