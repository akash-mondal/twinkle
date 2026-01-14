"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

// Minimalist components - no state, no animations, just styling.

export const MDXComponents = {
    h1: (props: any) => <h1 className="text-3xl font-bold text-white mb-6 mt-8" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-semibold text-white mb-4 mt-8 pb-2 border-b border-white/10" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-medium text-white mb-3 mt-6" {...props} />,
    p: (props: any) => <p className="text-zinc-400 leading-7 mb-4" {...props} />,
    ul: (props: any) => <ul className="list-disc pl-5 mb-4 text-zinc-400 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-5 mb-4 text-zinc-400 space-y-1" {...props} />,
    li: (props: any) => <li className="pl-1" {...props} />,
    a: ({ href, ...props }: any) => {
        if (href.startsWith('/')) {
            return <Link href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-4" {...props} />
        }
        return <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />
    },
    blockquote: (props: any) => <blockquote className="border-l-4 border-zinc-700 pl-4 py-1 italic text-zinc-500 my-6" {...props} />,
    code: (props: any) => <code className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
    pre: (props: any) => (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-lg overflow-x-auto mb-6">
            <pre className="p-4 text-sm font-mono text-zinc-300" {...props} />
        </div>
    ),
    // Minimalist Callout
    Callout: ({ children }: any) => (
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 my-6 text-sm text-zinc-300">
            {children}
        </div>
    )
};
