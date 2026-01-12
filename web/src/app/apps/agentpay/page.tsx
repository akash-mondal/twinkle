'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  Loader2,
  X,
  Wallet,
  Zap,
  CheckCircle2,
  Circle,
  Bot,
  Database,
  CreditCard,
  Server,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { dataSources } from './data/sources';
import { DataSourceTile } from './components/DataSourceTile';
import { ConnectionLayer } from './components/ConnectionLayer';
import { useAgentChat } from './hooks/useAgentChat';
import { useX402Payment } from './hooks/useX402Payment';

// Processing step type
interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail?: string;
}

export default function AgentPayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const { address, isConnected } = useAccount();

  // Processing modal state
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);

  const {
    messages,
    isLoading,
    pendingPayment,
    activeSourceId,
    error,
    sendMessage,
    executeAfterPayment,
    cancelPayment,
    clearChat,
  } = useAgentChat();

  const { signAndSettle, isPaying } = useX402Payment();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize processing steps
  const initProcessingSteps = (toolName: string, api: string) => {
    setProcessingSteps([
      { id: 'openai', label: 'Calling OpenAI GPT-4o-mini', status: 'complete', detail: 'Tool selection complete' },
      { id: 'tool', label: `Selected tool: ${toolName}`, status: 'complete', detail: `via ${api}` },
      { id: 'payment', label: 'Awaiting MNEE payment', status: 'active', detail: '0.1 MNEE required' },
      { id: 'settle', label: 'Settling on TwinkleX402', status: 'pending' },
      { id: 'api', label: `Fetching from ${api}`, status: 'pending' },
      { id: 'response', label: 'Generating response', status: 'pending' },
    ]);
    setShowProcessing(true);
  };

  const updateProcessingStep = (stepId: string, status: ProcessingStep['status'], detail?: string) => {
    setProcessingSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, detail: detail || step.detail } : step
    ));
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const msg = input.trim();
      setInput('');

      // Show initial processing
      setProcessingSteps([
        { id: 'openai', label: 'Calling OpenAI GPT-5.2', status: 'active', detail: 'Analyzing your request...' },
        { id: 'tool', label: 'Selecting data source', status: 'pending' },
        { id: 'payment', label: 'Awaiting MNEE payment', status: 'pending' },
        { id: 'settle', label: 'Settling on TwinkleX402', status: 'pending' },
        { id: 'api', label: 'Fetching data', status: 'pending' },
        { id: 'response', label: 'Generating response', status: 'pending' },
      ]);
      setShowProcessing(true);

      await sendMessage(msg, address);
    }
  };

  // Update processing when payment is required
  useEffect(() => {
    if (pendingPayment) {
      const source = dataSources.find(s => s.id === pendingPayment.sourceId);
      setProcessingSteps([
        { id: 'openai', label: 'Calling OpenAI GPT-5.2', status: 'complete', detail: 'Tool selection complete' },
        { id: 'tool', label: `Selected: ${pendingPayment.tool}`, status: 'complete', detail: `via ${source?.api || 'API'}` },
        { id: 'payment', label: 'Awaiting MNEE payment', status: 'active', detail: `${pendingPayment.cost} MNEE required` },
        { id: 'settle', label: 'Settling on TwinkleX402', status: 'pending' },
        { id: 'api', label: `Fetching from ${source?.api || 'API'}`, status: 'pending' },
        { id: 'response', label: 'Generating response', status: 'pending' },
      ]);
    }
  }, [pendingPayment]);

  // Close processing modal when we get a response
  useEffect(() => {
    if (!isLoading && !pendingPayment && messages.length > 0) {
      // Delay closing to show completion
      const timer = setTimeout(() => {
        setShowProcessing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, pendingPayment, messages.length]);

  const handlePay = async () => {
    if (!pendingPayment) return;

    // Update to payment processing
    updateProcessingStep('payment', 'complete', 'Payment signed');
    updateProcessingStep('settle', 'active', 'Broadcasting to Ethereum...');

    const result = await signAndSettle(pendingPayment.paymentRequest);

    if (result.success) {
      updateProcessingStep('settle', 'complete', `Tx: ${result.txHash?.slice(0, 10)}...`);
      updateProcessingStep('api', 'active', 'Fetching live data...');

      await executeAfterPayment(result.accessProofId, result.txHash);

      updateProcessingStep('api', 'complete', 'Data received');
      updateProcessingStep('response', 'active', 'Formatting response...');

      // Final step completes when response arrives
      setTimeout(() => {
        updateProcessingStep('response', 'complete', 'Done!');
      }, 300);
    } else {
      updateProcessingStep('settle', 'pending', result.error || 'Failed');
      updateProcessingStep('payment', 'active', 'Payment required');
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--agent-bg)' }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(var(--agent-border) 1px, transparent 1px), linear-gradient(90deg, var(--agent-border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Connection Layer - SVG lines */}
      <ConnectionLayer
        chatRef={chatRef}
        activeSourceId={activeSourceId}
        sources={dataSources}
        containerRef={containerRef}
      />

      {/* Processing Modal */}
      <AnimatePresence>
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--agent-surface)] border border-[var(--agent-border)] rounded-xl p-6 w-[420px] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--agent-accent)]/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[var(--agent-accent)]" />
                </div>
                <div>
                  <h3 className="text-[var(--agent-text)] font-semibold">Processing Request</h3>
                  <p className="text-xs text-[var(--agent-muted)]">x402 Payment Flow</p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {processingSteps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === 'active'
                        ? 'bg-[var(--agent-accent)]/10 border border-[var(--agent-accent)]/30'
                        : step.status === 'complete'
                        ? 'bg-green-500/10'
                        : 'bg-[var(--agent-surface-light)]'
                    }`}
                  >
                    {/* Icon */}
                    <div className="mt-0.5">
                      {step.status === 'complete' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="w-5 h-5 text-[var(--agent-accent)] animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--agent-muted)]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        step.status === 'active'
                          ? 'text-[var(--agent-accent)]'
                          : step.status === 'complete'
                          ? 'text-green-500'
                          : 'text-[var(--agent-muted)]'
                      }`}>
                        {step.label}
                      </p>
                      {step.detail && (
                        <p className="text-xs text-[var(--agent-muted)] mt-0.5 truncate">
                          {step.detail}
                        </p>
                      )}
                    </div>

                    {/* Step icon */}
                    <div className="text-[var(--agent-muted)]">
                      {step.id === 'openai' && <Sparkles className="w-4 h-4" />}
                      {step.id === 'tool' && <Database className="w-4 h-4" />}
                      {step.id === 'payment' && <CreditCard className="w-4 h-4" />}
                      {step.id === 'settle' && <Zap className="w-4 h-4" />}
                      {step.id === 'api' && <Server className="w-4 h-4" />}
                      {step.id === 'response' && <Bot className="w-4 h-4" />}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Payment button in modal */}
              {pendingPayment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-4 border-t border-[var(--agent-border)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[var(--agent-muted)]">Payment Required</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[var(--agent-accent)]">
                        {pendingPayment.cost}
                      </span>
                      <span className="text-sm text-[var(--agent-muted)]">MNEE</span>
                    </div>
                  </div>

                  {isConnected ? (
                    <button
                      onClick={handlePay}
                      disabled={isPaying}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--agent-accent)] text-white rounded-lg font-medium hover:bg-[var(--agent-accent)]/90 transition-colors disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Pay {pendingPayment.cost} MNEE & Continue
                        </>
                      )}
                    </button>
                  ) : (
                    <ConnectButton label="Connect Wallet to Pay" />
                  )}

                  <button
                    onClick={() => {
                      cancelPayment();
                      setShowProcessing(false);
                    }}
                    className="w-full mt-2 text-sm text-[var(--agent-muted)] hover:text-[var(--agent-text)] transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--agent-border)]"
        >
          <Link
            href="/apps"
            className="flex items-center gap-2 text-[var(--agent-muted)] hover:text-[var(--agent-accent)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Apps</span>
          </Link>
          <a
            href="https://www.mnee.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="text-xs text-[var(--agent-muted)] uppercase tracking-wide">Powered by</span>
            <img src="https://www.mnee.io/logo-light.svg" alt="MNEE" className="h-6" />
          </a>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Tiles - Data Sources */}
          <div className="w-72 p-4 overflow-y-auto border-r border-[var(--agent-border)]">
            <h3 className="text-xs text-[var(--agent-muted)] uppercase tracking-wider mb-4 px-1">
              Data Sources
            </h3>
            <div className="space-y-3">
              {dataSources.slice(0, 7).map((source, i) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DataSourceTile
                    source={source}
                    isActive={activeSourceId === source.id}
                    isPending={pendingPayment?.sourceId === source.id}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Center - Chat */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-[var(--agent-border)]">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--agent-accent)]/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[var(--agent-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-lg text-[var(--agent-text)] font-semibold">AgentPay</h2>
                    <p className="text-sm text-[var(--agent-muted)]">Crypto Data Agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="text-sm text-[var(--agent-muted)] hover:text-[var(--agent-text)] transition-colors px-3 py-1 rounded-lg hover:bg-[var(--agent-surface)]"
                    >
                      Clear
                    </button>
                  )}
                  <ConnectButton
                    accountStatus="avatar"
                    chainStatus="icon"
                    showBalance={false}
                  />
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={chatRef}
              className="flex-1 px-6 py-6 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--agent-accent)]/20 flex items-center justify-center mb-6">
                      <Zap className="w-10 h-10 text-[var(--agent-accent)]" />
                    </div>
                    <h3 className="text-2xl text-[var(--agent-text)] font-semibold mb-3">
                      Ask me about crypto
                    </h3>
                    <p className="text-[var(--agent-muted)] max-w-md mb-8 leading-relaxed">
                      Get real-time prices, market data, trending coins, gas fees, and more.
                      Each API call costs <span className="text-[var(--agent-accent)] font-medium">0.1 MNEE</span>.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {['What\'s BTC at?', 'Top 5 coins', 'ETH gas prices', 'What\'s trending?'].map((q) => (
                        <button
                          key={q}
                          onClick={async () => {
                            if (isConnected && !isLoading) {
                              // Show processing modal
                              setProcessingSteps([
                                { id: 'openai', label: 'Calling OpenAI GPT-5.2', status: 'active', detail: 'Analyzing your request...' },
                                { id: 'tool', label: 'Selecting data source', status: 'pending' },
                                { id: 'payment', label: 'Awaiting MNEE payment', status: 'pending' },
                                { id: 'settle', label: 'Settling on TwinkleX402', status: 'pending' },
                                { id: 'api', label: 'Fetching data', status: 'pending' },
                                { id: 'response', label: 'Generating response', status: 'pending' },
                              ]);
                              setShowProcessing(true);
                              await sendMessage(q, address);
                            }
                          }}
                          disabled={!isConnected || isLoading}
                          className="px-4 py-2 bg-[var(--agent-surface)] border border-[var(--agent-border)] rounded-full text-sm text-[var(--agent-muted)] hover:text-[var(--agent-text)] hover:border-[var(--agent-accent)] transition-all disabled:opacity-50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={msg.role === 'user' ? 'flex justify-end' : ''}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                        msg.role === 'user'
                          ? 'bg-[var(--agent-accent)] text-white'
                          : 'bg-[var(--agent-surface)] border border-[var(--agent-border)]'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--agent-border)]">
                          <Zap className="w-4 h-4 text-[var(--agent-accent)]" />
                          <span className="text-sm font-medium text-[var(--agent-accent)]">AgentPay</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && !pendingPayment && !showProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-[var(--agent-muted)]"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-[var(--agent-border)]">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 bg-[var(--agent-surface)] border border-[var(--agent-border)] rounded-xl px-4 py-3">
                  <input
                    type="text"
                    placeholder={isConnected ? 'Ask about crypto prices, trends, gas...' : 'Connect wallet to start...'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={!isConnected || isLoading || !!pendingPayment}
                    className="flex-1 bg-transparent text-[var(--agent-text)] placeholder-[var(--agent-muted)] outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!isConnected || !input.trim() || isLoading || !!pendingPayment}
                    className="w-10 h-10 rounded-lg bg-[var(--agent-accent)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--agent-accent)]/90 transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-xs text-[var(--agent-muted)] text-center mt-3">
                  Each API call costs 0.1 MNEE · Payments settle instantly on Ethereum Mainnet
                </p>
              </div>
            </div>
          </div>

          {/* Right Tiles - More Data Sources */}
          <div className="w-72 p-4 overflow-y-auto border-l border-[var(--agent-border)]">
            <h3 className="text-xs text-[var(--agent-muted)] uppercase tracking-wider mb-4 px-1">
              More APIs
            </h3>
            <div className="space-y-3">
              {dataSources.slice(7).map((source, i) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DataSourceTile
                    source={source}
                    isActive={activeSourceId === source.id}
                    isPending={pendingPayment?.sourceId === source.id}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-3 border-t border-[var(--agent-border)] text-center"
        >
          <p className="text-xs text-[var(--agent-muted)]">
            <span className="text-[var(--agent-accent)] font-medium">AgentPay</span> — x402
            payment infrastructure for AI agents · Live on <span className="text-[var(--agent-accent)]">Ethereum Mainnet</span> · Powered by real MNEE
          </p>
        </motion.div>
      </div>
    </div>
  );
}
