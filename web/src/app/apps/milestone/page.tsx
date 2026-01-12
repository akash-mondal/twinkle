'use client';

import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useRef } from 'react';
import {
  Milestone as MilestoneIcon,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Play,
  Pause,
  Lock,
  Eye,
  Wallet,
  FileCheck,
  CircleDollarSign,
  Users,
  Building2,
  Briefcase,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function MilestoneHomePage() {
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
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-[var(--milestone-border)] rounded-full text-sm text-[var(--milestone-muted)] hover:text-[var(--milestone-text)] hover:border-[var(--milestone-accent)] transition-all shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Apps
      </Link>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

        {/* Diagonal MILESTONE stripes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ minHeight: '100vh' }}>
          <div
            className="absolute animate-slide"
            style={{
              transform: 'rotate(-12deg)',
              top: '-100%',
              left: '-100%',
              right: '-100%',
              bottom: '-100%',
            }}
          >
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="whitespace-nowrap text-[140px] font-black select-none leading-[1.1]"
                style={{
                  marginLeft: i % 2 === 0 ? '0' : '-300px',
                  color: '#CAFF00',
                  WebkitTextStroke: '2px #0D1117',
                  opacity: 0.15,
                }}
              >
                MILESTONE MILESTONE MILESTONE MILESTONE MILESTONE MILESTONE MILESTONE MILESTONE
              </div>
            ))}
          </div>
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
              <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] text-[var(--milestone-text)] mb-6">
                <span className="font-semibold">Work delivered.</span>
                <br />
                <span className="font-light">Payments guaranteed.</span>
              </h1>
              <p className="text-[var(--milestone-muted)] text-lg mb-10 leading-relaxed max-w-md">
                Protected milestone payments for freelancers and clients.
                Funds held in escrow until work is approved. No more chasing invoices.
              </p>
              <div className="flex items-center gap-4">
                {isConnected ? (
                  <>
                    <Link
                      href="/apps/milestone/new"
                      className="px-6 py-3.5 bg-[var(--milestone-text)] text-[var(--milestone-accent)] rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Create Project
                    </Link>
                    <Link
                      href="#how-it-works"
                      className="px-6 py-3.5 border border-[var(--milestone-border)] text-[var(--milestone-text)] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      How it works
                    </Link>
                  </>
                ) : (
                  <>
                    <ConnectButton label="Create Project" />
                    <Link
                      href="#how-it-works"
                      className="px-6 py-3.5 border border-[var(--milestone-border)] text-[var(--milestone-text)] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      How it works
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
              <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* App Preview */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-[var(--milestone-muted)]">Project</p>
                      <p className="font-semibold text-[var(--milestone-text)]">Website Redesign</p>
                    </div>
                    <span className="text-xs text-[var(--milestone-success)] bg-green-50 px-3 py-1 rounded-full font-medium">
                      In Progress
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--milestone-muted)]">Progress</span>
                      <span className="font-medium text-[var(--milestone-text)]">2 of 4 milestones</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--milestone-accent)] rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    {[
                      { name: 'Discovery & Research', amount: '500', status: 'paid' },
                      { name: 'Wireframes', amount: '750', status: 'paid' },
                      { name: 'Visual Design', amount: '1,000', status: 'current' },
                      { name: 'Development', amount: '1,500', status: 'locked' },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          m.status === 'current'
                            ? 'border-[var(--milestone-accent)] bg-[#CAFF00]/5'
                            : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {m.status === 'paid' && (
                            <CheckCircle className="w-5 h-5 text-[var(--milestone-success)]" />
                          )}
                          {m.status === 'current' && (
                            <div className="w-5 h-5 rounded-full border-2 border-[var(--milestone-accent)] bg-[var(--milestone-accent)]/20" />
                          )}
                          {m.status === 'locked' && (
                            <Lock className="w-5 h-5 text-gray-300" />
                          )}
                          <span className={`text-sm ${m.status === 'locked' ? 'text-gray-400' : 'text-[var(--milestone-text)]'}`}>
                            {m.name}
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${m.status === 'locked' ? 'text-gray-400' : 'text-[var(--milestone-text)]'}`}>
                          {m.amount} MNEE
                        </span>
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
                    className="w-14 h-14 rounded-full bg-[var(--milestone-text)] flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-[var(--milestone-accent)]" />
                    ) : (
                      <Play className="w-5 h-5 text-[var(--milestone-accent)] ml-0.5" />
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

      {/* How it works - Timeline */}
      <section id="how-it-works" className="py-24 bg-[var(--milestone-bg-alt)]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--milestone-text)] mb-4">
              How it works
            </h2>
            <p className="text-[var(--milestone-muted)] max-w-lg mx-auto">
              A project flows through four simple stages
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200" />

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: FileCheck,
                  step: 'Create',
                  title: 'Define milestones',
                  desc: 'Break your project into milestones with clear deliverables and amounts.',
                },
                {
                  icon: Wallet,
                  step: 'Fund',
                  title: 'Client deposits',
                  desc: 'Client funds the total project amount. Held securely in smart contract escrow.',
                },
                {
                  icon: Eye,
                  step: 'Deliver',
                  title: 'Submit & approve',
                  desc: 'Complete work, submit for review. Client approves to unlock funds.',
                },
                {
                  icon: CircleDollarSign,
                  step: 'Get Paid',
                  title: 'Instant release',
                  desc: 'Approved funds transfer to your wallet immediately. No invoicing needed.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Step circle */}
                  <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center relative z-10">
                    <item.icon className="w-10 h-10 text-[var(--milestone-text)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--milestone-accent)] bg-[var(--milestone-text)] inline-block px-3 py-1 rounded-full mb-3">
                    {item.step}
                  </p>
                  <h3 className="text-lg font-semibold text-[var(--milestone-text)] mb-2">{item.title}</h3>
                  <p className="text-[var(--milestone-muted)] text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--milestone-text)] mb-4">
              Built for every project type
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Freelancers', desc: 'Web dev, design, writing, consulting' },
              { icon: Building2, title: 'Agencies', desc: 'Client projects and retainers' },
              { icon: Briefcase, title: 'Contractors', desc: 'Construction, home services' },
              { icon: Globe, title: 'Remote Teams', desc: 'Cross-border project payments' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="p-6 rounded-xl border border-[var(--milestone-border)] hover:border-[var(--milestone-accent)] hover:shadow-lg transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className="w-8 h-8 text-[var(--milestone-text)] mb-4" />
                <h3 className="font-semibold text-[var(--milestone-text)] mb-1">{item.title}</h3>
                <p className="text-sm text-[var(--milestone-muted)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24 bg-[var(--milestone-text)]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-white mb-4">
              Your money is safe
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Funds are held by smart contracts, not people
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Smart Contract Escrow',
                desc: 'Funds are locked in audited smart contracts until milestones are approved.',
              },
              {
                icon: Eye,
                title: 'On-Chain Transparency',
                desc: 'Every deposit, approval, and release is publicly verifiable on the blockchain.',
              },
              {
                icon: Zap,
                title: 'Instant Releases',
                desc: 'No waiting periods. Approved funds transfer to your wallet immediately.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--milestone-accent)]/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-[var(--milestone-accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--milestone-text)] mb-4">
              Simple pricing
            </h2>
            <p className="text-[var(--milestone-muted)] mb-12">
              No monthly fees. Only pay when projects complete.
            </p>

            <div className="inline-block bg-[var(--milestone-bg-alt)] rounded-2xl p-8 border border-[var(--milestone-border)]">
              <p className="text-6xl font-bold text-[var(--milestone-text)] mb-2">2.5%</p>
              <p className="text-[var(--milestone-muted)]">per project completion</p>
              <div className="mt-6 pt-6 border-t border-[var(--milestone-border)]">
                <ul className="space-y-2 text-sm text-[var(--milestone-text)]">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--milestone-success)]" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--milestone-success)]" />
                    Unlimited milestones
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--milestone-success)]" />
                    No setup costs
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[var(--milestone-bg-alt)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-[var(--milestone-text)] mb-4">
              Stop chasing payments.<br />
              Start delivering.
            </h2>
            <p className="text-[var(--milestone-muted)] mb-8">
              Create your first project in under a minute.
            </p>
            {isConnected ? (
              <Link
                href="/apps/milestone/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--milestone-text)] text-[var(--milestone-accent)] rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Create Project
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
