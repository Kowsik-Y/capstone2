# 💎 ClipSearch - AI-Powered Jewelry Search

An intelligent jewelry search application powered by OpenAI's CLIP model, enabling semantic search through natural language queries and image uploads. Built with FastAPI and Next.js.

## 🌟 Features

### Smart Search Capabilities
- **🔍 Semantic Text Search**: Search jewelry using natural language queries
- **📸 Image-Based Search**: Upload images to find visually similar items
- **🎯 Category Filtering**: Filter by jewelry types (rings, necklaces)
- **🤖 AI-Powered Recommendations**: Get intelligent product suggestions
- **👓 OCR Text Detection**: Extract and search text from jewelry images
- **⚡ Advanced Filtering**: Control decoration and plain style preferences

### Technical Highlights
- CLIP model for visual-semantic understanding
- Qdrant vector database for efficient similarity search
- OpenAI GPT integration for enhanced OCR and descriptions
- Real-time search with async processing
- Responsive modern UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────────┐
│   Next.js   │────────▶│   FastAPI        │
│   Frontend  │         │   Backend        │
│             │◀────────│                  │
└─────────────┘         └──────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    CLIP      │
                        │  Embeddings  │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Qdrant     │
                        │  Vector DB   │
                        └──────────────┘
```

## � System Architecture

### Overview

ClipSearch implements a multi-layered architecture combining modern web technologies with advanced AI models for intelligent jewelry search and recommendations.

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (TypeScript + React)                              │
│  ├── Pages: Home, Search, Product Detail                            │
│  ├── Components: SearchBar, Filters, Results, Recommendations       │
│  ├── State Management: React Hooks                                  │
│  └── API Client: Axios HTTP                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  FastAPI Backend (Python Async)                                     │
│  ├── API Routes                                                      │
│  │   ├── /search - Text & Image search                              │
│  │   ├── /recommend - Product recommendations                       │
│  │   ├── /products - Product management                             │
│  │   └── /categories - Category filtering                           │
│  ├── Dependencies: Dependency Injection                             │
│  ├── Middleware: CORS, Error Handling                               │
│  └── Models: Pydantic Schemas                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│  Search Engine Core                                                 │
│  ├── Query Processor                                                │
│  │   ├── Text normalization                                         │
│  │   ├── Query enhancement                                          │
│  │   └── Filter parsing                                             │
│  ├── Handlers                                                       │
│  │   ├── Embedding Handler (CLIP)                                   │
│  │   └── OCR Handler (EasyOCR + GPT)                                │
│  ├── Search Logic                                                   │
│  │   ├── Semantic similarity search                                 │
│  │   ├── Hybrid filtering                                           │
│  │   └── Result ranking                                             │
│  └── Recommendation Engine                                          │
│      ├── Content-based filtering                                    │
│      └── Similarity scoring                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA ACCESS LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  Indexing System                                                    │
│  ├── Data Loader                                                    │
│  │   ├── Image loading & validation                                │
│  │   ├── Metadata extraction                                       │
│  │   └── Batch processing                                          │
│  └── Index Builder                                                  │
│      ├── Embedding generation (CLIP)                               │
│      ├── Vector indexing (Qdrant)                                  │
│      └── Metadata indexing                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  ├── Qdrant Vector Database                                         │
│  │   ├── Vector storage (512-dim CLIP embeddings)                  │
│  │   ├── Similarity search (cosine distance)                       │
│  │   └── Metadata filtering                                        │
│  ├── File System Storage                                            │
│  │   ├── Product images                                             │
│  │   └── Cache directory                                            │
│  └── External APIs                                                  │
│      └── OpenAI API (GPT for OCR enhancement)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Search Flow Architecture

#### Text Search Pipeline
```
User Query
    │
    ├──> Query Normalization
    │        │
    │        ├─> Lowercase conversion
    │        ├─> Special character handling
    │        └─> Whitespace cleanup
    │
    ├──> CLIP Text Encoding
    │        │
    │        └─> 512-dim embedding vector
    │
    ├──> Category Filtering (Optional)
    │        │
    │        └─> Filter: ring, necklace
    │
    ├──> Semantic Search (Qdrant)
    │        │
    │        ├─> Vector similarity (cosine)
    │        ├─> Top-K retrieval
    │        └─> Score threshold filtering
    │
    ├──> Advanced Filtering (Optional)
    │        │
    │        ├─> Decoration score filtering
    │        └─> Plain style filtering
    │
    ├──> Result Ranking
    │        │
    │        ├─> Similarity score
    │        ├─> Category relevance
    │        └─> Style preferences
    │
    └──> Response Formation
             │
             └─> Product metadata + scores
```

#### Image Search Pipeline
```
User Image Upload
    │
    ├──> Image Preprocessing
    │        │
    │        ├─> Format validation
    │        ├─> Size normalization
    │        └─> Color space conversion
    │
    ├──> CLIP Vision Encoding
    │        │
    │        └─> 512-dim embedding vector
    │
    ├──> OCR Processing (Optional)
    │        │
    │        ├─> EasyOCR text detection
    │        ├─> GPT-4 text enhancement
    │        └─> Query augmentation
    │
    ├──> Vector Search (Qdrant)
    │        │
    │        ├─> Visual similarity
    │        └─> Top-K retrieval
    │
    ├──> Result Fusion
    │        │
    │        ├─> Visual match score
    │        ├─> Text match score (if OCR)
    │        └─> Combined ranking
    │
    └──> Response with Similar Items
```

#### Recommendation Pipeline
```
Product ID
    │
    ├──> Product Lookup
    │        │
    │        └─> Retrieve embedding & metadata
    │
    ├──> Similarity Search
    │        │
    │        ├─> Vector similarity (Qdrant)
    │        ├─> Same category preference
    │        └─> Exclude source product
    │
    ├──> Contextual Filtering
    │        │
    │        ├─> Style matching
    │        ├─> Material similarity
    │        └─> Price range (if available)
    │
    ├──> Ranking & Scoring
    │        │
    │        ├─> Similarity score (0-1)
    │        ├─> Category bonus
    │        └─> Diversity factor
    │
    └──> Recommended Products
```

### Data Flow Diagram

```
┌──────────────┐
│ Data Ingestion│
└───────┬───────┘
        │
        ├─> Load Images (necklace/, ring/)
        ├─> Extract Metadata (filename, category, path)
        └─> Validate Format (JPEG, PNG)
        │
        ▼
┌──────────────┐
│  Embedding   │
│  Generation  │
└───────┬───────┘
        │
        ├─> CLIP Model: openai/clip-vit-base-patch32
        ├─> Batch Processing (32 images)
        ├─> Generate 512-dim vectors
        └─> Normalize embeddings
        │
        ▼
┌──────────────┐
│   Indexing   │
└───────┬───────┘
        │
        ├─> Create Qdrant Collection
        ├─> Insert Vectors + Payload
        │   ├─> Vector: [512 floats]
        │   └─> Payload: {id, category, path, ...}
        ├─> Build HNSW Index
        └─> Optimize for Search
        │
        ▼
┌──────────────┐
│Runtime Search│
└───────┬───────┘
        │
        ├─> Query Embedding
        ├─> Vector Similarity (Cosine)
        ├─> Filter Application
        └─> Return Top-K Results
```

### Key Technologies Integration

#### CLIP Model Integration
- **Model**: OpenAI CLIP ViT-B/32
- **Purpose**: Unified visual-semantic embedding space
- **Input**: Text queries or images
- **Output**: 512-dimensional vectors
- **Batch Size**: 32 (configurable)
- **Device**: CUDA/CPU auto-detection

#### Qdrant Vector Database
- **Mode**: In-memory (configurable for persistence)
- **Collection**: jewelry_products
- **Distance Metric**: Cosine similarity
- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **Dimensions**: 512
- **Payload**: JSON metadata (category, path, id, scores)

#### OpenAI GPT Integration
- **Model**: GPT-4.1-nano
- **Use Cases**:
  - OCR text refinement
  - Query enhancement
  - Description generation
- **Fallback**: Graceful degradation if API unavailable

### Scalability Considerations

#### Current Architecture
- In-memory vector database
- Synchronous batch processing
- Single-server deployment

#### Production Enhancements
- **Vector DB**: Persistent Qdrant cluster
- **Caching**: Redis for query results
- **Load Balancing**: Multiple FastAPI instances
- **CDN**: Image delivery optimization
- **Async Processing**: Background indexing jobs
- **Monitoring**: Prometheus + Grafana

### Security Architecture

```
Frontend
    │
    ├─> CORS Validation
    │
    ▼
Backend
    │
    ├─> Input Validation (Pydantic)
    ├─> File Upload Limits
    ├─> Rate Limiting (planned)
    ├─> API Key Management (OpenAI)
    └─> Error Sanitization
```

## 💻 System Requirements

### Minimum Requirements

#### Hardware
- **CPU**: Dual-core processor (2.0 GHz or higher)
- **RAM**: 8 GB
- **Storage**: 5 GB free disk space
  - 2 GB for application and dependencies
  - 3 GB for dataset and cache
- **GPU**: Optional (CPU mode supported)
- **Internet**: Stable connection for API calls and downloads

#### Software
- **Operating System**: 
  - macOS 10.15 (Catalina) or later
  - Ubuntu 20.04 LTS or later
  - Windows 10/11 (with WSL2 recommended)
- **Python**: 3.8 or higher
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher (or yarn 1.22+)
- **Git**: 2.30 or later

#### Browsers (Frontend)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Recommended Requirements

#### Hardware
- **CPU**: Quad-core processor (3.0 GHz or higher)
- **RAM**: 16 GB or more
- **Storage**: 10 GB free disk space (SSD preferred)
- **GPU**: NVIDIA GPU with CUDA support
  - CUDA 11.0 or higher
  - 4 GB VRAM minimum (8 GB recommended)
  - Supported cards: GTX 1060, RTX 2060, or better
- **Internet**: High-speed connection (10+ Mbps)

#### Software
- **Operating System**: Latest stable versions
- **Python**: 3.10 or 3.11 (for best performance)
- **Node.js**: 20.x LTS
- **Docker**: 24.0+ (for containerized deployment)
- **Docker Compose**: 2.20+ (for multi-container setup)

### Development Environment

#### Required Tools
- **Code Editor**: VS Code, PyCharm, or similar
- **Version Control**: Git with GitHub/GitLab access
- **Terminal**: Bash, Zsh, or PowerShell
- **Package Managers**:
  - pip (Python) - included with Python
  - npm/yarn (Node.js)
  - Homebrew (macOS) - optional but recommended

#### Optional Tools
- **Postman** or **Insomnia** - API testing
- **Redis** - Query result caching (production)
- **Nginx** - Reverse proxy (production)
- **Prometheus & Grafana** - Monitoring (production)

### Python Dependencies

```plaintext
Core ML/AI:
├── torch>=2.0.0              # Deep learning framework
├── transformers>=4.30.0      # CLIP model
├── pillow>=10.0.0            # Image processing
├── easyocr>=1.7.0            # OCR capabilities
├── numpy>=1.24.0             # Numerical computing
└── scikit-learn>=1.3.0       # ML utilities

Vector Database:
└── qdrant-client>=1.6.0      # Vector similarity search

Web Framework:
├── fastapi>=0.104.0          # API framework
├── uvicorn[standard]>=0.24.0 # ASGI server
├── python-multipart>=0.0.6   # File upload support
└── pydantic>=2.0.0           # Data validation

External APIs:
└── openai>=1.0.0             # OpenAI GPT integration

Utilities:
├── python-dotenv>=1.0.0      # Environment management
├── requests>=2.31.0          # HTTP requests
└── python-magic>=0.4.27      # File type detection
```

### Node.js Dependencies

```plaintext
Framework:
├── next@16.x                 # React framework
├── react@19.x                # UI library
└── react-dom@19.x            # React DOM renderer

Styling:
├── tailwindcss@3.x           # CSS framework
├── postcss@8.x               # CSS processor
└── autoprefixer@10.x         # CSS vendor prefixes

HTTP & State:
├── axios@1.6.x               # HTTP client
└── swr@2.x                   # Data fetching

UI Components:
├── lucide-react@latest       # Icon library
└── @headlessui/react@2.x     # Unstyled components

Development:
├── typescript@5.x            # Type safety
├── eslint@9.x                # Code linting
└── @types/*                  # TypeScript definitions
```

### API Keys & External Services

#### Required
- **OpenAI API Key**: For GPT-4 OCR enhancement
  - Sign up at: https://platform.openai.com
  - Minimum credit: $5 recommended
  - Rate limits: Tier 1 or higher recommended

#### Optional
- **Kaggle Account**: For dataset download
  - Setup Kaggle API credentials
  - Place `kaggle.json` in `~/.kaggle/`

### Network Requirements

#### Ports
- **3000**: Frontend development server
- **8000**: Backend API server
- **6333**: Qdrant (if running externally)

#### Firewall Rules
- Allow outbound HTTPS (443) for API calls
- Allow local connections between frontend and backend
- Open specified ports for external access (production)

#### External Endpoints
- `https://api.openai.com` - OpenAI API
- `https://huggingface.co` - Model downloads
- `https://www.kaggle.com` - Dataset downloads (optional)

### Storage Requirements

#### Development
```plaintext
backend/
├── Application code: 50 MB
├── Python dependencies: 2 GB
├── CLIP model cache: 300 MB
├── EasyOCR models: 150 MB
└── Dataset: 2-3 GB

frontend/
├── Application code: 20 MB
└── Node modules: 400 MB

Total: ~6 GB
```

#### Production
- Add 2-3 GB for persistent Qdrant storage
- Add 1-2 GB for application logs
- Add 5-10 GB for image CDN cache (if applicable)
- **Total: ~15-20 GB**

### Performance Benchmarks

#### With GPU (NVIDIA RTX 3060)
- Index building: ~50-100 images/second
- Text search: <100ms per query
- Image search: <200ms per query
- Batch processing: 32 images per batch

#### With CPU (Intel i7)
- Index building: ~10-20 images/second
- Text search: <300ms per query
- Image search: <500ms per query
- Batch processing: 8-16 images per batch

### Compatibility Notes

#### macOS
- Apple Silicon (M1/M2/M3): Fully supported
- Use MPS acceleration with PyTorch 2.0+
- Rosetta 2 not required

#### Linux
- Ubuntu/Debian recommended
- Install CUDA drivers for GPU support
- libGL dependencies required for OpenCV

#### Windows
- WSL2 recommended for better compatibility
- Native Windows supported but may require additional setup
- CUDA Toolkit required for GPU acceleration

## 🚀 Quick Start

### Prerequisites

Ensure your system meets the [minimum requirements](#-system-requirements) before proceeding.

**Required Software:**
- **Python 3.8+**
- **Node.js 18+**
- **npm or yarn**
- **Git**

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   # API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4.1-nano
   
   # CORS Settings
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   
   # Data Paths
   DATA_ROOT=./data
   ZIP_PATH=./archive.zip
   
   # Qdrant Configuration
   QDRANT_URL=:memory:
   QDRANT_COLLECTION=jewelry_products
   
   # Model Settings
   CLIP_MODEL=openai/clip-vit-base-patch32
   DEVICE=cuda  # or cpu
   BATCH_SIZE=32
   EMBEDDING_DIM=512
   ```

5. **Download dataset (if needed)**
   ```bash
   python download_dataset.py
   ```

6. **Run the backend**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Frontend will be available at: `http://localhost:3000`

## 📁 Project Structure

```
capstone2/
├── backend/                    # FastAPI backend
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration management
│   ├── dependencies.py        # Dependency injection
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker configuration
│   │
│   ├── models/               # Data models
│   │   └── schemas.py        # Pydantic schemas
│   │
│   ├── routes/               # API endpoints
│   │   ├── search.py         # Search & recommendations
│   │   ├── products.py       # Product management
│   │   ├── categories.py     # Category endpoints
│   │   └── health.py         # Health checks
│   │
│   ├── search_engine/        # Core search logic
│   │   ├── engine.py         # Main search engine
│   │   ├── search.py         # Search implementation
│   │   ├── recommendations.py # Recommendation logic
│   │   │
│   │   ├── handlers/         # Feature handlers
│   │   │   ├── embeddings.py # CLIP embeddings
│   │   │   └── ocr.py        # OCR processing
│   │   │
│   │   ├── indexing/         # Data indexing
│   │   │   ├── builder.py    # Index builder
│   │   │   └── loader.py     # Data loader
│   │   │
│   │   ├── processors/       # Query processing
│   │   │   └── query.py      # Query handler
│   │   │
│   │   └── utils/            # Utility functions
│   │       └── jewelry.py    # Jewelry-specific utils
│   │
│   └── data/                 # Data storage
│       ├── cache/            # Cache directory
│       └── Jewellery_Data/   # Dataset
│           ├── necklace/
│           └── ring/
│
└── frontend/                 # Next.js frontend
    ├── package.json          # Node dependencies
    ├── next.config.mjs       # Next.js configuration
    ├── tsconfig.json         # TypeScript config
    ├── tailwind.config.cjs   # Tailwind CSS config
    │
    ├── app/                  # Next.js app directory
    │   ├── page.tsx          # Home page
    │   ├── layout.tsx        # Root layout
    │   ├── globals.css       # Global styles
    │   │
    │   ├── search/           # Search page
    │   │   └── page.tsx
    │   │
    │   └── product/          # Product detail
    │       └── [id]/
    │           └── page.tsx
    │
    ├── components/           # React components
    │   ├── Navbar.tsx        # Navigation bar
    │   ├── SearchBar.tsx     # Search input
    │   ├── SearchResults.tsx # Results display
    │   ├── FilterControls.tsx# Filter controls
    │   ├── ImageUpload.tsx   # Image upload
    │   └── RecommendationsPanel.tsx
    │
    ├── lib/                  # Utilities
    │   ├── api.ts            # API client
    │   └── utils.ts          # Helper functions
    │
    └── types/                # TypeScript types
        └── index.ts
```

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

### Search
```http
POST /search
Content-Type: application/json

{
  "query": "gold ring with diamonds",
  "categories": ["ring"],
  "top_k": 10,
  "max_decoration_score": null,
  "min_plain_score": null,
  "semantic_top_k": 100
}
```

### Image Upload Search
```http
POST /search/upload
Content-Type: multipart/form-data

file: <image_file>
categories: ["ring", "necklace"]
top_k: 10
```

### Recommendations
```http
POST /recommend
Content-Type: application/json

{
  "product_id": "ring_001",
  "top_k": 5
}
```

### Get All Products
```http
GET /products?category=ring&skip=0&limit=50
```

### Get Categories
```http
GET /categories
```

### Search by Image URL
```http
POST /search/image-url
Content-Type: application/json

{
  "image_url": "https://example.com/jewelry.jpg",
  "categories": ["necklace"],
  "top_k": 10
}
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async web framework
- **PyTorch** - Deep learning framework
- **Transformers** - CLIP model implementation
- **Qdrant** - Vector similarity search
- **EasyOCR** - Text detection in images
- **OpenAI API** - Enhanced OCR and descriptions
- **Pillow** - Image processing
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hooks** - State management

## 🎯 Usage Examples

### Text Search
```javascript
// Search for jewelry using natural language
const results = await searchProducts({
  query: "elegant gold necklace without diamonds",
  top_k: 10
});
```

### Image Search
```javascript
// Upload an image to find similar items
const formData = new FormData();
formData.append('file', imageFile);
formData.append('top_k', '10');

const results = await searchByImage(formData);
```

### Category Filter
```javascript
// Search within specific category
const results = await searchProducts({
  query: "vintage style",
  categories: ["ring"],
  top_k: 20
});
```

### Advanced Filtering
```javascript
// Control style preferences
const results = await searchProducts({
  query: "silver jewelry",
  max_decoration_score: 0.5,  // Less decorated items
  min_plain_score: 0.7,       // More plain items
  top_k: 15
});
```

## 🐳 Docker Deployment

### Backend
```bash
cd backend
docker build -t jewelry-search-backend .
docker run -p 8000:8000 --env-file .env jewelry-search-backend
```

### Full Stack (with Docker Compose)
```bash
# Create docker-compose.yml at root level
docker-compose up -d
```

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend
black backend/
isort backend/

# Frontend
npm run lint
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of a capstone project and is for educational purposes.

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �🙏 Acknowledgments

- **OpenAI CLIP** - For the powerful vision-language model
- **Qdrant** - For efficient vector search capabilities
- **FastAPI** - For the excellent async framework
- **Next.js** - For the modern React framework

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for Capstone Project 2**
