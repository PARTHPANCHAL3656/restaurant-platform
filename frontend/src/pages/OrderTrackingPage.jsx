import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Footer from '../components/Footer';

import { getImage } from '../utils/assetHelper';

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    orderId, 
    orderStatus, 
    activeOrderItems, 
    activeOrderTotal, 
    tableNumber,
    setOrderStatus
  } = useCart();

  // Hide simulation toolbar behind a debug flag ?debug=true or ?test=true
  const queryParams = new URLSearchParams(location.search);
  const isDebugMode = queryParams.get('debug') === 'true' || queryParams.get('test') === 'true';

  // Helper to determine status style
  const getStatusStepClass = (step) => {
    const statuses = ['Received', 'Preparing', 'Ready', 'At Table'];
    const currentIndex = statuses.indexOf(orderStatus || 'Received');
    const stepIndex = statuses.indexOf(step);

    if (stepIndex < currentIndex) {
      // Completed step
      return {
        bg: 'bg-saffron-gold text-white ring-8 ring-canvas-cream',
        labelColor: 'text-ink-navy',
        icon: 'check',
        pulse: false
      };
    } else if (stepIndex === currentIndex) {
      // Active step
      return {
        bg: 'bg-saffron-gold text-white ring-8 ring-canvas-cream active-status-dot',
        labelColor: 'text-saffron-gold font-bold',
        icon: step === 'Received' ? 'check' : step === 'Preparing' ? 'restaurant' : step === 'Ready' ? 'room_service' : 'distance',
        pulse: true
      };
    } else {
      // Pending step
      return {
        bg: 'bg-canvas-cream border border-muted-border text-subtle-text ring-8 ring-canvas-cream',
        labelColor: 'text-subtle-text',
        icon: step === 'Received' ? 'check' : step === 'Preparing' ? 'restaurant' : step === 'Ready' ? 'room_service' : 'distance',
        pulse: false
      };
    }
  };

  const getProgressPercentage = () => {
    switch (orderStatus) {
      case 'Received': return 15;
      case 'Preparing': return 50;
      case 'Ready': return 80;
      case 'At Table': return 100;
      default: return 15;
    }
  };

  const displayStatus = orderStatus || 'Received';

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      
      {/* Dev shortcuts header (visible only in debug mode) */}
      {isDebugMode && (
        <div className="bg-saffron-gold/15 py-2 px-margin-mobile md:px-margin-desktop flex items-center justify-between text-xs border-b border-saffron-gold/10">
          <span className="font-label-caps text-subtle-text">Simulate status (DEBUG ACTIVE):</span>
          <div className="flex gap-2">
            {['Received', 'Preparing', 'Ready', 'At Table'].map(s => (
              <button 
                key={s}
                onClick={() => setOrderStatus(s)}
                className={`px-2 py-0.5 border font-label-caps transition-colors ${
                  orderStatus === s ? 'bg-ink-navy text-canvas-cream border-ink-navy' : 'border-muted-border hover:bg-white text-ink-navy'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        
        {/* Status Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-muted-border pb-12">
          <div className="space-y-3">
            <span className="font-label-caps text-label-caps text-saffron-gold tracking-widest uppercase">Live Tracking</span>
            <h1 className="font-serif text-display-lg-mobile md:text-display-lg leading-tight">Your Culinary Journey</h1>
            
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div>
                <p className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase mb-0.5">Order Number</p>
                <p className="font-serif text-xl font-semibold">{orderId}</p>
              </div>
              <div className="w-px h-8 bg-muted-border hidden sm:block" />
              <div>
                <p className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase mb-0.5">Table Number</p>
                <p className="font-serif text-xl font-semibold">{tableNumber}</p>
              </div>
              <div className="w-px h-8 bg-muted-border hidden sm:block" />
              <div>
                <p className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase mb-0.5">Current Status</p>
                <p className="font-serif text-xl font-semibold text-saffron-gold uppercase">{displayStatus}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 border border-muted-border flex flex-col items-center justify-center text-center min-w-[280px] shadow-sm">
            {orderStatus === 'Preparing' ? (
              <>
                <p className="font-label-caps text-label-caps text-subtle-text tracking-widest mb-1">ESTIMATED TIME</p>
                <div className="font-serif text-3xl text-saffron-gold font-bold">10-15 MINS</div>
                <p className="font-body-md text-subtle-text mt-2 italic text-xs">Chef is perfecting your flavors</p>
              </>
            ) : orderStatus === 'At Table' ? (
              <>
                <p className="font-label-caps text-label-caps text-subtle-text tracking-widest mb-1">ORDER STATUS</p>
                <div className="font-serif text-3xl text-saffron-gold font-bold">SERVED</div>
                <p className="font-body-md text-subtle-text mt-2 italic text-xs">Enjoy your culinary selection</p>
              </>
            ) : orderStatus === 'Ready' ? (
              <>
                <p className="font-label-caps text-label-caps text-subtle-text tracking-widest mb-1">ORDER STATUS</p>
                <div className="font-serif text-3xl text-saffron-gold font-bold">READY</div>
                <p className="font-body-md text-subtle-text mt-2 italic text-xs">Ready at pass counter</p>
              </>
            ) : (
              <>
                <p className="font-label-caps text-label-caps text-subtle-text tracking-widest mb-1">ORDER STATUS</p>
                <div className="font-serif text-3xl text-saffron-gold font-bold">RECEIVED</div>
                <p className="font-body-md text-subtle-text mt-2 italic text-xs">Waiting in queue</p>
              </>
            )}
          </div>
        </header>

        {/* Live Timeline progress */}
        <section className="mb-20">
          <div className="relative py-12 max-w-4xl mx-auto">
            {/* Progress lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-muted-border -translate-y-1/2" />
            <motion.div 
              className="absolute top-1/2 left-0 h-[2px] bg-saffron-gold -translate-y-1/2"
              initial={{ width: '15%' }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.8 }}
            />

            {/* Steps */}
            <div className="flex justify-between items-center relative z-10">
              {/* Received */}
              {(() => {
                const step = getStatusStepClass('Received');
                return (
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bg}`}>
                      <span className="material-symbols-outlined !text-[20px]">{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={`font-label-caps text-label-caps uppercase ${step.labelColor}`}>Order Received</p>
                      <p className="font-body-md text-[11px] text-subtle-text mt-0.5">Kitchen Accepted</p>
                    </div>
                  </div>
                );
              })()}

              {/* Preparing */}
              {(() => {
                const step = getStatusStepClass('Preparing');
                return (
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bg}`}>
                      <span className="material-symbols-outlined !text-[20px]">{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={`font-label-caps text-label-caps uppercase ${step.labelColor}`}>Preparing</p>
                      <p className="font-body-md text-[11px] text-subtle-text mt-0.5">Slow tempering</p>
                    </div>
                  </div>
                );
              })()}

              {/* Ready */}
              {(() => {
                const step = getStatusStepClass('Ready');
                return (
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bg}`}>
                      <span className="material-symbols-outlined !text-[20px]">{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={`font-label-caps text-label-caps uppercase ${step.labelColor}`}>Ready</p>
                      <p className="font-body-md text-[11px] text-subtle-text mt-0.5">At pass counter</p>
                    </div>
                  </div>
                );
              })()}

              {/* Served */}
              {(() => {
                const step = getStatusStepClass('At Table');
                return (
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${step.bg}`}>
                      <span className="material-symbols-outlined !text-[20px]">{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={`font-label-caps text-label-caps uppercase ${step.labelColor}`}>At Table</p>
                      <p className="font-body-md text-[11px] text-subtle-text mt-0.5">Served hot</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Order Details Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Sommelier Order More Box */}
          <div className="lg:col-span-4 bg-ink-navy p-10 text-canvas-cream flex flex-col justify-between h-96 shadow-md">
            <div>
              <h3 className="font-serif text-headline-sm text-canvas-cream mb-4">Craving another pairing?</h3>
              <p className="font-body-md text-sm opacity-80 leading-relaxed mb-6">
                Our sommelier has curated a selection of rare vintages that perfectly complement your current order.
              </p>
            </div>
            
            <div className="space-y-4">
              {orderStatus === 'At Table' && (
                <button 
                  onClick={() => navigate('/bill')}
                  className="w-full py-4 bg-saffron-gold text-ink-navy font-cta-label text-cta-label tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase"
                >
                  Request Bill Summary
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                </button>
              )}
              
              <button 
                onClick={() => navigate('/menu')}
                className="w-full py-4 border border-canvas-cream/30 text-canvas-cream font-cta-label text-cta-label tracking-widest hover:bg-canvas-cream hover:text-ink-navy transition-all flex items-center justify-center gap-2 uppercase"
              >
                Order More 
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Active Items Table */}
          <div className="lg:col-span-8 border border-muted-border p-8 md:p-12 bg-white/50 shadow-sm space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-muted-border">
              <h3 className="font-serif text-headline-sm text-ink-navy">Order Summary</h3>
              <span className="font-label-caps text-label-caps text-subtle-text tracking-widest uppercase">
                {activeOrderItems.length} {activeOrderItems.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="space-y-6">
              {activeOrderItems.length === 0 ? (
                <div className="py-6 text-subtle-text italic text-center">
                  No active orders at this table yet. Go to the menu to place an order.
                </div>
              ) : (
                activeOrderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 pb-6 border-b border-muted-border last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-surface-container overflow-hidden flex-shrink-0 border border-muted-border">
                      <img 
                        className="w-full h-full object-cover" 
                        src={getImage(item.image)}
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-grow flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-lg text-ink-navy">{item.name}</h4>
                        <p className="font-body-md text-xs text-subtle-text mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-body-md text-saffron-gold font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeOrderItems.length > 0 && (
              <div className="mt-8 pt-6 border-t border-muted-border flex justify-between items-end">
                <div className="text-left">
                  <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest mb-1">Status</p>
                  <span className="font-label-caps text-xs px-3 py-1 bg-saffron-gold/15 text-saffron-gold font-semibold border border-saffron-gold/20 uppercase tracking-widest">
                    {orderStatus}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest mb-1">Total to Table</p>
                  <p className="font-display-lg text-headline-md text-ink-navy">${activeOrderTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Note from the Kitchen */}
        <section className="mt-24 grid grid-cols-1 lg:grid-cols-12 gap-element-gap items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif text-headline-md text-ink-navy">A Note from the Kitchen</h2>
            <p className="font-sans text-body-lg text-subtle-text leading-relaxed italic">
              "Every dish at Spice Garden is a labor of love and precision. Our chefs are currently slow-tempering the spices for your scallops to ensure the aromatic oils are perfectly released before serving. We appreciate your patience as we prepare your culinary journey."
            </p>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-muted-border flex items-center justify-center bg-[#f4f3f2]">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#D4AF37" 
                  strokeWidth="1.5" 
                  className="w-9 h-9"
                >
                  {/* Puffy top of the chef hat */}
                  <path d="M6 14.5c-1.2 0-2.2-.8-2.2-2 0-1.6 1.6-2.4 3.6-2 .4-1.6 2-2.8 3.6-2.8s3.2 1.2 3.6 2.8c2-.4 3.6.4 3.6 2 0 1.2-1 2-2.2 2H6z" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Chef hat band */}
                  <path d="M6 14.5h12v2.5H6v-2.5z" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Shoulders / Chef coat collar */}
                  <path d="M3.5 22c0-2.2 2.5-3.5 7.5-3.5s7.5 1.3 7.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-[16px] text-ink-navy font-semibold">Our Head Chef</p>
                <p className="font-label-caps text-[10px] text-saffron-gold tracking-widest uppercase mt-0.5">Executive Chef</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 h-[400px] overflow-hidden border border-muted-border shadow-sm">
            <img 
              className="w-full h-full object-cover grayscale-[10%]" 
              src={getImage('tracking-chef-bg.jpg')}
              alt="Kitchen Ambience"
              loading="lazy"
            />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
