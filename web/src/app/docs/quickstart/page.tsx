import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Quickstart - Twinkle Protocol Docs",
    description: "Get up and running with the Twinkle SDK in less than 5 minutes.",
};

export default function QuickstartPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Quickstart</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                In this guide, we'll install the Twinkle SDK and create a simple <strong>Paywall</strong>.
                By the end, you'll have a paid link that requires users to pay MNEE to access.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Prerequisites</h2>
            <ul className="list-disc pl-5 mb-6 text-zinc-400 space-y-2">
                <li><strong className="text-white">Node.js 18+</strong></li>
                <li><strong className="text-white">Wallet Connect Project ID</strong> (optional, for RainbowKit/Wagmi)</li>
                <li>A refined palate for good software.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">1. Install the SDK</h2>
            <p className="text-zinc-400 leading-7 mb-4">
                Add <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">@twinkle/sdk</code> to your project using your preferred package manager.
            </p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`npm install @twinkle/sdk viem
# or
pnpm add @twinkle/sdk viem`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">2. Initialize the Client</h2>
            <p className="text-zinc-400 leading-7 mb-4">
                Twinkle is built on <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">viem</code>.
                You need to create a <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">publicClient</code> (for reading data)
                and a <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">walletClient</code> (for signing transactions).
            </p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';
import { initTwinkle } from '@twinkle/sdk';

// 1. Setup Viem Clients
const publicClient = createPublicClient({ 
  chain: mainnet, 
  transport: http() 
});

const walletClient = createWalletClient({ 
  chain: mainnet, 
  transport: custom(window.ethereum!) 
});

// 2. Initialize Twinkle
const twinkle = initTwinkle({
  env: "production" 
});`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">3. Create a Paywall</h2>
            <p className="text-zinc-400 leading-7 mb-4">
                Now representing the <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">Unlock</code> protocol, let's lock some content behind a 10 MNEE price tag.
            </p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createPaywall } from '@twinkle/sdk';
import { parseEther } from 'viem';

async function createMyFirstPaywall() {
  const [account] = await walletClient.getAddresses();

  const { paywallId, txHash } = await createPaywall(
    walletClient, 
    publicClient, 
    {
      contentId: "my-premium-blog-post", 
      price: parseEther("10"), // 10 MNEE
      currency: "MNEE" // Optional, defaults to MNEE
    }
  );

  console.log(\`Paywall created! ID: \${paywallId}\`);
  console.log(\`Transaction: \${txHash}\`);
}`}
                </pre>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 my-6 text-sm text-zinc-300">
                <strong className="text-green-400">Success!</strong> You just deployed a crypto-economic primitive without writing a single line of Solidity.
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Next Steps</h2>
            <p className="text-zinc-400 leading-7 mb-4">Now that you have the basics, explore the specific modules:</p>
            <ul className="list-disc pl-5 mb-6 text-zinc-400 space-y-2">
                <li><Link href="/docs/core-concepts/paywalls" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">Paywalls</Link></li>
                <li><Link href="/docs/core-concepts/subscriptions" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">Subscriptions</Link></li>
                <li><Link href="/docs/core-concepts/splits" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">Revenue Splits</Link></li>
            </ul>
        </article>
    );
}
