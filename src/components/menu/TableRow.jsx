import React from 'react';

// "Dining at TABLE T-01" + "View My Order" side by side.
// The View My Order link keeps its original wiring: same condition
// (a live order exists), same plain href to /order-status.
export default function TableRow({ previewMode, isTakeout, tableNumber, orderId }) {
  if (previewMode) return null;

  // "Table T-09" -> table "T-09". A longer name such as "Patio 4" keeps
  // its first part as a section label; nothing is ever invented.
  const parts = String(tableNumber || '').split(' ');
  const tableNum = parts.pop() || '';
  const sectionName = parts.join(' ');
  const showSection = sectionName.trim() !== '' && sectionName.trim().toLowerCase() !== 'table';

  return (
    <div className="flex items-stretch justify-between gap-3">
      <div className="flex flex-col justify-center rounded-xl bg-white border border-muted-border px-3 py-2 min-w-0">
        <span className="font-label-caps text-[9px] tracking-[0.2em] uppercase text-subtle-text">
          {isTakeout ? 'Order type' : 'Dining at'}
        </span>
        <span className="font-label-caps text-sm font-bold tracking-widest uppercase text-ink-navy truncate">
          {isTakeout ? 'Takeout' : `${showSection ? `${sectionName} ` : ''}TABLE ${tableNum}`}
        </span>
      </div>

      {orderId && (
        <a
          href="/order-status"
          className="inline-flex items-center gap-2 rounded-xl bg-saffron-gold/10 border border-saffron-gold/30 text-ink-navy font-label-caps text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-saffron-gold/20 transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-sm">receipt_long</span>
          View My Order
        </a>
      )}
    </div>
  );
}