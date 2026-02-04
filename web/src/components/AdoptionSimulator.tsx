"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdoptionSimulator = () => {
  const [step, setStep] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);

  const startMigration = () => {
    setIsMigrating(true);
    setTimeout(() => {
      setStep(1);
      setIsMigrating(false);
    }, 2000);
  };

  return (
    <section className="py-24 px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="badge mb-6 mx-auto">Interactive Demo</div>
        <h2 className="text-5xl md:text-7xl mb-16 text-center serif italic italic text-white">
          Universal Bridge Simulator
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Legacy Request Side */}
          <div className="glass p-8 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold flex items-center space-x-2">
                  <img src="/logos/usdc.svg" alt="USDC" className="w-4 h-4" />
                  <span>Requesting Service</span>
                </h3>
                <div className="text-2xl font-medium tracking-tight">Legacy API (v1)</div>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-zinc-400">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Service Cost</span>
                <span className="text-white font-medium">50.00 USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <span className="text-amber-500 font-medium italic">402 Payment Required</span>
              </div>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
              <p className="text-[10px] text-red-400 leading-relaxed">
                ERROR: Insufficient ETH for approval gas fees. Agent cannot settle USDC without base-layer funding.
              </p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startMigration}
              disabled={step === 1 || isMigrating}
              className="w-full btn-primary text-xs tracking-widest uppercase flex items-center justify-center space-x-2 py-4"
            >
              {isMigrating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Inject Twinkle SDK</span>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </>
              )}
            </motion.button>
          </div>

          {/* Twinkle Optimized Side */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-zinc-600 italic py-24"
                >
                  <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                  <span>Waiting for optimization trigger...</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="active"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-8 rounded-2xl border-amber-500/30 bg-amber-500/[0.02]"
                >
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-amber-500/60 mb-2 font-bold flex items-center space-x-2">
                        <img src="/logos/mnee.svg" alt="MNEE" className="w-4 h-4" />
                        <span>Optimization Active</span>
                      </h3>
                      <div className="text-2xl font-medium tracking-tight text-white">Twinkle Adoption Bridge</div>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <div className="space-y-4 mb-12">
                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className="bg-green-500/20 p-2 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 uppercase tracking-tighter">Settlement</div>
                        <div className="text-sm font-medium">Gasless MNEE Transfer</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-amber-500/20">
                      <div className="bg-amber-500/20 p-2 rounded-full">
                        <Zap className="w-4 h-4 text-amber-500 fill-current" />
                      </div>
                      <div>
                        <div className="text-xs text-amber-500 uppercase tracking-tighter">Savings</div>
                        <div className="text-sm font-medium">$12.42 Gas Saved</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 uppercase tracking-tighter">Loyalty</div>
                        <div className="text-sm font-medium">+0.50 MNEE Rebate Earned</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">Developer Earnings (5%)</div>
                    <div className="text-3xl font-bold text-white tracking-tighter">2.50 MNEE</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Background Accent */}
            <div className="absolute inset-0 bg-amber-500/5 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};
