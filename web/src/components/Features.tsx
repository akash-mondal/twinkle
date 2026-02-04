"use client";
import { motion } from 'framer-motion';

const features = [
  {
    title: "Twinkle SDK — Zero gas, zero friction",
    description: "Connect AI agents to MNEE with one import. Deploy to Mainnet with zero gas overhead.",
    links: [
      { label: "Start building", href: "/docs/quickstart" },
      { label: "Learn more", href: "/docs/sdk" },
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
      theme: 'dark'
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
      theme: 'light'
    }
  }
];

const CodeBlock = ({ code, theme }: { code: typeof features[0]['code'], theme: 'dark' | 'light' }) => {
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      variants={{
        rest: { scale: 1, y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' },
        hover: { 
          scale: 1.02, 
          y: -4,
          boxShadow: isDark ? '0 20px 40px -12px rgba(0,0,0,0.5)' : '0 20px 40px -12px rgba(0,0,0,0.15)',
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
        }
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background: isDark ? 'var(--bg-dark)' : 'var(--bg-white)',
        border: `1px solid ${isDark ? 'var(--border-dark)' : 'var(--border)'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        height: '280px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: `1px solid ${isDark ? 'var(--border-dark)' : 'var(--border)'}`,
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDark ? '#3f3f46' : '#e4e4e7' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDark ? '#3f3f46' : '#e4e4e7' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isDark ? '#3f3f46' : '#e4e4e7' }} />
        </div>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 500, 
          color: isDark ? 'var(--text-muted)' : 'var(--text-secondary)',
          marginLeft: '8px'
        }}>
          {code.filename}
        </span>
      </div>
      
      {/* Code */}
      <pre
        style={{
          padding: '16px',
          margin: 0,
          fontSize: '11px',
          fontFamily: 'SF Mono, Monaco, Consolas, monospace',
          lineHeight: 1.6,
          color: isDark ? '#a1a1aa' : 'var(--text-secondary)',
          overflow: 'hidden',
          whiteSpace: 'pre',
        }}
      >
        {code.content}
      </pre>
    </motion.div>
  );
};

export const Features = () => {
  return (
    <section style={{ padding: '96px 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '64px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: '32px' }}
          >
           <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#000',
              color: '#FFF',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              SHIP WITHOUT GAS
            </span>
          </motion.div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(32px, 5vw, 48px)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Seamless DevEx for agents and wallets
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                paddingTop: '8px',
              }}
            >
              Whether your consumers are humans or AI agents, Twinkle handles settlement so devs focus on product.
            </motion.p>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial="rest"
              whileHover="hover"
              animate="rest"
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'default'
              }}
            >
              {/* Code Preview */}
              <CodeBlock code={feature.code} theme={feature.code.theme as 'dark' | 'light'} />
              
              {/* Content */}
              <motion.div 
                variants={{
                  rest: { y: 0 },
                  hover: { y: -2 }
                }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: '24px' }}
              >
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontStyle: 'normal',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                  lineHeight: 1.6,
                }}>
                  {feature.description}
                </p>
                
                {/* Links */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  {feature.links.map((link, i) => (
                    <motion.a
                      key={i}
                      href={link.href}
                      whileHover={{ x: 2, color: 'var(--text-primary)' }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {link.label}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M5 3L8 6L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
