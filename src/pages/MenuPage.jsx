import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Footer from '../components/Footer';
import { useStaff } from '../context/StaffContext';

import { getImage } from '../utils/assetHelper';
import { formatINR } from '../utils/currency';

const CATEGORIES = ['Starters', 'Mains', 'Rice & Biryani', 'Breads', 'Desserts', 'Signature Cocktails'];

export default function MenuPage({ onCartToggle }) {
  const { menuItems } = useStaff();
  const { cartItems, addToCart, removeFromCart, getSubtotal, tableNumber, sessionExpired, setSessionExpired } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Starters');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, itemName: '', count: 0 });

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

  // Filter items based on category, search query, and stock availability
  const filteredItems = menuItems.filter(item => {
    // If category in DB is Main Course but tab category is Mains, align them
    const itemCat = item.category === 'Main Course' ? 'Mains' : item.category;
    const matchesCategory = itemCat === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isAvailable = item.available !== false;
    return matchesCategory && matchesSearch && isAvailable;
  });

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      
      {/* Search & Category Tabs sticky header */}
      <nav className="sticky top-12 lg:top-0 bg-gradient-to-b from-[#FBF7EE] to-[#F7F2E2] z-25 border-b border-[#D4AF37]/15 shadow-[0_8px_30px_rgba(212,175,55,0.03)]">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Table Header Details (Clean & Premium Editorial) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left">
            <span className="font-label-caps text-[10px] text-saffron-gold tracking-[0.2em] font-semibold uppercase">
              DIGITAL MENU
            </span>
            <span className="hidden sm:inline opacity-30 text-xs text-subtle-text">•</span>
            <span className="font-serif text-lg text-ink-navy italic font-medium">
              {sectionName}
            </span>
            <span className="hidden sm:inline opacity-30 text-xs text-subtle-text">•</span>
            <span className="font-label-caps text-xs text-saffron-gold font-bold tracking-widest uppercase">
              TABLE {tableNum}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text/40 text-lg">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signature dishes..." 
              className="w-full bg-transparent border-b border-[#D4AF37]/20 py-2 pl-9 pr-4 focus:outline-none focus:border-saffron-gold font-body-md text-xs placeholder:text-subtle-text/30 placeholder:italic text-ink-navy outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop overflow-x-auto hide-scrollbar whitespace-nowrap pt-4 pb-4">
          <div className="flex gap-8 border-b border-[#D4AF37]/15">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`font-label-caps text-label-caps uppercase tracking-wider pb-3 transition-all relative ${
                  selectedCategory === cat 
                    ? 'text-saffron-gold' 
                    : 'text-subtle-text hover:text-saffron-gold'
                }`}
              >
                {cat}
                {selectedCategory === cat && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-saffron-gold" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Menu Layout */}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6 pb-24 md:pt-8 md:pb-12">
        {/* Editorial Section Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center mb-16">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-label-caps text-[10px] text-saffron-gold tracking-[0.3em] uppercase block">Welcome to Spice Garden</span>
            <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-ink-navy leading-none italic">
              Table {tableNum}
            </h1>
            <p className="font-label-caps text-xs text-subtle-text tracking-widest uppercase">
              {sectionName} • Summer Curations
            </p>
            <div className="h-px w-12 bg-saffron-gold my-4" />
            <p className="font-sans text-body-lg text-subtle-text max-w-md leading-relaxed">
              Our Michelin-inspired menu celebrates a century of culinary heritage, reimagined with contemporary artistry and locally sourced botanicals.
            </p>
          </div>
          <div className="lg:col-span-7 h-[300px] lg:h-[450px] overflow-hidden shadow-sm border border-muted-border mt-8 lg:mt-0">
            <img 
              className="w-full h-full object-cover grayscale-[10%]" 
              src={getImage('interior-2.jpg')}
              alt="Dining Experience"
              loading="lazy"
            />
          </div>
        </section>

        {/* Menu Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-muted-border">
            <span className="material-symbols-outlined text-4xl text-subtle-text/40 mb-2">restaurant_menu</span>
            <p className="font-serif text-headline-sm text-subtle-text">No items found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-16">
            {filteredItems.map((item) => {
              const cartItem = cartItems.find(i => i.id === item.id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <article key={item.id} className="group flex flex-col justify-between">
                  <div>
                    {/* Image Block */}
                    <div className="relative aspect-[4/3] md:aspect-[1.4] mb-6 overflow-hidden bg-surface-container shadow-sm border border-muted-border flex items-center justify-center">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" 
                        src={getImage(item.image)}
                        alt={item.name}
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-canvas-cream/90 backdrop-blur-sm px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase border border-muted-border">
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-headline-sm text-ink-navy group-hover:text-saffron-gold transition-colors">{item.name}</h3>
                      <span className="font-serif text-saffron-gold text-lg font-semibold">{formatINR(item.price)}</span>
                    </div>
                    <p className="font-sans text-body-md text-subtle-text mb-6 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end pt-2 border-t border-muted-border/40 min-h-[50px]">
                    {!item.available ? (
                      <span className="font-label-caps text-xs text-subtle-text/50 uppercase tracking-widest px-6 py-3 border border-muted-border/30 bg-[#f4f3f2] select-none cursor-not-allowed">
                        Out of Stock
                      </span>
                    ) : qty > 0 ? (
                      <div className="flex items-center border border-muted-border px-4 py-2 bg-white shadow-sm transition-all duration-300">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span className="mx-6 font-label-caps text-xs font-bold min-w-[20px] text-center">{String(qty).padStart(2, '0')}</span>
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
                        className="bg-ink-navy text-canvas-cream font-cta-label text-cta-label px-8 py-3.5 uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-sm active:scale-95 cursor-pointer"
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
      {cartCount > 0 && (
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



      <Footer />
    </div>
  );
}
