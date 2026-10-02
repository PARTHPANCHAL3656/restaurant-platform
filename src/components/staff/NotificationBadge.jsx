import React from 'react';
import { motion } from 'framer-motion';

// Small gold pill used for notification counters.
//   1..99  ->  "+1" ... "+99"
//   100+   ->  "99+"
//   0      ->  nothing rendered
//
// size="md" is the sidebar pill, size="sm" is the compact one used on the
// header bell and the mobile menu button.
const SIZES = {
  md: 'min-w-[24px] h-5 px-1.5 text-[11px]',
  sm: 'min-w-[18px] h-[18px] px-1 text-[10px]',
};

export default function NotificationBadge({ count, label = 'new', size = 'md', className = 'ml-auto' }) {
  const n = Number(count) || 0;
  if (n < 1) return null;

  const text = n > 99 ? '99+' : `+${n}`;

  return (
    <motion.span
      // Changing `key` remounts the pill, so it "pops" every time the number changes.
      key={text}
      initial={{ scale: 0.6, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      role="status"
      aria-label={`${n > 99 ? 'More than 99' : n} ${label}`}
      className={`shrink-0 rounded-full bg-saffron-gold text-midnight-black leading-none font-bold tabular-nums flex items-center justify-center ${SIZES[size] || SIZES.md} ${className}`}
    >
      {text}
    </motion.span>
  );
}
