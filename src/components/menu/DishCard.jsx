import React from 'react';
import { getImage } from '../../utils/assetHelper';
import { formatINR } from '../../utils/currency';
import { foodTypeLabel, isVeg, splitByQuery } from '../../utils/menuUtils';

// Underlines the part of the text that matches the guest's search.
function Highlight({ text, query }) {
  return (
    <>
      {splitByQuery(text, query).map((part, i) =>
        part.match ? (
          <span key={i} className="underline decoration-saffron-gold decoration-2 underline-offset-2">
            {part.text}
          </span>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

export default function DishCard({ item, qty = 0, previewMode = false, query = '', onAdd, onRemove }) {
  const secondBadge = item.special ? "Chef's Special" : item.tag;
  const veg = isVeg(item);

  return (
    <article className="bg-white border border-muted-border rounded-2xl p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
          <img
            className="w-full h-full object-cover"
            src={getImage(item.image)}
            alt={item.name}
            loading="lazy"
          />
        </div>

        <div className="flex-grow min-w-0 flex flex-col gap-1.5">
          <h3 className="font-serif text-lg leading-snug text-ink-navy">
            <Highlight text={item.name} query={query} />
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-border bg-white px-2 py-0.5 font-label-caps text-[9px] tracking-widest uppercase text-ink-navy">
              <span className={`h-2 w-2 rounded-full ${veg ? 'bg-green-700' : 'bg-red-700'}`} />
              {foodTypeLabel(item)}
            </span>
            {secondBadge && (
              <span
                className={`rounded-full px-2 py-0.5 font-label-caps text-[9px] tracking-widest uppercase ${
                  item.special
                    ? 'bg-saffron-gold/20 border border-saffron-gold/40 text-ink-navy font-bold'
                    : 'bg-surface-container-low border border-muted-border text-subtle-text'
                }`}
              >
                {item.special ? "Chef's Special" : <Highlight text={item.tag} query={query} />}
              </span>
            )}
          </div>

          {item.description && (
            <p className="font-sans text-xs text-subtle-text leading-snug line-clamp-2">
              <Highlight text={item.description} query={query} />
            </p>
          )}

          {item.allergens && item.allergens.length > 0 && (
            <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-wide">
              Contains: <Highlight text={item.allergens.join(', ')} query={query} />
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-muted-border/60 flex items-center justify-between gap-3">
        <span className="font-serif text-xl font-semibold text-ink-navy whitespace-nowrap">
          {formatINR(item.price)}
        </span>

        {previewMode ? (
          <span className="font-label-caps text-[9px] text-subtle-text/70 uppercase tracking-widest flex items-center gap-1.5 select-none whitespace-nowrap">
            <span className="material-symbols-outlined text-sm text-saffron-gold">qr_code_2</span>
            Order at your table
          </span>
        ) : qty > 0 ? (
          <div className="flex items-center rounded-xl border border-muted-border bg-white shadow-sm">
            <button
              onClick={() => onRemove(item.id)}
              className="h-11 w-11 flex items-center justify-center text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
              aria-label="Decrease quantity"
            >
              <span className="material-symbols-outlined text-base font-bold">remove</span>
            </button>
            <span className="min-w-[28px] text-center font-label-caps text-sm font-bold text-ink-navy">
              {String(qty).padStart(2, '0')}
            </span>
            <button
              onClick={() => onAdd(item)}
              className="h-11 w-11 flex items-center justify-center text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
              aria-label="Increase quantity"
            >
              <span className="material-symbols-outlined text-base font-bold">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAdd(item)}
            className="h-11 inline-flex items-center gap-2 rounded-xl bg-ink-navy text-canvas-cream font-cta-label text-cta-label px-5 uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}