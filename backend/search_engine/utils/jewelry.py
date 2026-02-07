"""
Jewelry Utilities for Type Detection and Description Generation
"""

import os
import base64
import io
import torch
from PIL import Image
from typing import Optional

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class JewelryUtils:
    """Utility functions for jewelry detection and description"""
    
    def __init__(self, model, processor, device: str):
        self.model = model
        self.processor = processor
        self.device = device
        
        # Initialize OpenAI client for description generation
        self.openai_client = None
        if OPENAI_AVAILABLE:
            openai_key = os.getenv("OPENAI_API_KEY")
            base_url = os.getenv("OPENAI_BASE_URL")
            
            if openai_key:
                if base_url:
                    self.openai_client = OpenAI(api_key=openai_key, base_url=base_url)
                else:
                    self.openai_client = OpenAI(api_key=openai_key)
    
    def detect_jewelry_type(self, image: Image.Image) -> Optional[str]:
        """Detect if image is a ring or necklace using CLIP"""
        try:
            type_queries = ["a ring", "a necklace"]
            text_inputs = self.processor(text=type_queries, return_tensors="pt", padding=True).to(self.device)
            image_inputs = self.processor(images=[image], return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                text_features = self.model.get_text_features(**text_inputs)
                image_features = self.model.get_image_features(**image_inputs)
                
                # Normalize
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
                # Compute similarity
                similarities = (image_features @ text_features.T).squeeze(0)
                
                # Get best match
                best_idx = similarities.argmax().item()
                best_score = similarities[best_idx].item()
                
                # Only return if confident (> 0.25)
                if best_score > 0.25:
                    jewelry_type = type_queries[best_idx].replace("a ", "")
                    print(f"🔍 Detected jewelry type: {jewelry_type} (confidence: {best_score:.2f})")
                    return jewelry_type
        
        except Exception as e:
            print(f"⚠️  Type detection failed: {e}")
        
        return None
    
    def generate_description(self, image_path: str, category: str) -> str:
        """Generate a product description using LLM"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            # Fallback to basic description
            return f"A beautiful {category} piece from our collection. This item showcases elegant craftsmanship and timeless design."
        
        try:
            # Load and encode image
            with Image.open(image_path) as img:
                # Resize for API
                img.thumbnail((512, 512))
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG")
                img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Get model from env or use default
            model = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")
            
            # Generate description
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Describe this {category} in 2-3 sentences. Focus on the design, style, and key features. Be specific and appealing for an e-commerce listing."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=150
            )
            
            description = response.choices[0].message.content.strip()
            return description
            
        except Exception as e:
            print(f"⚠️ Description generation failed: {e}")
            return f"An exquisite {category} featuring sophisticated design and premium quality. Perfect for adding elegance to any occasion."
