"use client";
import React from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';

export default function DocsServer() {
  return (
    <div>
      <h1 className="text-4xl font-serif italic mb-6 flex items-center gap-3 text-black">
        <Shield className="w-8 h-8 text-[#E78B1F]" />
        TwinkleServer SDK
      </h1>
      
      <p className="text-lg text-zinc-600 mb-12">
        Middleware for monetizing APIs. It validates Permit2 signatures, verifies on-chain settlement, and manages the 402 challenge-response cycle.
      </p>

      {/* === INSTALLATION === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">1. Installation</h2>
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm relative group">
           <code className="text-zinc-300 font-mono text-sm">npm install @twinkle/server-sdk express</code>
        </div>
      </section>

      {/* === SETUP === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">2. Middleware Configuration</h2>
        <p className="text-zinc-600 mb-6">
           Configure the global payment requirements. This sets the pricing and the destination wallet for funds.
        </p>
        
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm overflow-x-auto">
<pre className="text-zinc-300 font-mono text-sm leading-relaxed">
<span className="text-purple-400">import</span> {'{'} TwinkleServer {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">'@twinkle/server-sdk'</span>;

<span className="text-purple-400">const</span> twinkle = <span className="text-purple-400">new</span> <span className="text-yellow-400">TwinkleServer</span>({'{'}
  <span className="text-zinc-500">// Price per request</span>
  price: <span className="text-green-400">'0.5'</span>,
  currency: <span className="text-green-400">'MNEE'</span>,
  
  <span className="text-zinc-500">// Your wallet address (where funds settle)</span>
  destinationAddress: <span className="text-green-400">'0xYourWallet...'</span>,
  
  <span className="text-zinc-500">// The Facilitator allowed to relay payments</span>
  facilitatorAddress: <span className="text-green-400">'0xFacilitator...'</span>
{'}'});
</pre>
        </div>
      </section>

      {/* === PROTECTING ROUTES === */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">3. Protecting Routes</h2>
        <p className="text-zinc-600 mb-6">
          Add the middleware to any Express route you want to monetize. If the request is unpaid, it will reject with 402. If paid, it proceeds to your handler.
        </p>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-sm overflow-x-auto mb-8">
<pre className="text-zinc-300 font-mono text-sm leading-relaxed">
app.get(<span className="text-green-400">'/gpt-4-query'</span>, <span className="text-blue-400">twinkle.middleware()</span>, (req, res) =&gt; {'{'}
    
    <span className="text-zinc-500">// If code reaches here, payment is guaranteed confirmed.</span>
    <span className="text-zinc-500">// The payment proof is attached to the request.</span>
    const proof = req.payment;

    res.json({'{'} answer: <span className="text-green-400">"This data was paid for."</span> {'}'});

{'}'});
</pre>
        </div>
      </section>

       {/* === FAQ === */}
       <section className="mb-24">
        <h2 className="text-2xl font-bold mb-6 text-black border-b border-zinc-200 pb-2">FAQ</h2>
        <div className="space-y-6">
           <div>
              <h3 className="font-bold text-black mb-2 flex items-center gap-2">
                 <Lock className="w-4 h-4 text-[#E78B1F]" />
                 What happens if payment fails?
              </h3>
              <p className="text-zinc-600 text-sm leading-6">
                 The middleware intercepts the invalid signature and returns `401 Unauthorized` before your code ever runs. You never have to worry about serving unpaid requests.
              </p>
           </div>
           <div>
              <h3 className="font-bold text-black mb-2 flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-[#E78B1F]" />
                 Does this support dynamic pricing?
              </h3>
              <p className="text-zinc-600 text-sm leading-6">
                 Yes. You can pass a callback function to the configuration instead of a static price string to calculate costs per-request (e.g. based on compute time).
              </p>
           </div>
        </div>
      </section>

    </div>
  );
}
