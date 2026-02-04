"use client";
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer style={{ 
      position: 'relative',
      backgroundColor: '#000000', 
      color: '#FFFFFF',
      padding: '80px 40px 40px',
      overflow: 'hidden'
    }}>
      {/* Floating Watermark */}
      <div style={{
        position: 'absolute',
        bottom: '-15%', // Positioned to crop slightly
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 'clamp(100px, 25vw, 400px)',
        fontWeight: 800,
        color: '#FFFFFF',
        opacity: 0.03, // Subtle watermark
        pointerEvents: 'none',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        zIndex: 0,
        userSelect: 'none'
      }}>
        TWINKLE
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Section: Icons & Links */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '40px',
          marginBottom: '120px' // Spacing before legal text
        }}>
          
          {/* Social Icons (Left) */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="https://github.com/twinkle" target="_blank" rel="noopener noreferrer" style={{ color: '#FFF', transition: 'opacity 0.2s', opacity: 0.8 }} aria-label="GitHub">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017C2 16.44 5.865 20.194 9.839 21.516C10.339 21.605 10.518 21.299 10.518 21.033C10.518 20.793 10.509 20.016 10.504 19.183C7.03 19.851 6.136 18.067 5.923 17.472C5.803 17.133 5.228 16.084 4.721 15.803C4.305 15.572 3.71 15.009 4.708 14.992C5.641 14.975 6.307 15.852 6.524 16.195C7.595 18.006 9.309 17.493 9.982 17.185C10.09 16.406 10.402 15.875 10.749 15.574C7.712 15.228 4.522 14.053 4.522 8.82C4.522 7.331 5.053 6.111 5.923 5.16C5.783 4.815 5.315 3.411 6.056 1.54C6.056 1.54 7.201 1.173 9.809 2.939C10.897 2.636 12.062 2.485 13.221 2.479C14.379 2.485 15.545 2.636 16.634 2.939C19.24 1.173 20.384 1.54 20.384 1.54C21.127 3.411 20.66 4.815 20.521 5.16C21.392 6.111 21.921 7.331 21.921 8.82C21.921 14.066 18.724 15.223 15.679 15.561C16.112 15.934 16.502 16.685 16.502 17.834C16.502 19.479 16.488 20.812 16.488 21.033C16.488 21.303 16.665 21.614 17.172 21.515C21.143 20.191 25 16.439 25 12.017C25 6.484 20.522 2 12 2Z"/>
              </svg>
            </a>
            <a href="https://discord.gg/twinkle" target="_blank" rel="noopener noreferrer" style={{ color: '#FFF', transition: 'opacity 0.2s', opacity: 0.8 }} aria-label="Discord">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.36982C18.798 3.66699 17.168 3.16104 15.471 3.00002C15.446 2.99902 15.422 3.01102 15.411 3.03302C15.197 3.48802 14.957 4.07802 14.792 4.46902C12.966 4.19702 11.144 4.19702 9.342 4.46902C9.18 4.07802 8.93701 3.48802 8.72101 3.03302C8.71001 3.01002 8.686 2.99802 8.661 3.00002C6.963 3.16104 5.334 3.66699 3.815 4.36982C3.804 4.37482 3.796 4.38382 3.791 4.39482C0.689001 9.02982 -0.161999 13.555 0.252001 18.0198C0.254001 18.0438 0.268001 18.0658 0.288001 18.0808C2.336 19.5788 4.316 20.4888 6.262 21.0928C6.287 21.1008 6.314 21.0918 6.329 21.0698C6.791 20.4358 7.205 19.7618 7.564 19.0528C7.581 19.0188 7.563 18.9798 7.527 18.9668C6.884 18.7238 6.269 18.4358 5.679 18.1138C5.628 18.0858 5.623 18.0128 5.672 17.9778C5.801 17.8818 5.928 17.7818 6.05 17.6808C6.064 17.6688 6.084 17.6648 6.103 17.6698C10.06 19.4758 14.332 19.4758 18.257 17.6698C18.276 17.6638 18.297 17.6678 18.31 17.6808C18.434 17.7838 18.561 17.8828 18.691 17.9778C18.74 18.0128 18.736 18.0858 18.685 18.1138C18.092 18.4358 17.474 18.7228 16.83 18.9658C16.794 18.9798 16.777 19.0188 16.793 19.0528C17.155 19.7608 17.569 20.4358 18.028 21.0698C18.043 21.0918 18.07 21.1008 18.095 21.0928C20.045 20.4888 22.025 19.5788 24.072 18.0808C24.093 18.0658 24.106 18.0438 24.108 18.0198C24.585 13.0138 23.332 8.52802 20.36 4.39482C20.354 4.38382 20.347 4.37582 20.336 4.36982H20.317ZM8.02 15.3308C6.836 15.3308 5.867 14.2458 5.867 12.9118C5.867 11.5778 6.817 10.4928 8.02 10.4928C9.233 10.4928 10.198 11.5878 10.173 12.9118C10.173 14.2458 9.223 15.3308 8.02 15.3308ZM16.342 15.3308C15.158 15.3308 14.189 14.2458 14.189 12.9118C14.189 11.5778 15.139 10.4928 16.342 10.4928C17.555 10.4928 18.52 11.5878 18.495 12.9118C18.495 14.2458 17.555 15.3308 16.342 15.3308Z"/>
              </svg>
            </a>
          </div>

          {/* Navigation Links (Right) */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {['Docs', 'Ecosystem', 'Facilitators', 'Pricing'].map((item) => (
              <Link 
                key={item} 
                href={`/docs/${item.toLowerCase()}`} 
                style={{ 
                  color: '#A1A1AA', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom / Legal */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          paddingTop: '32px',
          color: '#52525B', 
          fontSize: '12px',
          lineHeight: 1.6
        }}>
          <p style={{ maxWidth: '600px' }}>
            While Twinkle is an open and neutral protocol, this website is maintained by the Twinkle Foundation. 
            By using this site, you agree to be bound by the <a href="#" style={{ color: '#71717A', textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: '#71717A', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </footer>
  );
};
