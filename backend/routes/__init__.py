"""
Routes package for Jewelry Search API
"""
from fastapi import APIRouter

# Create main API router
api_router = APIRouter()

# Import and include sub-routers
from .health import router as health_router
from .search import router as search_router
from .products import router as products_router
from .categories import router as categories_router

api_router.include_router(health_router, tags=["health"])
api_router.include_router(search_router, prefix="/api", tags=["search"])
api_router.include_router(products_router, prefix="/api", tags=["products"])
api_router.include_router(categories_router, prefix="/api", tags=["categories"])

__all__ = ["api_router"]
