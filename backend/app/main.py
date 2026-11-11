
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import engine, Base
from app.routes.auth import router as auth_router

app = FastAPI(
    title="Veylora API",
    description="Authentication and Identity Management API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Database table creation
Base.metadata.create_all(bind=engine)


@app.get("/")
async def home():
    return {
        "status": "success",
        "message": "Veylora API is running successfully"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }


# Authentication routes
# IMPORTANT: Prefix is registered only here.
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)
