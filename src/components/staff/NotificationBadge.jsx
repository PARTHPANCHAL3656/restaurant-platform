import React from 'react';
import { motion } from 'framer-motion';

// Small gold pill shown on the right of a sidebar row.
//   1..99  ->  "+1" ... "+99"
//   100+   ->  "99+"
//   0      ->  nothing rendered
export default function NotificationBadge({ count, label = 'new', className = '' }) {
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
      className={`ml-auto shrink-0 min-w-[24px] h-5 px-1.5 rounded-full bg-saffron-gold text-midnight-black text-[11px] leading-none font-bold tabular-nums flex items-center justify-center shadow-[0_0_0_2px_rgba(212,175,55,0.18)] ${className}`}
    >
      {text}
    </motion.span>
  );
}
