"use client";
import { Navbar } from "@/components/Navbar";
import { ChevronRight, Code2, Book, Terminal, Shield, Zap } from 'lucide-react';

const sections = [
  { id: 'intro', title: 'Introduction', icon: Book },
  { id: 'agent', title: 'TwinkleAgent', icon: Terminal },
  { id: 'server', title: 'TwinkleServer', icon: Shield },
  { id: 'bridge', title: 'Adoption Bridge', icon: Zap },
  { id: 'relay', title: 'Facilitators', icon: Code2 },
];

export default function Docs() {
  return (
    <main className="min-h-screen pt-24 bg-[#0A0A0A]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-8 py-12 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-white/5 h-[calc(100vh-160px)] sticky top-32">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors group"
              >
                <section.icon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          <div className="badge mb-6">Documentation</div>
          <h1 className="text-6xl serif italic mb-8 italic text-white leading-tight">
            Seamless integration for <br />autonomous agents.
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-xl text-zinc-400 mb-12 leading-relaxed font-medium">
              Twinkle provides the infrastructure layer for MNEE-centric commerce. 
              Our SDKs handle the complexities of x402 headers, Permit2 signatures, and Cross-Token bridging.
            </p>

            <section id="intro" className="mb-24">
              <h2 className="text-2xl font-bold mb-6 tracking-tight text-white flex items-center space-x-3">
                <span>The 402 Flow</span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </h2>
              <div className="glass p-6 rounded-xl border-white/5 bg-white/[0.02] mb-8">
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                  When an agent hits an x402-gated endpoint, TwinkleServer intercepts the request and issues a challenge. 
                  TwinkleAgent captures this challenge, manages the signature intent, and retries the request automatically.
                </p>
              </div>
            </section>

            <section id="code" className="mb-24">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500 mb-6">Installation</h3>
              <div className="p-6 bg-black border border-white/5 rounded-xl font-mono text-sm group relative overflow-hidden">
                <div className="flex items-center space-x-2 text-zinc-500 mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal</span>
                </div>
                <div className="text-amber-500">$ <span className="text-[#EDEDED]">npm install @twinkle/sdk</span></div>
                
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Zap className="w-24 h-24 text-amber-500 fill-current" />
                </div>
              </div>
            </section>

            <section id="example" className="mb-24">
              <h2 className="text-2xl font-bold mb-6 tracking-tight text-white">Example: TwinkleAgent</h2>
              <div className="p-6 bg-[#0E0E0E] border border-white/5 rounded-xl text-sm font-mono overflow-x-auto leading-relaxed">
<pre className="text-zinc-400">
{`import { TwinkleAgent } from '@twinkle/sdk';

const agent = new TwinkleAgent({
  privateKey: process.env.AGENT_KEY,
  developerAddress: '0x...',
  autoSwitch: true // Universal Bridge Active
});

// Performs gasless settlement automatically
const res = await agent.fetch('https://mnee-api.io/data');`}
</pre>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
