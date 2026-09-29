import React from 'react';
import { formatINR } from '../../utils/currency';

// Floating "Your Selection / View Selection" bar. Position classes are the
// same ones the old MenuPage used; onCartToggle wiring is unchanged.
export default function SelectionBar({ cartCount, subtotal, onCartToggle }) {
  if (cartCount <= 0) return null;

  return (
    <div className="fixed bottom-6 right-6 lg:right-8 z-40 w-[90%] max-w-sm lg:w-80 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0">
      <button
        onClick={onCartToggle}
        className="w-full bg-ink-navy text-canvas-cream rounded-2xl p-3 pl-4 flex justify-between items-center shadow-2xl hover:brightness-110 active:scale-98 transition-all focus:outline-none border border-canvas-cream/10"
      >
        <div className="text-left">
          <span className="font-label-caps tracking-wider text-[9px] block text-saffron-gold">YOUR SELECTION</span>
          <span className="font-serif text-base font-semibold">
            {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
            <span className="text-saffron-gold mx-1.5">•</span>
            {formatINR(subtotal)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-gold text-ink-navy font-label-caps text-[10px] font-bold tracking-widest px-4 py-3 whitespace-nowrap">
          VIEW SELECTION
          <span className="material-symbols-outlined text-sm">east</span>
        </span>
      </button>
    </div>
  );
}