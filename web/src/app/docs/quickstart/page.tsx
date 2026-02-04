"use client";
import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Zap, Server, Code2, ArrowRight } from 'lucide-react';

export default function DocsQuickstart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.1
    });
  });

  return (
    <div ref={containerRef}>
      <h1 className="text-4xl font-serif italic mb-8 flex items-center gap-3 text-black">
        <Zap className="w-8 h-8 text-[#E78B1F]" />
        Start in 5 Minutes
      </h1>
      
      <p className="text-lg text-zinc-600 mb-12">
        Twinkle is designed to be dropped into existing agents. You don't need to rewrite your wallet logic or migration scripts.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
           {/* Speed */}
           <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-100 h-full flex flex-col">
              <h3 className="text-lg font-bold text-black mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#E78B1F]" />
                1. Install the SDK
              </h3>
              <p className="text-zinc-600 mb-6 text-sm leading-6 flex-grow">
                Add the package to your agent's functionality. This is the only dependency you need.
              </p>
              <div className="bg-white p-4 rounded-lg border border-zinc-200 font-mono text-sm text-zinc-800 shadow-sm">
                npm install @twinkle/sdk
              </div>
           </div>
           
           {/* Hosting */}
           <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-100 h-full flex flex-col">
              <h3 className="text-lg font-bold text-black mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-[#E78B1F]" />
                2. Choose a Facilitator
              </h3>
              <p className="text-zinc-600 mb-6 text-sm leading-6 flex-grow">
                For instant onboarding, use our hosted high-performance relay.
                For trustless sovereignty, self-host with Docker.
              </p>
              <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm p-3 bg-white border border-zinc-200 rounded">
                    <span className="font-bold text-black">Hosted (Fastest)</span>
                    <code className="bg-zinc-100 px-2 py-1 rounded text-xs">https://tw1nkl3.rest</code>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 bg-white border border-zinc-200 rounded">
                    <div className="flex flex-col">
                      <span className="font-bold">Self-Hosted</span>
                      <a href="https://github.com" target="_blank" className="text-xs text-zinc-500 underline hover:text-[#E78B1F] mt-0.5">View Facilitator Source</a>
                    </div>
                    <code className="bg-zinc-100 px-2 py-1 rounded text-xs">docker-compose up</code>
                 </div>
              </div>
           </div>
      </div>

      <div className="bg-[#FFFBF0] border-l-4 border-[#E78B1F] p-8 rounded-r-xl">
        <h3 className="text-lg font-bold text-black mb-4">Next Steps</h3>
        <p className="text-zinc-700 mb-6 max-w-2xl">
           Now that you have the SDK, learn how to wrap your fetch calls to enable autonomous payments.
        </p>
        <a href="/docs/sdk" className="inline-flex items-center gap-2 bg-[#E78B1F] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#d67d15] transition-colors">
          Integrate the SDK
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
