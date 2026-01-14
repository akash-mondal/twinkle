import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Escrow - Twinkle Protocol Docs",
    description: "Learn how to create escrow-based milestone payments with Twinkle Protocol.",
};

export default function EscrowPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">Escrow</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                Escrow enables milestone-based payments for freelance work, projects, or any service that requires payment upon completion of defined milestones.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">How It Works</h2>
            <ol className="list-decimal pl-5 mb-6 text-zinc-400 space-y-2">
                <li>Client creates an escrow project with milestones and deposits funds.</li>
                <li>Freelancer completes work and requests milestone approval.</li>
                <li>Client approves the milestone, releasing funds to the freelancer.</li>
                <li>Disputes can be raised if there's disagreement.</li>
            </ol>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Create an Escrow Project</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { createEscrowProject } from '@twinkle/sdk';

const { projectId, txHash } = await createEscrowProject(
  walletClient,
  publicClient,
  {
    freelancer: "0xFreelancer...",
    milestones: [
      { description: "Design Phase", amount: parseEther("100") },
      { description: "Development", amount: parseEther("300") },
      { description: "Launch", amount: parseEther("100") },
    ],
  }
);`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Approve a Milestone</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`import { approveMilestone } from '@twinkle/sdk';

const { txHash } = await approveMilestone(
  walletClient,
  publicClient,
  {
    projectId: projectId,
    milestoneIndex: 0, // First milestone
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
