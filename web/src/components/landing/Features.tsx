"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lock, Repeat, Bot, GitBranch, Shield, Cpu } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Lock,
    title: "Paywalls",
    description: "Monetize content with one-time payments. Simple API, instant unlocks, full ownership.",
    gradient: "from-[#A855F7] to-[#6366F1]",
    span: "lg:col-span-2",
  },
  {
    icon: Bot,
    title: "x402 Protocol",
    description: "AI agents pay automatically via HTTP 402. The standard for machine-to-machine payments.",
    gradient: "from-[#34D399] to-[#10B981]",
  },
  {
    icon: Repeat,
    title: "Subscriptions",
    description: "Recurring revenue with automatic renewals on-chain.",
    gradient: "from-[#A855F7] to-[#C084FC]",
  },
  {
    icon: GitBranch,
    title: "Revenue Splits",
    description: "Share earnings automatically between collaborators.",
    gradient: "from-[#6366F1] to-[#A855F7]",
  },
  {
    icon: Shield,
    title: "Escrow",
    description: "Secure milestone-based payments for projects.",
    gradient: "from-[#34D399] to-[#059669]",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current?.querySelectorAll(".feature-card") || [],
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-[#09090B]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-syne)] mb-4"
          >
            Everything you need to monetize
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[#A1A1AA] text-lg max-w-xl mx-auto"
          >
            From simple paywalls to AI-ready payment flows
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`feature-card group relative overflow-hidden rounded-2xl bg-[#18181B] border border-[#27272A] p-6 ${feature.span || ""}`}
            >
              {/* Gradient border on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r ${feature.gradient} rounded-2xl`}
                style={{ padding: "1px" }}
              >
                <div className="absolute inset-[1px] bg-[#18181B] rounded-2xl" />
              </div>

              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2 font-[family-name:var(--font-syne)]">
                  {feature.title}
                </h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-2xl bg-[#18181B] border border-[#27272A] p-6 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-[#A855F7]" />
            <span className="text-sm text-[#A1A1AA]">Quick Start</span>
          </div>
          <pre className="text-sm overflow-x-auto font-[family-name:var(--font-mono)]">
            <code className="text-[#A1A1AA]">
              <span className="text-[#A855F7]">const</span>{" "}
              <span className="text-white">paywall</span>{" "}
              <span className="text-[#A855F7]">=</span>{" "}
              <span className="text-[#A855F7]">await</span>{" "}
              <span className="text-[#34D399]">twinkle</span>
              <span className="text-white">.</span>
              <span className="text-[#60A5FA]">createPaywall</span>
              <span className="text-white">({"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-white">contentId</span>
              <span className="text-[#A855F7]">:</span>{" "}
              <span className="text-[#34D399]">&quot;premium-article&quot;</span>
              <span className="text-white">,</span>
              {"\n"}
              {"  "}
              <span className="text-white">price</span>
              <span className="text-[#A855F7]">:</span>{" "}
              <span className="text-[#C084FC]">0.1</span>
              <span className="text-white">,</span>
              {"\n"}
              {"  "}
              <span className="text-white">x402</span>
              <span className="text-[#A855F7]">:</span>{" "}
              <span className="text-[#C084FC]">true</span>
              {"\n"}
              <span className="text-white">{"}"})</span>
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
