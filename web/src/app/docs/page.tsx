"use client";
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check, X, ArrowRight, Zap, RefreshCw, Smartphone, Server, Code2 } from 'lucide-react';

export default function DocsIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.1
    });

    gsap.from(".feature-card", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.3
    });
  });

  return (
    <div ref={containerRef}>
      <div className="mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E78B1F]"></span>
          <span>Twinkle Protocol v1.0</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-serif italic mb-6 leading-[1.1] text-black">
          The <span className="text-[#E78B1F]">MNEE</span> Adoption Engine.
        </h1>
        <p className="text-xl text-zinc-500 leading-relaxed max-w-3xl font-light">
          We didn't just build a payment rail. We built a <strong>liquidity migration protocol</strong> designed to capture USDC market share and convert it to MNEE volume through autonomous agent incentives.
        </p>
      </div>

      {/* STRATEGIC OVERVIEW */}
      <div className="prose prose-zinc max-w-none mb-20">
        <p className="text-lg text-zinc-800 leading-8">
          Existing solutions like <strong>Coinbase MCP</strong> behave like traditional SaaS: good for their ecosystem, bad for the open web. 
          They lock you into proprietary wallets and high-fee structures.
        </p>
        <p className="text-lg text-zinc-800 leading-8">
          <strong>Twinkle is different.</strong> We use the HTTP 402 standard to create a permissionless "Just-In-Time" bridge. 
          Agents can hold USDC, but when they hit a Twinkle paywall, our SDK automatically swaps and settles in <span className="inline-flex items-center align-middle mx-0.5"><svg width="20" height="20" viewBox="0 0 326 326" fill="none"><defs><linearGradient id="tinyMnee" x1="68" y1="278" x2="253" y2="54" gradientUnits="userSpaceOnUse"><stop stopColor="#E78B1F"/><stop offset="1" stopColor="#FFDB45"/></linearGradient></defs><path fillRule="evenodd" clipRule="evenodd" d="M217.737 172.769L217.489 115.409C217.478 112.456 216.303 109.659 214.216 107.572C212.126 105.485 209.327 104.298 206.369 104.298C203.413 104.298 200.614 105.485 198.527 107.572C196.44 109.659 195.253 112.458 195.253 115.414V210.315C195.253 218.949 191.822 227.161 185.722 233.263C179.62 239.365 171.405 242.796 162.77 242.796C154.14 242.796 145.924 239.365 139.822 233.263C133.72 227.161 130.289 218.949 130.289 210.315V115.414C130.289 112.458 129.105 109.659 127.015 107.572C124.928 105.485 122.129 104.298 119.171 104.298C116.215 104.298 113.416 105.485 111.329 107.572C109.242 109.659 108.068 112.456 108.055 115.409L107.806 172.769C106.913 179.95 103.642 186.596 98.5219 191.713C92.4198 197.815 84.2057 201.246 75.5705 201.246C66.9368 201.246 58.7227 197.815 52.6223 191.713C47.5035 186.594 44.2276 179.946 43.3378 172.762L43.0718 156.988L13.7477 156.982H0L0.109238 154.743C2.09468 114.31 18.99 76.3225 47.6111 47.7029C78.2526 17.0615 119.44 0 162.773 0C206.106 0 247.293 17.0615 277.934 47.7029C297.985 67.7537 312.519 92.7096 319.958 120.083L320.688 122.775H298.518L298.058 121.266C291.28 99.2026 279.144 79.1234 262.826 62.8076C236.203 36.1846 200.424 21.365 162.773 21.365C125.12 21.365 89.3419 36.1846 62.7189 62.8076C43.1431 82.385 29.701 107.23 24.1499 134.36L23.8903 135.621H64.4558V168.763C64.4558 171.719 65.6432 174.518 67.73 176.605C69.8168 178.695 72.6161 179.879 75.5736 179.879C78.5296 179.879 81.3289 178.692 83.4157 176.605C85.5025 174.518 86.6899 171.719 86.6899 168.763V115.412C86.6899 106.779 90.1209 98.5662 96.2229 92.4642C102.325 86.3622 110.541 82.9311 119.174 82.9311C127.808 82.9311 136.022 86.3622 142.122 92.4642C148.224 98.5662 151.656 106.78 151.656 115.412V210.313C151.656 213.269 152.843 216.069 154.93 218.155C157.017 220.242 159.817 221.429 162.773 221.429C165.729 221.429 168.529 220.242 170.617 218.155C172.704 216.069 173.89 213.269 173.89 210.313V115.412C173.89 106.779 177.321 98.5662 183.423 92.4642C189.525 86.3622 197.74 82.9311 206.374 82.9311C215.008 82.9311 223.22 86.3622 229.322 92.4642C235.424 98.5662 238.855 106.78 238.855 115.412V168.763C238.855 171.719 240.043 174.518 242.129 176.605C244.216 178.695 247.017 179.879 249.973 179.879C252.929 179.879 255.728 178.692 257.815 176.605C259.905 174.518 261.093 171.719 261.093 168.763V135.621H301.652L301.649 135.606H323.373L323.656 137.407C324.975 145.826 325.635 154.344 325.635 162.864C325.635 206.198 308.575 247.383 277.934 278.026C247.293 308.667 206.108 325.727 162.773 325.727C119.439 325.727 78.2526 308.667 47.6111 278.026C19.2607 249.674 2.39709 212.106 0.169404 172.066L0.0411671 169.814H21.4283L21.5533 171.812C23.7034 206.255 38.3219 238.52 62.7173 262.918C89.3403 289.541 125.121 304.361 162.772 304.361C200.422 304.361 236.202 289.541 262.825 262.918C289.448 236.292 304.267 200.514 304.267 162.864C304.267 161.245 304.24 159.624 304.185 158.006L304.152 156.988H282.47L282.206 172.762C281.313 179.946 278.039 186.594 272.92 191.713C266.818 197.815 258.604 201.246 249.968 201.246C241.336 201.246 233.121 197.815 227.02 191.713C221.903 186.596 218.629 179.95 217.736 172.769H217.737Z" fill="url(#tinyMnee)"/></svg></span>, earning the agent a rebate.
        </p>
      </div>

      {/* COMPARISON TABLE */}
      <section className="mb-24">
        <h2 className="text-2xl font-bold font-serif italic mb-8 border-b border-zinc-200 pb-4">Twinkle vs. The Status Quo</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <th className="p-6 w-1/3">Feature</th>
                <th className="p-6 w-1/3 text-zinc-900">Coinbase MCP / Others</th>
                <th className="p-6 w-1/3 text-[#E78B1F]">Twinkle Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              <tr>
                <td className="p-6 font-medium text-zinc-900">Liquidity Source</td>
                <td className="p-6 text-zinc-500">Locked to Native Token (USDC) only</td>
                <td className="p-6 font-bold text-black border-l-4 border-[#E78B1F] bg-[#FFFBF0]">
                  Any input (USDC) → Settles in MNEE
                  <span className="block text-[10px] font-normal text-[#E78B1F] mt-1 font-mono">JUST-IN-TIME BRIDGE</span>
                </td>
              </tr>
              <tr>
                <td className="p-6 font-medium text-zinc-900">Agent Standard</td>
                <td className="p-6 text-zinc-500">Proprietary SDKs</td>
                <td className="p-6 text-black">HTTP 402 (Open Web Standard)</td>
              </tr>
              <tr>
                <td className="p-6 font-medium text-zinc-900">On-Chain Evidence</td>
                <td className="p-6 text-zinc-500">Basic Transfer</td>
                <td className="p-6 text-black">
                  Permit2 "Witness" Data
                  <span className="block text-zinc-400 text-xs mt-1">Cryptographically binds "Reason" to "Payment"</span>
                </td>
              </tr>
              <tr>
                <td className="p-6 font-medium text-zinc-900">Gas Fees</td>
                <td className="p-6 text-zinc-500">User Pays Gas</td>
                <td className="p-6 text-black">Gasless (Relayer pays via Fee)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ADVANCED FEATURES GRID */}
      <section className="mb-24">
        <h2 className="text-2xl font-bold font-serif italic mb-8 border-b border-zinc-200 pb-4">Advanced Capabilities</h2>
        
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          
          {/* Feature 1: The Bridge */}
          <div className="feature-card h-full bg-zinc-50 p-8 rounded-2xl border border-zinc-100 relative group overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <RefreshCw className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#E78B1F]" />
              The "Vampire" Bridge
            </h3>
            <p className="text-zinc-600 mb-6 text-sm leading-6 flex-grow">
              How do we get market share from USDC? We don't ask users to switch. We ask their *agents* to switch at the moment of payment.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-300 relative border border-zinc-800 shadow-inner mt-auto">
              <div className="text-xs text-zinc-500 mb-2 border-b border-zinc-800 pb-2">src/bridge.ts</div>
              <p>⚠️ SERVICE REQUEST: 10.00 USDC</p>
              <p className="text-[#E78B1F]">💡 OPTIMIZATION FOUND: Switch to MNEE</p>
              <div className="my-2 border-t border-dashed border-zinc-700"></div>
              <p className="text-green-400">✅ Gasless Settlement</p>
              <p className="text-green-400">✅ +0.10 MNEE Rebate Applied</p>
            </div>
          </div>

          {/* Feature 2: Witness Data */}
          <div className="feature-card h-full bg-zinc-50 p-8 rounded-2xl border border-zinc-100 relative group overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smartphone className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#E78B1F]" />
              Permit2 Witness Data
            </h3>
            <p className="text-zinc-600 mb-6 text-sm leading-6 flex-grow">
              Standard payments are dumb; they don't know <em>why</em> money moved. Twinkle uses Uniswap Permit2's "Witness" feature to attach the 402 Challenge Reason to the blockchain transaction.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-xs text-zinc-300 relative border border-zinc-800 shadow-inner mt-auto">
              <div className="text-xs text-zinc-500 mb-2 border-b border-zinc-800 pb-2">src/Facilitator.ts</div>
              <p><span className="text-purple-400">const</span> witness = {'{'}</p>
              <p className="pl-4">user: <span className="text-green-400">'0xAgent...'</span>,</p>
              <p className="pl-4">reason: <span className="text-green-400">'GPT-4 API Call #8821'</span></p>
              <p>{'}'}</p>
              <p className="text-zinc-500 mt-2">// Hash validated on-chain</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA */}
      <div className="mt-20 flex justify-end">
        <a href="/docs/quickstart" className="group inline-flex items-center gap-2 text-sm font-bold text-black border-b-2 border-[#E78B1F] pb-0.5 hover:text-[#E78B1F] transition-colors">
          Start in 5 Minutes
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}
