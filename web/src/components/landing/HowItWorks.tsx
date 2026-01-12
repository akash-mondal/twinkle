"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lock, Code, Coins } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Lock,
    number: "01",
    title: "Create",
    description: "Set up a paywall with your price and content ID. One API call to get started.",
  },
  {
    icon: Code,
    number: "02",
    title: "Integrate",
    description: "Add our SDK to your app or use x402 headers for AI-ready APIs.",
  },
  {
    icon: Coins,
    number: "03",
    title: "Earn",
    description: "Receive MNEE payments directly to your wallet. No intermediaries.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current?.querySelectorAll(".step-card") || [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-[#09090B]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-syne)] mb-4"
          >
            HOW IT WORKS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[#A1A1AA] text-lg"
          >
            Start monetizing in three simple steps
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              whileHover={{ y: -4 }}
              className="step-card relative p-6 rounded-2xl bg-[#18181B] border border-[#27272A]"
            >
              {/* Number */}
              <span className="absolute top-6 right-6 text-5xl font-bold text-[#27272A] font-[family-name:var(--font-syne)]">
                {step.number}
              </span>

              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#6366F1] flex items-center justify-center mb-6"
              >
                <step.icon className="w-6 h-6 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-2 font-[family-name:var(--font-syne)]">
                {step.title}
              </h3>
              <p className="text-[#A1A1AA] text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Connector line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[#3F3F46] to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
