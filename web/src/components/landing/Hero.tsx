"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";

// PAYWALL DEMO - Bloomberg/NYT premium publication style (Playfair Display font)
// PAYWALL DEMO - Unlock style (Inter/Playfair)
function PaywallDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1500); // Start typing
    const timer2 = setTimeout(() => setStep(2), 2500); // Click create
    const timer3 = setTimeout(() => setStep(3), 3000); // Success
    const timer4 = setTimeout(() => setStep(0), 6000); // Reset
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
  }, [step]);

  return (
    <div className="relative h-[360px] bg-[#FDFDFC] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

      <div className="relative p-8 h-full flex flex-col justify-center">
        <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-xl border border-gray-100 p-6 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#C41200] rounded-lg flex items-center justify-center">
              <span className="text-white font-serif italic font-bold text-xl">U</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 font-[family-name:var(--font-syne)]">Create Paste</h3>
              <p className="text-xs text-gray-500">Share content. Get paid.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
              <div className="h-20 bg-gray-50 rounded-lg border border-gray-200 p-3 text-sm text-gray-900 font-mono relative overflow-hidden">
                <span className="opacity-90">
                  {step >= 1 ? "Top 10 Crypto Analysis for 2026..." : ""}
                </span>
                {step === 1 && <span className="w-0.5 h-4 bg-[#C41200] inline-block ml-0.5 animate-pulse" />}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (MNEE)</label>
                <div className="h-9 bg-gray-50 rounded-lg border border-gray-200 px-3 flex items-center text-sm font-semibold">
                  5.00
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
                <div className="h-9 bg-gray-50 rounded-lg border border-gray-200 px-3 flex items-center text-xs text-gray-500">
                  ~100 lines
                </div>
              </div>
            </div>

            <motion.button
              animate={step === 2 ? { scale: 0.95 } : { scale: 1 }}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${step >= 2 ? "bg-gray-900 text-white" : "bg-[#C41200] text-white"}`}
            >
              {step === 2 ? "Creating..." : "Create Locked Paste"}
            </motion.button>
          </div>

          {/* Success Card Overlay */}
          <AnimatePresence>
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Paste Created!</h4>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 mt-2">
                  <code className="text-xs text-gray-600">unlock.app/p/8x92...</code>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// SUBSCRIPTION DEMO - Vibrant Patreon/Gumroad creator style (DM Sans font)
// SUBSCRIPTION DEMO - Patronize style (Dark/Purple)
function SubscriptionDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1000); // Focus inputs
    const timer2 = setTimeout(() => setStep(2), 2000); // Click create
    const timer3 = setTimeout(() => setStep(3), 2500); // Success
    const timer4 = setTimeout(() => setStep(0), 5500); // Reset
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
  }, [step]);

  return (
    <div className="relative h-[360px] bg-[#0F0F13] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />

      <div className="relative p-8 h-full flex flex-col justify-center">
        <div className="w-full max-w-sm mx-auto bg-[#18181B] rounded-xl border border-white/10 p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white text-lg">✨</span>
            </div>
            <div>
              <h3 className="font-bold text-white font-[family-name:var(--font-syne)]">New Tier</h3>
              <p className="text-xs text-white/50">Define your offering</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Plan Name</label>
              <div className={`h-10 bg-black/20 rounded-lg border px-3 flex items-center text-sm text-white transition-colors ${step >= 1 ? "border-purple-500/50" : "border-white/10"}`}>
                Premium Access
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Price (MNEE)</label>
                <div className={`h-10 bg-black/20 rounded-lg border px-3 flex items-center text-sm text-white font-mono transition-colors ${step >= 1 ? "border-purple-500/50" : "border-white/10"}`}>
                  10.00
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Billing</label>
                <div className="h-10 bg-black/20 rounded-lg border border-white/10 px-3 flex items-center text-sm text-white/80">
                  Monthly
                </div>
              </div>
            </div>

            <motion.button
              animate={step === 2 ? { scale: 0.98, opacity: 0.9 } : { scale: 1, opacity: 1 }}
              className="w-full py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-purple-500/20"
            >
              {step === 2 ? "Creating..." : "Create Plan"}
            </motion.button>
          </div>

          {/* Success Overlay */}
          <AnimatePresence>
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                className="absolute inset-0 bg-[#0F0F13]/80 z-10 flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30"
                >
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h4 className="font-bold text-white mb-1">Plan Active</h4>
                <p className="text-xs text-white/50">Ready for subscribers</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// SPLITS DEMO - Clean fintech dashboard style (Inter font)
// SPLITS DEMO - SoundSplit style (Indigo/Purple gradients)
function SplitsDemo() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(p => (p >= 100 ? 0 : p + 40));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[360px] bg-white overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-80" />

      <div className="relative p-8 h-full flex flex-col justify-center">
        <div className="bg-white rounded-xl shadow-xl shadow-indigo-500/10 border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6366F1] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 font-[family-name:var(--font-syne)]">Album Split</span>
            </div>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">Active</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Total Revenue</span>
              <span className="font-bold text-gray-900">247 MNEE</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#6366F1]"
                animate={{ width: ["0%", "40%", "40%", "100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {[
              { addr: '0x1a...4d', pct: '40%', amt: 98.8, color: "bg-indigo-500" },
              { addr: '0x5e...8h', pct: '35%', amt: 86.45, color: "bg-purple-500" },
              { addr: '0x9i...2l', pct: '25%', amt: 61.75, color: "bg-pink-500" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.color}`} />
                  <span className="text-xs font-mono text-gray-500">{r.addr}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#6366F1]">{r.pct}</span>
                  <motion.span
                    className="text-xs text-gray-900 font-medium"
                    animate={{ opacity: [0.5, 1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {r.amt} MNEE
                  </motion.span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ESCROW DEMO - Milestone/Linear style (Inter/JetBrains Mono)
function EscrowDemo() {
  const [activeMs, setActiveMs] = useState(0);
  const [streamPct, setStreamPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setActiveMs(1), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeMs === 1 && streamPct < 100) {
      const interval = setInterval(() => {
        setStreamPct(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => { setActiveMs(0); setStreamPct(0); }, 2000);
            return 100;
          }
          return p + 4;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeMs, streamPct]);

  const milestones = [
    { name: "Discovery", amount: 400, done: true },
    { name: "Design System", amount: 800, stream: true },
    { name: "Implementation", amount: 800, pending: true },
    { name: "QA & Handoff", amount: 400, pending: true },
  ];

  return (
    <div className="h-[360px] bg-white overflow-hidden relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Diagonal stripes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute inset-[-100%] rotate-[-12deg] whitespace-nowrap text-9xl font-black select-none leading-[1.1] animate-slide" style={{ color: 'black' }}>
          MILESTONE MILESTONE MILESTONE MILESTONE MILESTONE
        </div>
      </div>

      {/* Linear-style header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#CAFF00] flex items-center justify-center border border-[#CAFF00]">
            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
            </svg>
          </div>
          <span className="text-zinc-900 font-semibold text-xs tracking-tight">webapp-redesign</span>
        </div>
        <span className="text-zinc-400 text-[10px] font-medium">Acme Corp → DesignLab</span>
      </div>

      <div className="p-4 relative z-10">
        {/* Project stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-semibold">Budget</div>
            <div className="text-[#E78B1F] font-bold text-sm">2,400</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-semibold">Released</div>
            <div className="text-zinc-900 font-bold text-sm">800</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="text-zinc-400 text-[9px] uppercase tracking-wider font-semibold">Locked</div>
            <div className="text-zinc-400 font-bold text-sm">1,600</div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.name} className={`p-2.5 rounded-lg border transition-colors ${m.done
              ? 'bg-green-50/50 border-green-100'
              : m.stream && activeMs === 1
                ? 'bg-[#CAFF00]/10 border-[#CAFF00]/50 shadow-sm'
                : 'bg-white border-gray-100'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.done ? (
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                      </svg>
                    </div>
                  ) : m.stream && activeMs === 1 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#8ED600] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-200" />
                  )}
                  <span className={`text-[11px] font-medium ${m.done ? 'text-green-700' : 'text-zinc-700'}`}>{m.name}</span>
                </div>
                <span className="text-zinc-400 text-[10px] tabular-nums font-medium">{m.amount} MNEE</span>
              </div>

              {m.stream && activeMs === 1 && (
                <div className="mt-2 ml-6">
                  <div className="flex items-center justify-between text-[9px] mb-1">
                    <span className="text-zinc-500 font-medium">⚡ Streaming payment...</span>
                    <span className="text-zinc-400 font-mono">{streamPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-[#CAFF00]" style={{ width: `${streamPct}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// X402 DEMO - AgentPay style (Dark/Grid/Neon)
function X402Demo() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([
    { role: 'user', content: "What's the floor price of BAYC?" }
  ]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let mounted = true;
    const timeouts: NodeJS.Timeout[] = [];

    const runSequence = () => {
      // Reset
      setStep(0);
      setMessages([{ role: 'user', content: "What's the floor price of BAYC?" }]);

      // Step 1: Processing (after 0.5s)
      timeouts.push(setTimeout(() => {
        if (mounted) setStep(1);
      }, 500));

      // Step 2: Quote (after 2s)
      timeouts.push(setTimeout(() => {
        if (mounted) {
          setStep(2);
          setMessages(p => [...p, { role: 'assistant', content: "I can fetch that from Reservoir API. Cost: 0.1 MNEE." }]);
        }
      }, 2000));

      // Step 3: Transaction (after 4s)
      timeouts.push(setTimeout(() => {
        if (mounted) {
          setStep(3);
          setMessages(p => [...p, { role: 'transaction', content: "Sent 0.1 MNEE to 0x8a...9f" }]);
        }
      }, 4000));

      // Step 4: Result (after 5.5s)
      timeouts.push(setTimeout(() => {
        if (mounted) {
          setStep(4);
          setMessages(p => [...p, { role: 'assistant', content: "Floor Price: 12.45 ETH\n24h Volume: 245 ETH" }]);
        }
      }, 5500));

      // Loop (after 9s)
      timeouts.push(setTimeout(runSequence, 9000));
    };

    runSequence();

    return () => {
      mounted = false;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative h-[360px] bg-transparent overflow-hidden flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

      {/* Sidebar */}
      <div className="w-16 border-r border-white/10 flex flex-col items-center py-4 gap-3 relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 relative z-10 flex flex-col">
        <div className="flex-1 space-y-3">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'transaction' ? 'justify-center' : 'justify-start'}`}
            >
              {m.role === 'transaction' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {m.content}
                </div>
              ) : (
                <div className={`max-w-[80%] rounded-xl p-3 text-xs ${m.role === 'user' ? 'bg-[#00FF00] text-black font-medium' : 'bg-white/10 text-white border border-white/10'}`}>
                  {m.content}
                </div>
              )}
            </motion.div>
          ))}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2 text-xs text-white">
                <div className="w-3 h-3 border-2 border-[#00FF00] border-t-transparent rounded-full animate-spin" />
                <span>Thinking...</span>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2 text-xs text-white">
                <div className="w-3 h-3 border-2 border-[#00FF00] border-t-transparent rounded-full animate-spin" />
                <span>Processing payment...</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className={`h-10 rounded-lg border flex items-center px-3 text-xs ${step === 0 ? 'bg-white/5 border-white/20 text-white' : 'bg-black/40 border-white/5 text-white/50'}`}>
            {step === 0 ? "What's the floor price of..." : "Waiting for agent..."}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/30 uppercase tracking-wider">
            <span>AgentPay v1.0</span>
            <span>x402 Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  { id: "unlock", label: "Paywalls", Demo: PaywallDemo, link: "/apps/unlock" },
  { id: "patronize", label: "Subscriptions", Demo: SubscriptionDemo, link: "/apps/patronize" },
  { id: "soundsplit", label: "Splits", Demo: SplitsDemo, link: "/apps/soundsplit" },
  { id: "milestone", label: "Escrow", Demo: EscrowDemo, link: "/apps/milestone" },
  { id: "agentpay", label: "x402", Demo: X402Demo, link: "/apps/agentpay" },
];

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(headingRef.current?.querySelectorAll(".word") || [], { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 0.3);
      tl.fromTo(subheadingRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3");
      tl.fromTo(ctaRef.current?.children || [], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.2");
      tl.fromTo(demoRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.4");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const CurrentDemo = tabs[activeTab].Demo;

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src="/hero.png" alt="Hero background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090B]/95 via-[#09090B]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-[#09090B]/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 ref={headingRef} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-[family-name:var(--font-syne)] leading-[1.1] mb-6">
              <span className="word inline-block">Monetize</span>{" "}
              <span className="word inline-block">Anything</span>
              <br />
              <span className="word inline-block">with</span>{" "}
              <span className="word inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#E78B1F] to-[#FFDB45] tracking-wide">MNEE</span>
            </h1>
            <p ref={subheadingRef} className="text-base md:text-lg text-[#A1A1AA] max-w-md mb-8 leading-relaxed">
              Paywalls, subscriptions, escrow, and AI-ready payments for the decentralized web. Built for creators who want to own their revenue.
            </p>
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3">
              <motion.a href="#apps-showcase" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium rounded-lg transition-colors duration-200 text-center">
                Try Now
              </motion.a>
              <motion.a href="/docs" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg backdrop-blur-sm border border-white/10 transition-colors duration-200 text-center">
                Read Docs
              </motion.a>
            </div>
          </div>

          <motion.div
            ref={demoRef}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:block relative z-20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Tabs Header */}
            <div className="flex mb-4 gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`relative px-4 py-2 text-xs font-medium rounded-full transition-all whitespace-nowrap ${i === activeTab ? "bg-white text-black" : "bg-white/5 text-zinc-400 hover:text-white"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <motion.a
              href={tabs[activeTab].link}
              className="block relative group"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#A855F7]/20 to-[#6366F1]/20 rounded-3xl blur-xl transition-opacity opacity-75 group-hover:opacity-100" />
              <div className="relative rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-black/20 backdrop-blur-md">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 1.02 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <CurrentDemo />
                  </motion.div>
                </AnimatePresence>

                {/* External Link Overlay Hint */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.a>

            {/* Progress Bar */}
            {!isHovered && (
              <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  key={activeTab}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-[#A855F7] to-[#6366F1]"
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="w-6 h-10 border-2 border-[#3F3F46] rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-[#A855F7] rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
