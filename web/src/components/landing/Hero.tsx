"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";

// PAYWALL DEMO - Bloomberg/NYT premium publication style (Playfair Display font)
function PaywallDemo() {
  const [unlocked, setUnlocked] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setClicking(true), 1800);
    const timer2 = setTimeout(() => { setClicking(false); setUnlocked(true); }, 2200);
    const timer3 = setTimeout(() => setUnlocked(false), 6500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [unlocked]);

  return (
    <div className="relative h-[360px] overflow-hidden" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
      {/* Newspaper style header */}
      <div className="bg-[#FDF6E3] px-4 py-2 border-b-2 border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <span className="text-[#1a1a1a] font-bold text-base tracking-tight italic">The Protocol</span>
          <span className="text-[9px] text-[#666] uppercase tracking-widest" style={{ fontFamily: "system-ui" }}>Jan 12, 2026</span>
        </div>
      </div>

      {/* Article */}
      <div className="bg-[#FDF6E3] p-4 h-full">
        <AnimatePresence mode="wait">
          {!unlocked ? (
            <motion.div key="locked" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-[#c41200] text-[8px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: "system-ui" }}>Exclusive Analysis</div>
              <h2 className="text-[#1a1a1a] text-lg font-bold leading-tight mb-2">
                Autonomous Agents Reshape Digital Commerce
              </h2>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e0d5c1]">
                <div className="w-6 h-6 rounded-full bg-[#1a1a1a]" />
                <div style={{ fontFamily: "system-ui" }}>
                  <div className="text-[#1a1a1a] text-[10px] font-medium">Eleanor Vance</div>
                  <div className="text-[#888] text-[8px]">Technology Correspondent</div>
                </div>
              </div>
              <p className="text-[#333] text-[11px] leading-relaxed">
                <span className="text-[#1a1a1a] text-xl font-bold float-left mr-1.5 leading-none">T</span>
                he emergence of payment-enabled AI agents marks a fundamental shift in how value flows through the internet...
              </p>

              {/* Paywall overlay */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FDF6E3] via-[#FDF6E3] to-transparent flex flex-col items-center justify-end pb-4">
                <div className="text-center px-4 py-3 bg-[#1a1a1a] rounded-lg mx-4">
                  <div className="text-[#FDF6E3] text-xs mb-0.5">Continue reading with Premium</div>
                  <div className="text-[#888] text-[9px] mb-2" style={{ fontFamily: "system-ui" }}>Unlimited access to analysis</div>
                  <motion.button
                    animate={clicking ? { scale: [1, 0.95, 1.05, 1], boxShadow: ["0 0 0 0 rgba(196,18,0,0)", "0 0 0 8px rgba(196,18,0,0.3)", "0 0 0 0 rgba(196,18,0,0)"] } : {}}
                    transition={{ duration: 0.4 }}
                    className="px-4 py-1.5 bg-[#c41200] text-white text-[10px] font-medium rounded"
                    style={{ fontFamily: "system-ui" }}
                  >
                    Unlock · 0.25 MNEE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#e8f5e9] rounded text-[9px] text-[#2e7d32]" style={{ fontFamily: "system-ui" }}>
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Unlocked
                </div>
                <span className="text-[8px] text-[#888]" style={{ fontFamily: "system-ui" }}>5 min read</span>
              </div>
              <h2 className="text-[#1a1a1a] text-base font-bold leading-tight mb-2">
                Autonomous Agents Reshape Digital Commerce
              </h2>
              <p className="text-[#333] text-[10px] leading-relaxed mb-2">
                <span className="text-[#1a1a1a] text-lg font-bold float-left mr-1 leading-none">T</span>
                he emergence of payment-enabled AI agents marks a fundamental shift in how value flows through the internet. Unlike traditional automated systems, these agents can negotiate, transact, and access premium resources autonomously.
              </p>
              <p className="text-[#333] text-[10px] leading-relaxed mb-2">
                Major technology firms are racing to integrate payment rails into their AI offerings. The x402 protocol has emerged as the leading standard, enabling seamless micropayments between machines.
              </p>
              <p className="text-[#333] text-[10px] leading-relaxed">
                &quot;We&apos;re witnessing the birth of an entirely new economic layer,&quot; says Dr. Sarah Chen, head of AI research at Stanford. &quot;Agents will handle 40% of all transactions by 2028.&quot;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// SUBSCRIPTION DEMO - Vibrant Patreon/Gumroad creator style (DM Sans font)
function SubscriptionDemo() {
  const [tier, setTier] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setClicking(true), 1500);
    const timer2 = setTimeout(() => { setClicking(false); setTier("pro"); }, 1900);
    const timer3 = setTimeout(() => setTier(null), 5200);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [tier]);

  return (
    <div className="relative h-[360px] bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Decorative shapes */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-20 left-5 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl" />

      <div className="relative p-4">
        {/* Creator card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl">
              🎨
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Studio Chromatic</h3>
              <p className="text-white/70 text-[10px]">Digital Art & Motion Design</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-white/30 border border-white/50" />
                  ))}
                </div>
                <span className="text-white/60 text-[8px] ml-1">2.4k members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="space-y-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white/60 text-[9px]">Free</span>
                <div className="text-white text-xs font-medium">Community Access</div>
              </div>
              <div className="text-white/50 text-[9px]">Public posts</div>
            </div>
          </div>

          <motion.div
            animate={{
              borderColor: tier === "pro" ? "#facc15" : "rgba(255,255,255,0.2)",
              backgroundColor: tier === "pro" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.1)",
            }}
            className="rounded-lg p-2.5 border-2 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-[9px] font-bold">⭐ PRO</span>
                  <span className="text-white font-bold text-sm">8 MNEE/mo</span>
                </div>
                <div className="text-white/80 text-[10px]">Tutorials + Source Files + Discord</div>
              </div>
              {!tier && (
                <motion.button
                  animate={clicking ? { scale: [1, 0.9, 1.1, 1], boxShadow: ["0 0 0 0 rgba(250,204,21,0)", "0 0 0 10px rgba(250,204,21,0.4)", "0 0 0 0 rgba(250,204,21,0)"] } : {}}
                  transition={{ duration: 0.4 }}
                  className="px-3 py-1.5 bg-yellow-400 text-[#1a1a1a] text-[9px] font-bold rounded-lg"
                >
                  Join
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {tier && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-3 bg-white rounded-lg p-3 text-center shadow-xl"
          >
            <div className="text-xl mb-0.5">🎉</div>
            <div className="text-[#1a1a1a] font-bold text-xs">Welcome to Pro!</div>
            <div className="text-[#666] text-[9px]">Your 7-day trial has started</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// SPLITS DEMO - Clean fintech dashboard style (Inter font)
function SplitsDemo() {
  const [distributed, setDistributed] = useState(false);
  const [amounts, setAmounts] = useState([0, 0, 0]);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setClicking(true), 1500);
    const timer2 = setTimeout(() => {
      setClicking(false);
      setDistributed(true);
      const final = [637.50, 382.50, 255.00];
      let frame = 0;
      const animate = () => {
        frame++;
        if (frame <= 20) {
          setAmounts(final.map(f => (f / 20) * frame));
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, 1900);
    const timer3 = setTimeout(() => {
      setDistributed(false);
      setAmounts([0, 0, 0]);
    }, 5500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [distributed]);

  const recipients = [
    { name: "Riverstone Studios", pct: 50, color: "#6366f1" },
    { name: "Apex Recordings", pct: 30, color: "#8b5cf6" },
    { name: "Mixdown Labs", pct: 20, color: "#a855f7" },
  ];

  return (
    <div className="relative h-[360px] bg-[#fafafa] overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Minimal header */}
      <div className="px-4 py-2 border-b border-[#eee] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#6366f1] to-[#a855f7]" />
          <span className="text-[#1a1a1a] font-semibold text-xs">SplitFlow</span>
        </div>
        <span className="text-[#888] text-[9px]">Album Revenue Split</span>
      </div>

      <div className="p-3">
        {/* Amount card */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-[#eee] mb-3">
          <div className="text-[#888] text-[9px] uppercase tracking-wide mb-0.5">Total Revenue</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#1a1a1a] text-2xl font-bold tabular-nums">1,275.00</span>
            <span className="text-[#E78B1F] text-xs font-medium">MNEE</span>
          </div>
          <div className="text-[#888] text-[9px] mt-0.5">&quot;Midnight Sessions&quot; EP · Q4 2025</div>
        </div>

        {/* Recipients */}
        <div className="space-y-1.5">
          {recipients.map((r, i) => (
            <div key={r.name} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#eee]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-semibold" style={{ backgroundColor: r.color }}>
                {r.pct}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#1a1a1a] text-[10px] font-medium truncate">{r.name}</div>
                {distributed && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} className="h-0.5 rounded-full mt-0.5" style={{ backgroundColor: r.color }} />
                )}
              </div>
              <div className="text-right">
                {distributed ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#1a1a1a] text-xs font-semibold tabular-nums">
                    +{amounts[i].toFixed(2)}
                  </motion.span>
                ) : (
                  <span className="text-[#888] text-[10px] tabular-nums">{(1275 * r.pct / 100).toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {!distributed && (
          <motion.button
            animate={clicking ? { scale: [1, 0.95, 1.02, 1], boxShadow: ["0 0 0 0 rgba(26,26,26,0)", "0 0 0 8px rgba(26,26,26,0.2)", "0 0 0 0 rgba(26,26,26,0)"] } : {}}
            transition={{ duration: 0.4 }}
            className="w-full mt-2.5 py-2 bg-[#1a1a1a] text-white text-[10px] font-medium rounded-lg"
          >
            Distribute Now
          </motion.button>
        )}

        {distributed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 text-center text-[#22c55e] text-[10px] font-medium">
            ✓ Distributed to 3 recipients
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ESCROW DEMO - Project management tool style (JetBrains Mono font)
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
    <div className="h-[360px] bg-[#0d1117] overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Linear-style header */}
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#238636] flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
            </svg>
          </div>
          <span className="text-[#c9d1d9] text-[10px]">webapp-redesign</span>
        </div>
        <span className="text-[#8b949e] text-[8px]">Acme Corp → DesignLab</span>
      </div>

      <div className="p-3">
        {/* Project stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div className="bg-[#161b22] rounded p-2 border border-[#30363d]">
            <div className="text-[#8b949e] text-[8px] uppercase">Budget</div>
            <div className="text-[#E78B1F] font-bold text-sm">2,400</div>
          </div>
          <div className="bg-[#161b22] rounded p-2 border border-[#30363d]">
            <div className="text-[#8b949e] text-[8px] uppercase">Released</div>
            <div className="text-[#238636] font-bold text-sm">800</div>
          </div>
          <div className="bg-[#161b22] rounded p-2 border border-[#30363d]">
            <div className="text-[#8b949e] text-[8px] uppercase">Locked</div>
            <div className="text-[#c9d1d9] font-bold text-sm">1,600</div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-1">
          {milestones.map((m) => (
            <div key={m.name} className={`p-2 rounded border ${m.done ? 'bg-[#238636]/10 border-[#238636]/30' : 'bg-[#161b22] border-[#30363d]'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {m.done ? (
                    <svg className="w-3 h-3 text-[#238636]" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                    </svg>
                  ) : m.stream && activeMs === 1 ? (
                    <div className="w-3 h-3 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-[#30363d]" />
                  )}
                  <span className={`text-[10px] ${m.done ? 'text-[#238636]' : 'text-[#c9d1d9]'}`}>{m.name}</span>
                </div>
                <span className="text-[#8b949e] text-[9px]">{m.amount}</span>
              </div>
              {m.stream && activeMs === 1 && (
                <div className="mt-1.5 ml-4">
                  <div className="flex items-center justify-between text-[8px] mb-0.5">
                    <span className="text-[#a855f7]">⚡ Sablier stream</span>
                    <span className="text-[#8b949e]">{streamPct}%</span>
                  </div>
                  <div className="h-1 bg-[#30363d] rounded-full">
                    <motion.div className="h-full bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full" style={{ width: `${streamPct}%` }} />
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

// X402 DEMO - Retro terminal/cyberpunk style (Space Mono font)
let logIdCounter = 0;
function X402Demo() {
  const [logs, setLogs] = useState<{ id: number; text: string; type: string }[]>([]);

  useEffect(() => {
    const addLog = (text: string, type: string) => {
      logIdCounter++;
      const id = logIdCounter;
      setLogs(prev => [...prev.slice(-6), { id, text, type }]);
    };

    addLog("Agent initialized: research-bot-v3", "system");

    const interval = setInterval(() => {
      const apis = ["arxiv.org/api", "news.api/headlines", "market.data/live", "scholar.api/search"];
      const api = apis[Math.floor(Math.random() * apis.length)];
      const cost = (Math.random() * 0.03 + 0.005).toFixed(4);

      addLog(`GET ${api} [402] → paying ${cost} MNEE...`, "request");
      setTimeout(() => {
        addLog(`✓ ${api} [200 OK]`, "success");
      }, 600);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[360px] bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: "'Space Mono', monospace" }}>
      {/* CRT-style header */}
      <div className="px-3 py-1.5 bg-[#00ff00]/10 border-b border-[#00ff00]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
          <span className="text-[#00ff00] text-[10px]">x402-agent-terminal</span>
        </div>
        <span className="text-[#00ff00]/60 text-[9px]">session:7f3a9b2</span>
      </div>

      {/* Stats bar */}
      <div className="px-3 py-1.5 border-b border-[#222] grid grid-cols-3 gap-3">
        <div>
          <div className="text-[#666] text-[7px] uppercase">Status</div>
          <div className="text-[#00ff00] text-[10px]">● ACTIVE</div>
        </div>
        <div>
          <div className="text-[#666] text-[7px] uppercase">Requests</div>
          <div className="text-[#00ff00] text-[10px]">{logs.filter(l => l.type === "success").length * 2 + 12}</div>
        </div>
        <div>
          <div className="text-[#666] text-[7px] uppercase">Spent</div>
          <div className="text-[#E78B1F] text-[10px]">{(logs.filter(l => l.type === "success").length * 0.015 + 0.156).toFixed(3)} MNEE</div>
        </div>
      </div>

      {/* Terminal output */}
      <div className="p-3 space-y-0.5">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`text-[9px] leading-relaxed ${
                log.type === "system" ? "text-[#666]" :
                log.type === "success" ? "text-[#00ff00]" :
                "text-[#888]"
              }`}
            >
              <span className="text-[#444] mr-1.5">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
              {log.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[#00ff00] text-[9px]">→</span>
          <div className="w-1.5 h-2.5 bg-[#00ff00] animate-pulse" />
        </div>
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
    </div>
  );
}

const tabs = [
  { id: "paywalls", label: "Paywalls", Demo: PaywallDemo },
  { id: "subscriptions", label: "Subscriptions", Demo: SubscriptionDemo },
  { id: "splits", label: "Splits", Demo: SplitsDemo },
  { id: "escrow", label: "Escrow", Demo: EscrowDemo },
  { id: "x402", label: "X402", Demo: X402Demo },
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
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(headingRef.current?.querySelectorAll(".word") || [], { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 0.3);
      tl.fromTo(subheadingRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3");
      tl.fromTo(ctaRef.current?.children || [], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.2");
      tl.fromTo(demoRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, "-=0.4");
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
              <motion.a href="/dashboard" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium rounded-lg transition-colors duration-200 text-center">
                Start Building
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
            className="hidden lg:block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex mb-3 gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(i)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${i === activeTab ? "bg-white/10 text-white" : "text-[#71717A] hover:text-[#A1A1AA]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#A855F7]/20 to-[#6366F1]/20 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-white/10 shadow-[0_0_60px_rgba(168,85,247,0.1)] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CurrentDemo />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {!isHovered && (
              <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  key={activeTab}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 7, ease: "linear" }}
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
