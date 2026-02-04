"use client";
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    title: "Twinkle SDK — Zero gas, zero friction",
    description: "Connect AI agents to MNEE with one import. Deploy to Mainnet with zero gas overhead.",
    links: [
      { label: "Start building", href: "/docs#agent" },
      { label: "Learn more", href: "/docs#intro" },
    ],
    code: {
      filename: "agent.ts",
      content: `import { TwinkleAgent } from '@twinkle/sdk';

const agent = new TwinkleAgent({
  privateKey: process.env.AGENT_KEY,
  facilitator: 'https://f.twinkle.so',
  autoPayment: true
});

// Pay any merchant - gasless
await agent.pay({
  to: 'merchant@example.com',
  amount: '10.00',
  currency: 'MNEE'
});`,
    }
  },
  {
    title: "Universal MNEE Adoption Engine",
    description: "Intercept legacy USDC requests and settle in MNEE. Automatic migration for every agent.",
    links: [
      { label: "Start generating", href: "/docs/swap-relay" },
      { label: "Explore SDKs", href: "/docs" },
      { label: "Explore Docs", href: "/docs" },
    ],
    code: {
      filename: "PREVIEW",
      content: `// Automatic USDC → MNEE Migration

import { SwapRelay } from '@twinkle/sdk';

const relay = new SwapRelay({
  mode: 'intercept',
  fallback: 'MNEE'
});

// Legacy USDC request → MNEE settlement
relay.on('payment', async (req) => {
  const mnee = await relay.convert(req);
  console.log('Settled:', mnee.txid);
});`,
    }
  }
];

const CodeBlock = ({ code }: { code: typeof features[0]['code'] }) => {
  return (
    <div className="bg-[#0a0a0a] rounded-lg overflow-hidden h-[280px] border border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/50 bg-[#111]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-[11px] font-medium text-zinc-500 ml-2">
          {code.filename}
        </span>
      </div>
      
      {/* Code */}
      <pre className="p-4 text-[11px] font-mono leading-relaxed text-zinc-400 overflow-hidden whitespace-pre">
        {code.content}
      </pre>
    </div>
  );
};

export const Features = () => {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardsContainer = cardsRef.current;
    if (!cardsContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cards = cardsContainer.querySelectorAll<HTMLElement>('.spotlight-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    cardsContainer.addEventListener('mousemove', handleMouseMove);
    return () => cardsContainer.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <style jsx global>{`
        .spotlight-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 1px;
        }

        .spotlight-card::before,
        .spotlight-card::after {
          border-radius: inherit;
          content: "";
          height: 100%;
          left: 0;
          opacity: 0;
          position: absolute;
          top: 0;
          transition: opacity 500ms;
          width: 100%;
          pointer-events: none;
        }

        .spotlight-card::before {
          background: radial-gradient(
            800px circle at var(--mouse-x) var(--mouse-y), 
            rgba(255, 255, 255, 0.06),
            transparent 40%
          );
          z-index: 3;
        }

        .spotlight-card::after {  
          background: radial-gradient(
            600px circle at var(--mouse-x) var(--mouse-y), 
            rgba(231, 139, 31, 0.4),
            transparent 40%
          );
          z-index: 1;
        }

        .spotlight-card:hover::before {
          opacity: 1;
        }

        #feature-cards:hover > .spotlight-card::after {
          opacity: 1;
        }

        .spotlight-card-content {
          background-color: #fafafa;
          border-radius: 15px;
          padding: 16px;
          position: relative;
          z-index: 2;
        }
        
        @media (min-width: 768px) {
          .spotlight-card-content {
            padding: 24px;
          }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto">
        {/* Section Header */}
        <div className="mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 md:mb-8"
          >
           <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-[11px] font-bold tracking-widest uppercase shadow-lg">
              SHIP WITHOUT GAS
            </span>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-start md:items-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif italic font-normal text-3xl md:text-5xl leading-tight tracking-tight text-black"
            >
              Seamless DevEx for agents and wallets
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base leading-relaxed text-zinc-600"
            >
              Whether your consumers are humans or AI agents, Twinkle handles settlement so devs focus on product.
            </motion.p>
          </div>
        </div>

        {/* Feature Cards - Single column on mobile */}
        <div id="feature-cards" ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="spotlight-card"
            >
              <div className="spotlight-card-content">
                {/* Code Preview */}
                <CodeBlock code={feature.code} />
                
                {/* Content */}
                <div className="mt-4 md:mt-6">
                  <h3 className="text-base md:text-lg font-semibold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-zinc-600 mb-4 md:mb-5 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Links */}
                  <div className="flex flex-wrap gap-3 md:gap-5">
                    {feature.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-black hover:text-[#E78B1F] transition-colors"
                      >
                        {link.label}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M5 3L8 6L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
