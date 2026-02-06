"""
Centralized configuration management using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import torch


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Server Configuration
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        description="Comma-separated list of allowed CORS origins"
    )

    # Data Paths
    data_root: str = Field(
        default="./data",
        description="Root directory for data storage"
    )
    zip_path: str = Field(
        default="./archive.zip",
        description="Path to the jewelry dataset archive"
    )

    # OpenAI Configuration
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key for OCR and description generation"
    )
    openai_base_url: str = Field(
        default="https://api.openai.com/v1",
        description="OpenAI API base URL (for custom endpoints)"
    )
    openai_model: str = Field(
        default="gpt-4.1-nano",
        description="OpenAI model to use for vision tasks"
    )

    # Model Configuration
    clip_model_name: str = Field(
        default="laion/CLIP-ViT-L-14-laion2B-s32B-b82K",
        description="CLIP model name from HuggingFace"
    )

    # Search Configuration
    default_top_k: int = Field(
        default=5,
        ge=1,
        le=100,
        description="Default number of search results to return"
    )
    semantic_top_k: int = Field(
        default=100,
        ge=1,
        le=500,
        description="Number of results to retrieve before filtering"
    )
    max_decoration_score: float = Field(
        default=0.25,
        ge=0.0,
        le=1.0,
        description="Maximum decoration similarity score for plain jewelry"
    )
    min_plain_score: float = Field(
        default=0.28,
        ge=0.0,
        le=1.0,
        description="Minimum plain similarity score for plain jewelry"
    )

    # Vector Database Configuration
    qdrant_collection_name: str = Field(
        default="jewellery_images",
        description="Qdrant collection name"
    )

    # Jewelry Categories
    categories: str = Field(
        default="ring,necklace",
        description="Comma-separated list of jewelry categories"
    )

    # Device Configuration
    device: str = Field(
        default="auto",
        description="Device to use for model inference (cpu, cuda, mps, or auto)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def categories_list(self) -> List[str]:
        """Parse categories string into list"""
        return [cat.strip() for cat in self.categories.split(",")]

    @property
    def computed_device(self) -> str:
        """Auto-detect device if set to 'auto'"""
        if self.device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
            return "cpu"
        return self.device

    @property
    def has_openai_key(self) -> bool:
        """Check if OpenAI API key is configured"""
        return bool(self.openai_api_key and self.openai_api_key.strip())


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance"""
    return settings
