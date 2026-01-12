"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Paywalls", href: "/docs/paywalls" },
      { label: "Subscriptions", href: "/docs/subscriptions" },
      { label: "x402 Protocol", href: "/docs/x402" },
      { label: "Escrow", href: "/docs/escrow" },
      { label: "Revenue Splits", href: "/docs/splits" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs/api" },
      { label: "GitHub", href: "https://github.com/twinkle-protocol", external: true },
      { label: "MCP Server", href: "/docs/mcp" },
      { label: "Smart Contracts", href: "/docs/contracts" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Getting Started", href: "/docs" },
      { label: "Examples", href: "/docs/examples" },
      { label: "Changelog", href: "/changelog" },
      { label: "Status", href: "https://status.tw1nkl3.rest", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Twitter", href: "https://twitter.com/twinkleprotocol", external: true },
      { label: "Discord", href: "https://discord.gg/twinkle", external: true },
      { label: "Contact", href: "mailto:hello@tw1nkl3.rest" },
    ],
  },
];

const socials = [
  { href: "https://github.com/twinkle-protocol", icon: Github, label: "GitHub" },
  { href: "https://twitter.com/twinkleprotocol", icon: Twitter, label: "Twitter" },
];

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-[#27272A] bg-[#09090B]">
      <div className="max-w-6xl mx-auto">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="text-white font-semibold text-sm mb-4 font-[family-name:var(--font-syne)]">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-[#71717A] hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[#27272A] pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo + Copyright */}
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="w-6 h-6"
              >
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M24 4L26.5 18.5L41 16L29 24L41 32L26.5 29.5L24 44L21.5 29.5L7 32L19 24L7 16L21.5 18.5L24 4Z"
                    fill="url(#footerGradient1)"
                  />
                  <circle cx="24" cy="24" r="6" fill="url(#footerGradient2)" />
                  <defs>
                    <linearGradient id="footerGradient1" x1="7" y1="4" x2="41" y2="44" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#A855F7" />
                      <stop offset="1" stopColor="#6366F1" />
                    </linearGradient>
                    <linearGradient id="footerGradient2" x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E879F9" />
                      <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
              <span className="text-sm text-[#71717A]">
                © 2025 Twinkle Protocol
              </span>
            </div>

            {/* Powered by */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#71717A]">Powered by</span>
              <span className="text-xs text-[#34D399] font-medium">Ethereum</span>
              <span className="text-[#3F3F46]">•</span>
              <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#E78B1F] to-[#FFDB45]">MNEE</span>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-full bg-[#18181B] flex items-center justify-center text-[#71717A] hover:text-white hover:bg-[#27272A] transition-colors duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
