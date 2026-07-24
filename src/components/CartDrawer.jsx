import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';

import { getImage } from '../utils/assetHelper';
import { formatINR } from '../utils/currency'

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addOrder } = useStaff();
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    deleteFromCart, 
    getSubtotal, 
    getServiceCharge, 
    getGST, 
    getGrandTotal, 
    placeOrder 
  } = useCart();

  const [specialNotes, setSpecialNotes] = useState('');

  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge(subtotal);
  const gst = getGST(subtotal);
  const total = getGrandTotal();

  const handleCheckout = () => {
    addOrder('T-14', cartItems, specialNotes);
    placeOrder();
    onClose();
    navigate('/order-status');
  };

  // Overlay transition
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  // Content transition (slide from right on desktop, slide from bottom on mobile)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  const drawerVariants = {
    hidden: {
      x: isMobile ? 0 : '100%',
      y: isMobile ? '100%' : 0,
    },
    visible: {
      x: 0,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div 
            className="absolute inset-0 bg-ink-navy/40 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            onClick={onClose}
          />

          {/* Drawer Wrapper */}
          <div className="absolute inset-y-0 right-0 max-w-full flex lg:pl-10">
            <motion.aside 
              className="w-screen max-w-md bg-canvas-cream shadow-2xl flex flex-col h-screen fixed right-0 top-0 lg:static lg:h-full lg:rounded-none rounded-t-[20px] overflow-hidden z-50"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
            >
              {/* Header */}
              <div className="p-6 border-b border-muted-border flex justify-between items-center bg-canvas-cream">
                <div>
                  <h2 className="font-display-lg text-headline-sm text-ink-navy uppercase tracking-wider">Your Selection</h2>
                  <p className="font-body-md text-xs text-subtle-text mt-1">Ready for the kitchen</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-surface-container rounded-full text-ink-navy transition-colors focus:outline-none"
                  aria-label="Close cart"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Items List — independently scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6 bg-canvas-cream">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <span className="material-symbols-outlined text-5xl text-subtle-text/30 mb-4">shopping_bag</span>
                    <p className="font-display-lg text-headline-sm text-ink-navy/50">Your basket is empty</p>
                    <button 
                      onClick={() => { onClose(); navigate('/menu'); }}
                      className="mt-6 font-label-caps text-xs text-saffron-gold tracking-widest border-b border-saffron-gold pb-1 hover:text-ink-navy hover:border-ink-navy transition-colors"
                    >
                      BROWSE MENU
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 pb-6 border-b border-muted-border last:border-0 last:pb-0">
                          {/* Image */}
                          <div className="w-20 h-20 bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img 
                                src={getImage(item.image)} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="font-serif italic text-[10px] text-subtle-text/50 text-center px-1">No Image</span>
                            )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-grow flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-headline-sm text-[16px] text-ink-navy leading-snug">{item.name}</h3>
                                <p className="font-body-md text-xs text-subtle-text line-clamp-1 mt-0.5">{item.description}</p>
                              </div>
                              <span className="font-body-md text-saffron-gold font-semibold">{formatINR((item.price * item.quantity))}</span>
                            </div>

                            {/* Quantity Selector & Remove */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-muted-border px-2.5 py-1">
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
                                  aria-label="Decrease quantity"
                                >
                                  <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                                <span className="mx-4 text-xs font-label-caps min-w-[12px] text-center">{String(item.quantity).padStart(2, '0')}</span>
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
                                  aria-label="Increase quantity"
                                >
                                  <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                              </div>

                              <button 
                                onClick={() => deleteFromCart(item.id)}
                                className="text-xs font-label-caps text-subtle-text hover:text-red-600 transition-colors uppercase tracking-wider"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Special Notes */}
                    <div className="mt-8 pt-6 border-t border-muted-border">
                      <label className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest mb-2 block">Special Instructions</label>
                      <textarea 
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        placeholder="E.g. No onions, extra saffron, allergy warnings..."
                        className="w-full bg-[#f4f3f2] border border-muted-border p-3 text-xs font-body-md focus:outline-none focus:border-ink-navy resize-none h-16 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Bill Details Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 bg-surface-container-low border-t border-muted-border space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-subtle-text">
                      <span className="font-label-caps tracking-wider">Subtotal</span>
                      <span className="font-body-md">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-subtle-text">
                      <span className="font-label-caps tracking-wider">Service Charge (12.5%)</span>
                      <span className="font-body-md">{formatINR(serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-subtle-text">
                      <span className="font-label-caps tracking-wider">GST (5%)</span>
                      <span className="font-body-md">{formatINR(gst)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-subtle-text">
                      <span className="font-label-caps tracking-wider text-saffron-gold">Est. Prep Time</span>
                      <span className="font-body-md text-saffron-gold font-semibold">12-15 MINS</span>
                    </div>
                    <div className="h-px bg-muted-border my-2" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-display-lg text-headline-sm uppercase tracking-wider text-ink-navy">Total</span>
                      <span className="font-display-lg text-headline-sm text-saffron-gold font-bold">{formatINR(total)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 pt-2">
                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-ink-navy text-canvas-cream py-4 font-cta-label text-cta-label tracking-widest uppercase hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-lg text-center"
                    >
                      Place Order
                    </button>
                    <button 
                      onClick={onClose}
                      className="w-full text-center text-xs font-label-caps tracking-widest uppercase text-subtle-text hover:text-ink-navy transition-colors py-2"
                    >
                      Continue Ordering
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
