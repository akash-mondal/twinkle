"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Users, PieChart, Milestone, Bot, ArrowRight, Sparkles } from "lucide-react";

const apps = [
  {
    id: "unlock",
    name: "Unlock",
    tagline: "Monetized Pastebin",
    description: "Paste anything. Set a price. Get paid.",
    icon: Lock,
    gradient: "from-[#C41200] to-[#FF6B4A]",
    bg: "bg-gradient-to-br from-[#FDF6E3] to-[#F5E6D3]",
    textColor: "text-[#1A1A1A]",
    status: "live",
  },
  {
    id: "patronize",
    name: "Patronize",
    tagline: "Creator Memberships",
    description: "Recurring revenue from your biggest fans.",
    icon: Users,
    gradient: "from-[#7C3AED] to-[#EC4899]",
    bg: "bg-gradient-to-br from-[#1A1A2E] to-[#2D1B4E]",
    textColor: "text-white",
    status: "live",
  },
  {
    id: "soundsplit",
    name: "SoundSplit",
    tagline: "Revenue Splits",
    description: "Fair distribution for collaborators.",
    icon: PieChart,
    gradient: "from-[#6366F1] to-[#8B5CF6]",
    bg: "bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]",
    textColor: "text-[#1E1B4B]",
    status: "live",
  },
  {
    id: "milestone",
    name: "Milestone",
    tagline: "Project Escrow",
    description: "Protected payments with streaming.",
    icon: Milestone,
    gradient: "from-[#CAFF00] to-[#8ED600]",
    bg: "bg-white border border-zinc-200",
    textColor: "text-zinc-900",
    status: "live",
  },
  {
    id: "agentpay",
    name: "AgentPay",
    tagline: "AI Payments",
    description: "x402 for autonomous agents.",
    icon: Bot,
    gradient: "from-[#00FF00] to-[#00CC00]",
    bg: "bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]",
    textColor: "text-white",
    status: "live",
  },
];

export function AppsShowcase() {
  const featuredApp = apps[0];
  const gridApps = apps.slice(1);

  return (
    <section id="apps-showcase" className="py-24 px-6 bg-[#09090B] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A855F7]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-[#A855F7]" />
            <span className="text-[#A855F7] text-sm font-medium">Live Demo Apps</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-[family-name:var(--font-syne)]">
            Try It Right Now
          </h2>
          <p className="text-[#71717A] text-lg max-w-xl mx-auto">
            Real products. Real payments. Built on Twinkle Protocol.
          </p>
        </motion.div>

        {/* Featured Live App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <Link href={`/apps/${featuredApp.id}`} className="block group">
            <div className={`relative ${featuredApp.bg} rounded-2xl p-8 md:p-12 overflow-hidden border border-white/10`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-black/20 to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${featuredApp.gradient} flex items-center justify-center shadow-lg`}>
                      <featuredApp.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      Live Now
                    </div>
                  </div>

                  <h3 className={`text-3xl md:text-4xl font-bold ${featuredApp.textColor} mb-2 font-[family-name:var(--font-syne)]`}>
                    {featuredApp.name}
                  </h3>
                  <p className={`text-xl ${featuredApp.textColor} opacity-80 mb-4`}>
                    {featuredApp.tagline}
                  </p>
                  <p className={`${featuredApp.textColor} opacity-60 max-w-md`}>
                    {featuredApp.description} Create a monetized paste in seconds, share the link, and get paid in MNEE when someone unlocks it.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${featuredApp.gradient} text-white rounded-xl font-medium shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all`}>
                    <span>Launch App</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Code preview decoration */}
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-20 font-mono text-xs hidden md:block">
                <pre className={featuredApp.textColor}>
                  {`const paste = await unlock.create({
  content: "...",
  price: "0.50 MNEE"
});`}
                </pre>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Grid Apps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gridApps.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/apps/${app.id}`} className="block h-full group">
                <div className={`relative ${app.bg} rounded-xl p-6 border border-white/5 h-full hover:scale-[1.02] transition-transform duration-300`}>
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <app.icon className={`w-5 h-5 ${app.id === 'milestone' ? 'text-zinc-900' : 'text-white'}`} />
                  </div>

                  {/* Content */}
                  <h4 className={`text-lg font-semibold ${app.textColor} mb-1 font-[family-name:var(--font-syne)]`}>
                    {app.name}
                  </h4>
                  <p className={`text-sm ${app.textColor} opacity-70 mb-2`}>
                    {app.tagline}
                  </p>
                  <p className={`text-xs ${app.textColor} opacity-50`}>
                    {app.description}
                  </p>

                  {/* Arrow hint */}
                  <div className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity ${app.textColor}`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mainnet notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#71717A]">
            <span className="text-[#E78B1F]">Live on Ethereum</span> — Payments in MNEE stablecoin.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
