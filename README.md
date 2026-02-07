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

## 🚀 Quick Start

### Prerequisites

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

## 🙏 Acknowledgments

- **OpenAI CLIP** - For the powerful vision-language model
- **Qdrant** - For efficient vector search capabilities
- **FastAPI** - For the excellent async framework
- **Next.js** - For the modern React framework

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for Capstone Project 2**
