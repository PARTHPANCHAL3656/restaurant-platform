import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';
import Footer from '../components/Footer';
import DishCard from '../components/menu/DishCard';
import TableRow from '../components/menu/TableRow';
import SelectionBar from '../components/menu/SelectionBar';
import { DIET, buildSections, countLabel } from '../utils/menuUtils';

// The long, finite scroll: every category in staff order, one after another.
// Reached from the category grid (/menu) as /menu/browse?cat=Desserts&diet=veg&special=1
//   cat     - which section to land on (the whole menu is still scrollable)
//   diet    - veg | nonveg (carried over from the grid)
//   special - 1 = Chef's Special only (carried over from the grid)

export default function MenuBrowsePage({ onCartToggle }) {
  const { menuItems, isMenuLoading, categories: staffCategories } = useStaff();
  const { cartItems, addToCart, removeFromCart, getSubtotal, tableNumber, tableToken, isTakeout, orderId } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewMode = !tableToken;

  const dietParam = searchParams.get('diet');
  const diet = dietParam === 'veg' ? DIET.VEG : dietParam === 'nonveg' ? DIET.NONVEG : DIET.ALL;
  const specialOnly = searchParams.get('special') === '1';
  const targetCat = searchParams.get('cat');

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = getSubtotal();
  const qtyById = useMemo(
    () => Object.fromEntries(cartItems.map((ci) => [ci.id, ci.quantity])),
    [cartItems]
  );

  const categoryNames = useMemo(() => staffCategories.map((c) => c.name), [staffCategories]);

  // Only categories that still have dishes after the diet / special filters.
  const sections = useMemo(
    () => buildSections(menuItems, categoryNames, { diet, specialOnly }).filter((s) => s.items.length > 0),
    [menuItems, categoryNames, diet, specialOnly]
  );

  const sectionRefs = useRef({});
  const chipRefs = useRef({});
  const didInitialScroll = useRef(false);
  const [activeName, setActiveName] = useState(targetCat || '');

  // Land on the category the guest tapped on the grid. The list still starts
  // at the first category, so scrolling up shows everything before it.
  useEffect(() => {
    if (didInitialScroll.current || isMenuLoading || sections.length === 0) return;
    didInitialScroll.current = true;
    const el = targetCat ? sectionRefs.current[targetCat] : null;
    if (el) {
      el.scrollIntoView({ block: 'start' });
      setActiveName(targetCat);
    }
  }, [isMenuLoading, sections, targetCat]);

  // Highlight the chip of the section currently under the sticky bar.
  useEffect(() => {
    if (sections.length === 0) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = window.matchMedia('(min-width: 1024px)').matches ? 72 : 136;
      let current = sections[0].name;
      for (const s of sections) {
        const el = sectionRefs.current[s.name];
        if (el && el.getBoundingClientRect().top <= offset) current = s.name;
      }
      setActiveName(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  // Keep the active chip visible inside the sideways-scrolling strip.
  useEffect(() => {
    const chip = chipRefs.current[activeName];
    if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeName]);

  const jumpTo = (name) => {
    const el = sectionRefs.current[name];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  // Filters travel back to the grid so the two pages always agree.
  const gridParams = new URLSearchParams();
  if (diet !== DIET.ALL) gridParams.set('diet', dietParam);
  if (specialOnly) gridParams.set('special', '1');
  const gridQuery = gridParams.toString() ? `?${gridParams.toString()}` : '';

  const hasFilters = diet !== DIET.ALL || specialOnly;

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen">
      {!previewMode && (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-3">
          <TableRow previewMode={previewMode} isTakeout={isTakeout} tableNumber={tableNumber} orderId={orderId} />
        </div>
      )}

      {/* One-line sticky strip: grid icon + sideways-scrolling category chips */}
      <div className="sticky top-16 lg:top-0 z-30 bg-canvas-cream/95 backdrop-blur-md border-b border-muted-border">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-2 flex items-center gap-2">
          <Link
            to={`/menu${gridQuery}`}
            aria-label="All categories"
            className="h-10 w-10 flex-shrink-0 rounded-xl bg-ink-navy text-canvas-cream flex items-center justify-center hover:bg-saffron-gold hover:text-ink-navy transition-colors"
          >
            <span className="material-symbols-outlined text-xl">grid_view</span>
          </Link>
          <div className="flex-1 flex gap-2 overflow-x-auto hide-scrollbar">
            {sections.map((s) => (
              <button
                key={s.name}
                ref={(el) => {
                  chipRefs.current[s.name] = el;
                }}
                onClick={() => jumpTo(s.name)}
                className={`h-10 flex-shrink-0 rounded-xl border px-4 font-label-caps text-[11px] tracking-widest uppercase whitespace-nowrap transition-colors focus:outline-none ${
                  activeName === s.name
                    ? 'bg-ink-navy text-canvas-cream border-ink-navy'
                    : 'bg-surface-container-low text-subtle-text border-muted-border hover:text-ink-navy'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-5 pb-28 md:pb-16">
        {previewMode && (
          <section className="mb-6">
            <a
              href="/reservation"
              className="inline-flex items-center gap-2 font-label-caps text-xs text-ink-navy font-semibold tracking-widest uppercase border-b border-saffron-gold pb-1 hover:text-saffron-gold transition-colors"
            >
              Reserve a table to order online
              <span className="material-symbols-outlined text-sm">east</span>
            </a>
          </section>
        )}

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-subtle-text">Showing</span>
            {diet !== DIET.ALL && (
              <button
                onClick={() => updateParam('diet', null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-navy text-canvas-cream px-3 py-1.5 font-label-caps text-[10px] tracking-widest uppercase"
              >
                {diet === DIET.VEG ? 'Vegetarian' : 'Non-Veg'}
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
            {specialOnly && (
              <button
                onClick={() => updateParam('special', null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-navy text-canvas-cream px-3 py-1.5 font-label-caps text-[10px] tracking-widest uppercase"
              >
                Chef's Special
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        )}

        {isMenuLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-muted-border p-3 space-y-3">
                <div className="flex gap-3">
                  <div className="w-24 h-24 rounded-xl bg-surface-container-low flex-shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-4 w-1/2 rounded bg-surface-container-low" />
                    <div className="h-3 w-full rounded bg-surface-container-low" />
                    <div className="h-3 w-4/5 rounded bg-surface-container-low" />
                  </div>
                </div>
                <div className="h-11 w-full rounded-xl bg-surface-container-low" />
              </div>
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-surface-container-low border border-muted-border">
            <p className="font-serif text-xl text-ink-navy mb-2">No dishes match these filters</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              {hasFilters && (
                <button
                  onClick={() => setSearchParams({}, { replace: true })}
                  className="font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy border-b border-saffron-gold pb-1"
                >
                  Clear filters
                </button>
              )}
              <Link
                to="/menu"
                className="font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy border-b border-saffron-gold pb-1"
              >
                All categories
              </Link>
            </div>
          </div>
        ) : (
          <>
            {sections.map((section, idx) => {
              const next = sections[idx + 1];
              return (
                <section
                  key={section.name}
                  ref={(el) => {
                    sectionRefs.current[section.name] = el;
                  }}
                  className="scroll-mt-[128px] lg:scroll-mt-16 mb-10"
                >
                  <div className="mb-3 px-1">
                    <h2 className="font-serif text-2xl text-ink-navy">{section.name}</h2>
                    <p className="font-label-caps text-[10px] tracking-widest uppercase text-subtle-text mt-1">
                      {countLabel(section.items.length)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.items.map((item) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        qty={qtyById[item.id] || 0}
                        previewMode={previewMode}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>

                  {next && (
                    <button
                      onClick={() => jumpTo(next.name)}
                      className="mt-6 w-full rounded-2xl bg-surface-container-low border border-muted-border py-5 px-4 flex flex-col items-center gap-1 hover:bg-white transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-saffron-gold text-2xl">arrow_downward</span>
                      <span className="font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy">
                        Continue scrolling
                      </span>
                      <span className="font-serif text-lg text-ink-navy">
                        Next: {next.name} · {countLabel(next.items.length)}
                      </span>
                    </button>
                  )}
                </section>
              );
            })}

            <div className="text-center pt-2 pb-4">
              <p className="font-label-caps text-[10px] tracking-widest uppercase text-subtle-text mb-3">
                End of menu
              </p>
              <Link
                to={`/menu${gridQuery}`}
                className="font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy border-b border-saffron-gold pb-1 hover:text-saffron-gold transition-colors"
              >
                Back to all categories
              </Link>
            </div>
          </>
        )}
      </main>

      {!previewMode && (
        <SelectionBar cartCount={cartCount} subtotal={cartSubtotal} onCartToggle={onCartToggle} />
      )}

      <Footer />
    </div>
  );
}