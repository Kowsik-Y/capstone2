FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY dependencies.py .
COPY config.py .
COPY download_dataset.py .
COPY routes/ ./routes/
COPY models/ ./models/
COPY search_engine/ ./search_engine/

# Create data directory
RUN mkdir -p /data

# Set environment variables
ENV DATA_ROOT=/data
ENV DEVICE=cpu
ENV PORT=7860
ENV PYTHONPATH=/app

# Expose port
EXPOSE 7860

# Run the FastAPI application directly
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
