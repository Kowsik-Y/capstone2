"""
OCR Handler for Text Extraction from Images
Supports both LLM-based OCR (preferred) and EasyOCR fallback
"""

import os
import base64
import io
import numpy as np
import cv2
from PIL import Image, ImageEnhance
from typing import Optional

try:
    import easyocr
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  EasyOCR not available. Text extraction from images will be disabled.")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI not available. LLM-based OCR will be disabled.")


class OCRHandler:
    """Handles text extraction from images using LLM or EasyOCR"""
    
    def __init__(self):
        self.ocr_reader = None
        self.openai_client = None
        
        # Initialize OpenAI client if available
        if OPENAI_AVAILABLE:
            openai_key = os.getenv("OPENAI_API_KEY")
            base_url = os.getenv("OPENAI_BASE_URL")
            
            if openai_key:
                if base_url:
                    self.openai_client = OpenAI(api_key=openai_key, base_url=base_url)
                    print(f"✅ OpenAI client initialized with custom base URL: {base_url}")
                else:
                    self.openai_client = OpenAI(api_key=openai_key)
                    print("✅ OpenAI client initialized for LLM-based OCR")
            else:
                print("⚠️  OPENAI_API_KEY not set. LLM-based OCR disabled.")
    
    def extract_text_with_llm(self, image: Image.Image) -> str:
        """Extract text using LLM vision API (best for handwritten text)"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            return ""
        
        try:
            print("🤖 Using LLM vision for OCR...")
            
            # Resize image to save tokens
            MAX_SIZE = 360
            img_copy = image.copy()
            img_copy.thumbnail((MAX_SIZE, MAX_SIZE))
            
            # Convert to base64
            buffer = io.BytesIO()
            img_copy.save(buffer, format="JPEG", quality=85)
            buffer.seek(0)
            b64_image = base64.b64encode(buffer.read()).decode("utf-8")
            
            # Call OpenAI vision API
            model_name = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")
            response = self.openai_client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze the provided image and follow the rules strictly.\n\n"
                                "STEP 1 — CONTENT CHECK\n"
                                "Determine whether the image contains:\n"
                                "A) only text\n"
                                "B) only a diagram, illustration, or drawn object\n"
                                "C) both text and a diagram, illustration, or drawn object\n\n"
                                "STEP 2 — ACTION\n\n"
                                "IF THE IMAGE CONTAINS ONLY TEXT:\n"
                                "- Extract and return ONLY the text exactly as visible.\n"
                                "- Preserve line breaks if present.\n"
                                "- Do NOT add, remove, or explain anything.\n\n"
                                "IF THE IMAGE CONTAINS ONLY A DIAGRAM, ILLUSTRATION, OR DRAWN OBJECT:\n"
                                "- Return a short, simple description of the main visual object.\n"
                                "- Use the most direct and commonly understood object name.\n"
                                "- Do NOT add extra words, explanations, or adjectives.\n"
                                "- Return ONLY the description.\n\n"
                                "IF THE IMAGE CONTAINS BOTH TEXT AND A DIAGRAM, ILLUSTRATION, OR DRAWN OBJECT:\n"
                                "- Ignore and skip all text completely.\n"
                                "- Describe ONLY the diagram, illustration, or drawn object.\n"
                                "- Use a short, simple description with no extra words.\n"
                                "- Return ONLY the description.\n\n"
                                "OUTPUT RULES (ALL CASES):\n"
                                "- Return ONLY the required output.\n"
                                "- No punctuation.\n"
                                "- No extra lines.\n"
                                "- No commentary.\n"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{b64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            extracted = response.choices[0].message.content.strip()
            
            if extracted and extracted != "NO_TEXT":
                print(f"✅ LLM extracted text: '{extracted}'")
                return extracted
            else:
                print("⚠️  No text detected by LLM")
                return ""
        
        except Exception as e:
            print(f"❌ LLM OCR failed: {e}")
            return ""
    
    def preprocess_image_for_ocr(self, image: Image.Image) -> np.ndarray:
        """Preprocess image to improve OCR accuracy for handwritten text"""
        # Convert to numpy array
        img_array = np.array(image)
        
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply adaptive thresholding to handle varying lighting
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(binary)
        
        # Increase contrast
        pil_img = Image.fromarray(denoised)
        enhancer = ImageEnhance.Contrast(pil_img)
        enhanced = enhancer.enhance(2.0)
        
        return np.array(enhanced)
    
    def extract_text_with_easyocr(self, image: Image.Image) -> str:
        """Extract text using EasyOCR (fallback method)"""
        if not OCR_AVAILABLE:
            return ""
        
        try:
            # Lazy load OCR reader
            if self.ocr_reader is None:
                print("📝 Initializing OCR reader (supports handwritten text)...")
                import torch
                self.ocr_reader = easyocr.Reader(
                    ['en'], 
                    gpu=torch.cuda.is_available(),
                    recognizer=True,
                    verbose=False
                )
                print("✅ OCR reader ready")
            
            # Preprocess image for better OCR
            print("📝 Preprocessing image for OCR...")
            processed_img = self.preprocess_image_for_ocr(image)
            
            # Try OCR on original and processed images
            all_results = []
            
            # Original image
            print("📝 Running OCR on original image...")
            results1 = self.ocr_reader.readtext(
                np.array(image),
                detail=1,
                paragraph=False
            )
            all_results.extend(results1)
            
            # Processed image
            print("📝 Running OCR on preprocessed image...")
            results2 = self.ocr_reader.readtext(
                processed_img,
                detail=1,
                paragraph=False
            )
            all_results.extend(results2)
            
            print(f"📝 OCR found {len(all_results)} total text regions")
            
            # Deduplicate and filter results
            seen_texts = set()
            valid_texts = []
            
            for i, (bbox, text, conf) in enumerate(all_results):
                text_lower = text.lower().strip()
                
                # Skip duplicates
                if text_lower in seen_texts:
                    continue
                
                print(f"📝 Region {i+1}: '{text}' (confidence: {conf:.2f})")
                
                # Accept text with lower confidence for handwritten
                if conf > 0.2:
                    cleaned = text.strip()
                    # More lenient filtering
                    if len(cleaned) >= 2:
                        alpha_count = sum(c.isalpha() for c in cleaned)
                        if alpha_count >= 2:
                            valid_texts.append(cleaned)
                            seen_texts.add(text_lower)
                            print(f"✅ Accepted: '{cleaned}'")
                        else:
                            print(f"❌ Rejected (not enough letters): '{cleaned}'")
                    else:
                        print(f"❌ Rejected (too short): '{cleaned}'")
                else:
                    print(f"❌ Rejected (low confidence {conf:.2f}): '{text}'")
            
            extracted_text = " ".join(valid_texts)
            
            if extracted_text.strip():
                print(f"✅ Final extracted text: '{extracted_text.strip()}'")
                print(f"⚠️  Note: OCR accuracy for handwritten text may be limited")
                return extracted_text.strip()
            else:
                print("⚠️  No valid text detected - using pure image similarity search")
            
        except Exception as e:
            import traceback
            print(f"❌ OCR extraction failed: {e}")
            print(traceback.format_exc())
        
        return ""
    
    def extract_text_from_image(self, image: Image.Image) -> str:
        """Extract text from image using LLM (preferred) or EasyOCR fallback"""
        # Try LLM-based OCR first (most accurate for handwritten)
        if OPENAI_AVAILABLE and self.openai_client:
            llm_text = self.extract_text_with_llm(image)
            if llm_text:
                return llm_text
            print("⚠️  LLM OCR found no text, trying EasyOCR...")
        
        # Fallback to EasyOCR
        return self.extract_text_with_easyocr(image)
