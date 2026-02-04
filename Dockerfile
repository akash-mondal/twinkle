FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Run the facilitator service
CMD ["npx", "ts-node", "src/run_facilitator.ts"]
