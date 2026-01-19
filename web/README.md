# Twinkle Web

Next.js frontend for the Twinkle payment protocol.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Backend services running (see `../backend/README.md`)

## Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Port Configuration

**Important:** The frontend runs on port 3000 by default, which conflicts with the backend API.

When running both frontend and backend together:

1. Start the frontend first (takes port 3000)
2. Start the backend API with a different port:
   ```bash
   cd ../backend/apps/api
   API_PORT=3002 pnpm dev
   ```

Or start the frontend on a different port:
```bash
PORT=3003 pnpm dev
```

### Recommended Development Setup

| Service | Port | Command |
|---------|------|---------|
| Frontend | 3000 | `pnpm dev` (in `/web`) |
| Backend API | 3002 | `API_PORT=3002 pnpm api:dev` (in `/backend`) |
| Facilitator | 3001 | `pnpm facilitator:dev` (in `/backend`) |
| Indexer | 42069 | `pnpm indexer:dev` (in `/backend`) |

## Environment Variables

Create a `.env.local` file:

```bash
# API URL (use port 3002 if running alongside frontend)
NEXT_PUBLIC_API_URL=http://localhost:3002

# Chain ID (1 for Mainnet, 11155111 for Sepolia)
NEXT_PUBLIC_CHAIN_ID=1
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **Wagmi + Viem** - Ethereum interactions
- **Privy** - Web3 authentication
- **Framer Motion + GSAP** - Animations
- **TanStack Query** - Data fetching

## Project Structure

```
web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── docs/         # Documentation pages
│   │   └── apps/         # Applications showcase
│   ├── components/
│   │   ├── landing/      # Landing page components
│   │   ├── docs/         # Documentation components
│   │   ├── ui/           # Reusable UI components
│   │   └── shared/       # Shared components
│   └── lib/              # Utility functions
└── public/               # Static assets
```

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```
