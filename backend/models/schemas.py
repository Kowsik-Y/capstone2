"""
Pydantic schemas for request/response models
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    total_images: int


class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., description="Natural language search query")
    categories: Optional[List[str]] = Field(None, description="Filter by categories")
    top_k: int = Field(10, ge=1, le=100, description="Number of results to return")
    max_decoration_score: float = Field(0.85, ge=0.0, le=1.0, description="Maximum decoration similarity threshold")
    min_plain_score: float = Field(0.325, ge=0.0, le=1.0, description="Minimum plain similarity threshold")
    semantic_top_k: int = Field(100, ge=1, le=1000, description="Number of candidates for semantic search")


class SearchResult(BaseModel):
    """Individual search result"""
    id: int
    image_path: str
    category: str
    similarity_score: float
    plain_score: Optional[float] = None
    decoration_score: Optional[float] = None
    description: Optional[str] = None


class SearchResponse(BaseModel):
    """Search response model"""
    query: str
    enhanced_query: str
    categories: List[str]
    negations: List[str]
    results: List[SearchResult]
    total_results: int
    filter_stats: Dict[str, Any]


class RecommendRequest(BaseModel):
    """Recommendation request model"""
    image_id: int = Field(..., description="ID of the reference image")
    top_k: int = Field(5, ge=1, le=50, description="Number of recommendations to return")
