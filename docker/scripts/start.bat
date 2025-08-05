@echo off
REM AI Assistant Docker Start Script
REM This script creates the Docker network and starts all containers

echo Starting AI Assistant Docker Environment...
echo.

REM Change to docker directory
cd /d "%~dp0\.."

REM Clean up any existing ai-assistant containers and networks
echo Cleaning up existing setup...
docker-compose down 2>nul
docker container rm -f ai-assistant-postgres ai-assistant-n8n ai-assistant-ollama 2>nul
docker network rm ai-assistant 2>nul

REM Create fresh network
echo Creating Docker network 'ai-assistant'...
docker network create ai-assistant 2>nul
if %errorlevel% equ 0 (
    echo Network 'ai-assistant' created successfully.
) else (
    echo Network 'ai-assistant' already exists.
)
echo.

REM Create volumes if they don't exist (ollama uses existing volume)
echo Creating Docker volumes...
docker volume create ai-assistant-postgres-data 2>nul
docker volume create ai-assistant-n8n-data 2>nul
echo Volumes created/verified.
echo.

REM Start containers using docker-compose with project name
echo Starting containers...
docker-compose -p ai-assistant up -d

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo AI Assistant services started!
    echo ================================
    echo.
    echo Services available at:
    echo - PostgreSQL: localhost:5432
    echo - n8n:        http://localhost:5678
    echo - Ollama:     http://localhost:11434
    echo.
    echo n8n uses its own authentication system - create account on first visit
    echo.
    echo To stop services, run: docker\scripts\stop.bat
    echo To view logs, run: docker\scripts\logs.bat
) else (
    echo.
    echo ERROR: Failed to start containers!
    echo Check the error messages above.
    exit /b 1
)

pause