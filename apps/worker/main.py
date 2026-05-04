from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("hirevault-worker")

app = FastAPI(title="HireVault Worker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
