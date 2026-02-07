"""
Index Builder - Builds vector database index from image embeddings
"""

from qdrant_client import QdrantClient 
from qdrant_client.models import VectorParams, Distance, PointStruct


async def build_index(engine):
    """Build vector database index with Qdrant"""
    # Try to load from cache first
    engine.image_embeddings = engine.embedding_handler.load_embeddings_cache(engine.image_paths)
    
    if engine.image_embeddings is None:
        print("Computing image embeddings...")
        engine.image_embeddings = engine.embedding_handler.embed_images_batch(
            engine.image_paths, batch_size=8
        )
        print(f"✅ Image embeddings: {engine.image_embeddings.shape}")
        # Save to cache
        engine.embedding_handler.save_embeddings_cache(
            engine.image_embeddings, engine.image_paths
        )
    else:
        print(f"✅ Image embeddings: {engine.image_embeddings.shape}")
    
    # Initialize Qdrant
    engine.client = QdrantClient(":memory:")
    
    # Determine embedding size (768 for CLIP-ViT-L)
    embedding_size = engine.image_embeddings.shape[1] if len(engine.image_embeddings) > 0 else 768
    
    engine.client.create_collection(
        collection_name=engine.collection_name,
        vectors_config=VectorParams(
            size=embedding_size,
            distance=Distance.COSINE
        )
    )
    
    if len(engine.image_embeddings) > 0:
        # Index all images
        points = [
            PointStruct(
                id=i,
                vector=engine.image_embeddings[i].tolist(),
                payload={
                    "image_path": engine.image_paths[i],
                    "category": engine.image_categories[i]
                }
            )
            for i in range(len(engine.image_embeddings))
        ]
        
        engine.client.upsert(collection_name=engine.collection_name, points=points)
        print(f"✅ Indexed {len(points)} images in Qdrant")
    else:
        print("⚠️  No images to index - database is empty")
