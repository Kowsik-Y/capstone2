"""
CLIP-based Jewelry Search Engine - Main Engine Class
"""

import os
import torch
from typing import List
from transformers import CLIPProcessor, CLIPModel
from qdrant_client import QdrantClient

from .handlers.ocr import OCRHandler
from .handlers.embeddings import EmbeddingHandler
from .processors.query import QueryProcessor
from .utils.jewelry import JewelryUtils


class JewelrySearchEngine:
    """Main search engine class for jewelry product search"""
    
    def __init__(
        self,
        data_root: str = "/app/data",
        zip_path: str = "/app/archive.zip",
        categories: List[str] = None,
        device: str = "cpu",
        model_name: str = "laion/CLIP-ViT-L-14-laion2B-s32B-b82K"
    ):
        self.data_root = data_root
        self.zip_path = zip_path
        self.categories = categories or ["ring", "necklace"]
        self.device = device
        self.model_name = model_name
        
        self.model = None
        self.processor = None
        self.client = None
        self.collection_name = "jewellery_images"
        
        self.image_paths = []
        self.image_categories = []
        self.image_embeddings = None
        self.total_images = 0
        
        cache_dir = os.path.join(self.data_root, "cache")
        os.makedirs(cache_dir, exist_ok=True)
        
        # Initialize modular components (will be set after model loads)
        self.ocr_handler = None
        self.embedding_handler = None
        self.query_processor = None
        self.jewelry_utils = None
    
    async def initialize(self):
        """Initialize model, extract data, and build index"""
        from .indexing import load_images, build_index
        
        print("Loading CLIP model...")
        self.model = CLIPModel.from_pretrained(self.model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.model.eval()
        print(f"✅ Model loaded on {self.device}")
        
        # Initialize modular components
        cache_dir = os.path.join(self.data_root, "cache")
        self.ocr_handler = OCRHandler()
        self.embedding_handler = EmbeddingHandler(
            self.model, self.processor, self.device, self.model_name, cache_dir
        )
        self.query_processor = QueryProcessor(self.categories)
        self.jewelry_utils = JewelryUtils(self.model, self.processor, self.device)
        
        # Extract dataset if needed
        from zipfile import ZipFile
        if os.path.exists(self.zip_path) and not os.path.exists(os.path.join(self.data_root, "Jewellery_Data")):
            print("Extracting dataset...")
            with ZipFile(self.zip_path, "r") as z:
                z.extractall(self.data_root)
            print("✅ Dataset extracted")
        
        # Load images
        await load_images(self)
        
        # Build vector index
        await build_index(self)
    
    def get_category_counts(self):
        """Get image counts per category"""
        counts = {}
        for category in self.categories:
            counts[category] = self.image_categories.count(category)
        return counts
