'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Plus, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useMyPastes } from '@/hooks/usePastes';

export default function UnlockHomePage() {
  const { address, isConnected } = useAccount();
  const { pastes: myPastes, isLoading } = useMyPastes(address);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/apps/unlock/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  // Show only latest 3 pastes
  const recentPastes = myPastes.slice(0, 3);

  // If connected and has pastes, show dashboard view
  if (isConnected && !isLoading && recentPastes.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold text-[var(--unlock-text)]"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              Welcome Back
            </h1>
            <p className="text-[var(--unlock-muted)]">
              You have {myPastes.length} paste{myPastes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/apps/unlock/new"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Paste
          </Link>
        </div>

        {/* Recent Pastes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold text-[var(--unlock-text)]"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              Recent Pastes
            </h2>
            <Link
              href="/apps/unlock/my"
              className="text-sm text-[var(--unlock-accent)] hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPastes.map((paste, i) => (
              <motion.div
                key={paste.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-[var(--unlock-border)] rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-[var(--unlock-text)] truncate"
                      style={{ fontFamily: 'var(--font-unlock-heading)' }}
                    >
                      {paste.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-[var(--unlock-muted)]">
                      {paste.price} MNEE • {new Date(paste.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(paste.id)}
                      className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                      title="Copy link"
                    >
                      {copiedId === paste.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--unlock-muted)]" />
                      )}
                    </button>
                    <Link
                      href={`/apps/unlock/${paste.id}`}
                      className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                      title="View"
                    >
                      <ExternalLink className="w-4 h-4 text-[var(--unlock-muted)]" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-[var(--unlock-accent)]/5 border border-[var(--unlock-accent)]/20 rounded-lg p-6">
          <h3 className="font-semibold text-[var(--unlock-text)] mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-[var(--unlock-muted)]">
            <li>• Share your paste links on social media to reach more buyers</li>
            <li>• Set competitive prices - start low and increase based on demand</li>
            <li>• Use descriptive titles to attract more unlocks</li>
          </ul>
        </div>
      </div>
    );
  }

  // Loading state
  if (isConnected && isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--unlock-muted)]" />
        <p className="mt-4 text-[var(--unlock-muted)]">Loading...</p>
      </div>
    );
  }

  // Default: Marketing landing page (Craft-inspired)
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Main Headline */}
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] leading-[1.1] tracking-tight text-[var(--unlock-text)] mb-6">
            <span
              className="block font-bold"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              PASTE. PRICE.
            </span>
            <span
              className="block font-normal italic"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              GET PAID.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[var(--unlock-muted)] mb-10 max-w-lg mx-auto">
            Paste anything. Set a price. Get paid instantly in MNEE.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isConnected ? (
              <>
                <Link
                  href="/apps/unlock/new"
                  className="w-full sm:w-auto px-8 py-4 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-all text-center"
                >
                  Create Paste
                </Link>
                <Link
                  href="/apps/unlock/my"
                  className="w-full sm:w-auto px-8 py-4 border-2 border-[var(--unlock-text)] text-[var(--unlock-text)] rounded-lg font-medium hover:bg-[var(--unlock-text)] hover:text-white transition-all text-center"
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <ConnectButton label="Create Paste" />
            )}
          </div>
        </motion.div>

        {/* Value Proposition Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl md:text-2xl leading-relaxed text-[var(--unlock-text)] max-w-4xl mx-auto text-center"
          style={{ fontFamily: 'var(--font-unlock-heading)' }}
        >
          The best ideas deserve to be paid for. Whether it&apos;s code, guides, research, or exclusive content—
          Unlock lets you monetize anything you can paste, with instant crypto payments and zero middlemen.
        </motion.p>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-[var(--unlock-text)] text-center mb-8"
            style={{ fontFamily: 'var(--font-unlock-heading)' }}
          >
            See It In Action
          </h2>

          {/* Video Container with Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--unlock-border)] shadow-2xl">
            {/* Realistic Thumbnail - App Preview */}
            <div className="absolute inset-0 bg-[#1a1a1a]">
              {/* Fake Browser Chrome */}
              <div className="h-8 bg-[#2d2d2d] flex items-center px-3 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-[#1a1a1a] rounded px-3 py-1 text-xs text-gray-400 text-center">
                    unlock.twinkle.app/new
                  </div>
                </div>
              </div>

              {/* App Content Preview */}
              <div className="p-6 md:p-10 h-[calc(100%-2rem)] flex gap-6">
                {/* Left: Editor */}
                <div className="flex-1 bg-[#fdf6e3] rounded-lg p-4 overflow-hidden">
                  <div className="text-xs text-[#93a1a1] mb-3 font-mono">// Your premium content</div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="text-[#268bd2]">const <span className="text-[#b58900]">secretAPI</span> = {'{'}</div>
                    <div className="text-[#657b83] pl-4">endpoint: <span className="text-[#2aa198]">&quot;https://api...&quot;</span>,</div>
                    <div className="text-[#657b83] pl-4">key: <span className="text-[#2aa198]">&quot;sk_live_...&quot;</span>,</div>
                    <div className="text-[#657b83] pl-4">// More secrets...</div>
                    <div className="text-[#268bd2]">{'}'}</div>
                  </div>
                  {/* Blur overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-1/2 h-32 bg-gradient-to-t from-[#fdf6e3] to-transparent" />
                </div>

                {/* Right: Price Card */}
                <div className="w-48 md:w-64 flex flex-col gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <div className="text-xs text-gray-500 mb-1">Price</div>
                    <div className="text-2xl font-bold text-[#C41200]">5 MNEE</div>
                  </div>
                  <div className="bg-[#C41200] text-white rounded-lg p-4 text-center font-medium shadow-lg">
                    Create Paste
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    Share link & earn instantly
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button Overlay */}
            <button
              onClick={toggleVideo}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-[var(--unlock-accent)] flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </motion.div>
            </button>

            {/* Video (hidden until played) */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
              onEnded={() => setIsPlaying(false)}
            >
              {/* <source src="/videos/unlock-demo.mp4" type="video/mp4" /> */}
            </video>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Paywall Anything',
              description: 'Code snippets, articles, guides, research papers, tutorials—if you can paste it, you can monetize it.',
            },
            {
              title: 'Instant Payments',
              description: 'Get paid directly to your wallet the moment someone unlocks. No waiting, no intermediaries.',
            },
            {
              title: 'Share Anywhere',
              description: 'Get a unique link in seconds. Share on Twitter, Discord, email—wherever your audience is.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center md:text-left"
            >
              <h3
                className="text-xl font-bold text-[var(--unlock-text)] mb-3"
                style={{ fontFamily: 'var(--font-unlock-heading)' }}
              >
                {feature.title}
              </h3>
              <p className="text-[var(--unlock-muted)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-lg text-[var(--unlock-muted)] mb-6">
            Only <span className="text-[#E78B1F] font-medium">2.5% platform fee</span>. Payments in{' '}
            <a
              href="https://mnee.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E78B1F] underline hover:no-underline"
            >
              MNEE stablecoin
            </a>
            .
          </p>
          {!isConnected && (
            <div className="flex justify-center">
              <ConnectButton label="Get Started" />
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
