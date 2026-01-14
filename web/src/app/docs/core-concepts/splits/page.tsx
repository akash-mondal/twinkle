import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Revenue Splits - Twinkle Protocol Docs",
    description: "Learn how to split revenue among multiple recipients with Twinkle Protocol.",
};

export default function SplitsPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Revenue Splits</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Revenue Splits allow you to automatically distribute incoming payments among multiple recipients based on predefined shares.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">How It Works</h2>
            <ol className="list-decimal pl-5 mb-6 text-zinc-400 space-y-2">
                <li>Create a split with recipient addresses and their share percentages.</li>
                <li>Send payments to the split contract address.</li>
                <li>Funds are automatically distributed proportionally.</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Create a Split</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createSplit } from '@twinkle/sdk';

const { splitId, txHash } = await createSplit(
  walletClient,
  publicClient,
  {
    recipients: [
      "0xArtist...",
      "0xProducer...",
      "0xLabel..."
    ],
    shares: [50, 30, 20], // 50%, 30%, 20%
  }
);`}
                </pre>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 my-6 text-sm text-zinc-300">
                <strong className="text-blue-400">Note:</strong> Share percentages must add up to 100.
            </div>

            <p className="text-zinc-400 leading-7">
                See the <Link href="/docs/sdk/reference" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">SDK Reference</Link> for full API details.
            </p>
        </article>
    );
}
