'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useRef } from 'react';
import {
  Heart,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Shield,
  Globe,
  Zap,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAllPlans } from '@/hooks/usePlans';

export default function PatronizeHomePage() {
  const { isConnected } = useAccount();
  const { plans } = useAllPlans();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const formatInterval = (days: number) => {
    if (days === 1) return '/day';
    if (days === 7) return '/week';
    if (days === 30) return '/month';
    if (days === 365) return '/year';
    return `/${days} days`;
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--patronize-bg)] snap-y snap-mandatory overflow-y-auto h-screen"
    >
      {/* Back to Apps */}
      <Link
        href="/apps"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--patronize-bg-light)]/90 backdrop-blur-sm border border-[var(--patronize-border)] rounded-full text-sm text-[var(--patronize-muted)] hover:text-[var(--patronize-text)] hover:border-[var(--patronize-accent)] transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Apps
      </Link>

      {/* Hero Section - Split layout with video */}
      <section className="relative h-screen snap-start overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop"
            alt="Creators collaborating"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay - stronger for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>

        {/* Content - Split layout */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Title + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.95] text-white mb-6">
              <span className="block font-light italic">Create</span>
              <span className="block font-light italic text-[var(--patronize-accent-light)]">on your terms</span>
            </h1>
            <p className="text-white/80 max-w-md text-lg mb-8">
              Build recurring revenue from your biggest supporters.
              No algorithms, no ads—just direct connection with your community.
            </p>
            <div className="flex items-center gap-4">
              {isConnected ? (
                <Link
                  href="/apps/patronize/new"
                  className="px-8 py-4 bg-[var(--patronize-accent)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Create on Patronize
                </Link>
              ) : (
                <ConnectButton label="Get Started" />
              )}
            </div>
          </motion.div>

          {/* Right: Video Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {/* Browser Chrome */}
              <div className="absolute inset-0 bg-[#1a1a2e]">
                <div className="h-8 bg-[#25253D] flex items-center px-3 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-[#1a1a2e] rounded px-3 py-1 text-xs text-[var(--patronize-muted)] text-center">
                      patronize.twinkle.app/new
                    </div>
                  </div>
                </div>

                {/* App Content Preview */}
                <div className="p-4 h-[calc(100%-2rem)]">
                  <div className="max-w-sm mx-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">Create Subscription Plan</h3>

                    <div className="mb-3">
                      <label className="block text-xs text-[var(--patronize-muted)] mb-1">Plan Name</label>
                      <div className="bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded px-3 py-2 text-sm text-white">
                        Premium Membership
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-[var(--patronize-muted)] mb-1">Price</label>
                        <div className="bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded px-3 py-2 text-sm text-white">
                          10 MNEE
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--patronize-muted)] mb-1">Billing</label>
                        <div className="bg-[var(--patronize-bg-light)] border border-[var(--patronize-border)] rounded px-3 py-2 text-sm text-white">
                          Monthly
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--patronize-accent)] text-white rounded py-2.5 text-center text-sm font-medium">
                      Create Plan
                    </div>
                  </div>
                </div>
              </div>

              {/* Play Button Overlay */}
              <button
                onClick={toggleVideo}
                className="absolute inset-0 flex items-center justify-center group bg-black/20 hover:bg-black/30 transition-colors"
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-[var(--patronize-accent)] flex items-center justify-center shadow-xl"
                  whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(124,58,237,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" />
                  )}
                </motion.div>
              </button>

              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                onEnded={() => setIsPlaying(false)}
              >
                {/* <source src="/videos/patronize-demo.mp4" type="video/mp4" /> */}
              </video>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Showcase your work - Full screen with fade */}
      <section className="relative h-screen snap-start overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-[var(--patronize-accent)]" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[clamp(2.5rem,6vw,5rem)] leading-[1] text-white mb-6">
              <span className="block font-light">Showcase</span>
              <span className="block font-light italic">your work</span>
            </h2>
            <p className="text-white/80 text-xl max-w-md">
              Easily highlight your most popular content, organize your offerings,
              and curate collections for your subscribers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <div className="w-10 h-10 rounded-full bg-[var(--patronize-accent)]" />
                <div>
                  <p className="font-semibold text-gray-900">Your Creator Page</p>
                  <p className="text-xs text-gray-500">patronize.twinkle.app/you</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop"
                    alt="Creator content"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">142</p>
                    <p className="text-xs text-gray-500">Subscribers</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--patronize-accent)]">1.2K</p>
                    <p className="text-xs text-gray-500">MNEE Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: "Starting is free" - Full screen */}
      <section className="relative h-screen snap-start overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1920&h=1080&fit=crop"
            alt="Creator at work"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] text-white mb-8">
              <span className="block font-light italic">Starting a</span>
              <span className="block font-light italic">Patronize is</span>
              <span className="block font-bold">free</span>
            </h2>
            <p className="text-white/70 max-w-lg text-xl">
              Access tools to share work directly with your fans.
              Introduce paid options when you&apos;re ready.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Pricing - Full screen */}
      <section className="relative h-screen snap-start overflow-hidden bg-gradient-to-b from-blue-50 to-white flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[clamp(2.5rem,6vw,4rem)] font-light text-gray-900 mb-4">
              Simple pricing
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto text-lg">
              Only pay based on what you earn.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Plan */}
            <motion.div
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-4">
                Standard
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-bold text-gray-900">2.5%</span>
                <span className="text-gray-500">of earnings</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited subscribers',
                  'Custom subscription tiers',
                  'Direct crypto payments',
                  'Real-time analytics',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-[var(--patronize-accent)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isConnected ? (
                <Link
                  href="/apps/patronize/new"
                  className="block w-full py-4 bg-gray-900 text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Create on Patronize
                </Link>
              ) : (
                <div className="flex justify-center">
                  <ConnectButton label="Get Started" />
                </div>
              )}
            </motion.div>

            {/* Why Low Fees */}
            <motion.div
              className="bg-[var(--patronize-bg)] rounded-2xl p-8 text-white shadow-lg"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-2xl font-semibold mb-4">Why just 2.5%?</h3>
              <p className="text-white/70 mb-6">
                Blockchain payments cut out intermediaries. We pass the savings to you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[var(--patronize-accent-light)]" />
                  </div>
                  <div>
                    <p className="font-medium">Instant settlements</p>
                    <p className="text-sm text-white/60">No waiting for payouts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[var(--patronize-accent-light)]" />
                  </div>
                  <div>
                    <p className="font-medium">Global by default</p>
                    <p className="text-sm text-white/60">Accept payments worldwide</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[var(--patronize-accent-light)]" />
                  </div>
                  <div>
                    <p className="font-medium">You own your data</p>
                    <p className="text-sm text-white/60">On-chain, transparent, yours</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 5: Features - Full screen */}
      <section className="relative h-screen snap-start overflow-hidden bg-white flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm uppercase tracking-wider text-[var(--patronize-accent)] mb-4">Powered by Twinkle</p>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-light text-gray-900">
              Everything you need
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: 'Trusted payments', desc: 'Battle-tested smart contracts' },
              { icon: CreditCard, title: 'MNEE stablecoin', desc: 'Stable value, low fees' },
              { icon: RefreshCw, title: 'Auto-renewals', desc: 'Automatic billing cycles' },
              { icon: Users, title: 'Unlimited subscribers', desc: 'Scale without limits' },
              { icon: Zap, title: 'Instant access', desc: 'Immediate on payment' },
              { icon: TrendingUp, title: 'Real-time analytics', desc: 'Live dashboards' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <feature.icon className="w-8 h-8 text-[var(--patronize-accent)] mb-4" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Final CTA - Full screen */}
      <section className="relative h-screen snap-start overflow-hidden bg-[var(--patronize-bg)] flex items-center justify-center">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[clamp(2.5rem,8vw,5rem)] font-light text-white mb-6 leading-tight">
            Ready to build<br />
            <span className="italic text-[var(--patronize-accent-light)]">your community?</span>
          </h2>
          <p className="text-[var(--patronize-muted)] mb-10 text-lg max-w-md mx-auto">
            Join creators earning recurring revenue with Patronize.
          </p>
          {isConnected ? (
            <Link
              href="/apps/patronize/new"
              className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--patronize-accent)] text-white rounded-full font-medium hover:opacity-90 transition-opacity text-lg"
            >
              Create Your Page
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="flex justify-center">
              <ConnectButton label="Connect to Start" />
            </div>
          )}
        </motion.div>
      </section>

      {/* Browse Plans - Optional scrollable section */}
      {plans.length > 0 && (
        <section className="py-24 bg-gray-50 snap-start">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Browse Creators</h2>
              <Link href="/apps/patronize/explore" className="text-[var(--patronize-accent)] hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.slice(0, 6).map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/apps/patronize/${plan.id}`}
                    className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-[var(--patronize-accent)]/20 to-[var(--patronize-accent)]/5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="w-12 h-12 text-[var(--patronize-accent)]/30" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[var(--patronize-accent)] transition-colors">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xl font-bold text-[var(--patronize-accent)]">{plan.price}</span>
                        <span className="text-gray-500 text-sm">MNEE{formatInterval(plan.intervalDays)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
