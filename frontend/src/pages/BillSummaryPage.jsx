import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCart } from '../context/CartContext';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';

export default function BillSummaryPage() {
  const navigate = useNavigate();
  const { 
    orderId, 
    activeOrderItems, 
    activeOrderTotal, 
    tableNumber,
    activeOrderTime
  } = useCart();

  const receiptRef = useRef(null);

  // Fallback mock items matching the exact Stitch design (Step 40) if no order has been placed yet
  const hasActiveOrder = activeOrderItems && activeOrderItems.length > 0;
  
  const displayOrderId = hasActiveOrder ? orderId : '#SG-992104';
  const displayTable = hasActiveOrder ? tableNumber : 'Garden Terrace 14';
  const displayTime = hasActiveOrder ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${activeOrderTime}` : 'October 24, 2023 — 8:42 PM';

  const items = hasActiveOrder ? activeOrderItems : [
    { id: 'risotto', name: 'Saffron Infused Risotto', price: 36, quantity: 2 },
    { id: 'quail', name: 'Truffle Glazed Quail', price: 58, quantity: 1 },
    { id: 'krug', name: 'Vintage Krug 2008', price: 240, quantity: 1 },
    { id: 'pannacotta', name: 'Golden Leaf Panna Cotta', price: 15, quantity: 3 }
  ];

  const subtotal = hasActiveOrder 
    ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : 415.00;

  const serviceCharge = hasActiveOrder ? subtotal * 0.125 : 51.88;
  const gst = hasActiveOrder ? subtotal * 0.05 : 23.34;
  const grandTotal = hasActiveOrder ? activeOrderTotal : 490.22;

  const handleDownloadPDF = () => {
    const element = receiptRef.current;
    if (!element) return;

    // Use html2canvas to capture the receipt element
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFCFB'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`spice_garden_bill_${displayOrderId}.pdf`);
    });
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pt-20 flex flex-col justify-between">
      <main className="py-16 px-margin-mobile md:px-0 flex flex-col items-center justify-center max-w-[600px] mx-auto w-full">
        
        {/* Receipt Container */}
        <div 
          ref={receiptRef}
          id="receipt-container"
          className="w-full bg-canvas-cream border border-muted-border p-8 md:p-12 relative overflow-hidden shadow-sm space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <BrandLogo colorClassName="text-ink-navy" />
            </div>
            <p className="font-label-caps text-label-caps text-saffron-gold uppercase tracking-[0.25em] mb-6">
              Michelin Star Experience
            </p>
            
            {/* Dashed Line */}
            <div className="h-px w-full border-t border-dashed border-muted-border my-6" />

            <div className="grid grid-cols-2 gap-4 text-left text-xs font-label-caps text-subtle-text">
              <div>
                <p className="tracking-wider uppercase mb-1">TABLE NUMBER</p>
                <p className="font-serif text-base text-ink-navy font-semibold">{displayTable}</p>
              </div>
              <div className="text-right">
                <p className="tracking-wider uppercase mb-1">ORDER NUMBER</p>
                <p className="font-serif text-base text-ink-navy font-semibold">{displayOrderId}</p>
              </div>
            </div>

            <div className="mt-4 text-left text-xs font-label-caps text-subtle-text">
              <p className="tracking-wider uppercase mb-1">DATE &amp; TIME</p>
              <p className="font-sans text-sm text-ink-navy">{displayTime}</p>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-6">
            <div className="flex justify-between font-label-caps text-xs text-subtle-text border-b border-muted-border pb-2 tracking-widest uppercase">
              <span>Item</span>
              <span>Price</span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start font-body-md">
                  <div className="flex flex-col">
                    <span className="font-serif text-base text-ink-navy font-semibold">{item.name}</span>
                    <span className="font-sans text-xs text-subtle-text">Qty: {String(item.quantity).padStart(2, '0')}</span>
                  </div>
                  <span className="font-sans text-base text-ink-navy">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations */}
          <div className="space-y-3 pt-6 border-t border-muted-border font-body-md text-sm text-subtle-text">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink-navy">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (12.5%)</span>
              <span className="text-ink-navy">${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="text-ink-navy">${gst.toFixed(2)}</span>
            </div>

            {/* Dashed Line */}
            <div className="h-px w-full border-t border-dashed border-muted-border my-4" />

            <div className="flex justify-between items-center font-serif text-lg font-bold text-ink-navy">
              <span className="uppercase tracking-wider">Grand Total</span>
              <span className="text-saffron-gold text-2xl">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-6 bg-[#f4f3f2] border border-muted-border flex flex-col items-center justify-center text-center">
            <p className="font-label-caps text-label-caps text-subtle-text mb-2 uppercase tracking-widest text-[10px]">
              PAYMENT STATUS
            </p>
            <div className="flex items-center space-x-2 text-ink-navy font-semibold font-serif text-lg">
              <span className="material-symbols-outlined text-[22px]">payments</span>
              <span>Pay at Counter</span>
            </div>
            <p className="mt-3 font-sans text-xs text-subtle-text leading-relaxed">
              Please present this summary summary to the concierge upon departure.
            </p>
          </div>

          {/* Footer note */}
          <div className="text-center pt-4">
            <p className="font-sans text-xs text-subtle-text italic">
              Thank you for dining with Spice Garden. We look forward to your return.
            </p>
          </div>

          {/* Overlay Corner Decor */}
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
            <div className="w-full h-full bg-saffron-gold/5 rotate-45 translate-x-10 -translate-y-10"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none">
            <div className="w-full h-full bg-saffron-gold/5 rotate-45 -translate-x-10 translate-y-10"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6 mt-8 w-full">
          <Link 
            to="/" 
            className="font-cta-label text-cta-label text-saffron-gold hover:underline transition-all flex items-center gap-1 uppercase tracking-widest text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </Link>
          <span className="text-muted-border">|</span>
          <button 
            onClick={handleDownloadPDF}
            className="font-cta-label text-cta-label text-ink-navy hover:text-saffron-gold transition-all flex items-center gap-1 uppercase tracking-widest text-xs focus:outline-none"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download Receipt (PDF)
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
}
