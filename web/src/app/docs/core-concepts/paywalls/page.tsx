import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Paywalls - Twinkle Protocol Docs",
    description: "Learn how to create paywalls with Twinkle Protocol.",
};

export default function PaywallsPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Paywalls</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Paywalls allow you to lock content behind a one-time payment. Users pay a specified amount in MNEE to unlock access forever.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">How It Works</h2>
            <ol className="list-decimal pl-5 mb-6 text-zinc-400 space-y-2">
                <li>You create a paywall with a <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">contentId</code> and <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">price</code>.</li>
                <li>Users attempt to access the content.</li>
                <li>Your app checks if the user has unlocked the paywall using <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">isPaywallUnlocked</code>.</li>
                <li>If not unlocked, prompt them to pay.</li>
                <li>Once paid, content is accessible forever for that wallet.</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Create a Paywall</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createPaywall } from '@twinkle/sdk';

const { paywallId, txHash } = await createPaywall(
  walletClient, 
  publicClient, 
  {
    contentId: "premium-article-001",
    price: parseEther("5"), // 5 MNEE
  }
);`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Check Unlock Status</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { isPaywallUnlocked } from '@twinkle/sdk';

const unlocked = await isPaywallUnlocked(
  publicClient,
  paywallId,
  userAddress
);

if (unlocked) {
  // Show premium content
} else {
  // Show payment prompt
}`}
                </pre>
            </div>

            <p className="text-zinc-400 leading-7">
                See the <Link href="/docs/sdk/reference" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">SDK Reference</Link> for full API details.
            </p>
        </article>
    );
}
