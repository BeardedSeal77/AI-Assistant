# n8n Volume Configuration

This directory contains n8n workflow data and configuration.

## Volume Mount
The n8n container mounts this volume to `/home/node/.n8n` to persist:
- Workflow definitions
- Credentials
- Settings
- Execution history

## Setup
1. Start the containers with `docker-compose up -d`
2. Access n8n at http://localhost:5678
3. Login with the credentials from your .env file
4. Import or create workflows for the AI Assistant

## Workflows Required
1. Google OAuth workflow (`/webhook/google-oauth`)
2. Main assistant workflow (`/webhook/assistant`)

See the main documentation for detailed workflow setup instructions.