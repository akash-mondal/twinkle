"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

const caseStudies = [
  {
    id: '01',
    company: 'Adoption Engine',
    logo: 'A',
    tagline: 'UNIVERSAL MNEE MIGRATION & REBATES',
    expanded: false,
    content: `Seamlessly intercepts legacy USDC requests and upgrades them to gasless MNEE transactions. The Adoption Engine detects currency mismatches and automatically routes payments through the Facilitator, unlocking built-in loyalty incentives for agents without code changes.`,
  },
  {
    id: '02',
    company: 'Power Protocol',
    logo: 'P',
    tagline: 'DUAL-INTENT SETTLEMENT ON MAINNET',
    expanded: true,
    badge: '#WITNESS',
    content: `Leverages Witness + Permit2 for atomic fee splitting and developer payouts in a single 100ms transaction. The Power Protocol ensures that every interaction creates verifiable revenue streams for both the agent developer and the service provider instantly.`,
  },
  {
    id: '03',
    company: 'Batch Settlement',
    logo: 'B',
    tagline: 'HIGH-THROUGHPUT AGENT COMMERCE',
    expanded: false,
    content: `Aggregates high-frequency micropayments into efficient batch settlements, reducing gas costs by over 90%. Ideal for streaming services, API metering, and autonomous agents performing rapid-fire partial transactions.`,
  },
  {
    id: '04',
    company: 'Singular Witness',
    logo: 'S',
    tagline: 'CRYPTOGRAPHIC VERIFICATION AT THE EDGE',
    expanded: false,
    content: `Edge-compatible witness generation allows untrusted agents to prove interaction validity without on-chain overhead. Singular Witness provides mathematically guaranteed proof-of-payment for offline or optimistic service delivery.`,
  },
];

// ASCII art pattern for dark section
const DarkAsciiPattern = () => {
  const rows = 15;
  const pattern: string[] = [];
  for (let i = 0; i < rows; i++) {
    let row = '';
    for (let j = 0; j < 8; j++) {
      const sparse = (i + j) % 2 === 0;
      row += sparse ? '·' : ' ';
    }
    pattern.push(row);
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        left: '32px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '20px',
        color: 'rgba(255,255,255,0.15)',
        whiteSpace: 'pre',
        pointerEvents: 'none',
      }}
    >
      {pattern.map((row, i) => (
        <div key={i}>{row}</div>
      ))}
    </div>
  );
};

export const Showcase = () => {
  const [activeCase, setActiveCase] = useState('02');

  return (
    <section
      style={{
        position: 'relative',
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        padding: '96px 32px',
        overflow: 'hidden',
      }}
    >
      <DarkAsciiPattern />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px' }}>
          {/* Left: Headline */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                display: 'inline-block',
                marginBottom: '32px',
                padding: '6px 14px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#A1A1AA',
              }}
            >
              SHOWCASE
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(36px, 5vw, 56px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '24px',
                color: '#FFFFFF',
              }}
            >
              The biggest protocols, the smartest agents
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '15px',
                color: '#A1A1AA',
              }}
            >
              And everyone in between
            </motion.p>
          </div>

          {/* Right: Case Studies List */}
          <div>
            {caseStudies.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  padding: '20px 0',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveCase(activeCase === item.id ? '' : item.id)}
              >
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#71717A',
                    fontFamily: 'SF Mono, Monaco, monospace',
                    minWidth: '24px',
                  }}>
                    {item.id}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                    }}
                  >
                    {item.logo}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    color: '#A1A1AA',
                  }}>
                    // {item.tagline}
                  </span>
                </div>

                {/* Expanded Content */}
                {activeCase === item.id && item.content && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: '24px',
                      marginLeft: '68px',
                    }}
                  >
                    {item.badge && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginBottom: '16px',
                          padding: '4px 10px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          color: '#FFFFFF',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <p style={{
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#A1A1AA',
                      marginBottom: '24px',
                      maxWidth: '500px',
                    }}>
                      {item.content}
                    </p>
                    <motion.a
                      href="#"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '12px 24px',
                        background: '#71717A',
                        color: '#0A0A0A',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                      }}
                    >
                      Read Case Study
                    </motion.a>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
