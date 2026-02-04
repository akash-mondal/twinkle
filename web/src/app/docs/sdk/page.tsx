"use client";
import React from 'react';
import { Terminal, Copy } from 'lucide-react';

export default function DocsSDK() {
  return (
    <div>
      <h1 className="text-4xl font-serif italic mb-6 flex items-center gap-3 text-black">
        <Terminal className="w-8 h-8 text-[#E78B1F]" />
        TwinkleAgent SDK
      </h1>
      
      <p className="text-lg text-zinc-600 mb-12">
        The complete reference for increasing agent autonomy. This library handles 402 negotiation, Permit2 signing, and HTTP header management automatically.
      </p>

      {/* === INSTALLATION === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">1. Installation</h2>
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm relative group">
           <code className="text-zinc-300 font-mono text-sm">npm install @twinkle/sdk ethers axios</code>
        </div>
      </section>

      {/* === INITIALIZATION === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">2. Initialization</h2>
        <p className="text-zinc-600 mb-6">Initialize the agent once at startup. It requires an EVM private key to sign challenge responses.</p>
        
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm overflow-x-auto">
<pre className="text-zinc-300 font-mono text-sm leading-relaxed">
<span className="text-purple-400">import</span> {'{'} TwinkleAgent {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">'@twinkle/sdk'</span>;

<span className="text-purple-400">const</span> agent = <span className="text-purple-400">new</span> <span className="text-yellow-400">TwinkleAgent</span>({'{'}
  <span className="text-zinc-500">// Your Agent's Wallet (Must hold USDC or MNEE)</span>
  privateKey: process.env.AGENT_PRIVATE_KEY,
  
  <span className="text-zinc-500">// The RPC to broadcast signatures to (if self-relaying)</span>
  providerUrl: <span className="text-green-400">'https://rpc.ankr.com/eth'</span>,

  <span className="text-zinc-500">// Optional: Hosted Facilitator for gasless mode</span>
  facilitator: <span className="text-green-400">'https://tw1nkl3.rest'</span>
{'}'});
</pre>
        </div>
      </section>

      {/* === MAKING PAYMENTS === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">3. Making Assignments</h2>
        <p className="text-zinc-600 mb-6">
          The SDK wraps `axios` to make 402-aware requests. Simply replace your standard fetch calls with `agent.fetch()`.
        </p>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm overflow-x-auto mb-8">
<pre className="text-zinc-300 font-mono text-sm leading-relaxed">
<span className="text-zinc-500">// Before: 402 Error (Payment Required)</span>
<span className="text-zinc-500">// const res = await axios.get('https://api.provider.com/data');</span>

<span className="text-zinc-500">// After: Auto-Negotiated & Paid</span>
<span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> agent.<span className="text-blue-400">fetch</span>(<span className="text-green-400">'https://api.provider.com/data'</span>);

console.log(res.data); <span className="text-zinc-500">// "Premium Data..."</span>
</pre>
        </div>

        <div className="bg-[#FFFBF0] border border-[#E78B1F]/20 p-6 rounded-lg">
           <h4 className="font-bold text-[#E78B1F] mb-2 flex items-center gap-2">
             <Terminal className="w-4 h-4"/>
             How it works under the hood
           </h4>
           <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700">
             <li>Agent sends initial request.</li>
             <li>Server responds with <strong>402 Payment Required</strong> + Price + Faciliator Address.</li>
             <li>SDK catches error, prompts wallet to sign <strong>Permit2</strong> for exact amount.</li>
             <li>SDK retries request with <code>Payment-Signature</code> header.</li>
           </ul>
        </div>
      </section>

       {/* === CONFIG REFERENCE === */}
       <section className="mb-24">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">Configuration Reference</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-900">
              <tr>
                <th className="p-4 font-bold">Property</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="p-4 font-mono text-[#E78B1F]">privateKey</td>
                <td className="p-4 font-mono text-zinc-500">string</td>
                <td className="p-4 text-zinc-700">Hex string of the agent's EVM wallet.</td>
              </tr>
              <tr>
                <td className="p-4 font-mono text-[#E78B1F]">facilitator</td>
                <td className="p-4 font-mono text-zinc-500">string</td>
                <td className="p-4 text-zinc-700">URL of the relayer. Default: <code>https://tw1nkl3.rest</code></td>
              </tr>
              <tr>
                <td className="p-4 font-mono text-[#E78B1F]">providerUrl</td>
                <td className="p-4 font-mono text-zinc-500">string</td>
                <td className="p-4 text-zinc-700">JSON-RPC endpoint (e.g. Infura/Ankr).</td>
              </tr>
              <tr>
                <td className="p-4 font-mono text-[#E78B1F]">autoSwitch</td>
                <td className="p-4 font-mono text-zinc-500">boolean</td>
                <td className="p-4 text-zinc-700">If true, automatically swaps USDC &rarr; MNEE using just-in-time bridge if MNEE balance is low.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
