"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  {
    id: "paywall",
    label: "Paywall",
    code: `// Create a paywall
const { paywallId } = await createPaywall(walletClient, publicClient, {
  contentId: "premium-guide",
  price: parseEther("100"), // 100 MNEE
});

// Check access
const hasAccess = await isUnlocked(
  publicClient,
  paywallId,
  userAddress
);

// Unlock content
await payForPaywall(walletClient, publicClient, paywallId);`,
  },
  {
    id: "subscription",
    label: "Subscription",
    code: `// Create a plan
const { planId } = await createSubscriptionPlan(walletClient, publicClient, {
  price: parseEther("5"), // 5 MNEE
  interval: 30 * 24 * 60 * 60 // 30 days
});

// Subscribe
await subscribeToPlan(walletClient, publicClient, planId);

// Verify subscription
const active = await isSubscribedToPlan(
  publicClient,
  planId,
  userAddress
);`,
  },
  {
    id: "splits",
    label: "Splits",
    code: `// Create a revenue split
const { splitId } = await createSplit(walletClient, publicClient, {
  recipients: [
    { address: "0x123...", percent: 60 }, // Band member
    { address: "0x456...", percent: 40 }  // Manager
  ],
  name: "Album Revenue"
});

// Funds sent to splitId are automatically distributed`,
  },
  {
    id: "escrow",
    label: "Escrow",
    code: `// Client funds a milestone
const { gigId } = await createGig(walletClient, publicClient, {
  freelancer: "0xFreelancer...",
  amount: parseEther("500"), // 500 MNEE
  deadline: 30 * 24 * 60 * 60 // 30 days
});

// Freelancer submits work
await submitWork(walletClient, publicClient, gigId);

// Client approves & releases funds
await releasePayment(walletClient, publicClient, gigId);`,
  },
  {
    id: "x402",
    label: "x402 Agent",
    code: `// AI agent makes HTTP request
// Server responds with 402 Payment Required

HTTP/1.1 402 Payment Required
X-Payment-Address: 0x68Ab...
X-Payment-Amount: 0.01
X-Payment-Token: MNEE

// Agent automatically pays and retries
// Content unlocked instantly`,
  },
];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("paywall");
  const activeContent = tabs.find((t) => t.id === activeTab);

  return (
    <section id="product-showcase" className="py-24 px-6 bg-[#18181B]">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-syne)] mb-4"
          >
            SEE IT IN ACTION
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[#A1A1AA] text-lg"
          >
            Simple APIs for every payment type
          </motion.p>
        </div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? "bg-[#A855F7] text-white"
                : "bg-[#27272A] text-[#A1A1AA] hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Code Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-[#09090B] border border-[#27272A] overflow-hidden min-h-[400px]"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A]">
            <div className="w-3 h-3 rounded-full bg-[#F87171]" />
            <div className="w-3 h-3 rounded-full bg-[#FBBF24]" />
            <div className="w-3 h-3 rounded-full bg-[#34D399]" />
            <span className="ml-4 text-xs text-[#71717A]">
              {activeTab === "x402" ? "http-response.txt" : "twinkle.ts"}
            </span>
          </div>

          {/* Code content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <pre className="text-sm overflow-x-auto font-[family-name:var(--font-mono)]">
                <code className="text-[#A1A1AA]">
                  {activeContent?.code.split("\n").map((line, i) => (
                    <div key={i} className="leading-relaxed">
                      {line.startsWith("//") || line.startsWith("HTTP") || line.startsWith("X-") ? (
                        <span className="text-[#71717A]">{line}</span>
                      ) : line.includes("await") || line.includes("const") ? (
                        <>
                          {line.split(/(\bawait\b|\bconst\b|\btrue\b|\bfalse\b)/).map((part, j) =>
                            ["await", "const", "true", "false"].includes(part) ? (
                              <span key={j} className="text-[#A855F7]">{part}</span>
                            ) : part.includes('"') || part.includes("'") ? (
                              <span key={j} className="text-[#34D399]">{part}</span>
                            ) : (
                              <span key={j} className="text-white">{part}</span>
                            )
                          )}
                        </>
                      ) : (
                        <span className="text-white">{line}</span>
                      )}
                    </div>
                  ))}
                </code>
              </pre>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
