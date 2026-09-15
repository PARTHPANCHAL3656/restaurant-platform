import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';
import api from '../utils/api';
import Footer from '../components/Footer';

export default function TakeoutStartPage() {
  const navigate = useNavigate();
  const { setTableToken } = useCart();
  const { restaurantInfo } = useStaff();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('ASAP');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/api/takeout/start', {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        pickupTime
      });

      const { token } = res.data;
      sessionStorage.setItem('tableToken', token);
      setTableToken(token);
      navigate('/menu');
    } catch (err) {
      setError(err.message || 'Could not start your takeout order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-cream flex flex-col">
      <div className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl text-ink-navy font-semibold mb-2">
              {restaurantInfo?.name || 'Spice Garden'}
            </h1>
            <p className="text-sm text-subtle-text uppercase tracking-widest">Takeout / Pickup Order</p>
            <p className="text-sm text-subtle-text mt-4">
              Order online, skip the line, pay when you pick up. No commission, no middleman.
            </p>
          </div>

          <form onSubmit={handleStart} className="bg-white border border-muted-border p-8 space-y-5">
            <div>
              <label className="text-[11px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="w-full mt-1 border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-saffron-gold"
                placeholder="e.g. Rohan Mehta"
              />
            </div>

            <div>
              <label className="text-[11px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">
                Phone Number
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
                className="w-full mt-1 border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-saffron-gold"
                placeholder="10-digit mobile number"
              />
              <p className="text-[10px] text-subtle-text/70 mt-1">
                We'll only use this to confirm your order and let you know when it's ready.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">
                When will you pick it up?
              </label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full mt-1 border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-saffron-gold bg-white"
              >
                <option value="ASAP">As soon as possible (~20-25 mins)</option>
                <option value="Later today">Later today — I'll confirm at the counter</option>
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !guestName.trim() || !guestPhone.trim()}
              className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[52px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Starting your order...' : 'Start Order — Browse Menu'}
            </button>

            <p className="text-[10px] text-subtle-text/70 text-center leading-relaxed">
              Pay at the counter when you arrive — cash or UPI. No online payment needed.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}