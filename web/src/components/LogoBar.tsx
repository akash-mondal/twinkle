"use client";
import { motion } from 'framer-motion';

const logos = [
  { name: 'OpenAI', display: 'OPENAI' },
  { name: 'Anthropic', display: 'ANTHROPIC' },
  { name: 'MNEE', display: 'MNEE' },
  { name: 'Alchemy', display: 'ALCHEMY' },
  { name: 'BSV', display: 'BSV' },
  { name: 'Sigma', display: 'SIGMA' },
  { name: 'Payman', display: 'PAYMAN' },
  { name: 'Handcash', display: 'HANDCASH' },
];

export const LogoBar = () => {
  return (
    <section style={{ padding: '64px 32px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            marginBottom: '40px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          POWERING THE AGENTIC ECONOMY
        </motion.p>
        
        {/* Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '48px',
          }}
        >
          {logos.map((logo, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {logo.display}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
