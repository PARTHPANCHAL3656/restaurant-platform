import React from 'react';

export default function StaffAvatar({ className = 'w-10 h-10' }) {
  return (
    <div className={`rounded-full bg-[#f4f3f2] border border-[#E5E1DA] overflow-hidden flex items-center justify-center ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#1A1F2C" 
        strokeWidth="1.5" 
        className="w-2/3 h-2/3 opacity-70"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
