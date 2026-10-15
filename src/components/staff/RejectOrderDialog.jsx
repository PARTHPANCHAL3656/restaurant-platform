import React from 'react';

// The quick reasons staff pick when they turn an order away. Staff never type
// a reason; each code maps to a friendly line the guest sees (see
// backend/src/utils/cancelReasons.js, keep the codes in step).
export const REJECT_REASONS = [
  { code: 'closing', label: 'Kitchen closing soon' },
  { code: 'busy', label: 'Too many orders right now' },
  { code: 'unavailable', label: "An item isn't available" },
  { code: 'later', label: 'Please order another time' },
  { code: 'guest_called', label: 'Guest called to cancel' }
];

export default function RejectOrderDialog({ title, note, reasons, busy, error, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <div className="bg-white w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 bg-ink-navy text-canvas-cream">
          <h3 className="font-serif text-xl">{title}</h3>
          <p className="text-xs text-canvas-cream/70 mt-1">{note}</p>
        </div>
        <div className="p-6 space-y-3">
          {reasons.map(r => (
            <button
              key={r.code}
              type="button"
              disabled={busy}
              onClick={() => onPick(r.code)}
              className="w-full h-12 border border-muted-border text-ink-navy text-xs font-semibold uppercase tracking-widest hover:border-saffron-gold hover:bg-canvas-cream disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {r.label}
            </button>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="w-full text-subtle-text text-xs font-semibold uppercase tracking-widest py-2 cursor-pointer"
          >
            Keep this order
          </button>
        </div>
      </div>
    </div>
  );
}