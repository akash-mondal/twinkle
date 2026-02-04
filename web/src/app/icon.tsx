import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Twinkle Diamond Logo */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 2L2 9L12 22L22 9L12 2Z" 
            fill="#FFFFFF"
          />
          <path 
            d="M2 9H22M12 2L7 9L12 22L17 9L12 2Z" 
            stroke="#000000"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
