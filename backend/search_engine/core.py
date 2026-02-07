"""
CLIP-based Jewelry Search Engine
Enhanced semantic search with negation filtering

This module provides backward compatibility by importing from the new modular structure.
The actual implementation is now split across multiple files for better maintainability.
"""

import warnings
from PIL import Image
from typing import List, Optional, Dict, Any

# Suppress common library warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*urllib3 v2.*")

# Import the main engine class from the new modular structure
from .engine import JewelrySearchEngine as _JewelrySearchEngine

# Import search functions
from .search import search, search_by_image, search_by_image_and_text

# Import recommendation functions
from .recommendations import recommend, generate_description


class JewelrySearchEngine(_JewelrySearchEngine):
    """
    Main search engine class that delegates to modular components.
    This class maintains backward compatibility while using the new modular structure.
    """
    
    async def search(
        self,
        query: str,
        categories: Optional[List[str]] = None,
        top_k: int = 5,
        max_decoration_score: float = 0.25,
        min_plain_score: float = 0.28,
        semantic_top_k: int = 100
    ) -> Dict[str, Any]:
        """Perform semantic search with negation filtering"""
        return await search(
            self, query, categories, top_k,
            max_decoration_score, min_plain_score, semantic_top_k
        )
    
    async def search_by_image(self, image: Image.Image, top_k: int = 10) -> Dict[str, Any]:
        """Search by uploaded image with automatic text extraction and type detection"""
        return await search_by_image(self, image, top_k)
    
    async def search_by_image_and_text(
        self, image: Image.Image, query: str, top_k: int = 10
    ) -> Dict[str, Any]:
        """Search by combining image and text embeddings"""
        return await search_by_image_and_text(self, image, query, top_k)
    
    async def recommend(self, image_id: int, top_k: int = 5) -> Dict[str, Any]:
        """Get recommendations based on image similarity"""
        return await recommend(self, image_id, top_k)
    
    def generate_description(self, image_id: int, category: str) -> str:
        """Generate a product description using LLM"""
        return generate_description(self, image_id, category)
