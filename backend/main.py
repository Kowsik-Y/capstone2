"""
FastAPI Backend for Jewelry Search with CLIP Model
Provides semantic search and recommendation endpoints
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import api_router
from dependencies import initialize_search_engine

# Load environment variables
load_dotenv()

# Create FastAPI application
app = FastAPI(
    title="Jewelry Search API",
    description="Semantic search for jewelry using CLIP model with advanced features",
    version="2.0.0"
)

# CORS configuration - load allowed origins from environment
cors_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routes
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """Initialize the search engine on startup"""
    await initialize_search_engine()


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Jewelry Search API",
        "version": "2.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "search": "/api/search",
            "upload": "/api/upload",
            "recommend": "/api/recommend",
            "products": "/api/product/{id}",
            "images": "/api/image/{id}",
            "categories": "/api/categories",
            "featured": "/api/featured"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

