"use client";

import { motion } from "framer-motion";

const integrations = [
  {
    name: "Ethereum",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
      </svg>
    ),
  },
  {
    name: "React",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 1.808c-5.63 0-10.192 4.562-10.192 10.192S6.37 22.192 12 22.192 22.192 17.63 22.192 12 17.63 1.808 12 1.808zm0 18.384c-4.516 0-8.192-3.676-8.192-8.192S7.484 3.808 12 3.808s8.192 3.676 8.192 8.192-3.676 8.192-8.192 8.192z" opacity="0" />
        <circle cx="12" cy="12" r="2" />
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          <ellipse cx="12" cy="12" rx="10" ry="4.5" />
          <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
        </g>
      </svg>
    ),
  },
  {
    name: "Next.js",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385l-7.07-9.234 9.111 11.906c6.124-.816 10.834-6.096 10.834-12.716l-8.498-11.085v9.234h2.46v2.105h-6.762v-2.105h2.45v-9.61l-5.66 7.397v2.85h-1.846v-12.44h1.846l5.706 7.453v-6.99h-2.155v-2.106h6.467v2.106h-2.154v9.066l8.55-11.15z" />
      </svg>
    ),
  },
  {
    name: "TypeScript",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0H1.125zM11.5 17h-1.5v-3.5h-2v3.5H6.5v-8h5v1.5h-3.5v1.5h3.5V17zm7.5 0h-3.5v-1.25l2.25-2.5a1.25 1.25 0 0 0-.875-2.125H15v-1.5h4v1.25l-2.25 2.5a1.25 1.25 0 0 0 .875 2.125h2V17z" />
      </svg>
    ),
  },
  {
    name: "Solidity",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 0L4.63 12.22 12 24l7.37-11.78L12 0zM5.6 12.22L12 2l6.4 10.22L12 22.42 5.6 12.22z" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 2l-9.8 5.6v11.2l9.8 5.6 9.8-5.6V7.6L12 2zm1.6 15.2l-6.4 3.7-6.4-3.7V9.8l6.4-3.7 6.4 3.7v7.4z" />
        <path d="M16 11l-4-2.3-4 2.3v4.6l4 2.3 4-2.3v-4.6z" />
      </svg>
    ),
  },
  {
    name: "Tailwind",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 1L24 22H0L12 1Z" />
      </svg>
    ),
  },
  {
    name: "Python",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 9h4v2h-4v-2zm0 6h4v2h-4v-2z" />
        <path d="M14.2 0h-4.4c-.6 0-1.1.5-1.1 1.1v2.2h-1.1c-2.4 0-4.4 2-4.4 4.4v1.1h-2.2v4.4h2.2v1.1c0 2.4 2 4.4 4.4 4.4h1.1v2.2c0 .6.5 1.1 1.1 1.1h4.4c.6 0 1.1-.5 1.1-1.1v-2.2h1.1c2.4 0 4.4-2 4.4-4.4v-1.1h2.2v-4.4h-2.2v-1.1c0-2.4-2-4.4-4.4-4.4h-1.1v-2.2c0-.6-.5-1.1-1.1-1.1z" transform="scale(0.8) translate(4 4)" />
      </svg>
    ),
  },
];

export function Integrations() {
  return (
    <section className="py-24 bg-[#09090B] overflow-hidden">
      <div className="text-center mb-16 px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#A1A1AA] text-sm font-medium uppercase tracking-[0.2em]"
        >
          WORKS WITH YOUR STACK
        </motion.p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="flex animate-marquee whitespace-nowrap">
          {integrations.map((item, i) => (
            <div key={i} className="mx-12 flex flex-col items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 text-[#E4E4E7] flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-sm text-[#71717A] font-medium">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Duplicate for infinite loop */}
        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
          {integrations.map((item, i) => (
            <div key={`${i}-clone`} className="mx-12 flex flex-col items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 text-[#E4E4E7] flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-sm text-[#71717A] font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
