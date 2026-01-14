'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, PieChart, Milestone, Bot, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const apps = [
  {
    id: 'unlock',
    name: 'Unlock',
    tagline: 'Monetized Pastebin',
    description: 'Paste anything, set a price, get paid.',
    icon: Lock,
    gradient: 'from-red-500/30 to-orange-500/20',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    accentColor: '#FF6B4A',
  },
  {
    id: 'patronize',
    name: 'Patronize',
    tagline: 'Creator Memberships',
    description: 'Monthly subscriptions for your supporters.',
    icon: Users,
    gradient: 'from-purple-500/30 to-pink-500/20',
    iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    accentColor: '#A855F7',
  },
  {
    id: 'soundsplit',
    name: 'SoundSplit',
    tagline: 'Revenue Sharing',
    description: 'Split earnings with collaborators automatically.',
    icon: PieChart,
    gradient: 'from-indigo-500/30 to-purple-500/20',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    accentColor: '#6366F1',
  },
  {
    id: 'milestone',
    name: 'Milestone',
    tagline: 'Project Escrow',
    description: 'Protected milestone payments with streaming.',
    icon: Milestone,
    gradient: 'from-lime-400/30 to-green-500/20',
    iconBg: 'bg-gradient-to-br from-lime-400 to-green-500',
    accentColor: '#CAFF00',
  },
  {
    id: 'agentpay',
    name: 'AgentPay',
    tagline: 'AI API Payments',
    description: 'x402 payments for autonomous agents.',
    icon: Bot,
    gradient: 'from-emerald-500/30 to-teal-500/20',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    accentColor: '#10B981',
  },
];

function AppCard({ app, index }: { app: typeof apps[0]; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      glow.style.setProperty('--glow-x', `${x}px`);
      glow.style.setProperty('--glow-y', `${y}px`);
    };

    card.addEventListener('pointermove', handlePointerMove);
    return () => card.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const Icon = app.icon;

  return (
    <motion.a
      ref={cardRef}
      href={`/apps/${app.id}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative w-[280px] aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-2xl transition-colors group-hover:border-zinc-700" />

      {/* Gradient glow that follows cursor */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${app.accentColor}15, transparent 40%)`,
        }}
      />

      {/* Static gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 p-6">
        {/* Icon */}
        <div className={`w-16 h-16 ${app.iconBg} rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-white">{app.name}</h2>

        {/* Tagline */}
        <p className="text-sm font-medium" style={{ color: app.accentColor }}>{app.tagline}</p>

        {/* Description */}
        <p className="text-xs text-zinc-500 text-center leading-relaxed">{app.description}</p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${app.accentColor}, transparent)` }}
      />
    </motion.a>
  );
}

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-4 font-[family-name:var(--font-syne)]">
              Twinkle Apps
            </h1>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Real products built on Twinkle Protocol. Each app showcases a different payment primitive.
            </p>
          </motion.div>

          {/* Apps Grid */}
          <div className="flex flex-wrap justify-center gap-6">
            {apps.map((app, i) => (
              <AppCard key={app.id} app={app} index={i} />
            ))}
          </div>

          {/* Mainnet notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center"
          >
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-[#E78B1F]">Live on Ethereum</span> — All payments use{' '}
              <a
                href="https://mnee.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E78B1F] hover:underline"
              >
                MNEE stablecoin
              </a>
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
