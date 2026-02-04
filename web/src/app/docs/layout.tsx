"use client";
import React, { useRef } from 'react';
import { Navbar } from "@/components/Navbar";
import { Zap, Terminal, Shield, Book, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const sections = [
  { id: '/docs', title: 'Introduction', icon: Book },
  { id: '/docs/quickstart', title: 'Quickstart', icon: Zap },
  { id: '/docs/concept', title: 'How it Works', icon: RefreshCw },
  { id: '/docs/sdk', title: 'TwinkleAgent SDK', icon: Terminal },
  { id: '/docs/server', title: 'TwinkleServer SDK', icon: Shield },
  { id: '/docs/ai', title: 'For AI Agents', icon: FileText },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Removed GSAP animation to ensure visibility
  // If we want animation, we'll use simple CSS transitions instead.

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-black selection:text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-24 flex gap-16">
        
        {/* === SIDEBAR (Sticky) === */}
        <aside ref={sidebarRef} className="hidden lg:block w-64 shrink-0 h-[calc(100vh-160px)] sticky top-32 border-r border-zinc-100 pr-8">
          <nav className="space-y-1">
            <div className="px-4 mb-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] sidebar-item">Contents</div>
            {sections.map((section) => {
              const isActive = pathname === section.id;
              return (
                <Link
                  key={section.id}
                  href={section.id}
                  className={`sidebar-item group flex items-center space-x-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-zinc-50 text-black font-semibold translate-x-1" 
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                  }`}
                >
                  <section.icon className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#E78B1F] opacity-100" : "opacity-50 group-hover:opacity-100"
                  }`} />
                  <span>{section.title}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 max-w-3xl min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
