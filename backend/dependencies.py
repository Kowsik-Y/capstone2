"""
Dependencies and shared utilities
"""
import os
import torch
from typing import Optional
from clip_search import JewelrySearchEngine
from download_dataset import download_dataset

# Global search engine instance
_search_engine: Optional[JewelrySearchEngine] = None


def get_search_engine() -> Optional[JewelrySearchEngine]:
    """
    Get the global search engine instance
    
    Returns:
        The initialized search engine or None if not yet initialized
    """
    return _search_engine


def set_search_engine(engine: JewelrySearchEngine) -> None:
    """
    Set the global search engine instance
    
    Args:
        engine: The initialized search engine
    """
    global _search_engine
    _search_engine = engine


async def initialize_search_engine() -> JewelrySearchEngine:
    """
    Initialize the search engine with configuration from environment
    
    Returns:
        The initialized search engine
    """
    print("🚀 Initializing Jewelry Search Engine...")
    
    # Configure paths with defaults
    data_root = os.getenv("DATA_ROOT", "./data")
    zip_path = os.getenv("ZIP_PATH", "./archive.zip")
    
    # Check if dataset exists, if not try to download
    jewellery_data_path = os.path.join(data_root, "Jewellery_Data")

    if not os.path.exists(jewellery_data_path) or \
       not os.path.exists(os.path.join(jewellery_data_path, "ring")) or \
       not os.path.exists(os.path.join(jewellery_data_path, "necklace")):
        print("📦 Dataset not found, attempting to download...")
        try:
            download_dataset()
        except Exception as e:
            print(f"⚠️  Could not auto-download dataset: {e}")
            print(f"ℹ️  Creating empty directories at {jewellery_data_path}")
            os.makedirs(os.path.join(jewellery_data_path, "ring"), exist_ok=True)
            os.makedirs(os.path.join(jewellery_data_path, "necklace"), exist_ok=True)
            print("💡 Upload images manually or set KAGGLE credentials")
    
    # Create search engine instance
    engine = JewelrySearchEngine(
        data_root=data_root,
        zip_path=zip_path,
        categories=["ring", "necklace"],
        device="cuda" if torch.cuda.is_available() else "cpu"
    )
    
    # Initialize (load model and index images)
    await engine.initialize()
    print(f"✅ Search engine ready with {engine.total_images} images")
    
    # Set as global instance
    set_search_engine(engine)
    
    return engine
