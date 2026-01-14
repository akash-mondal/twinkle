import { Metadata } from "next";

export const metadata: Metadata = {
    title: "SDK Reference - Twinkle Protocol Docs",
    description: "Complete API reference for the Twinkle SDK.",
};

export default function ReferencePage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">SDK Reference</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Complete API reference for all functions exported by <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm">@twinkle/sdk</code>.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Paywalls</h2>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">createPaywall</h3>
            <p className="text-zinc-400 leading-7 mb-4">Creates a new paywall for content monetization.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`createPaywall(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    contentId: string;
    price: bigint;
  }
): Promise<{ paywallId: string; txHash: string }>`}
                </pre>
            </div>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">isPaywallUnlocked</h3>
            <p className="text-zinc-400 leading-7 mb-4">Checks if a user has unlocked a specific paywall.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`isPaywallUnlocked(
  publicClient: PublicClient,
  paywallId: string,
  userAddress: Address
): Promise<boolean>`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Subscriptions</h2>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">createSubscriptionPlan</h3>
            <p className="text-zinc-400 leading-7 mb-4">Creates a new subscription plan.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`createSubscriptionPlan(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    name: string;
    price: bigint;
    period: number; // seconds
  }
): Promise<{ planId: string; txHash: string }>`}
                </pre>
            </div>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">subscribeToPlan</h3>
            <p className="text-zinc-400 leading-7 mb-4">Subscribes a user to a plan.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`subscribeToPlan(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    planId: string;
  }
): Promise<{ subscriptionId: string; txHash: string }>`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Splits</h2>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">createSplit</h3>
            <p className="text-zinc-400 leading-7 mb-4">Creates a revenue split among multiple recipients.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`createSplit(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    recipients: Address[];
    shares: number[]; // percentages, must sum to 100
  }
): Promise<{ splitId: string; txHash: string }>`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Escrow</h2>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">createEscrowProject</h3>
            <p className="text-zinc-400 leading-7 mb-4">Creates an escrow project with milestones.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`createEscrowProject(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    freelancer: Address;
    milestones: Array<{
      description: string;
      amount: bigint;
    }>;
  }
): Promise<{ projectId: string; txHash: string }>`}
                </pre>
            </div>

            <h3 className="text-xl font-medium text-white mb-3 mt-6">approveMilestone</h3>
            <p className="text-zinc-400 leading-7 mb-4">Approves a milestone and releases funds to the freelancer.</p>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`approveMilestone(
  walletClient: WalletClient,
  publicClient: PublicClient,
  options: {
    projectId: string;
    milestoneIndex: number;
  }
): Promise<{ txHash: string }>`}
                </pre>
            </div>
        </article>
    );
}
