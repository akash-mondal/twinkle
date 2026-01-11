#!/bin/bash
set -e

# Twinkle Backend - VPS Deployment Script
# Usage: ./scripts/deploy.sh [command]
# Commands: setup, deploy, logs, status, restart, stop

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[TWINKLE]${NC} $1"; }
warn() { echo -e "${YELLOW}[TWINKLE]${NC} $1"; }
error() { echo -e "${RED}[TWINKLE]${NC} $1"; exit 1; }

# Check prerequisites
check_prereqs() {
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed."
    command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || error "Docker Compose is required but not installed."
}

# Setup function - first time setup
setup() {
    log "Setting up Twinkle backend..."

    # Check for .env.prod
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.prod.example" ]; then
            cp .env.prod.example "$ENV_FILE"
            warn "Created $ENV_FILE from template. Please edit it with your values!"
            warn "  nano $ENV_FILE"
            exit 1
        else
            error "$ENV_FILE not found. Please create it from .env.prod.example"
        fi
    fi

    # Validate required vars
    source "$ENV_FILE"
    [ -z "$POSTGRES_PASSWORD" ] && error "POSTGRES_PASSWORD is required in $ENV_FILE"
    [ -z "$RPC_URL" ] && error "RPC_URL is required in $ENV_FILE"
    [ -z "$PONDER_RPC_URL_11155111" ] && error "PONDER_RPC_URL_11155111 is required in $ENV_FILE"
    [ -z "$FACILITATOR_PRIVATE_KEY" ] && error "FACILITATOR_PRIVATE_KEY is required in $ENV_FILE"

    log "Configuration valid!"
    log "Building containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    log "Setup complete! Run './scripts/deploy.sh deploy' to start services."
}

# Deploy/start services
deploy() {
    check_prereqs

    if [ ! -f "$ENV_FILE" ]; then
        error "$ENV_FILE not found. Run './scripts/deploy.sh setup' first."
    fi

    log "Starting Twinkle services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log "Waiting for services to be healthy..."
    sleep 10

    status
}

# Show status
status() {
    log "Service status:"
    docker compose -f "$COMPOSE_FILE" ps

    echo ""
    log "Health checks:"

    # Check API
    if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
        echo -e "  API:         ${GREEN}healthy${NC}"
    else
        # Try via caddy
        if curl -sf http://localhost/api/health >/dev/null 2>&1; then
            echo -e "  API:         ${GREEN}healthy${NC}"
        else
            echo -e "  API:         ${RED}unhealthy${NC}"
        fi
    fi

    # Check Facilitator
    if curl -sf http://localhost:8080/facilitator/health >/dev/null 2>&1; then
        echo -e "  Facilitator: ${GREEN}healthy${NC}"
    else
        if curl -sf http://localhost/facilitator/health >/dev/null 2>&1; then
            echo -e "  Facilitator: ${GREEN}healthy${NC}"
        else
            echo -e "  Facilitator: ${RED}unhealthy${NC}"
        fi
    fi

    # Check Indexer (via docker)
    if docker ps --filter "name=twinkle-indexer" --filter "status=running" | grep -q twinkle-indexer; then
        echo -e "  Indexer:     ${GREEN}running${NC}"
    else
        echo -e "  Indexer:     ${RED}not running${NC}"
    fi
}

# Show logs
logs() {
    SERVICE=${1:-""}
    if [ -n "$SERVICE" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
    else
        docker compose -f "$COMPOSE_FILE" logs -f
    fi
}

# Restart services
restart() {
    SERVICE=${1:-""}
    if [ -n "$SERVICE" ]; then
        log "Restarting $SERVICE..."
        docker compose -f "$COMPOSE_FILE" restart "$SERVICE"
    else
        log "Restarting all services..."
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    fi
}

# Stop services
stop() {
    log "Stopping Twinkle services..."
    docker compose -f "$COMPOSE_FILE" down
    log "Services stopped."
}

# Pull latest and redeploy
update() {
    log "Pulling latest changes..."
    git pull origin main

    log "Rebuilding containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    log "Restarting services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log "Update complete!"
    status
}

# Main
check_prereqs

case "${1:-deploy}" in
    setup)
        setup
        ;;
    deploy|start)
        deploy
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    restart)
        restart "$2"
        ;;
    stop)
        stop
        ;;
    update)
        update
        ;;
    *)
        echo "Twinkle Backend Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup     First-time setup (create config, build images)"
        echo "  deploy    Start all services (default)"
        echo "  status    Show service status and health"
        echo "  logs      Show logs (optionally: logs <service>)"
        echo "  restart   Restart services (optionally: restart <service>)"
        echo "  stop      Stop all services"
        echo "  update    Pull latest code and redeploy"
        ;;
esac
