import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "SDK Installation - Twinkle Protocol Docs",
    description: "Install the Twinkle SDK in your project.",
};

export default function InstallationPage() {
    return (
        <article className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">SDK Installation</h1>
            <p className="text-zinc-400 leading-7 mb-6">
                The Twinkle SDK is a TypeScript library that provides easy access to all Twinkle Protocol smart contracts.
            </p>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Install</h2>
            <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
                <pre className="p-4 text-sm font-mono text-zinc-300">
                    {`npm install @twinkle/sdk viem
# or
pnpm add @twinkle/sdk viem
# or
yarn add @twinkle/sdk viem`}
                </pre>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Requirements</h2>
            <ul className="list-disc pl-5 mb-6 text-zinc-400 space-y-2">
                <li><strong className="text-white">Node.js 18+</strong></li>
                <li><strong className="text-white">viem</strong> - Required peer dependency for blockchain interactions</li>
                <li><strong className="text-white">TypeScript</strong> - Recommended for best developer experience</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10">Next Steps</h2>
            <p className="text-zinc-400 leading-7">
                Head to the <Link href="/docs/quickstart" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">Quickstart</Link> to create your first paywall,
                or check the <Link href="/docs/sdk/reference" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">SDK Reference</Link> for full API documentation.
            </p>
        </article>
    );
}
