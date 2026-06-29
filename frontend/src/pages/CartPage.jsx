import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Footer from '../components/Footer';

import { getImage } from '../utils/assetHelper';

export default function CartPage() {
  const navigate = useNavigate();
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

  const subtotal = getSubtotal();
  const serviceCharge = getServiceCharge(subtotal);
  const gst = getGST(subtotal);
  const total = getGrandTotal();

  const handleCheckout = () => {
    placeOrder();
    navigate('/order-status');
  };

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      
      {/* Header */}
      <header className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center border-b border-muted-border">
        <span className="font-label-caps text-label-caps text-saffron-gold tracking-widest uppercase mb-4 block">Shopping Bag</span>
        <h1 className="font-serif text-display-lg-mobile md:text-display-lg mb-4">Your Selection</h1>
        <p className="font-sans text-body-lg text-subtle-text max-w-lg mx-auto">
          Review your culinary selections before sending them to the kitchen master.
        </p>
      </header>

      {/* Main Container */}
      <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-muted-border">
            <span className="material-symbols-outlined text-5xl text-subtle-text/30 mb-4">shopping_bag</span>
            <p className="font-serif text-headline-sm text-ink-navy/60">Your basket is empty</p>
            <button 
              onClick={() => navigate('/menu')}
              className="mt-6 bg-ink-navy text-canvas-cream font-cta-label text-cta-label px-10 py-4 uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            
            {/* Items Listing */}
            <div className="lg:col-span-8 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-6 p-6 bg-white border border-muted-border shadow-sm">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-surface-container overflow-hidden flex-shrink-0 border border-muted-border flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={getImage(item.image)} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif italic text-[11px] text-subtle-text/50 text-center px-1">No Image</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif text-xl text-ink-navy">{item.name}</h3>
                        <p className="font-body-md text-xs text-subtle-text mt-1 leading-relaxed max-w-md">{item.description}</p>
                      </div>
                      <span className="font-serif text-saffron-gold text-lg font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>

                    {/* Quantities */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted-border/40">
                      <div className="flex items-center border border-muted-border px-3 py-1.5 bg-canvas-cream/50">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="mx-6 text-xs font-label-caps font-bold">{String(item.quantity).padStart(2, '0')}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => deleteFromCart(item.id)}
                        className="text-xs font-label-caps text-subtle-text hover:text-red-600 transition-colors uppercase tracking-widest"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Card */}
            <div className="lg:col-span-4 bg-[#f4f3f2] border border-muted-border p-8 md:p-10 space-y-8 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-serif text-headline-sm text-ink-navy">Total Calculation</h3>
                <div className="h-px bg-muted-border w-16"></div>
              </div>

              <div className="space-y-4 text-sm font-body-md text-subtle-text">
                <div className="flex justify-between">
                  <span className="font-label-caps tracking-wide">Subtotal</span>
                  <span className="text-ink-navy">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-caps tracking-wide">Service Charge (12.5%)</span>
                  <span className="text-ink-navy">${serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-label-caps tracking-wide">GST (5%)</span>
                  <span className="text-ink-navy">${gst.toFixed(2)}</span>
                </div>
                
                <div className="h-px bg-muted-border my-4" />

                <div className="flex justify-between items-center font-serif text-lg font-bold text-ink-navy">
                  <span className="uppercase tracking-wider">Grand Total</span>
                  <span className="text-saffron-gold text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-4 pt-4">
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-ink-navy text-canvas-cream py-4 font-cta-label text-cta-label tracking-widest uppercase hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-md"
                >
                  Place Order
                </button>
                <Link 
                  to="/menu"
                  className="text-center font-cta-label text-cta-label text-xs uppercase tracking-widest text-ink-navy hover:text-saffron-gold transition-colors py-2 block border border-ink-navy/20 hover:border-saffron-gold"
                >
                  Continue Ordering
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
