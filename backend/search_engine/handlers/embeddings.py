"""
Embedding Handler for CLIP Image and Text Embeddings
Includes caching functionality for performance optimization
"""

import os
import hashlib
import pickle
import numpy as np
import torch
from PIL import Image
from tqdm import tqdm
from typing import List, Optional


class EmbeddingHandler:
    """Handles CLIP embeddings with caching support"""
    
    def __init__(self, model, processor, device: str, model_name: str, cache_dir: str):
        self.model = model
        self.processor = processor
        self.device = device
        self.model_name = model_name
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def get_cache_key(self, image_paths: List[str]) -> str:
        """Generate cache key based on image paths and model"""
        paths_str = "|".join(sorted(image_paths))
        key_str = f"{self.model_name}_{paths_str}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def load_embeddings_cache(self, image_paths: List[str]) -> Optional[np.ndarray]:
        """Load embeddings from cache if available"""
        cache_key = self.get_cache_key(image_paths)
        cache_file = os.path.join(self.cache_dir, f"embeddings_{cache_key}.pkl")
        
        if os.path.exists(cache_file):
            try:
                print(f"Loading embeddings from cache...")
                with open(cache_file, "rb") as f:
                    cached_data = pickle.load(f)
                    if len(cached_data) == len(image_paths):
                        print(f"✅ Loaded {len(cached_data)} embeddings from cache")
                        return cached_data
                    else:
                        print(f"⚠️  Cache size mismatch, recomputing...")
            except Exception as e:
                print(f"⚠️  Error loading cache: {e}, recomputing...")
        return None
    
    def save_embeddings_cache(self, embeddings: np.ndarray, image_paths: List[str]):
        """Save embeddings to cache"""
        cache_key = self.get_cache_key(image_paths)
        cache_file = os.path.join(self.cache_dir, f"embeddings_{cache_key}.pkl")
        
        try:
            with open(cache_file, "wb") as f:
                pickle.dump(embeddings, f)
            print(f"✅ Saved embeddings to cache")
        except Exception as e:
            print(f"⚠️  Error saving cache: {e}")
    
    def embed_images_batch(self, paths: List[str], batch_size: int = 8) -> np.ndarray:
        """Embed images in batches"""
        if len(paths) == 0:
            print("⚠️  No images to embed - returning empty array")
            # Return empty array with correct dimensions
            dummy_embedding_size = 768  # CLIP embedding size
            return np.zeros((0, dummy_embedding_size), dtype="float32")
        
        all_embs = []
        for i in tqdm(range(0, len(paths), batch_size), desc="Embedding images"):
            batch_paths = paths[i:i+batch_size]
            images = [Image.open(p).convert("RGB") for p in batch_paths]
            inputs = self.processor(images=images, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                feats = image_features.pooler_output if hasattr(image_features, 'pooler_output') else image_features
                feats = feats / feats.norm(dim=-1, keepdim=True)
            
            all_embs.append(feats.cpu())
        
        return torch.cat(all_embs, dim=0).numpy().astype("float32")
    
    def embed_text(self, text: str) -> np.ndarray:
        """Embed text query"""
        inputs = self.processor(text=[text], return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)
            feats = text_features.pooler_output if hasattr(text_features, 'pooler_output') else text_features
            feats = feats / feats.norm(dim=-1, keepdim=True)
        
        return feats.cpu().numpy().astype("float32")
    
    def embed_image(self, image: Image.Image) -> np.ndarray:
        """Embed a single image"""
        inputs = self.processor(images=[image], return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)
            feats = image_features.pooler_output if hasattr(image_features, 'pooler_output') else image_features
            feats = feats / feats.norm(dim=-1, keepdim=True)
        
        return feats.cpu().numpy().astype("float32")[0]
    
    def batch_embed_texts(self, texts: List[str]) -> torch.Tensor:
        """Batch embed multiple text queries (returns tensor for faster similarity computation)"""
        all_embeddings = []
        for text in texts:
            embedding = self.embed_text(text)
            all_embeddings.append(torch.tensor(embedding).to(self.device))
        return torch.stack(all_embeddings)
