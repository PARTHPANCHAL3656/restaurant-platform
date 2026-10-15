import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Footer from '../components/Footer';
import CallRestaurantNote from '../components/CallRestaurantNote';

export default function ReservationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const reservation = location.state?.reservation;
  const [copied, setCopied] = useState(false);

  const copyReference = async () => {
    const code = reservation?.referenceCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      // Older or non-secure browsers: fall back to a temporary text box.
      const box = document.createElement('textarea');
      box.value = code;
      document.body.appendChild(box);
      box.select();
      try { document.execCommand('copy'); } catch (err) { /* nothing more to try */ }
      document.body.removeChild(box);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Launch premium confetti burst on successful reservation request
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#1A1F2C', '#FDFCFB']
    });
  }, []);

  const formattedDate = reservation?.date 
    ? new Date(reservation.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '--';

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20 flex flex-col justify-between">
      <main className="flex-grow flex items-center justify-center px-margin-mobile py-16 max-w-[600px] mx-auto w-full">
        <div className="bg-white border border-muted-border p-8 md:p-16 text-center shadow-sm w-full space-y-8 relative overflow-hidden">
          
          {/* Saffron Check Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-saffron-gold/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-saffron-gold font-bold">check_circle</span>
            </div>
          </div>

          <div className="space-y-4">
            <span className="font-label-caps text-label-caps text-saffron-gold tracking-[0.25em] uppercase block">Request Pending</span>
            <h1 className="font-serif text-headline-md md:text-headline-lg leading-tight">Reservation Requested</h1>
            <p className="font-sans text-body-lg text-subtle-text leading-relaxed">
              We have received your table booking request. Our host concierge will review and contact you within 2 hours to confirm your table.
            </p>
          </div>

          {reservation?.referenceCode && (
            <div className="bg-saffron-gold/10 border border-saffron-gold/30 py-4 px-4 space-y-3">
              <div>
                <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">Your reference</p>
                <p className="font-serif text-2xl text-ink-navy tracking-wider">{reservation.referenceCode}</p>
              </div>
              <button
                type="button"
                onClick={copyReference}
                className="text-xs font-label-caps tracking-widest uppercase text-ink-navy border border-ink-navy/30 px-4 py-2 hover:bg-ink-navy hover:text-canvas-cream transition-colors cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy reference'}
              </button>
              <p className="text-[11px] text-subtle-text leading-relaxed">
                Please record this reference number. You'll need it, with your phone number, to check your booking.
              </p>
            </div>
          )}

          {/* Details Table */}
          {reservation ? (
            <div className="border-t border-b border-muted-border py-6 my-6 text-left space-y-4 font-body-md text-sm">
              <div className="flex justify-between">
                <span className="text-subtle-text font-label-caps tracking-wider uppercase text-[11px]">Guest Name</span>
                <span className="text-ink-navy font-semibold">{reservation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle-text font-label-caps tracking-wider uppercase text-[11px]">Contact Phone</span>
                <span className="text-ink-navy">{reservation.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle-text font-label-caps tracking-wider uppercase text-[11px]">Date</span>
                <span className="text-ink-navy">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle-text font-label-caps tracking-wider uppercase text-[11px]">Time Slot</span>
                <span className="text-ink-navy font-semibold">{reservation.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtle-text font-label-caps tracking-wider uppercase text-[11px]">Party Size</span>
                <span className="text-ink-navy">{reservation.guests} {reservation.guests === '1' ? 'Person' : 'People'}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-subtle-text italic">No reservation details found.</div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-ink-navy text-canvas-cream py-4 font-cta-label text-cta-label tracking-widest uppercase hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-md"
            >
              Scan Table QR / View Menu
            </button>
            <Link
              to="/check-reservation"
              className="w-full block text-center border border-ink-navy text-ink-navy py-4 font-cta-label text-cta-label tracking-widest uppercase hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300"
            >
              Check Reservation Status
            </Link>
            <Link 
              to="/"
              className="text-xs font-label-caps tracking-widest uppercase text-subtle-text hover:text-ink-navy transition-colors py-2 block"
            >
              Back to Home
            </Link>
          </div>

          <CallRestaurantNote className="text-center mt-6">
            To cancel or change this reservation, please call the restaurant and speak to the manager:
          </CallRestaurantNote>

          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
            <div className="w-full h-full bg-saffron-gold/5 rotate-45 translate-x-8 -translate-y-8"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
            <div className="w-full h-full bg-saffron-gold/5 rotate-45 -translate-x-8 translate-y-8"></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
