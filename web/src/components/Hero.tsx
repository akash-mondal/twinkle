"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ThreeHero } from './ThreeHero';

// === HERO COMPONENT ===
export const Hero = () => {
  // Shared transition config for perfect sync
  const transition = { delay: 0.2 };
  
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 40px 0px', 
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* 3D ABSTRACTION BACKGROUND */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ThreeHero />
      </div>



      {/* === LAYER 1: CONTENT (DIFFERENCE MODE) === */}
      {/* Renders Text, Badge, Buttons, and MNEE Letters. Coin is hidden. */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '900px',
        gap: '16px',
        mixBlendMode: 'difference', // GLOBAL INVERSION
        color: '#FFFFFF', 
      }}>
        {/* Badge */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           style={{
             display: 'inline-flex',
             alignItems: 'center',
             gap: '8px',
             padding: '5px 12px',
             border: '1px solid #FFFFFF',
             borderRadius: '100px',
             backgroundColor: '#FFFFFF', 
           }}
        >
           <span style={{
             padding: '2px 6px',
             backgroundColor: '#000000',
             borderRadius: '100px',
             fontSize: '9px',
             fontWeight: 600,
             letterSpacing: '0.06em',
             textTransform: 'uppercase',
             color: '#FFFFFF',
           }}>NEW</span>
           <span style={{ fontSize: '12px', color: '#000000', fontWeight: 500 }}>Twinkle SDK is live</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>Gasless payments for agents.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.15em' }}>
            <span>Native </span>
            <svg width="220" height="50" viewBox="0 0 963 326" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: '-6px' }}>
              {/* COIN HIDDEN IN THIS LAYER */}
              <defs>
                 {/* Gradients not needed here but kept for validity if referenced */}
              </defs>
              <path style={{ opacity: 0 }} d="" /> 

              {/* LETTERS VISIBLE - White to invert to Black */}
              <path d="M495.936 134.492V228.191H518.707V97.5352H494.256L454.498 159.317L414.74 97.5352H390.291V228.191H413.061V134.866L453.937 196.086H454.685L495.936 134.492Z" fill="#FFFFFF"/>
              <path d="M656.912 187.875L587.072 97.5352H565.824V228.191H588.596V135.24L660.487 228.191H679.681V97.5352H656.912V187.875Z" fill="#FFFFFF"/>
              <path d="M823.488 97.5352H726.803V228.191H824.421V207.473H749.574V172.571H797.837V151.85H749.574V118.254H823.488V97.5352Z" fill="#FFFFFF"/>
              <path d="M962.067 97.5352H865.381V228.191H963V207.473H888.151V172.571H936.416V151.85H888.151V118.254H962.067V97.5352Z" fill="#FFFFFF"/>
            </svg>
            <span> everywhere.</span>
          </span>
        </motion.h1>

        {/* Subhead and Buttons... (Standard difference mode) */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontSize: '15px', lineHeight: 1.5, color: '#FFFFFF', maxWidth: '460px', margin: 0 }}
        >
           Hosted facilitators to power agents. SDK and middleware to unblock devs building the agentic future.
        </motion.p>
        <motion.div 
           initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
           style={{ display: 'flex', gap: '10px', marginTop: '8px' }}
        >
          <Link href="/docs/quickstart" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#FFFFFF', // Inverts to Black
            color: '#000000', // Inverts to White
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Start Building
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: '6px' }}>
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link href="/docs" style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#000000', // Inverts to White
            color: '#FFFFFF', // Inverts to Black
            border: '1px solid #FFFFFF',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            View Docs
          </Link>
        </motion.div>
      </div>

      {/* === LAYER 2: OVERLAY (NORMAL MODE) === */}
      {/* Renders ONLY the Coin. Everything else is effectively invisible/transparent. */}
      {/* Pointer events none so clicks pass through to Layer 1 buttons */}
      <div style={{
        position: 'absolute', // Absolute over the section
        inset: 0, // Cover entire section
        zIndex: 11, // Above Layer 1
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Match parent section
        padding: '80px 40px 0px', 
        textAlign: 'center', // Match Layer 1
      }}>
         {/* Wrapper to match Layer 1 content widths */}
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',  maxWidth: '900px', gap: '16px' }}>
            
            {/* Ghost Badge (Invisible placeholder) */}
            <div style={{ height: '32px', opacity: 0 }}></div> 

            {/* Ghost Headline with Visible Coin */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'transparent', // Text invisible
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span>Gasless payments for agents.</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15em' }}>
                <span>Native </span>
                <svg width="220" height="50" viewBox="0 0 963 326" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: '-6px' }}>
                  <defs>
                     <linearGradient id="mneeGradientOverlay" x1="68.6452" y1="278.727" x2="253.29" y2="54.0995" gradientUnits="userSpaceOnUse">
                       <stop stopColor="#E78B1F"/>
                       <stop offset="1" stopColor="#FFDB45"/>
                     </linearGradient>
                  </defs>
                  {/* COIN VISIBLE HERE */}
                  <path fillRule="evenodd" clipRule="evenodd" d="M217.737 172.769L217.489 115.409C217.478 112.456 216.303 109.659 214.216 107.572C212.126 105.485 209.327 104.298 206.369 104.298C203.413 104.298 200.614 105.485 198.527 107.572C196.44 109.659 195.253 112.458 195.253 115.414V210.315C195.253 218.949 191.822 227.161 185.722 233.263C179.62 239.365 171.405 242.796 162.77 242.796C154.14 242.796 145.924 239.365 139.822 233.263C133.72 227.161 130.289 218.949 130.289 210.315V115.414C130.289 112.458 129.105 109.659 127.015 107.572C124.928 105.485 122.129 104.298 119.171 104.298C116.215 104.298 113.416 105.485 111.329 107.572C109.242 109.659 108.068 112.456 108.055 115.409L107.806 172.769C106.913 179.95 103.642 186.596 98.5219 191.713C92.4198 197.815 84.2057 201.246 75.5705 201.246C66.9368 201.246 58.7227 197.815 52.6223 191.713C47.5035 186.594 44.2276 179.946 43.3378 172.762L43.0718 156.988L13.7477 156.982H0L0.109238 154.743C2.09468 114.31 18.99 76.3225 47.6111 47.7029C78.2526 17.0615 119.44 0 162.773 0C206.106 0 247.293 17.0615 277.934 47.7029C297.985 67.7537 312.519 92.7096 319.958 120.083L320.688 122.775H298.518L298.058 121.266C291.28 99.2026 279.144 79.1234 262.826 62.8076C236.203 36.1846 200.424 21.365 162.773 21.365C125.12 21.365 89.3419 36.1846 62.7189 62.8076C43.1431 82.385 29.701 107.23 24.1499 134.36L23.8903 135.621H64.4558V168.763C64.4558 171.719 65.6432 174.518 67.73 176.605C69.8168 178.695 72.6161 179.879 75.5736 179.879C78.5296 179.879 81.3289 178.692 83.4157 176.605C85.5025 174.518 86.6899 171.719 86.6899 168.763V115.412C86.6899 106.779 90.1209 98.5662 96.2229 92.4642C102.325 86.3622 110.541 82.9311 119.174 82.9311C127.808 82.9311 136.022 86.3622 142.122 92.4642C148.224 98.5662 151.656 106.78 151.656 115.412V210.313C151.656 213.269 152.843 216.069 154.93 218.155C157.017 220.242 159.817 221.429 162.773 221.429C165.729 221.429 168.529 220.242 170.617 218.155C172.704 216.069 173.89 213.269 173.89 210.313V115.412C173.89 106.779 177.321 98.5662 183.423 92.4642C189.525 86.3622 197.74 82.9311 206.374 82.9311C215.008 82.9311 223.22 86.3622 229.322 92.4642C235.424 98.5662 238.855 106.78 238.855 115.412V168.763C238.855 171.719 240.043 174.518 242.129 176.605C244.216 178.695 247.017 179.879 249.973 179.879C252.929 179.879 255.728 178.692 257.815 176.605C259.905 174.518 261.093 171.719 261.093 168.763V135.621H301.652L301.649 135.606H323.373L323.656 137.407C324.975 145.826 325.635 154.344 325.635 162.864C325.635 206.198 308.575 247.383 277.934 278.026C247.293 308.667 206.108 325.727 162.773 325.727C119.439 325.727 78.2526 308.667 47.6111 278.026C19.2607 249.674 2.39709 212.106 0.169404 172.066L0.0411671 169.814H21.4283L21.5533 171.812C23.7034 206.255 38.3219 238.52 62.7173 262.918C89.3403 289.541 125.121 304.361 162.772 304.361C200.422 304.361 236.202 289.541 262.825 262.918C289.448 236.292 304.267 200.514 304.267 162.864C304.267 161.245 304.24 159.624 304.185 158.006L304.152 156.988H282.47L282.206 172.762C281.313 179.946 278.039 186.594 272.92 191.713C266.818 197.815 258.604 201.246 249.968 201.246C241.336 201.246 233.121 197.815 227.02 191.713C221.903 186.596 218.629 179.95 217.736 172.769H217.737Z" fill="url(#mneeGradientOverlay)"/>
                  
                  {/* LETTERS HIDDEN */}
                  <path style={{ opacity: 0 }} d="..." />
                </svg>
                <span> everywhere.</span>
              </span>
            </motion.h1>

            {/* Ghost Subhead for vertical alignment */}
            <div style={{
              height: '24px', // Approx height of subhead
              marginBottom: '16px', // Approx margin
              opacity: 0
            }}>
               Hosted facilitators to power agents.
            </div>

            {/* Ghost Buttons for vertical alignment */}
            <div style={{
              display: 'flex', gap: '10px', marginTop: '8px', opacity: 0,
              height: '42px' // Approx button height
            }}>
               <div style={{ padding: '12px 24px' }}>Start</div>
            </div>
         </div>
      </div>

    </section>
  );
};
