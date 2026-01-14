import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference - Twinkle Protocol Docs",
  description: "REST API reference for the Twinkle Indexer.",
};

export default function APIReferencePage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-4">API Reference</h1>
      <p className="text-zinc-400 leading-7 mb-6">
        The Twinkle Indexer provides a REST API for querying on-chain data about paywalls, subscriptions, splits, and escrow projects.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Base URL</h2>
      <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
        <pre className="p-4 text-sm font-mono text-zinc-300">
          {`https://tw1nkl3.rest`}
        </pre>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Authentication</h2>
      <p className="text-zinc-400 leading-7 mb-4">
        The API is currently public and does not require authentication. Rate limit: 200 requests per minute.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Health & Info</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get service status and contract addresses.</p>
      <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
        <pre className="p-4 text-sm font-mono text-zinc-300">
          {`GET /

Response:
{
  "service": "twinkle-api",
  "version": "1.0.0",
  "status": "healthy",
  "chainId": 8453,
  "network": "Base",
  "contracts": {
    "TwinkleCore": "0x...",
    "TwinklePay": "0x...",
    "TwinkleSubscription": "0x...",
    "TwinkleEscrow": "0x...",
    "TwinkleSplit": "0x...",
    "TwinkleX402": "0x..."
  }
}`}
        </pre>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Paywalls</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /paywalls</h3>
      <p className="text-zinc-400 leading-7 mb-4">List all paywalls.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /paywalls/:id</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get paywall details by ID.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /paywalls/:id/unlocks</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get all unlocks for a paywall.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /paywalls/:id/check/:address</h3>
      <p className="text-zinc-400 leading-7 mb-4">Check if a user has unlocked a paywall.</p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Subscriptions</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /subscriptions/plans</h3>
      <p className="text-zinc-400 leading-7 mb-4">List all subscription plans.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /subscriptions/plans/:id</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get plan details.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /subscriptions/user/:address</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get a user's subscriptions.</p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Splits</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /splits</h3>
      <p className="text-zinc-400 leading-7 mb-4">List all splits.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /splits/:id</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get split details.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /splits/:id/distributions</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get split distributions.</p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Escrow Projects</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /projects</h3>
      <p className="text-zinc-400 leading-7 mb-4">List all escrow projects.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /projects/:id</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get project with milestones.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /projects/:id/milestones</h3>
      <p className="text-zinc-400 leading-7 mb-4">Get project milestones.</p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">x402 Protocol</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /x402/requests</h3>
      <p className="text-zinc-400 leading-7 mb-4">List payment requests.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /x402/settlements</h3>
      <p className="text-zinc-400 leading-7 mb-4">List settlements.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /x402/agent-payments</h3>
      <p className="text-zinc-400 leading-7 mb-4">List agent-to-agent payments.</p>

      <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Analytics</h2>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /analytics/overview</h3>
      <p className="text-zinc-400 leading-7 mb-4">Protocol overview statistics.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /analytics/daily</h3>
      <p className="text-zinc-400 leading-7 mb-4">Daily statistics.</p>

      <h3 className="text-xl font-medium text-white mb-3 mt-6">GET /analytics/top-creators</h3>
      <p className="text-zinc-400 leading-7 mb-4">Top creators by revenue.</p>
    </article>
  );
}
