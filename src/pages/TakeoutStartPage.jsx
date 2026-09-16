import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStaff } from '../context/StaffContext';
import api from '../utils/api';
import Footer from '../components/Footer';

// Parses restaurantInfo.openingHours (free-text day ranges like
// "Monday - Thursday" + "12:00 PM - 10:30 PM") to find today's closing
// time, so the pickup time picker can't accept a time after closing.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseDayRange(daysStr) {
  const parts = daysStr.split('-').map(s => s.trim());
  if (parts.length === 1) {
    const idx = DAY_NAMES.indexOf(parts[0]);
    return idx === -1 ? [] : [idx];
  }
  const startIdx = DAY_NAMES.indexOf(parts[0]);
  const endIdx = DAY_NAMES.indexOf(parts[1]);
  if (startIdx === -1 || endIdx === -1) return [];
  const result = [];
  let i = startIdx;
  while (true) {
    result.push(i);
    if (i === endIdx) break;
    i = (i + 1) % 7;
  }
  return result;
}

function parseClosingTime(hoursStr) {
  const closingPart = hoursStr.split('-')[1]?.trim();
  if (!closingPart) return null;
  const match = closingPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let [, h, m, meridiem] = match;
  h = parseInt(h, 10);
  if (meridiem.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
  const closing = new Date();
  closing.setHours(h, parseInt(m, 10), 0, 0);
  return closing;
}

function getTodaysClosingTime(openingHours) {
  const today = new Date().getDay();
  for (const entry of openingHours || []) {
    if (parseDayRange(entry.days).includes(today)) {
      return parseClosingTime(entry.hours);
    }
  }
  return null;
}

export default function TakeoutStartPage() {
  const navigate = useNavigate();
  const { setTableToken } = useCart();
  const { restaurantInfo } = useStaff();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [pickupChoice, setPickupChoice] = useState('ASAP');
  const [specificTime, setSpecificTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Last pickup slot is 30 minutes before actual closing, so the kitchen
  // isn't taking a fresh order right as staff are trying to close up.
  const closingTime = useMemo(() => getTodaysClosingTime(restaurantInfo?.openingHours), [restaurantInfo]);
  const lastPickupTime = useMemo(() => {
    if (!closingTime) return null;
    return new Date(closingTime.getTime() - 30 * 60000);
  }, [closingTime]);
  const lastPickupLabel = lastPickupTime
    ? lastPickupTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const minTimeStr = useMemo(() => {
    const min = new Date(Date.now() + 20 * 60000); // can't schedule sooner than ASAP would take anyway
    return `${String(min.getHours()).padStart(2, '0')}:${String(min.getMinutes()).padStart(2, '0')}`;
  }, []);
  const maxTimeStr = lastPickupTime
    ? `${String(lastPickupTime.getHours()).padStart(2, '0')}:${String(lastPickupTime.getMinutes()).padStart(2, '0')}`
    : null;

  const isPastClosing = pickupChoice === 'Later' && lastPickupTime && new Date() > lastPickupTime;

  const handleStart = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) return;

    let finalPickupTime = 'ASAP';
    if (pickupChoice === 'Later') {
      if (!specificTime) {
        setError('Please choose a pickup time.');
        return;
      }
      const [h, m] = specificTime.split(':').map(Number);
      const chosen = new Date();
      chosen.setHours(h, m, 0, 0);
      if (lastPickupTime && chosen > lastPickupTime) {
        setError(`We're only taking pickup orders until ${lastPickupLabel} today. Please choose an earlier time or call us directly for anything later.`);
        return;
      }
      if (chosen < new Date()) {
        setError('That time has already passed today. Please choose a later time.');
        return;
      }
      finalPickupTime = chosen.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/api/takeout/start', {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        pickupTime: finalPickupTime
      });

      const { token } = res.data;
      localStorage.setItem('tableToken', token);
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
                value={pickupChoice}
                onChange={(e) => setPickupChoice(e.target.value)}
                className="w-full mt-1 border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-saffron-gold bg-white"
              >
                <option value="ASAP">As soon as possible (~20-25 mins)</option>
                <option value="Later">Choose a specific time</option>
              </select>
              {pickupChoice === 'Later' && (
                <div className="mt-3">
                  <input
                    type="time"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    min={minTimeStr}
                    max={maxTimeStr || undefined}
                    className="w-full border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-saffron-gold"
                  />
                  {lastPickupLabel ? (
                    <p className="text-[10px] text-subtle-text/70 mt-1">
                      We're taking pickup orders until {lastPickupLabel} today.
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-600 mt-1">
                      We couldn't confirm today's hours — please call us to schedule a later pickup instead.
                    </p>
                  )}
                  {isPastClosing && (
                    <p className="text-[10px] text-red-600 mt-1">
                      We're closed for new pickup orders for the rest of today.
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !guestName.trim() || !guestPhone.trim() || isPastClosing}
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