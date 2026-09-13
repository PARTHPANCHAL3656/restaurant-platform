import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Footer from '../components/Footer';
import { useStaff } from '../context/StaffContext';

import { getImage } from '../utils/assetHelper';
import { formatINR } from '../utils/currency';

const CATEGORIES = ['Starters', 'Mains', 'Rice & Biryani', 'Breads', 'Desserts', 'Signature Cocktails'];

export default function MenuPage({ onCartToggle }) {
  const { menuItems, isMenuLoading, categories: staffCategories } = useStaff();
  const { cartItems, addToCart, removeFromCart, getSubtotal, tableNumber, tableToken, sessionExpired, setSessionExpired, orderId, activeOrderItems, consumeFreshScan } = useCart();
  const navigate = useNavigate();
  const previewMode = !tableToken;

  // If this page load came from an actual QR (re)scan - not from clicking
  // "Order More" internally - and the guest already has an order sitting
  // here, send them straight to their order status instead of a blank menu.
  useEffect(() => {
    if (orderId && activeOrderItems && activeOrderItems.length > 0 && cartItems.length === 0 && consumeFreshScan()) {
      navigate('/order-status');
    }
    }, [orderId, activeOrderItems, cartItems.length, consumeFreshScan, navigate]);
  
  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, itemName: '', count: 0 });

  const categories = useMemo(
    () => staffCategories.map((c) => c.name),
    [staffCategories]
  );
  const safeCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : (categories[0] || selectedCategory);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = getSubtotal();

  const handleAddItem = (item) => {
    addToCart(item);
    setToast({
      visible: true,
      itemName: item.name,
      count: cartCount + 1
    });
    // Hide toast after 2.5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  // Parse Table Number: e.g. "Garden Terrace 14" -> "Garden Terrace", "Table 14"
  const parts = tableNumber.split(' ');
  const tableNum = parts.pop() || '14';
  const sectionName = parts.join(' ') || 'Garden Terrace';

  // Filter items based on category, search query, and stock availability.
  // While actively searching, ignore the selected tab entirely — a guest
  // searching "gulab jamun" from the Starters tab should still find it.
  const isSearching = searchQuery.trim().length > 0;
  const filteredItems = menuItems.filter(item => {
    // If category in DB is Main Course but tab category is Mains, align them
    const itemCat = item.category === 'Main Course' ? 'Mains' : item.category;
    const matchesCategory = isSearching || itemCat === safeCategory;
    const matchesSearch = !isSearching || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isAvailable = item.available !== false;
    return matchesCategory && matchesSearch && isAvailable;
  }).sort((a, b) => (b.special === true) - (a.special === true));

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen">

      {/* Search & Category Tabs sticky header */}
      <nav className="sticky top-[64px] lg:top-0 bg-gradient-to-b from-[#FBF7EE] to-[#F7F2E2] z-25 border-b border-saffron-gold/15 shadow-[0_8px_30px_rgba(212,175,55,0.03)]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-3 md:pt-8 md:pb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          
          {/* Table Header Details (Clean & Premium Editorial) */}
          <div className="flex flex-row items-center gap-2 text-left">
            <span className="font-label-caps text-[11px] text-saffron-gold tracking-[0.2em] font-semibold uppercase">
              {previewMode ? 'OUR MENU' : 'DIGITAL MENU'}
            </span>
            {!previewMode && (
              <>
                {sectionName.trim().toLowerCase() !== 'table' && (
                  <>
                    <span className="opacity-30 text-xs text-subtle-text">•</span>
                    <span className="font-serif text-lg text-ink-navy italic font-medium">
                      {sectionName}
                    </span>
                  </>
                )}
                <span className="opacity-30 text-xs text-subtle-text">•</span>
                <span className="font-label-caps text-xs text-saffron-gold font-bold tracking-widest uppercase">
                  TABLE {tableNum}
                </span>
              </>
            )}
          </div>

          {!previewMode && orderId && (
            <a
              href="/order-status"
              className="inline-flex items-center gap-2 bg-saffron-gold/10 border border-saffron-gold/30 text-ink-navy font-label-caps text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-saffron-gold/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              View My Order
            </a>
          )}

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-saffron-gold/70 text-lg">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signature dishes..." 
              className="w-full bg-white/70 border border-saffron-gold/30 rounded-sm py-2.5 pl-9 pr-4 focus:outline-none focus:border-saffron-gold focus:bg-white font-body-md text-sm placeholder:text-subtle-text/60 text-ink-navy outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-4">
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-saffron-gold/15">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`font-label-caps text-label-caps uppercase tracking-wider pb-3 transition-all relative whitespace-nowrap ${
                  safeCategory === cat 
                    ? 'text-saffron-gold' 
                    : 'text-subtle-text hover:text-saffron-gold'
                }`}
              >
                {cat}
                {safeCategory === cat && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-saffron-gold" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Menu Layout */}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6 pb-24 md:pt-8 md:pb-12">
            {previewMode && (
            <section className="mb-8">
              <a
                href="/reservation"
                className="inline-flex items-center gap-2 font-label-caps text-xs text-ink-navy font-semibold tracking-widest uppercase border-b border-saffron-gold pb-1 hover:text-saffron-gold transition-colors"
              >
                Reserve a table to order online
                <span className="material-symbols-outlined text-sm">east</span>
              </a>
            </section>
          )}

        {/* Menu Cards List */}
        {isMenuLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-muted-border p-3 md:p-4 space-y-3">
                <div className="h-4 w-1/2 bg-surface-container" />
                <div className="flex gap-3">
                  <div className="w-24 h-24 bg-surface-container flex-shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-3 w-full bg-surface-container" />
                    <div className="h-3 w-4/5 bg-surface-container" />
                    <div className="h-3 w-2/3 bg-surface-container" />
                  </div>
                </div>
                <div className="h-8 w-full bg-surface-container" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-muted-border">
            <span className="material-symbols-outlined text-4xl text-subtle-text/40 mb-2">restaurant_menu</span>
            <p className="font-serif text-headline-sm text-subtle-text">No items found matching your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const cartItem = cartItems.find(i => i.id === item.id);
              const qty = cartItem ? cartItem.quantity : 0;
              const secondBadge = item.special ? "Chef's Special" : item.tag;

              return (
                <article key={item.id} className="group border border-muted-border p-3 md:p-4 space-y-3">
                  {/* Name */}
                  <h3 className="font-serif text-headline-sm text-ink-navy group-hover:text-saffron-gold transition-colors">{item.name}</h3>

                  {/* Image + Description */}
                  <div className="flex gap-3">
                    <div className="w-24 h-28 md:w-28 md:h-32 flex-shrink-0 overflow-hidden bg-surface-container border border-muted-border">
                      <img 
                        className="w-full h-full object-cover" 
                        src={getImage(item.image)}
                        alt={item.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col gap-1.5">
                      <p className="font-sans text-sm text-subtle-text leading-relaxed line-clamp-4">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.prepTime && (
                          <span className="font-label-caps text-xs text-ink-navy font-semibold uppercase tracking-wide whitespace-nowrap">
                            {item.prepTime}
                          </span>
                        )}
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="font-label-caps text-[9px] text-subtle-text/70 uppercase tracking-wide">
                            Contains: {item.allergens.join(', ')}
                          </p>
                        )}
                        <span className="font-serif text-saffron-gold text-base font-semibold whitespace-nowrap ml-auto">{formatINR(item.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags + Action */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-muted-border/50">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-surface-container-low text-subtle-text px-2.5 py-1 font-label-caps text-[9px] tracking-widest uppercase border border-muted-border">
                        {item.foodType === 'Non Vegetarian' ? 'Non-Veg' : item.foodType === 'Vegetarian' ? 'Veg' : item.foodType}
                      </span>
                      {secondBadge && (
                        <span className={`px-2.5 py-1 font-label-caps text-[9px] tracking-widest uppercase ${
                          item.special ? 'bg-saffron-gold text-ink-navy font-bold' : 'bg-surface-container-low text-subtle-text border border-muted-border'
                        }`}>
                          {secondBadge}
                        </span>
                      )}
                    </div>

                    {previewMode ? (
                      <span className="font-label-caps text-[9px] text-subtle-text/60 uppercase tracking-widest flex items-center gap-1.5 select-none whitespace-nowrap">
                        <span className="material-symbols-outlined text-sm text-saffron-gold/70">qr_code_2</span>
                        Order at your table
                      </span>
                    ) : !item.available ? (
                      <span className="font-label-caps text-[10px] text-subtle-text/50 uppercase tracking-widest px-4 py-2 border border-muted-border/30 bg-surface-container-low select-none cursor-not-allowed whitespace-nowrap">
                        Out of Stock
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex items-center border border-muted-border px-3 py-1.5 bg-white shadow-sm">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span className="mx-4 font-label-caps text-xs font-bold min-w-[16px] text-center">{String(qty).padStart(2, '0')}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="text-ink-navy hover:text-saffron-gold transition-colors flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAddItem(item)}
                        className="bg-ink-navy text-canvas-cream font-cta-label text-cta-label px-5 py-2.5 uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        Add to Order
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Responsive Floating Cart Overlay (Desktop: bottom-right, Mobile: bottom-center) */}
      {!previewMode && cartCount > 0 && (
        <div className="fixed bottom-6 right-6 lg:right-8 z-40 w-[90%] max-w-sm lg:w-80 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0">
          <button 
            onClick={onCartToggle}
            className="w-full bg-ink-navy text-canvas-cream p-4 flex justify-between items-center shadow-2xl hover:brightness-110 active:scale-98 transition-all focus:outline-none border border-canvas-cream/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-saffron-gold text-[22px]">shopping_bag</span>
              <div className="text-left">
                <span className="font-label-caps text-label-caps tracking-wider text-[9px] block opacity-60">YOUR SELECTION</span>
                <span className="font-label-caps text-label-caps tracking-wider text-xs font-semibold">{cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="font-serif text-saffron-gold font-bold text-sm">{formatINR(cartSubtotal)}</span>
              <span className="text-[9px] font-label-caps tracking-widest text-canvas-cream/70 flex items-center gap-0.5">VIEW SELECTION <span className="material-symbols-outlined text-[10px]">east</span></span>
            </div>
          </button>
        </div>
      )}

      {/* Premium Toast Notification (Fades in/out smoothly) */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-ink-navy text-canvas-cream border border-saffron-gold/30 px-6 py-4 shadow-2xl flex items-center justify-between gap-6 min-w-[320px] max-w-sm rounded-sm"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-saffron-gold text-2xl font-bold">check_circle</span>
              <div className="text-left">
                <p className="font-serif text-sm text-canvas-cream font-semibold leading-none mb-1">{toast.itemName} Added</p>
                <p className="font-sans text-[11px] text-canvas-cream/60">{toast.count} {toast.count === 1 ? 'item' : 'items'} in your selection</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setToast(prev => ({ ...prev, visible: false }));
                onCartToggle();
              }}
              className="font-label-caps text-[10px] text-saffron-gold tracking-widest uppercase hover:underline flex items-center gap-1.5 focus:outline-none"
            >
              View Selection <span className="material-symbols-outlined text-xs">east</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Footer */}
      <Footer />
    </div>
  );
}
