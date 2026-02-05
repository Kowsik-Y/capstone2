"""
Health check and system status endpoints
"""
from fastapi import APIRouter, HTTPException
from models.schemas import HealthResponse
from dependencies import get_search_engine

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    Returns system status and model information
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    return HealthResponse(
        status="healthy",
        model_loaded=search_engine.model is not None,
        total_images=search_engine.total_images
    )
