FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port and run production server
EXPOSE 8000
CMD ["python", "run.py"]
