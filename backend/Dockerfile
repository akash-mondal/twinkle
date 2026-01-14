# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/api/package.json ./apps/api/
COPY apps/facilitator/package.json ./apps/facilitator/
COPY apps/indexer/package.json ./apps/indexer/

# Install dependencies
RUN pnpm install

# Copy source
COPY packages/shared ./packages/shared
COPY packages/sdk ./packages/sdk
COPY apps/api ./apps/api
COPY apps/facilitator ./apps/facilitator
COPY apps/indexer ./apps/indexer

# Build shared package
RUN pnpm --filter @twinkle/shared build
RUN pnpm --filter @twinkle/sdk build

# Build apps
RUN pnpm --filter @twinkle/api build
RUN pnpm --filter @twinkle/facilitator build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy built files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/sdk ./packages/sdk
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/apps/facilitator ./apps/facilitator
COPY --from=builder /app/apps/indexer ./apps/indexer

# Default to API service
ENV NODE_ENV=production
ENV SERVICE=api

# Start script will be overridden per service
CMD ["sh", "-c", "pnpm --filter @twinkle/${SERVICE} start"]
