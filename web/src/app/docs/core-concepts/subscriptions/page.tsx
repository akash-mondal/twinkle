import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Subscriptions - Twinkle Protocol Docs",
    description: "Learn how to create recurring subscriptions with Twinkle Protocol.",
};

export default function SubscriptionsPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Subscriptions</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Subscriptions enable recurring payments for ongoing access to content or services. Users subscribe to a plan and are charged periodically.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">How It Works</h2>
            <ol className="list-decimal pl-5 mb-6 text-zinc-400 space-y-2">
                <li>Create a subscription plan with price, billing period, and metadata.</li>
                <li>Users subscribe to the plan by paying the first period.</li>
                <li>Check subscription status before serving premium content.</li>
                <li>Renewals are handled automatically or triggered by the user.</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Create a Plan</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createSubscriptionPlan } from '@twinkle/sdk';

const { planId, txHash } = await createSubscriptionPlan(
  walletClient,
  publicClient,
  {
    name: "Pro Monthly",
    price: parseEther("10"), // 10 MNEE/month
    period: 30 * 24 * 60 * 60, // 30 days in seconds
  }
);`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Subscribe a User</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { subscribeToPlan } from '@twinkle/sdk';

const { subscriptionId, txHash } = await subscribeToPlan(
  walletClient,
  publicClient,
  {
    planId: planId,
  }
);`}
                </pre>
            </div>

            <p className="text-zinc-400 leading-7">
                See the <Link href="/docs/sdk/reference" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">SDK Reference</Link> for full API details.
            </p>
        </article>
    );
}
