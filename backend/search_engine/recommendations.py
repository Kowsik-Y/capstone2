"""
Recommendations Module - Product Recommendation Features
"""

from typing import Dict, Any


async def recommend(engine, image_id: int, top_k: int = 5) -> Dict[str, Any]:
    """Get recommendations based on image similarity"""
    if image_id >= len(engine.image_embeddings):
        raise ValueError(f"Invalid image_id: {image_id}")
    
    # Get image embedding
    img_embedding = engine.image_embeddings[image_id]
    
    # Search similar images
    results = engine.client.search(
        collection_name=engine.collection_name,
        query_vector=img_embedding.tolist(),
        limit=top_k + 1  # +1 to exclude the query image itself
    )
    
    # Format results (exclude the query image)
    formatted_results = []
    for p in results:
        if p.id != image_id:
            formatted_results.append({
                "id": p.id,
                "image_path": p.payload["image_path"],
                "category": p.payload["category"],
                "similarity_score": float(p.score),
                "plain_score": None,
                "decoration_score": None
            })
    
    return {
        "query": f"Similar to image {image_id}",
        "enhanced_query": f"Recommendations for {engine.image_categories[image_id]}",
        "categories": [engine.image_categories[image_id]],
        "negations": [],
        "results": formatted_results[:top_k],
        "total_results": len(formatted_results[:top_k]),
        "filter_stats": {"semantic_matches": len(results)}
    }


def generate_description(engine, image_id: int, category: str) -> str:
    """Generate a product description using LLM"""
    image_path = engine.image_paths[image_id]
    return engine.jewelry_utils.generate_description(image_path, category)
