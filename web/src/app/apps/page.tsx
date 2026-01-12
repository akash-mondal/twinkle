'use client';

import { motion } from 'framer-motion';
import { Lock, Users, PieChart, Milestone, Bot, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const apps = [
  {
    id: 'unlock',
    name: 'Unlock',
    tagline: 'Monetized Pastebin',
    description: 'Paste anything, set a price, get paid.',
    icon: Lock,
    color: '#C41200',
    bg: '#FDF6E3',
    status: 'live',
  },
  {
    id: 'patronize',
    name: 'Patronize',
    tagline: 'Creator Memberships',
    description: 'Monthly subscriptions for your supporters.',
    icon: Users,
    color: '#7C3AED',
    bg: '#1A1A2E',
    status: 'live',
  },
  {
    id: 'soundsplit',
    name: 'SoundSplit',
    tagline: 'Revenue Sharing',
    description: 'Split earnings with collaborators automatically.',
    icon: PieChart,
    color: '#6366F1',
    bg: '#FAFAFA',
    status: 'live',
  },
  {
    id: 'milestone',
    name: 'Milestone',
    tagline: 'Project Escrow',
    description: 'Protected milestone payments with streaming.',
    icon: Milestone,
    color: '#CAFF00',
    bg: '#0D1117',
    status: 'live',
  },
  {
    id: 'agentpay',
    name: 'AgentPay',
    tagline: 'AI API Payments',
    description: 'x402 payments for autonomous agents.',
    icon: Bot,
    color: '#10B981',
    bg: '#0B1120',
    status: 'live',
  },
];

export default function AppsPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#71717A] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-4 font-[family-name:var(--font-syne)]">
            Twinkle Apps
          </h1>
          <p className="text-[#71717A] text-lg">
            Real products built on Twinkle Protocol. Each app showcases a different payment primitive.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app, i) => (
            <motion.a
              key={app.id}
              href={app.status === 'live' ? `/apps/${app.id}` : '#'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group relative bg-[#18181B] border border-[#27272A] rounded-xl p-6 hover:border-[#3F3F46] transition-colors ${
                app.status === 'coming' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {/* Status badge */}
              {app.status === 'live' && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                  Live
                </div>
              )}
              {app.status === 'coming' && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-[#27272A] text-[#71717A] text-xs font-medium rounded">
                  Coming Soon
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${app.color}20` }}
              >
                <app.icon className="w-6 h-6" style={{ color: app.color }} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-1">{app.name}</h3>
              <p className="text-sm text-[#A855F7] mb-2">{app.tagline}</p>
              <p className="text-sm text-[#71717A]">{app.description}</p>

              {/* Color preview bar */}
              <div
                className="mt-4 h-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: app.color }}
              />
            </motion.a>
          ))}
        </div>

        {/* Mainnet notice */}
        <div className="mt-12 p-4 bg-[#27272A] border border-[#3F3F46] rounded-lg text-center">
          <p className="text-sm text-[#A1A1AA]">
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
        </div>
      </div>
    </div>
  );
}
