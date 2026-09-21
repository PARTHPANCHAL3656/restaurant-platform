import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import { formatINR } from '../utils/currency';
import ThermalReceipt from '../components/ThermalReceipt';
import api from '../utils/api';
import socket from '../utils/socket';

export default function BillSummaryPage() {
  const navigate = useNavigate();
  const { 
    orderId, 
    activeOrderItems, 
    activeOrderTotal, 
    tableNumber,
    activeOrderTime,
    activeOrderBillNumber
  } = useCart();
  const { restaurantInfo } = useStaff();

  const receiptRef = useRef(null);

  // The REAL invoice, once staff has generated one for this table (see
  // backend invoiceController.generateInvoiceForTable). Before that exists
  // there is genuinely no cashier, no guest name, and no real payment
  // status yet — so this page shows an honest order summary instead of
  // guessing at those fields, and switches to the real bill the moment
  // one is presented.
  const [invoice, setInvoice] = useState(null);
  const hasInvoice = Boolean(invoice);

  useEffect(() => {
    let cancelled = false;
    const fetchInvoice = () => {
      api.get('/api/invoices/my-invoice')
        .then((res) => { if (!cancelled) setInvoice(res.data); })
        .catch(() => { if (!cancelled) setInvoice(null); }); // 404 = no bill presented yet, not an error
    };

    fetchInvoice();
    // Live-refresh the instant staff presents the bill, instead of making
    // the customer reload to see it. The endpoint is scoped server-side to
    // this table's own session, so re-fetching on any table's event is
    // harmless — it just no-ops for tables that aren't ours.
    socket.on('invoice:generated', fetchInvoice);
    return () => {
      cancelled = true;
      socket.off('invoice:generated', fetchInvoice);
    };
  }, []);

  // Fallback mock items matching the exact Stitch design (Step 40) if no order has been placed yet
  const hasActiveOrder = activeOrderItems && activeOrderItems.length > 0;

  const displayTable = hasActiveOrder ? tableNumber : 'Garden Terrace 14';
  const displayTime = hasInvoice
    ? new Date(invoice.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', ' —')
    : hasActiveOrder ? `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${activeOrderTime}` : 'October 24, 2023 — 8:42 PM';

  // Once a real invoice exists it's the source of truth (frozen at the
  // moment staff presented the bill) - prefer it over the live cart, which
  // may no longer reflect what was actually billed.
  const items = hasInvoice
    ? invoice.items.map(i => ({ name: i.name, price: i.price, quantity: i.qty }))
    : hasActiveOrder ? activeOrderItems : [];
  const subtotal = hasInvoice ? invoice.subtotal
    : hasActiveOrder ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
  const serviceCharge = hasInvoice ? invoice.serviceCharge
    : hasActiveOrder && restaurantInfo.serviceChargeEnabled ? Math.round(subtotal * (restaurantInfo.serviceChargePercent / 100)) : 0;
  const gst = hasInvoice ? invoice.gst
    : hasActiveOrder ? Math.round((restaurantInfo.serviceChargeTaxable ? subtotal + serviceCharge : subtotal) * ((restaurantInfo.cgstRate + restaurantInfo.sgstRate) / 100)) : 0;
  const grandTotal = hasInvoice ? invoice.total : hasActiveOrder ? activeOrderTotal : 0;

  // The ID shown to the guest: the invoice number once an Invoice exists,
  // otherwise the SAME number already minted on the order at creation time
  // (see backend utils/nextBillNumber.js) - so this never shows the raw
  // Mongo order id, and always matches what staff will eventually see.
  // Only orders created before that field existed fall back to the id.
  const displayOrderId = hasInvoice ? invoice.invoiceNumber
    : hasActiveOrder ? (activeOrderBillNumber || orderId) : '#SG-992104';

    const handleDownloadPDF = () => {
    const element = receiptRef.current;
    if (!element) return;

    // Guard against capturing an unstyled receipt. If index.css hasn't
    // actually loaded for this element (stale bundle, dev server that
    // silently dropped HMR, a `vite preview` serving an old `dist/`),
    // html2canvas will happily screenshot the *unstyled* markup and hand
    // back a "successful" PDF that looks nothing like the design - this
    // is the exact symptom of a PDF that never changes no matter what you
    // edit. Fail loudly instead of shipping a silently-broken chit.
    const cs = window.getComputedStyle(element.querySelector('.thermal-receipt') || element);
    if (!cs.fontFamily.includes('Courier') || cs.borderTopWidth === '0px') {
      console.warn(
        '[ThermalReceipt] Expected receipt styles (Courier font, 1px border) ' +
        'were not detected on the capture target. This usually means the ' +
        'browser is running a stale JS/CSS bundle. Hard-refresh ' +
        '(Ctrl/Cmd+Shift+R), clear any service workers/caches, and rebuild ' +
        'before retrying. Computed style seen:', cs.fontFamily, cs.borderTopWidth
      );
      alert('The receipt template looks unstyled (stale build?). Please hard-refresh the page and try again.');
      return;
    }

    // windowHeight/scrollY ensure we capture the FULL receipt regardless of
    // where the page happens to be scrolled to when the button is tapped -
    // without this, only whatever's in the current viewport gets captured.
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFCFB',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      // html2canvas clones the page into an offscreen document and
      // re-parses stylesheets there before rasterizing - THAT clone is
      // what actually gets captured, not the live DOM we checked above.
      // That re-parse is async and can race the capture, which is why the
      // guard above sometimes passes yet the PDF still comes out unstyled.
      // Block until the clone itself shows the right styles.
      onclone: (clonedDoc) => new Promise((resolve, reject) => {
        const deadline = Date.now() + 2000;
        const check = () => {
          const el = clonedDoc.querySelector('.thermal-receipt');
          const ccs = el && clonedDoc.defaultView.getComputedStyle(el);
          if (ccs && ccs.fontFamily.includes('Courier') && ccs.borderTopWidth !== '0px') {
            resolve();
          } else if (Date.now() > deadline) {
            reject(new Error('stale-styles'));
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      })
    }).then((canvas) => {
      // JPEG at 0.92 quality instead of uncompressed PNG - same visual
      // result for a receipt, a fraction of the file size.
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgWidth = 72;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const margin = 4;

      // Custom page sized to fit the WHOLE receipt in one page, no matter
      // how long the order is — a fixed 'a4' page silently clipped anything
      // past 295mm, which is why long receipts looked "cut in half."
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth + margin * 2, imgHeight + margin * 2]
      });

      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      pdf.save(`spice_garden_${hasInvoice ? 'invoice' : 'bill'}_${displayOrderId}.pdf`);
    }).catch((err) => {
      console.error('Receipt download failed:', err);
      alert('Could not generate the receipt PDF. Please try again or ask staff for a printed copy.');
    });
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pt-20 flex flex-col justify-between">
      <main className="py-16 px-margin-mobile md:px-0 flex flex-col items-center justify-center max-w-[600px] mx-auto w-full">
        
        {/* Receipt Container */}
        <div 
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
                <p className="tracking-wider uppercase mb-1">{hasInvoice ? 'INVOICE NUMBER' : 'ORDER NUMBER'}</p>
                <p className="font-serif text-base text-ink-navy font-semibold">{displayOrderId}</p>
              </div>
            </div>

            {hasInvoice && (
              <div className="grid grid-cols-2 gap-4 text-left text-xs font-label-caps text-subtle-text mt-4">
                <div>
                  <p className="tracking-wider uppercase mb-1">GUEST</p>
                  <p className="font-serif text-base text-ink-navy font-semibold">{invoice.guestName || 'Guest'}</p>
                </div>
                <div className="text-right">
                  <p className="tracking-wider uppercase mb-1">CASHIER</p>
                  <p className="font-serif text-base text-ink-navy font-semibold">{invoice.generatedBy || 'Floor Manager'}</p>
                </div>
              </div>
            )}

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
                <div key={item.name} className="flex justify-between items-start font-body-md">
                  <div className="flex flex-col">
                    <span className="font-serif text-base text-ink-navy font-semibold">{item.name}</span>
                    <span className="font-sans text-xs text-subtle-text">Qty: {String(item.quantity).padStart(2, '0')}</span>
                  </div>
                  <span className="font-sans text-base text-ink-navy">{formatINR((item.price * item.quantity))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations */}
          <div className="space-y-3 pt-6 border-t border-muted-border font-body-md text-sm text-subtle-text">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink-navy">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (10%)</span>
              <span className="text-ink-navy">{formatINR(serviceCharge)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (7.5%)</span>
              <span className="text-ink-navy">{formatINR(gst)}</span>
            </div>

            {/* Dashed Line */}
            <div className="h-px w-full border-t border-dashed border-muted-border my-4" />

            <div className="flex justify-between items-center font-serif text-lg font-bold text-ink-navy">
              <span className="uppercase tracking-wider">Grand Total</span>
              <span className="text-saffron-gold text-2xl">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-6 bg-surface-container-low border border-muted-border flex flex-col items-center justify-center text-center">
            <p className="font-label-caps text-label-caps text-subtle-text mb-2 uppercase tracking-widest text-[10px]">
              PAYMENT STATUS
            </p>
            <div className="flex items-center space-x-2 text-ink-navy font-semibold font-serif text-lg">
              <span className="material-symbols-outlined text-[22px]">payments</span>
              <span>
                {hasInvoice
                  ? `${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}${invoice.paymentMethod && invoice.paymentMethod !== '—' ? ` · ${invoice.paymentMethod}` : ''}`
                  : 'Pay at Counter'}
              </span>
            </div>
            <p className="mt-3 font-sans text-xs text-subtle-text leading-relaxed">
              {hasInvoice
                ? 'Please settle at the counter before you leave, if you haven\'t already.'
                : 'Please present this summary to the concierge upon departure.'}
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

        {/* The on-screen summary remains spacious for phone reading; this is
            the exact narrow receipt captured for download and printer use. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={receiptRef}>
            <ThermalReceipt
              restaurantInfo={restaurantInfo}
              heading={hasInvoice ? 'TAX INVOICE' : 'BILL SUMMARY'}
              invoice={{
                number: displayOrderId,
                table: displayTable,
                date: displayTime,
                time: hasInvoice
                  ? new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  : (activeOrderTime || '—'),
                items: items.map(item => ({ ...item, qty: item.quantity })),
                subtotal,
                serviceCharge,
                packagingFee: hasInvoice ? (invoice.packagingFee || 0) : 0,
                gst,
                total: grandTotal,
                ...(hasInvoice && {
                  cashier: invoice.generatedBy || 'Floor Manager',
                  guest: invoice.guestName || 'Guest',
                  paymentMethod: invoice.paymentMethod && invoice.paymentMethod !== '—' ? invoice.paymentMethod : 'Pay at Counter',
                  status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
                })
              }}
            />
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
