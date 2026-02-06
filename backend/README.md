---
title: ClipSearch Backend
emoji: 💎
colorFrom: blue
colorTo: purple
sdk: docker
app_file: main.py
pinned: false
---

# ClipSearch Backend

AI-powered jewelry search backend using CLIP for visual similarity search. This service provides RESTful APIs for image-based product search and recommendations.

## Features

- 🔍 CLIP-based image similarity search
- 📸 Image upload and processing
- 🏷️ Category-based filtering
- 💍 Jewelry product recommendations
- 🚀 FastAPI backend with async support

## API Endpoints

- `GET /health` - Health check
- `POST /search` - Search products by image or text
- `GET /products` - List all products
- `GET /categories` - List available categories

## Dataset

Uses jewelry dataset with categories:
- Necklaces
- Rings
