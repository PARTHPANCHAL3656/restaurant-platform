import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';
import Footer from '../components/Footer';
import DishCard from '../components/menu/DishCard';
import TableRow from '../components/menu/TableRow';
import SelectionBar from '../components/menu/SelectionBar';
import { DIET, buildSections, countLabel, normalizeQuery } from '../utils/menuUtils';

// Landing page after a QR scan: category grid + search + diet / Chef's Special
// filters. Tapping a tile opens the long scroll at /menu/browse. Searching, or
// switching on Chef's Special, swaps the grid for grouped results.
//   ?diet=veg|nonveg   ?special=1   (kept in the URL so /menu/browse agrees)

const chipBase =
  'min-h-[48px] rounded-2xl border px-2 py-2 flex items-center justify-center gap-2 text-center font-label-caps text-[10px] leading-tight tracking-widest uppercase transition-colors focus:outline-none';
const chipOn = 'bg-ink-navy text-canvas-cream border-ink-navy';
const chipOff = 'bg-white text-ink-navy border-muted-border hover:border-saffron-gold';

export default function MenuPage({ onCartToggle }) {
  const { menuItems, isMenuLoading, categories: staffCategories } = useStaff();
  const { cartItems, addToCart, removeFromCart, getSubtotal, tableNumber, tableToken, isTakeout, orderId, activeOrderItems, consumeFreshScan } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewMode = !tableToken;

  // If this page load came from an actual QR (re)scan - not from clicking
  // "Order More" internally - and the guest already has an order sitting
  // here, send them straight to their order status instead of a blank menu.
  useEffect(() => {
    if (orderId && activeOrderItems && activeOrderItems.length > 0 && cartItems.length === 0 && consumeFreshScan()) {
      navigate('/order-status');
    }
  }, [orderId, activeOrderItems, cartItems.length, consumeFreshScan, navigate]);

  const dietParam = searchParams.get('diet');
  const diet = dietParam === 'veg' ? DIET.VEG : dietParam === 'nonveg' ? DIET.NONVEG : DIET.ALL;
  const specialOnly = searchParams.get('special') === '1';
  const [query, setQuery] = useState('');
  const isSearching = normalizeQuery(query).length > 0;
  const resultsMode = isSearching || specialOnly;

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = getSubtotal();
  const qtyById = useMemo(
    () => Object.fromEntries(cartItems.map((ci) => [ci.id, ci.quantity])),
    [cartItems]
  );

  // Category order is whatever staff set in Menu Management (sortOrder).
  const categoryNames = useMemo(() => staffCategories.map((c) => c.name), [staffCategories]);

  const tiles = useMemo(
    () => buildSections(menuItems, categoryNames, { diet }).filter((s) => s.items.length > 0),
    [menuItems, categoryNames, diet]
  );

  const resultSections = useMemo(() => {
    if (!resultsMode) return [];
    return buildSections(menuItems, categoryNames, { diet, specialOnly, query }).filter((s) => s.items.length > 0);
  }, [resultsMode, menuItems, categoryNames, diet, specialOnly, query]);
  const totalFound = resultSections.reduce((sum, s) => sum + s.items.length, 0);

  // Built from scratch on purpose: never carries a stale ?token= back into the URL.
  const applyFilters = (nextDiet, nextSpecial) => {
    const p = new URLSearchParams();
    if (nextDiet !== DIET.ALL) p.set('diet', nextDiet);
    if (nextSpecial) p.set('special', '1');
    setSearchParams(p, { replace: true });
  };
  const toggleDiet = (value) => applyFilters(diet === value ? DIET.ALL : value, specialOnly);
  const toggleSpecial = () => applyFilters(diet, !specialOnly);
  const clearAll = () => {
    setQuery('');
    applyFilters(DIET.ALL, false);
  };

  const browseLink = (categoryName) => {
    const p = new URLSearchParams({ cat: categoryName });
    if (diet !== DIET.ALL) p.set('diet', diet);
    if (specialOnly) p.set('special', '1');
    return `/menu/browse?${p.toString()}`;
  };

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-28 md:pt-8 md:pb-16">
        {!previewMode && (
          <div className="mb-4">
            <TableRow previewMode={previewMode} isTakeout={isTakeout} tableNumber={tableNumber} orderId={orderId} />
          </div>
        )}

        {previewMode && (
          <section className="mb-5">
            <a
              href="/reservation"
              className="inline-flex items-center gap-2 font-label-caps text-xs text-ink-navy font-semibold tracking-widest uppercase border-b border-saffron-gold pb-1 hover:text-saffron-gold transition-colors"
            >
              Reserve a table to order online
              <span className="material-symbols-outlined text-sm">east</span>
            </a>
          </section>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-muted-border px-4 h-12 mb-3 focus-within:border-saffron-gold transition-colors">
          <span className="material-symbols-outlined text-saffron-gold">search</span>
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes or allergens..."
            className="flex-1 min-w-0 bg-transparent outline-none font-sans text-base text-ink-navy placeholder:text-subtle-text/70"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="h-7 w-7 flex-shrink-0 rounded-full bg-surface-container-low flex items-center justify-center text-ink-navy"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => toggleDiet(DIET.VEG)}
            aria-pressed={diet === DIET.VEG}
            className={`${chipBase} ${diet === DIET.VEG ? chipOn : chipOff}`}
          >
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-700" />
            Vegetarian
          </button>
          <button
            onClick={() => toggleDiet(DIET.NONVEG)}
            aria-pressed={diet === DIET.NONVEG}
            className={`${chipBase} ${diet === DIET.NONVEG ? chipOn : chipOff}`}
          >
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-700" />
            Non-Veg
          </button>
          <button
            onClick={toggleSpecial}
            aria-pressed={specialOnly}
            className={`${chipBase} ${specialOnly ? chipOn : chipOff}`}
          >
            <span className="material-symbols-outlined text-sm flex-shrink-0">star</span>
            Chef's Special
          </button>
        </div>

        {isMenuLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-muted-border p-4 min-h-[112px] space-y-3">
                <div className="h-3 w-6 rounded bg-surface-container-low" />
                <div className="h-5 w-3/4 rounded bg-surface-container-low" />
              </div>
            ))}
          </div>
        ) : resultsMode ? (
          /* ---------- Results: grouped by category, category order ---------- */
          <>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <p className="font-serif text-ink-navy">
                <span className="text-lg font-semibold">{countLabel(totalFound)} found</span>
                <span className="text-sm text-subtle-text ml-2">in {countLabel(resultSections.length, 'section', 'sections')}</span>
              </p>
              <button
                onClick={clearAll}
                className="flex-shrink-0 font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy border-b border-saffron-gold pb-0.5"
              >
                Clear filters
              </button>
            </div>

            {resultSections.length === 0 ? (
              <div className="text-center py-14 rounded-2xl bg-surface-container-low border border-muted-border">
                <p className="font-serif text-xl text-ink-navy">No dishes found</p>
                <p className="font-sans text-sm text-subtle-text mt-2">Try a different word or clear the filters.</p>
              </div>
            ) : (
              resultSections.map((section) => (
                <section key={section.name} className="mb-6">
                  <div className="flex items-center gap-2 rounded-xl bg-surface-container-low border border-muted-border px-3 py-2 mb-3">
                    <h2 className="min-w-0 truncate font-serif text-lg text-ink-navy">{section.name}</h2>
                    <span className="flex-shrink-0 rounded-full bg-white border border-muted-border px-2 py-0.5 font-label-caps text-[9px] tracking-widest uppercase text-ink-navy whitespace-nowrap">
                      {countLabel(section.items.length, 'match', 'matches')}
                    </span>
                    <Link
                      to={browseLink(section.name)}
                      className="ml-auto flex-shrink-0 inline-flex items-center gap-1 font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy whitespace-nowrap hover:text-saffron-gold transition-colors"
                    >
                      <span className="hidden sm:inline">Jump to section</span>
                      <span className="sm:hidden">Jump</span>
                      <span className="material-symbols-outlined text-sm">north_east</span>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.items.map((item) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        qty={qtyById[item.id] || 0}
                        previewMode={previewMode}
                        query={isSearching ? query : ''}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        ) : (
          /* ---------- Category grid ---------- */
          <>
            <div className="flex items-baseline justify-between mb-4">
              <h1 className="font-serif text-2xl text-ink-navy">Menu Categories</h1>
              <span className="font-label-caps text-[10px] tracking-widest uppercase text-subtle-text">
                {countLabel(tiles.length, 'section', 'sections')}
              </span>
            </div>

            {tiles.length === 0 ? (
              <div className="text-center py-14 rounded-2xl bg-surface-container-low border border-muted-border">
                <p className="font-serif text-xl text-ink-navy">
                  {menuItems.length === 0 ? 'Our menu is being prepared' : 'No dishes match this filter'}
                </p>
                {diet !== DIET.ALL && (
                  <button
                    onClick={clearAll}
                    className="mt-4 font-label-caps text-[10px] tracking-widest uppercase font-bold text-ink-navy border-b border-saffron-gold pb-0.5"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tiles.map((s, i) => (
                  <Link
                    key={s.name}
                    to={browseLink(s.name)}
                    className="group rounded-2xl bg-white border border-muted-border p-4 min-h-[112px] flex flex-col justify-between hover:border-saffron-gold active:scale-[0.98] transition-all max-md:[&:last-child:nth-child(odd)]:col-span-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-label-caps text-[10px] tracking-widest text-subtle-text">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="material-symbols-outlined text-base text-subtle-text group-hover:text-saffron-gold transition-colors">
                        north_east
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif text-xl leading-tight text-ink-navy">{s.name}</h3>
                      <p className="font-label-caps text-[10px] tracking-widest uppercase text-subtle-text mt-1">
                        {countLabel(s.items.length)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
