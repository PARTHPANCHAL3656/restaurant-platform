import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '../utils/api';

const STATUS_COPY = {
  pending:  { emoji: '🟡', label: 'Pending Review', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  confirmed:{ emoji: '🟢', label: 'Confirmed',        tone: 'text-green-700 bg-green-50 border-green-200' },
  rejected: { emoji: '🔴', label: 'Declined',          tone: 'text-red-700 bg-red-50 border-red-200' },
  cancelled:{ emoji: '⚪', label: 'Cancelled',         tone: 'text-subtle-text bg-surface-container-low border-muted-border' },
  seated:   { emoji: '🟢', label: 'Seated',            tone: 'text-green-700 bg-green-50 border-green-200' },
  'no-show':{ emoji: '⚪', label: 'Marked No-Show',    tone: 'text-subtle-text bg-surface-container-low border-muted-border' }
};

function statusMessage(res) {
  switch (res.status) {
    case 'pending':
      return `We're checking table availability for ${res.time} on ${res.date}. We'll call within 2 hours of your request.`;
    case 'confirmed':
      return `See you on ${res.date} at ${res.time} for ${res.guests} ${res.guests === 1 ? 'guest' : 'guests'}. Tables are held for a short grace period past the booked time, so please let us know if you're running late.`;
    case 'seated':
      return `You're already checked in — enjoy your meal!`;
    case 'rejected':
      return `Unfortunately we're fully booked for ${res.time} on ${res.date}. Please try another time.`;
    case 'cancelled':
      return `This reservation was cancelled.`;
    case 'no-show':
      return `This reservation was marked as a no-show.`;
    default:
      return '';
  }
}

export default function ReservationTrackerPage() {
  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get(`/api/reservations/status/${encodeURIComponent(phone.trim())}`, {
        params: { ref: reference.trim() }
      });
      setResult(res.data);
    } catch (err) {
      // api.js turns server errors into plain Error objects carrying the
      // server's message, so read err.message (err.response is not kept).
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = result ? (STATUS_COPY[result.status] || STATUS_COPY.pending) : null;

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20 lg:pt-0 flex flex-col">
      <header className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center border-b border-muted-border w-full">
        <span className="font-label-caps text-label-caps text-saffron-gold tracking-[0.3em] uppercase mb-4 block">Table Booking</span>
        <h1 className="font-serif text-display-lg-mobile md:text-display-lg mb-6 max-w-3xl mx-auto">Check Reservation</h1>
        <p className="font-sans text-body-lg text-subtle-text max-w-2xl mx-auto">
          Didn't get a call yet? Look up your reservation with the phone number you booked with and the reference code from your confirmation. Lost it? Call us and we'll find it for you.
        </p>
      </header>

      <main className="flex-grow px-margin-mobile md:px-margin-desktop max-w-[560px] mx-auto py-16 w-full">
        <form onSubmit={handleCheck} className="bg-white/50 border border-muted-border shadow-sm p-6 md:p-10 space-y-6">
          <div>
            <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="The number you booked with"
              required
              className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none"
            />
          </div>

          <div>
            <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Reference Code</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="From your confirmation, e.g. RES-3F9A2C"
              required
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone.trim() || !reference.trim()}
            className="w-full bg-ink-navy text-canvas-cream font-cta-label text-cta-label py-4 uppercase tracking-[0.2em] hover:bg-saffron-gold hover:text-ink-navy transition-all duration-500 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>

          {error && (
            <div className="p-4 bg-red-900/10 border border-red-500/30 text-red-700 text-xs font-sans tracking-wide">
              {error}
            </div>
          )}

          {result && statusInfo && (
            <div className={`p-6 border space-y-3 ${statusInfo.tone}`}>
              <p className="font-serif text-xl">
                {statusInfo.emoji} {statusInfo.label}
              </p>
              <p className="font-sans text-sm leading-relaxed">{statusMessage(result)}</p>
              <div className="pt-3 border-t border-current/20 text-xs font-label-caps uppercase tracking-wider space-y-1">
                <div className="flex justify-between"><span>Reference</span><span className="font-mono">{result.referenceCode}</span></div>
                <div className="flex justify-between"><span>Guest</span><span>{result.name}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{result.date}</span></div>
                <div className="flex justify-between"><span>Time</span><span>{result.time}</span></div>
                <div className="flex justify-between"><span>Party Size</span><span>{result.guests}</span></div>
              </div>
            </div>
          )}
        </form>

        <Link
          to="/reservation"
          className="block text-center mt-8 text-xs font-label-caps tracking-widest uppercase text-subtle-text hover:text-ink-navy transition-colors"
        >
          Make a New Reservation
        </Link>
      </main>

      <Footer />
    </div>
  );
}