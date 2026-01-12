"use client";

import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-24 px-6 bg-[#18181B]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-syne)] mb-6"
        >
          READY TO MONETIZE?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[#A1A1AA] text-lg mb-10"
        >
          Start accepting payments with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E78B1F] to-[#FFDB45]">MNEE</span> today
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.a
            href="/dashboard"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium rounded-lg transition-colors duration-200 text-lg"
          >
            Launch Dashboard
          </motion.a>
          <motion.a
            href="/docs"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-transparent text-white font-medium rounded-lg border border-[#3F3F46] hover:border-[#A1A1AA] transition-colors duration-200 text-lg"
          >
            Read Documentation
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
