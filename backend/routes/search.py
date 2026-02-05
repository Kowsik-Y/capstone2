"""
Search and recommendation endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from PIL import Image
import io
import traceback

from models.schemas import SearchRequest, SearchResponse, RecommendRequest
from dependencies import get_search_engine

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Perform semantic search for jewelry items
    
    - **query**: Natural language query (supports negations like "no diamonds")
    - **categories**: Optional category filter (ring, necklace)
    - **top_k**: Number of results to return
    - **max_decoration_score**: Maximum decoration similarity threshold
    - **min_plain_score**: Minimum plain similarity threshold
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    try:
        results = await search_engine.search(
            query=request.query,
            categories=request.categories,
            top_k=request.top_k,
            max_decoration_score=request.max_decoration_score,
            min_plain_score=request.min_plain_score,
            semantic_top_k=request.semantic_top_k
        )
        
        return SearchResponse(**results)
    
    except Exception as e:
        print(f"❌ Search Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.post("/recommend", response_model=SearchResponse)
async def recommend(request: RecommendRequest):
    """
    Get recommendations based on a specific image
    
    - **image_id**: ID of the reference image
    - **top_k**: Number of recommendations
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    try:
        results = await search_engine.recommend(
            image_id=request.image_id,
            top_k=request.top_k
        )
        
        return SearchResponse(**results)
    
    except Exception as e:
        print(f"❌ Recommendation Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@router.post("/upload", response_model=SearchResponse)
async def upload_image(
    file: UploadFile = File(...),
    top_k: int = Form(10)
):
    """
    Upload a jewelry image and get similar items
    
    - **file**: Image file (JPEG, PNG)
    - **top_k**: Number of results to return
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Search by image
        results = await search_engine.search_by_image(image, top_k=top_k)
        
        return SearchResponse(**results)
    
    except Exception as e:
        print(f"❌ Upload Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


@router.post("/upload-with-text", response_model=SearchResponse)
async def upload_image_with_text(
    file: UploadFile = File(...),
    query: str = Form(""),
    top_k: int = Form(10)
):
    """
    Upload a jewelry image with optional text query for hybrid search
    
    - **file**: Image file (JPEG, PNG)
    - **query**: Optional text query to refine search
    - **top_k**: Number of results to return
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Search by image + text if query provided, otherwise just image
        if query and query.strip():
            results = await search_engine.search_by_image_and_text(
                image, query.strip(), top_k=top_k
            )
        else:
            results = await search_engine.search_by_image(image, top_k=top_k)
        
        return SearchResponse(**results)
    
    except Exception as e:
        print(f"❌ Upload with Text Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")
