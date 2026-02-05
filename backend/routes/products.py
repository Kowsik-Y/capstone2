"""
Product-related endpoints
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import traceback
import random

from models.schemas import SearchResponse
from dependencies import get_search_engine

router = APIRouter()


@router.get("/product/{product_id}")
async def get_product(product_id: int):
    """
    Get detailed product information by ID
    
    - **product_id**: ID of the jewelry item
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    if product_id < 0 or product_id >= len(search_engine.image_paths):
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Get product details
        category = search_engine.image_categories[product_id]
        
        # Generate description using LLM
        description = search_engine.generate_description(product_id, category)
        
        product = {
            "id": product_id,
            "image_path": search_engine.image_paths[product_id],
            "category": category,
            "description": description,
            "similarity_score": None,
            "plain_score": None,
            "decoration_score": None
        }
        
        return product
    
    except Exception as e:
        print(f"❌ Product Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Product error: {str(e)}")


@router.get("/image/{image_id}")
async def get_image(image_id: int):
    """
    Serve image by ID
    
    - **image_id**: ID of the image to retrieve
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    if image_id < 0 or image_id >= len(search_engine.image_paths):
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_path = search_engine.image_paths[image_id]
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(image_path, media_type="image/jpeg")


@router.get("/featured", response_model=SearchResponse)
async def get_featured_items(limit: int = 12):
    """
    Get featured/random jewelry items for homepage
    
    - **limit**: Number of items to return
    """
    search_engine = get_search_engine()
    
    if search_engine is None:
        raise HTTPException(status_code=503, detail="Search engine not initialized")
    
    try:
        # Get random indices
        total = len(search_engine.image_paths)
        random_indices = random.sample(range(total), min(limit, total))
        
        # Format as search results
        results = []
        for idx in random_indices:
            results.append({
                "id": idx,
                "image_path": search_engine.image_paths[idx],
                "category": search_engine.image_categories[idx],
                "similarity_score": 1.0,
                "plain_score": None,
                "decoration_score": None
            })
        
        return SearchResponse(
            query="Featured items",
            enhanced_query="Explore our jewelry collection",
            categories=list(set([r["category"] for r in results])),
            negations=[],
            results=results,
            total_results=len(results),
            filter_stats={"featured": True}
        )
    
    except Exception as e:
        print(f"❌ Featured Items Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Featured items error: {str(e)}")
