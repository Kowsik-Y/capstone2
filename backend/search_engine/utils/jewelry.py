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
    
    def correct_image_rotation(self, image: Image.Image) -> Image.Image:
        """Correct image rotation using EXIF orientation data and auto-rotation"""
        try:
            # First, handle EXIF orientation
            from PIL import ImageOps
            image = ImageOps.exif_transpose(image)
            
            # Try to detect if image needs rotation by testing text readability at different angles
            if self.openai_client:
                # Use a simple heuristic: check image dimensions
                width, height = image.size
                
                # If significantly wider than tall, might be rotated
                if width > height * 1.5:
                    # Try rotating and see which orientation is better
                    print("🔄 Image appears rotated, attempting auto-correction...")
                    return image.rotate(90, expand=True)
                elif height > width * 1.5:
                    # Might be portrait orientation or rotated the other way
                    # Keep as is for now - portrait is common for jewelry
                    pass
            
            return image
            
        except Exception as e:
            print(f"⚠️ Image rotation correction failed: {e}")
            return image
    
    def detect_jewelry_type(self, image: Image.Image) -> Optional[str]:
        """Detect if image is a ring or necklace using CLIP"""
        try:
            # Correct rotation first for better detection
            corrected_image = self.correct_image_rotation(image)
            
            type_queries = ["a ring", "a necklace"]
            text_inputs = self.processor(text=type_queries, return_tensors="pt", padding=True).to(self.device)
            image_inputs = self.processor(images=[corrected_image], return_tensors="pt").to(self.device)
            
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
    
    def extract_text_with_llm(self, image: Image.Image) -> Optional[str]:
        """Extract text from image using LLM vision capabilities"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            print("⚠️ LLM text extraction unavailable - OpenAI client not configured")
            return None
        
        try:
            # Correct rotation first
            corrected_image = self.correct_image_rotation(image)
            
            # Encode image for API
            img_copy = corrected_image.copy()
            img_copy.thumbnail((512, 512))
            buffer = io.BytesIO()
            img_copy.save(buffer, format="JPEG")
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Get model from env or use default
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            
            # Extract text using vision model
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Look at this image carefully. If there is any text written on it (handwritten or printed, in any orientation), extract and return ONLY that text. If the text appears rotated, still read and extract it. If this is just a jewelry/object image with no text, respond with 'NO_TEXT'. Be concise and extract all visible text."
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
                max_tokens=100
            )
            
            extracted = response.choices[0].message.content.strip()
            
            # Check if LLM found text
            if extracted and extracted.upper() != "NO_TEXT":
                print(f"🤖 LLM extracted text: '{extracted}'")
                return extracted
            
            print("🤖 LLM found no text in image")
            return None
            
        except Exception as e:
            print(f"⚠️ LLM text extraction failed: {e}")
            return None
