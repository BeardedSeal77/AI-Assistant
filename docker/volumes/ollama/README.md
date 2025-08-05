# Ollama Volume Configuration

This directory contains Ollama models and configuration.

## Volume Mount
The Ollama container mounts this volume to `/root/.ollama` to persist downloaded models.

## Setup
1. Start the containers with `docker-compose up -d`
2. Access the Ollama container to download models:
   ```bash
   docker exec -it ai-assistant-ollama ollama pull llama2
   ```

## Recommended Models
See `models.txt` for a list of recommended models to download for the AI Assistant.

## Usage
- Models are accessible via http://localhost:11434
- n8n can connect to Ollama using the internal network address: http://ollama:11434