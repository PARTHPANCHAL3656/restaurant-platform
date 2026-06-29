import React from 'react';

export default function BrandLogo({ colorClassName = 'text-current', heightClass = 'h-[62px]' }) {
  return (
    <div className={`pt-5 pb-2 flex items-center justify-center ${colorClassName}`}>
      <svg 
        className={`${heightClass} w-auto`} 
        viewBox="0 0 400 120" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(16, 41) scale(1.2)">
          <path 
            d="M10,30 C15,10 35,5 45,15 C55,25 35,45 25,35 C15,25 10,10 40,5" 
            fill="none" 
            stroke="#D4AF37" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M15,25 C20,15 30,12 35,18" 
            fill="none" 
            stroke="#D4AF37" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </g>
        <text 
          x="85" 
          y="65" 
          fontFamily="'Playfair Display', serif" 
          fontWeight="700" 
          fontSize="32" 
          letterSpacing="0.15em" 
          fill="currentColor"
        >
          SPICE GARDEN
        </text>
        <rect fill="#D4AF37" height="0.5" opacity="0.5" width="220" x="85" y="74"></rect>
        <text 
          x="85" 
          y="92" 
          fontFamily="'Hanken Grotesk', sans-serif" 
          fontSize="11" 
          letterSpacing="0.35em" 
          fill="currentColor" 
          opacity="0.75"
        >
          MODERN INDIAN FINE DINING
        </text>
        <rect fill="#D4AF37" height="0.5" opacity="0.4" width="220" x="85" y="102"></rect>
      </svg>
    </div>
  );
}

