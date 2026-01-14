#!/bin/bash
set -e

# Config
REPO="https://github.com/akash-mondal/twinkle.git"
PRIVATE_KEY="0xec0838b3e14efa09c8af7a940b24c6d50117c705848b7217c49f9bf3b20b12d4"

echo "--- Starting Setup ---"

# 1. Install Dependencies
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get install -y docker.io docker-compose-v2 git

# 2. Setup Repo
if [ -d "twinkle" ]; then
    echo "Updating repo..."
    cd twinkle
    git pull
else
    echo "Cloning repo..."
    git clone $REPO
    cd twinkle
fi

cd backend

# 3. Configure Secrets
echo "Configuring secrets..."
cp .env.prod.example .env.prod
sed -i "s|FACILITATOR_PRIVATE_KEY=.*|FACILITATOR_PRIVATE_KEY=$PRIVATE_KEY|g" .env.prod
sed -i "s|RPC_URL_MAINNET=.*|RPC_URL_MAINNET=https://ethereum.publicnode.com|g" .env.prod
sed -i "s|RPC_URL_SEPOLIA=.*|RPC_URL_SEPOLIA=https://ethereum-sepolia.publicnode.com|g" .env.prod
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=secure_twinkle_pg_pass_123!|g" .env.prod
# Set Domain for Caddy (Auto HTTPS)
echo "DOMAIN=tw1nkl3.rest" >> .env.prod

# 4. Start App
echo "Starting Docker Stack..."
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

echo "--- Setup Complete ---"
