"""
Category-related endpoints
"""
from fastapi import APIRouter, HTTPException
from dependencies import get_search_engine

router = APIRouter()


@router.get("/categories")
async def get_categories():
    """
    Get available jewelry categories with image counts
    
    Returns information about all available categories in the system
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    return {
        "categories": search_engine.categories,
        "total_images": search_engine.total_images,
        "images_per_category": search_engine.get_category_counts()
    }
