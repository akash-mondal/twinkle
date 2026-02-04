"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '32px 40px',
        backgroundColor: 'transparent',
        // Dynamic color inversion: 
        // Elements defined as White will appearing Black on White BG.
        // Elements defined as Black will appear White on White BG.
        mixBlendMode: 'difference',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        {/* Diamond/Gem Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {/* Main Shape: White -> Inverts to Black */}
          <path 
            d="M12 2L2 9L12 22L22 9L12 2Z" 
            fill="#FFFFFF"
          />
          {/* Inner Lines: Black -> Inverts to White */}
          <path 
            d="M2 9H22M12 2L7 9L12 22L17 9L12 2Z" 
            stroke="#000000"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          color: '#FFFFFF', // Inverts to Black
          letterSpacing: '-0.02em',
        }}>
          twinkle
        </span>
      </Link>
    </motion.nav>
  );
};
