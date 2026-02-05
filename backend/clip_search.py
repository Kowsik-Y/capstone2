"""
CLIP-based Jewelry Search Engine
Enhanced semantic search with negation filtering
"""

import os
import warnings
import numpy as np
import torch
from PIL import Image, ImageEnhance, ImageFilter
from zipfile import ZipFile
from tqdm import tqdm
from typing import List, Optional, Dict, Any
import asyncio
import pickle
import hashlib
import cv2
import base64
import io

# Suppress common library warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*urllib3 v2.*")

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

from transformers import CLIPProcessor, CLIPModel
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

class JewelrySearchEngine:
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
        self.cache_dir = os.path.join(self.data_root, "cache")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Initialize OCR reader (lazy loading)
        self.ocr_reader = None
        
        # Initialize OpenAI client for LLM-based OCR
        self.openai_client = None
        if OPENAI_AVAILABLE:
            openai_key = os.getenv("OPENAI_API_KEY")
            base_url = os.getenv("OPENAI_BASE_URL")  # Custom base URL for alternative providers
            if openai_key:
                if base_url:
                    self.openai_client = OpenAI(api_key=openai_key, base_url=base_url)
                    print(f"✅ OpenAI client initialized with custom base URL: {base_url}")
                else:
                    self.openai_client = OpenAI(api_key=openai_key)
                    print("✅ OpenAI client initialized for LLM-based OCR")
            else:
                print("⚠️  OPENAI_API_KEY not set. LLM-based OCR disabled.")
    
    async def initialize(self):
        """Initialize model, extract data, and build index"""
        print("Loading CLIP model...")
        self.model = CLIPModel.from_pretrained(self.model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.model.eval()
        print(f"✅ Model loaded on {self.device}")
        
        # Extract dataset if needed
        if os.path.exists(self.zip_path) and not os.path.exists(os.path.join(self.data_root, "Jewellery_Data")):
            print("Extracting dataset...")
            with ZipFile(self.zip_path, "r") as z:
                z.extractall(self.data_root)
            print("✅ Dataset extracted")
        
        # Load images
        await self._load_images()
        
        # Build vector index
        await self._build_index()
    
    async def _load_images(self):
        """Load image paths and categories"""
        image_dir = os.path.join(self.data_root, "Jewellery_Data")
        
        if not os.path.exists(image_dir):
            print(f"⚠️  Image directory not found: {image_dir}")
            print(f"ℹ️  Please create the directory and add your jewelry images")
            print(f"ℹ️  Expected structure: {image_dir}/{{category}}/{{image.jpg}}")
        
        for category in self.categories:
            cat_dir = os.path.join(image_dir, category)
            if not os.path.isdir(cat_dir):
                print(f"⚠️  Category directory not found: {cat_dir}")
                continue
            
            count_before = len(self.image_paths)
            for f in os.listdir(cat_dir):
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    self.image_paths.append(os.path.join(cat_dir, f))
                    self.image_categories.append(category)
            
            images_added = len(self.image_paths) - count_before
            if images_added > 0:
                print(f"✅ Loaded {images_added} {category} images")
        
        self.total_images = len(self.image_paths)
        print(f"✅ Total: {self.total_images} images across {len(self.categories)} categories")
    
    def _get_cache_key(self) -> str:
        """Generate cache key based on image paths and model"""
        paths_str = "|".join(sorted(self.image_paths))
        key_str = f"{self.model_name}_{paths_str}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def _load_embeddings_cache(self) -> Optional[np.ndarray]:
        """Load embeddings from cache if available"""
        cache_key = self._get_cache_key()
        cache_file = os.path.join(self.cache_dir, f"embeddings_{cache_key}.pkl")
        
        if os.path.exists(cache_file):
            try:
                print(f"Loading embeddings from cache...")
                with open(cache_file, "rb") as f:
                    cached_data = pickle.load(f)
                    if len(cached_data) == len(self.image_paths):
                        print(f"✅ Loaded {len(cached_data)} embeddings from cache")
                        return cached_data
                    else:
                        print(f"⚠️  Cache size mismatch, recomputing...")
            except Exception as e:
                print(f"⚠️  Error loading cache: {e}, recomputing...")
        return None
    
    def _save_embeddings_cache(self, embeddings: np.ndarray):
        """Save embeddings to cache"""
        cache_key = self._get_cache_key()
        cache_file = os.path.join(self.cache_dir, f"embeddings_{cache_key}.pkl")
        
        try:
            with open(cache_file, "wb") as f:
                pickle.dump(embeddings, f)
            print(f"✅ Saved embeddings to cache")
        except Exception as e:
            print(f"⚠️  Error saving cache: {e}")
    
    async def _build_index(self):
        """Build vector database index"""
        # Try to load from cache first
        self.image_embeddings = self._load_embeddings_cache()
        
        if self.image_embeddings is None:
            print("Computing image embeddings...")
            self.image_embeddings = self._embed_images_batch(self.image_paths, batch_size=8)
            print(f"✅ Image embeddings: {self.image_embeddings.shape}")
            # Save to cache
            self._save_embeddings_cache(self.image_embeddings)
        else:
            print(f"✅ Image embeddings: {self.image_embeddings.shape}")
        
        # Initialize Qdrant
        self.client = QdrantClient(":memory:")
        
        # Determine embedding size (768 for CLIP-ViT-L)
        embedding_size = self.image_embeddings.shape[1] if len(self.image_embeddings) > 0 else 768
        
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=embedding_size,
                distance=Distance.COSINE
            )
        )
        
        if len(self.image_embeddings) > 0:
            # Index all images
            points = [
                PointStruct(
                    id=i,
                    vector=self.image_embeddings[i].tolist(),
                    payload={
                        "image_path": self.image_paths[i],
                        "category": self.image_categories[i]
                    }
                )
                for i in range(len(self.image_embeddings))
            ]
            
            self.client.upsert(collection_name=self.collection_name, points=points)
            print(f"✅ Indexed {len(points)} images in Qdrant")
        else:
            print("⚠️  No images to index - database is empty")
            print("⚠️  Please add your jewelry dataset to the data directory")
    
    def _embed_images_batch(self, paths: List[str], batch_size: int = 8) -> np.ndarray:
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
    
    def _embed_text(self, text: str) -> np.ndarray:
        """Embed text query"""
        inputs = self.processor(text=[text], return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            text_features = self.model.get_text_features(**inputs)
            feats = text_features.pooler_output if hasattr(text_features, 'pooler_output') else text_features
            feats = feats / feats.norm(dim=-1, keepdim=True)
        
        return feats.cpu().numpy().astype("float32")
    
    def _extract_categories(self, query: str) -> List[str]:
        """Extract categories from query"""
        q = query.lower()
        found = [c for c in self.categories if c in q]
        return found if found else self.categories
    
    def _extract_negations(self, query: str) -> List[str]:
        """Extract negation terms from query"""
        q = query.lower()
        negations = []
        
        # Pattern: "no X"
        words = q.split()
        for i, word in enumerate(words):
            if word == "no" and i + 1 < len(words):
                next_word = words[i + 1]
                if next_word not in self.categories:
                    negations.append(next_word)
        
        # Pattern: "without X"
        if "without" in q:
            parts = q.split("without")
            if len(parts) > 1:
                after_without = parts[1].strip().split()
                if after_without and after_without[0] not in self.categories:
                    negations.append(after_without[0])
        
        return list(set(negations))
    
    def _get_decoration_terms(self, category: str, negations: List[str]) -> List[str]:
        """Generate decoration detection terms based on what was negated"""
        decoration_terms = []
        
        for neg in negations:
            # Add variations of the negated term with the category
            decoration_terms.extend([
                f"{category} with {neg}",
                f"{neg} {category}",
                f"{category} featuring {neg}",
                f"{neg}s on {category}",
                f"{category} set with {neg}s"
            ])
            
            # Add specific variations based on common jewelry terms
            if "diamond" in neg or "stone" in neg or "gem" in neg:
                decoration_terms.extend([
                    f"jeweled {category}", f"sparkly {category}",
                    f"{category} with stones", f"{category} with gems"
                ])
            if "pendant" in neg or "charm" in neg:
                decoration_terms.extend([
                    f"{category} with pendant", f"{category} with charm",
                    f"pendant {category}", f"charm {category}"
                ])
            if "pattern" in neg or "design" in neg or "engraving" in neg:
                decoration_terms.extend([
                    f"patterned {category}", f"engraved {category}",
                    f"ornate {category}", f"{category} with design"
                ])
        
        return list(set(decoration_terms))
    
    def _get_plain_terms(self, category: str) -> List[str]:
        """Generate plain/simple detection terms"""
        if category == "ring":
            return [
                "plain gold ring", "simple ring band", "smooth metal ring",
                "minimalist ring", "wedding band", "plain ring"
            ]
        elif category == "necklace":
            return [
                "plain gold necklace", "simple chain necklace", "minimalist necklace",
                "basic necklace chain", "smooth necklace"
            ]
        return [f"plain simple {category}"]
    
    def _enhance_query(self, query: str, category: str, negations: List[str]) -> str:
        """Enhance query with positive terms"""
        enhanced = query.lower()
        
        # Only add "plain simple" if there are negations in the query
        if negations:
            for neg in negations:
                enhanced = enhanced.replace(f"no {neg}", "plain simple")
                enhanced = enhanced.replace(f"without {neg}", "minimalist smooth")
        
        return enhanced
    
    async def search(
        self,
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
        # Extract query components
        filter_categories = categories or self._extract_categories(query)
        negations = self._extract_negations(query)
        
        # Enhance query
        category = filter_categories[0] if filter_categories else "jewelry"
        enhanced_query = self._enhance_query(query, category, negations)
        
        # Embed query
        query_embedding = self._embed_text(enhanced_query)
        
        # Pre-compute decoration and plain term embeddings if we have negations (for performance)
        decoration_embeddings = None
        plain_embeddings = None
        if negations:
            decoration_terms = self._get_decoration_terms(category, negations)
            plain_terms = self._get_plain_terms(category)
            
            # Batch embed all terms at once (much faster than one by one)
            decoration_embeddings = torch.stack([
                torch.tensor(self._embed_text(term)).to(self.device)
                for term in decoration_terms
            ])
            plain_embeddings = torch.stack([
                torch.tensor(self._embed_text(term)).to(self.device)
                for term in plain_terms
            ])
        
        # Stage 1: Semantic search
        semantic_results = self.client.search(
            collection_name=self.collection_name,
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
                img_emb = torch.tensor(p.vector).unsqueeze(0).to(self.device)
                img_emb = img_emb / img_emb.norm(dim=-1, keepdim=True)
                
                # Batch compute decoration similarity (much faster)
                decoration_scores = (decoration_embeddings @ img_emb.T).squeeze()
                max_decoration = decoration_scores.max().item()
                
                # Batch compute plain similarity (much faster)
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
    
    async def recommend(self, image_id: int, top_k: int = 5) -> Dict[str, Any]:
        """Get recommendations based on image similarity"""
        if image_id >= len(self.image_embeddings):
            raise ValueError(f"Invalid image_id: {image_id}")
        
        # Get image embedding
        img_embedding = self.image_embeddings[image_id]
        
        # Search similar images
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=img_embedding.tolist(),
            limit=top_k + 1  # +1 to exclude the query image itself
        )
        
        # Format results (exclude the query image)
        formatted_results = []
        for p in results:
            if p.id != image_id:
                formatted_results.append({
                    "id": p.id,
                    "image_path": p.payload["image_path"],
                    "category": p.payload["category"],
                    "similarity_score": float(p.score),
                    "plain_score": None,
                    "decoration_score": None
                })
        
        return {
            "query": f"Similar to image {image_id}",
            "enhanced_query": f"Recommendations for {self.image_categories[image_id]}",
            "categories": [self.image_categories[image_id]],
            "negations": [],
            "results": formatted_results[:top_k],
            "total_results": len(formatted_results[:top_k]),
            "filter_stats": {"semantic_matches": len(results)}
        }
    
    def generate_description(self, image_id: int, category: str) -> str:
        """Generate a product description using LLM"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            # Fallback to basic description
            return f"A beautiful {category} piece from our collection. This item showcases elegant craftsmanship and timeless design."
        
        try:
            # Load and encode image
            image_path = self.image_paths[image_id]
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
            # Fallback description
            return f"An exquisite {category} featuring sophisticated design and premium quality. Perfect for adding elegance to any occasion."
    
    def _extract_text_with_llm(self, image: Image.Image) -> str:
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
            model_name = os.getenv("OPENAI_MODEL", "gpt-4.1-nano")  # Default to gpt-4.1-nano
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
    
    def _preprocess_image_for_ocr(self, image: Image.Image) -> np.ndarray:
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
    
    def _extract_text_from_image(self, image: Image.Image) -> str:
        """Extract text from image using LLM (preferred) or EasyOCR fallback"""
        # Try LLM-based OCR first (most accurate for handwritten)
        if OPENAI_AVAILABLE and self.openai_client:
            llm_text = self._extract_text_with_llm(image)
            if llm_text:
                return llm_text
            print("⚠️  LLM OCR found no text, trying EasyOCR...")
        
        # Fallback to EasyOCR
        if not OCR_AVAILABLE:
            return ""
        
        try:
            # Lazy load OCR reader
            if self.ocr_reader is None:
                print("📝 Initializing OCR reader (supports handwritten text)...")
                # Enable both printed and handwritten text detection
                self.ocr_reader = easyocr.Reader(
                    ['en'], 
                    gpu=torch.cuda.is_available(),
                    recognizer=True,
                    verbose=False
                )
                print("✅ OCR reader ready")
            
            # Preprocess image for better OCR
            print("📝 Preprocessing image for OCR...")
            processed_img = self._preprocess_image_for_ocr(image)
            
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
    
    def _detect_jewelry_type(self, image: Image.Image) -> Optional[str]:
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
    
    async def search_by_image(self, image: Image.Image, top_k: int = 10) -> Dict[str, Any]:
        """Search by uploaded image with automatic text extraction and type detection"""
        # Extract text from image
        extracted_text = self._extract_text_from_image(image)
        
        # Detect jewelry type
        detected_type = self._detect_jewelry_type(image)
        
        # If we have extracted text, use hybrid search
        if extracted_text:
            # Build query from extracted text and detected type
            query = extracted_text
            if detected_type:
                query = f"{detected_type} {extracted_text}"
            
            print(f"🔍 Searching with extracted text: '{query}'")
            return await self.search_by_image_and_text(image, query, top_k)
        
        # Otherwise, use pure image similarity
        # Embed the uploaded image
        inputs = self.processor(images=[image], return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            image_features = self.model.get_image_features(**inputs)
            feats = image_features.pooler_output if hasattr(image_features, 'pooler_output') else image_features
            feats = feats / feats.norm(dim=-1, keepdim=True)
        
        img_embedding = feats.cpu().numpy().astype("float32")[0]
        
        # Filter by detected type if available
        search_filter = None
        if detected_type:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="category",
                        match=MatchValue(value=detected_type)
                    )
                ]
            )
        
        # Search
        results = self.client.search(
            collection_name=self.collection_name,
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
    
    async def search_by_image_and_text(self, image: Image.Image, query: str, top_k: int = 10) -> Dict[str, Any]:
        """Search by combining image and text embeddings"""
        # Embed the uploaded image
        image_inputs = self.processor(images=[image], return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            image_features = self.model.get_image_features(**image_inputs)
            img_feats = image_features.pooler_output if hasattr(image_features, 'pooler_output') else image_features
            img_feats = img_feats / img_feats.norm(dim=-1, keepdim=True)
        
        # Embed the text query
        text_embedding = self._embed_text(query)
        
        # Combine embeddings (weighted average: 0.6 image + 0.4 text)
        img_embedding = img_feats.cpu().numpy().astype("float32")[0]
        combined_embedding = 0.6 * img_embedding + 0.4 * text_embedding[0]
        combined_embedding = combined_embedding / np.linalg.norm(combined_embedding)
        
        # Search
        results = self.client.search(
            collection_name=self.collection_name,
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
    
    def get_category_counts(self) -> Dict[str, int]:
        """Get image counts per category"""
        counts = {}
        for category in self.categories:
            counts[category] = self.image_categories.count(category)
        return counts
