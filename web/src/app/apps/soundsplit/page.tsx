'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useRef } from 'react';
import {
  PieChart,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle,
  Play,
  Pause,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

export default function SoundSplitHomePage() {
  const { isConnected } = useAccount();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back to Apps */}
      <Link
        href="/apps"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-[var(--split-border)] rounded-full text-sm text-[var(--split-muted)] hover:text-[var(--split-text)] hover:border-[var(--split-accent)] transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Apps
      </Link>

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-2.5 px-4 text-center">
        <p className="text-white text-sm">
          Powered by Twinkle Protocol — Trustless revenue splitting with MNEE
          <ArrowRight className="w-4 h-4 inline ml-2" />
        </p>
      </div>

      {/* Hero Section - Sequence style */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/80" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm text-[var(--split-muted)] mb-6">
                Revenue Splitting for Web3
              </p>
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] text-[var(--split-text)] mb-6">
                <span className="font-light">The </span>
                <span className="font-semibold">Split Platform</span>
                <span className="font-light"> for<br />Modern Teams</span>
              </h1>
              <p className="text-[var(--split-muted)] text-lg mb-10 leading-relaxed max-w-md">
                SoundSplit automates revenue distribution in one trustless platform.
                Create splits for bands, DAOs, and collaborators.
              </p>
              <div className="flex items-center gap-4">
                {isConnected ? (
                  <>
                    <Link
                      href="/apps/soundsplit/new"
                      className="px-6 py-3.5 bg-[var(--split-text)] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Create a split
                    </Link>
                    <Link
                      href="#demo"
                      className="px-6 py-3.5 border border-[var(--split-border)] text-[var(--split-text)] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Take a tour
                    </Link>
                  </>
                ) : (
                  <>
                    <ConnectButton label="Create a split" />
                    <Link
                      href="#demo"
                      className="px-6 py-3.5 border border-[var(--split-border)] text-[var(--split-text)] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Take a tour
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            {/* Right: Product Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="relative bg-white rounded-xl shadow-2xl shadow-indigo-500/10 border border-gray-100 overflow-hidden">
                {/* App Preview */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--split-accent)] flex items-center justify-center">
                        <PieChart className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-[var(--split-text)]">SoundSplit</span>
                    </div>
                    <span className="text-xs text-[var(--split-muted)] bg-gray-100 px-2 py-1 rounded">Dashboard</span>
                  </div>

                  {/* Split Card */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-[var(--split-text)]">Band Revenue Split</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--split-accent)] rounded-full" style={{ width: '40%' }} />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[var(--split-text)]">247 MNEE</span>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    {[
                      { addr: '0x1a2b...3c4d', pct: '40%', amt: '98.8' },
                      { addr: '0x5e6f...7g8h', pct: '35%', amt: '86.45' },
                      { addr: '0x9i0j...1k2l', pct: '25%', amt: '61.75' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-100">
                        <span className="text-sm font-mono text-[var(--split-muted)]">{r.addr}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-[var(--split-accent)] font-medium">{r.pct}</span>
                          <span className="text-sm text-[var(--split-text)]">{r.amt} MNEE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={toggleVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors group"
                >
                  <motion.div
                    className="w-14 h-14 rounded-full bg-[var(--split-accent)] flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(99,102,241,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </motion.div>
                </button>

                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--split-text)] mb-4">
              How it works
            </h2>
            <p className="text-[var(--split-muted)] max-w-lg mx-auto">
              Create trustless revenue splits in under a minute
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: '1',
                icon: PieChart,
                title: 'Create a split',
                desc: 'Add wallet addresses and set percentage shares for each recipient.',
              },
              {
                num: '2',
                icon: Wallet,
                title: 'Share the address',
                desc: 'Get a unique split address. Anyone can send MNEE payments to it.',
              },
              {
                num: '3',
                icon: Zap,
                title: 'Auto-distribute',
                desc: 'Funds are split automatically. Recipients withdraw anytime.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-indigo-50 flex items-center justify-center text-[var(--split-accent)] font-semibold">
                  {item.num}
                </div>
                <h3 className="text-lg font-semibold text-[var(--split-text)] mb-2">{item.title}</h3>
                <p className="text-[var(--split-muted)] text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases - light cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--split-text)] mb-4">
              Built for collaboration
            </h2>
            <p className="text-[var(--split-muted)]">
              From bands to DAOs, anyone can split revenue fairly
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Music & Bands', desc: 'Split streaming royalties, merch sales, and live performance revenue with bandmates.', color: 'from-pink-50 to-rose-50' },
              { title: 'DAOs & Collectives', desc: 'Distribute treasury funds, bounties, and grant money to contributors automatically.', color: 'from-indigo-50 to-blue-50' },
              { title: 'Freelance Teams', desc: 'Share project payments fairly among collaborators without manual calculations.', color: 'from-purple-50 to-violet-50' },
              { title: 'Content Creators', desc: 'Split sponsorship deals, ad revenue, and tip jar earnings with your team.', color: 'from-amber-50 to-orange-50' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className={`bg-gradient-to-br ${item.color} rounded-xl p-6 border border-white`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="font-semibold text-[var(--split-text)] mb-2">{item.title}</h3>
                <p className="text-[var(--split-muted)] text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - minimal */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-semibold text-[var(--split-text)] mb-6">
                Trustless by design
              </h2>
              <p className="text-[var(--split-muted)] mb-8 leading-relaxed">
                Smart contracts enforce every split. No middlemen, no delays,
                no trust required. Just code that works.
              </p>
              <ul className="space-y-4">
                {[
                  'Immutable splits — can\'t be changed after creation',
                  'On-chain transparency — all distributions public',
                  'Instant withdrawals — no waiting periods',
                  'Gas-efficient — optimized for low fees',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--split-accent)] mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--split-text)] text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-center">
                <p className="text-sm text-[var(--split-muted)] mb-2">Platform fee</p>
                <p className="text-6xl font-bold text-[var(--split-text)] mb-2">1%</p>
                <p className="text-[var(--split-muted)] text-sm">per distribution</p>
                <div className="mt-8 pt-6 border-t border-indigo-100">
                  <p className="text-xs text-[var(--split-muted)]">
                    No monthly fees. No setup costs.<br />Only pay when funds are distributed.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--split-text)] mb-4">
              Ready to split revenue?
            </h2>
            <p className="text-[var(--split-muted)] mb-8">
              Create your first split in under a minute. No setup fees.
            </p>
            {isConnected ? (
              <Link
                href="/apps/soundsplit/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--split-text)] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Create Split
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex justify-center">
                <ConnectButton label="Get Started" />
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
