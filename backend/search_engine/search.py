"""
Search Module - All Search Functionality
"""

import torch
import numpy as np
from PIL import Image
from typing import Optional, List, Dict, Any
from qdrant_client.models import Filter, FieldCondition, MatchValue


async def search(
    engine,
    query: str,
    categories: Optional[List[str]] = None,
    top_k: int = 5,
    max_decoration_score: float = 0.25,
    min_plain_score: float = 0.28,
    semantic_top_k: int = 100
) -> Dict[str, Any]:
    """
    Perform semantic search with negation filtering
    """
    # Extract query components using query processor
    filter_categories = categories or engine.query_processor.extract_categories(query)
    negations = engine.query_processor.extract_negations(query)
    
    # Enhance query
    category = filter_categories[0] if filter_categories else "jewelry"
    enhanced_query = engine.query_processor.enhance_query(query, category, negations)
    
    # Embed query using embedding handler
    query_embedding = engine.embedding_handler.embed_text(enhanced_query)
    
    # Pre-compute decoration and plain term embeddings if we have negations
    decoration_embeddings = None
    plain_embeddings = None
    if negations:
        decoration_terms = engine.query_processor.get_decoration_terms(category, negations)
        plain_terms = engine.query_processor.get_plain_terms(category)
        
        # Batch embed all terms at once (much faster than one by one)
        decoration_embeddings = engine.embedding_handler.batch_embed_texts(decoration_terms)
        plain_embeddings = engine.embedding_handler.batch_embed_texts(plain_terms)
    
    # Stage 1: Semantic search
    semantic_results = engine.client.search(
        collection_name=engine.collection_name,
        query_vector=query_embedding[0].tolist(),
        limit=semantic_top_k,
        with_vectors=True
    )
    
    semantic_points = semantic_results
    filter_stats = {
        "semantic_matches": len(semantic_points),
        "category_filtered": 0,
        "negation_filtered": 0,
        "final_results": 0
    }
    
    # Stage 2: Category filter
    filtered_points = semantic_points
    if filter_categories:
        filtered_points = [p for p in filtered_points if p.payload["category"] in filter_categories]
        filter_stats["category_filtered"] = len(filtered_points)
    
    # Stage 3: Negation + decoration filter
    if negations and decoration_embeddings is not None and plain_embeddings is not None:
        passed_images = []
        
        for p in filtered_points:
            img_emb = torch.tensor(p.vector).unsqueeze(0).to(engine.device)
            img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)
            
            # Batch compute decoration similarity
            decoration_scores = (decoration_embeddings @ img_emb.T).squeeze()
            max_decoration = decoration_scores.max().item()
            
            # Batch compute plain similarity
            plain_scores = (plain_embeddings @ img_emb.T).squeeze()
            max_plain = plain_scores.max().item()
            
            if max_decoration < max_decoration_score and max_plain > min_plain_score:
                passed_images.append((p, max_plain, max_decoration))
        
        passed_images = sorted(passed_images, key=lambda x: x[1], reverse=True)
        filtered_points = [(p, plain, deco) for p, plain, deco in passed_images]
        filter_stats["negation_filtered"] = len(filtered_points)
    else:
        filtered_points = [(p, None, None) for p in filtered_points]
    
    # Format results
    results = []
    for i, (p, plain_score, decoration_score) in enumerate(filtered_points[:top_k]):
        results.append({
            "id": p.id,
            "image_path": p.payload["image_path"],
            "category": p.payload["category"],
            "similarity_score": float(p.score),
            "plain_score": float(plain_score) if plain_score is not None else None,
            "decoration_score": float(decoration_score) if decoration_score is not None else None
        })
    
    filter_stats["final_results"] = len(results)
    
    return {
        "query": query,
        "enhanced_query": enhanced_query,
        "categories": filter_categories,
        "negations": negations,
        "results": results,
        "total_results": len(results),
        "filter_stats": filter_stats
    }


async def search_by_image(engine, image: Image.Image, top_k: int = 10) -> Dict[str, Any]:
    """Search by uploaded image with automatic text extraction and type detection"""
    # Extract text from image using OCR handler
    extracted_text = engine.ocr_handler.extract_text_from_image(image)
    
    # Detect jewelry type using jewelry utils
    detected_type = engine.jewelry_utils.detect_jewelry_type(image)
    
    # If we have extracted text, use hybrid search
    if extracted_text:
        # Build query from extracted text and detected type
        query = extracted_text
        if detected_type:
            query = f"{detected_type} {extracted_text}"
        
        print(f"🔍 Searching with extracted text: '{query}'")
        return await search_by_image_and_text(engine, image, query, top_k)
    
    # Otherwise, use pure image similarity
    # Embed the uploaded image
    img_embedding = engine.embedding_handler.embed_image(image)
    
    # Filter by detected type if available
    search_filter = None
    if detected_type:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="category",
                    match=MatchValue(value=detected_type)
                )
            ]
        )
    
    # Search
    results = engine.client.search(
        collection_name=engine.collection_name,
        query_vector=img_embedding.tolist(),
        limit=top_k,
        query_filter=search_filter
    )
    
    # Format results
    formatted_results = []
    for p in results:
        formatted_results.append({
            "id": p.id,
            "image_path": p.payload["image_path"],
            "category": p.payload["category"],
            "similarity_score": float(p.score),
            "plain_score": None,
            "decoration_score": None
        })
    
    return {
        "query": extracted_text or "Image upload search",
        "enhanced_query": f"Image search{f' (detected: {detected_type})' if detected_type else ''}{f' + text: {extracted_text}' if extracted_text else ''}",
        "categories": list(set([r["category"] for r in formatted_results])),
        "negations": [],
        "results": formatted_results,
        "total_results": len(formatted_results),
        "filter_stats": {"semantic_matches": len(results)}
    }


async def search_by_image_and_text(
    engine, image: Image.Image, query: str, top_k: int = 10
) -> Dict[str, Any]:
    """Search by combining image and text embeddings"""
    # Embed the uploaded image using embedding handler
    img_embedding = engine.embedding_handler.embed_image(image)
    
    # Embed the text query using embedding handler
    text_embedding = engine.embedding_handler.embed_text(query)
    
    # Combine embeddings (weighted average: 0.6 image + 0.4 text)
    combined_embedding = 0.6 * img_embedding + 0.4 * text_embedding[0]
    combined_embedding = combined_embedding / np.linalg.norm(combined_embedding)
    
    # Search
    results = engine.client.search(
        collection_name=engine.collection_name,
        query_vector=combined_embedding.tolist(),
        limit=top_k
    )
    
    # Format results
    formatted_results = []
    for p in results:
        formatted_results.append({
            "id": p.id,
            "image_path": p.payload["image_path"],
            "category": p.payload["category"],
            "similarity_score": float(p.score),
            "plain_score": None,
            "decoration_score": None
        })
    
    return {
        "query": query,
        "enhanced_query": f"Image + Text: {query}",
        "categories": list(set([r["category"] for r in formatted_results])),
        "negations": [],
        "results": formatted_results,
        "total_results": len(formatted_results),
        "filter_stats": {"semantic_matches": len(results)}
    }
