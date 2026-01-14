import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Introduction - Twinkle Protocol Docs",
    description: "Build monetized applications on the decentralized web with Twinkle Protocol.",
};

export default function IntroductionPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to Twinkle</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Twinkle Protocol is a suite of payment primitives designed for the decentralized web.
                We provide a simple, unified SDK to handle complex crypto-economic flows like <strong>paywalls</strong>,
                <strong>recurring subscriptions</strong>, <strong>revenue splits</strong>, and <strong>escrow</strong>.
            </p>
            <p className="text-zinc-400 leading-7 mb-8">
                Our goal is to make "getting paid on-chain" as easy as integrating Stripe, but with the power of smart contracts and autonomous agents.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Why Twinkle?</h2>
            <ul className="list-disc pl-5 mb-6 text-zinc-400 space-y-2">
                <li><strong className="text-white">For Creators</strong>: Monetize your content directly. Launch a paywall for your blog, a subscription for your newsletter, or split revenue with collaborators instantly.</li>
                <li><strong className="text-white">For Developers</strong>: Stop writing boilerplate Solidity. Use our audited, secure contracts via a simple TypeScript SDK. Integrate in minutes, not weeks.</li>
                <li><strong className="text-white">For Agents</strong>: Implementation of the <strong>x402</strong> standard allows AI agents to autonomously discover prices and pay for resources via HTTP headers.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Features</h2>
            <ul className="list-disc pl-5 mb-6 text-zinc-400 space-y-2">
                <li><strong className="text-white">Paywalls (Unlock)</strong>: One-time payments to reveal content or data.</li>
                <li><strong className="text-white">Subscriptions (Patronize)</strong>: Recurring memberships with automatic expiry handling.</li>
                <li><strong className="text-white">Revenue Splits (SoundSplit)</strong>: Distribute incoming funds to multiple wallets automatically.</li>
                <li><strong className="text-white">Escrow (Milestone)</strong>: Job-based payments with milestone releases and dispute resolution.</li>
                <li><strong className="text-white">Agent Payments (x402)</strong>: Standardized headers for AI-to-AI commerce.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Getting Started</h2>
            <p className="text-zinc-400 leading-7">
                Ready to build? Check out the{" "}
                <Link href="/docs/quickstart" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
                    Quickstart
                </Link>{" "}
                guide to make your first transaction in under 5 minutes.
            </p>
        </article>
    );
}
