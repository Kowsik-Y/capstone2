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
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /data

# Make startup script executable
RUN chmod +x start_hf.sh

# Set environment variables
ENV DATA_ROOT=/data
ENV DEVICE=cpu
ENV PORT=8000

# Expose port
EXPOSE 8000

# Run startup script
CMD ["./start_hf.sh"]
