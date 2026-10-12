import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { isKitchenSoundOn, setKitchenSound, playKitchenChime } from '../../utils/kitchenChime';

export default function StaffSettingsOperationsPage() {
  const { restaurantInfo, updateOpeningHours, reservationRules, updateReservationRules, updateBillingInfo } = useStaff();
  const [hours, setHours] = useState(restaurantInfo.openingHours);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHours(restaurantInfo.openingHours);
  }, [restaurantInfo.openingHours]);

  // Reservation rules are edited as strings (so a field can be briefly
  // empty while typing) and converted to numbers on save.
  const [rules, setRules] = useState({
    resMinLeadTimeHours: String(reservationRules.resMinLeadTimeHours),
    resMaxAdvanceDays: String(reservationRules.resMaxAdvanceDays),
    resHoldGraceMinutes: String(reservationRules.resHoldGraceMinutes),
    resRequireManagerLargeParties: String(reservationRules.resRequireManagerLargeParties),
    resAutoRejectIfFull: !!reservationRules.resAutoRejectIfFull
  });
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesSavedMessage, setRulesSavedMessage] = useState('');
  const [rulesError, setRulesError] = useState('');

  useEffect(() => {
    setRules({
      resMinLeadTimeHours: String(reservationRules.resMinLeadTimeHours),
      resMaxAdvanceDays: String(reservationRules.resMaxAdvanceDays),
      resHoldGraceMinutes: String(reservationRules.resHoldGraceMinutes),
      resRequireManagerLargeParties: String(reservationRules.resRequireManagerLargeParties),
      resAutoRejectIfFull: !!reservationRules.resAutoRejectIfFull
    });
  }, [reservationRules]);

  const updateRule = (field, value) => {
    setRules(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRules = async () => {
    setRulesError('');
    const numericFields = ['resMinLeadTimeHours', 'resMaxAdvanceDays', 'resHoldGraceMinutes', 'resRequireManagerLargeParties'];
    const payload = { resAutoRejectIfFull: rules.resAutoRejectIfFull };
    for (const field of numericFields) {
      const value = Number(rules[field]);
      if (rules[field].trim() === '' || Number.isNaN(value) || value < 0) {
        setRulesError('Every number must be filled in and 0 or higher.');
        return;
      }
      payload[field] = value;
    }
    setIsSavingRules(true);
    try {
      await updateReservationRules(payload);
      setRulesSavedMessage('Saved. New booking requests use these rules immediately.');
      setTimeout(() => setRulesSavedMessage(''), 4000);
    } catch (err) {
      setRulesError(err.response?.data?.error || err.message || 'Could not save. Please try again.');
    } finally {
      setIsSavingRules(false);
    }
  };

  // Kitchen & table timers. The server stores these two numbers with the
  // billing settings, but they have no tax effect, so a Manager may change them.
  const [kitchen, setKitchen] = useState({
    autoServeMinutes: String(restaurantInfo.autoServeMinutes),
    tableAutoReleaseMinutes: String(restaurantInfo.tableAutoReleaseMinutes),
    takeoutSessionEndMinutes: String(restaurantInfo.takeoutSessionEndMinutes)
  });
  const [isSavingKitchen, setIsSavingKitchen] = useState(false);
  const [kitchenSavedMessage, setKitchenSavedMessage] = useState('');
  const [kitchenError, setKitchenError] = useState('');

  useEffect(() => {
    setKitchen({
      autoServeMinutes: String(restaurantInfo.autoServeMinutes),
      tableAutoReleaseMinutes: String(restaurantInfo.tableAutoReleaseMinutes),
      takeoutSessionEndMinutes: String(restaurantInfo.takeoutSessionEndMinutes)
    });
  }, [restaurantInfo.autoServeMinutes, restaurantInfo.tableAutoReleaseMinutes, restaurantInfo.takeoutSessionEndMinutes]);

  const updateKitchen = (field, value) => {
    setKitchen(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveKitchen = async () => {
    setKitchenError('');
    const autoServe = Number(kitchen.autoServeMinutes);
    const autoRelease = Number(kitchen.tableAutoReleaseMinutes);
    const takeoutEnd = Number(kitchen.takeoutSessionEndMinutes);
    if (kitchen.autoServeMinutes.trim() === '' || !Number.isInteger(autoServe) || autoServe < 2 || autoServe > 10) {
      setKitchenError('Auto-serve time must be a whole number between 2 and 10 minutes.');
      return;
    }
    if (kitchen.tableAutoReleaseMinutes.trim() === '' || !Number.isInteger(autoRelease) || autoRelease < 5 || autoRelease > 120) {
      setKitchenError('Auto-release time must be a whole number between 5 and 120 minutes.');
      return;
    }
    if (kitchen.takeoutSessionEndMinutes.trim() === '' || !Number.isInteger(takeoutEnd) || takeoutEnd < 5 || takeoutEnd > 120) {
      setKitchenError('Takeout session end time must be a whole number between 5 and 120 minutes.');
      return;
    }
    setIsSavingKitchen(true);
    try {
      await updateBillingInfo({ autoServeMinutes: autoServe, tableAutoReleaseMinutes: autoRelease, takeoutSessionEndMinutes: takeoutEnd });
      setKitchenSavedMessage('Saved. The new times apply straight away.');
      setTimeout(() => setKitchenSavedMessage(''), 4000);
    } catch (err) {
      setKitchenError(err.response?.data?.error || err.message || 'Could not save. Please try again.');
    } finally {
      setIsSavingKitchen(false);
    }
  };

  // The chime switch is per device and saves the moment it is ticked.
  const [soundOn, setSoundOn] = useState(() => isKitchenSoundOn());
  const handleSoundToggle = (checked) => {
    setSoundOn(checked);
    setKitchenSound(checked);
    if (checked) playKitchenChime(); // so you hear it work
  };

  const updateEntry = (idx, field, value) => {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const addEntry = () => {
    setHours(prev => [...prev, { days: '', hours: '' }]);
  };

  const removeEntry = (idx) => {
    setHours(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError('');
    // A row that already existed reverts to its own previous value if
    // left empty; a brand-new row that's still empty has nothing to
    // revert to, so it's dropped rather than saved blank.
    const previous = restaurantInfo.openingHours;
    const safeHours = hours
      .map((h, idx) => {
        const prev = previous[idx];
        return {
          days: h.days.trim() || (prev ? prev.days : ''),
          hours: h.hours.trim() || (prev ? prev.hours : '')
        };
      })
      .filter(h => h.days && h.hours);
    setHours(safeHours);
    setIsSaving(true);
    try {
      const saved = await updateOpeningHours(safeHours);
      setHours(saved);
      setSavedMessage('Saved. This takes effect immediately for new takeout orders.');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Operations — Opening Hours</h2>
        <p className="text-xs text-subtle-text mb-5">
          Used to set the pickup-time cutoff on the takeout order page, and displayed on the website.
          Each row is a day range (e.g. "Monday - Thursday") and its hours (e.g. "12:00 PM - 10:30 PM").
        </p>

        <div className="space-y-3">
          {hours.map((entry, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center pb-3 sm:pb-0 border-b sm:border-b-0 border-muted-border last:border-0 last:pb-0">
              <input
                type="text"
                value={entry.days}
                onChange={(e) => updateEntry(idx, 'days', e.target.value)}
                placeholder="e.g. Monday - Thursday"
                className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
              <input
                type="text"
                value={entry.hours}
                onChange={(e) => updateEntry(idx, 'hours', e.target.value)}
                placeholder="e.g. 12:00 PM - 10:30 PM"
                className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
              <button
                onClick={() => removeEntry(idx)}
                className="self-end sm:self-auto text-red-500 hover:text-red-600 p-2"
                title="Remove this row"
              >
                <span className="material-symbols-outlined normal-case text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addEntry}
          className="mt-4 text-xs font-semibold text-saffron-gold hover:text-saffron-gold/80 uppercase tracking-widest"
        >
          + Add a day range
        </button>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{error}</p>
        )}
        {savedMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mt-4">{savedMessage}</p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Opening Hours'}
        </button>
      </div>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Operations — Reservation Rules</h2>
        <p className="text-xs text-subtle-text mb-5">
          These rules decide which online booking requests are accepted, and when a booking is flagged late.
          Nothing here ever cancels a reservation or blocks a guest on its own — a Manager always makes that call.
        </p>

        <div className="space-y-5">
          {[
            { field: 'resMinLeadTimeHours', label: 'Minimum notice (hours)', hint: 'Blocks bookings made too close to the table time, e.g. 8:00 PM booked at 7:55 PM.' },
            { field: 'resMaxAdvanceDays', label: 'Furthest booking ahead (days)', hint: 'Blocks bookings made too far in advance.' },
            { field: 'resHoldGraceMinutes', label: 'Table hold grace (minutes)', hint: 'After this long past the booked time, the reservation is flagged LATE. It is never removed automatically.' },
            { field: 'resRequireManagerLargeParties', label: 'Large party rule (guests, 0 = off)', hint: 'Off by default (0): any staff member can confirm any party size. Set a size, e.g. 8, and parties that big or bigger can only be confirmed by a Manager or Owner.' }
          ].map(({ field, label, hint }) => (
            <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:flex-1">
                <label className="block text-sm font-semibold text-ink-navy">{label}</label>
                <p className="text-xs text-subtle-text">{hint}</p>
              </div>
              <input
                type="number"
                min="0"
                value={rules[field]}
                onChange={(e) => updateRule(field, e.target.value)}
                className="w-full sm:w-24 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
          ))}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.resAutoRejectIfFull}
              onChange={(e) => updateRule('resAutoRejectIfFull', e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-ink-navy">Decline requests for fully booked time slots</span>
              <span className="block text-xs text-subtle-text">When on, the booking form greys out slots with no table capacity left. When off, a full slot still lands in Pending for you to handle.</span>
            </span>
          </label>
        </div>

        {rulesError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{rulesError}</p>
        )}
        {rulesSavedMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mt-4">{rulesSavedMessage}</p>
        )}

        <button
          onClick={handleSaveRules}
          disabled={isSavingRules}
          className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSavingRules ? 'Saving...' : 'Save Reservation Rules'}
        </button>
      </div>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Operations — Kitchen &amp; Tables</h2>
        <p className="text-xs text-subtle-text mb-5">
          Timers that keep the kitchen board and table release from getting stuck, and the new-ticket chime.
        </p>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Kitchen Sound</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => handleSoundToggle(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-semibold text-ink-navy">Play a chime when a new ticket arrives</span>
                <span className="block text-xs text-subtle-text">Applies only to the screen you are using now, and saves instantly (no Save button). It is on by default. After a page reload, the first tap on the board wakes the sound.</span>
              </span>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Kitchen Auto-Serve</h3>
            <div>
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Minutes after food is sent out</span>
              <input
                type="number"
                step="1"
                min="2"
                max="10"
                value={kitchen.autoServeMinutes}
                onChange={(e) => updateKitchen('autoServeMinutes', e.target.value)}
                onBlur={() => {
                  // Clicking away corrects it: below 2 becomes 2, above 10 becomes 10, empty becomes 5.
                  const n = Math.round(Number(kitchen.autoServeMinutes));
                  updateKitchen('autoServeMinutes', String(Number.isFinite(n) && kitchen.autoServeMinutes !== '' ? Math.min(10, Math.max(2, n)) : 5));
                }}
                className="w-full sm:w-40 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
            <p className="text-xs text-subtle-text">
              Once the kitchen taps Send out, a ticket that nobody taps Served is marked served automatically after this many minutes (2 to 10). That keeps billing and table release from getting stuck. Tickets that haven't been sent out are never auto-served.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Table Auto-Release</h3>
            <div>
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Minutes after payment</span>
              <input
                type="number"
                step="1"
                min="5"
                max="120"
                value={kitchen.tableAutoReleaseMinutes}
                onChange={(e) => updateKitchen('tableAutoReleaseMinutes', e.target.value)}
                onBlur={() => {
                  // Clicking away corrects it: below 5 becomes 5, above 120 becomes 120, empty becomes 10.
                  const n = Math.round(Number(kitchen.tableAutoReleaseMinutes));
                  updateKitchen('tableAutoReleaseMinutes', String(Number.isFinite(n) && kitchen.tableAutoReleaseMinutes !== '' ? Math.min(120, Math.max(5, n)) : 10));
                }}
                className="w-full sm:w-40 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
            <p className="text-xs text-subtle-text">
              A safety net, not a rule. If staff forget to release a paid table, the system frees it after this many minutes. Staff can always release sooner. It can't be turned off, and the minimum is 5.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Takeout Tracking End</h3>
            <div>
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Minutes after pickup</span>
              <input
                type="number"
                step="1"
                min="5"
                max="120"
                value={kitchen.takeoutSessionEndMinutes}
                onChange={(e) => updateKitchen('takeoutSessionEndMinutes', e.target.value)}
                onBlur={() => {
                  // Clicking away corrects it: below 5 becomes 5, above 120 becomes 120, empty becomes 15.
                  const n = Math.round(Number(kitchen.takeoutSessionEndMinutes));
                  updateKitchen('takeoutSessionEndMinutes', String(Number.isFinite(n) && kitchen.takeoutSessionEndMinutes !== '' ? Math.min(120, Math.max(5, n)) : 15));
                }}
                className="w-full sm:w-40 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
            <p className="text-xs text-subtle-text">
              After a takeout order is marked Picked Up, the customer's tracking page and bill stay available for this many minutes (5 to 120), then close and the customer's browser forgets the order. It protects privacy on shared phones and computers. Cancelled orders close at once.
            </p>
          </div>
        </div>

        {kitchenError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{kitchenError}</p>
        )}
        {kitchenSavedMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mt-4">{kitchenSavedMessage}</p>
        )}

        <button
          onClick={handleSaveKitchen}
          disabled={isSavingKitchen}
          className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSavingKitchen ? 'Saving...' : 'Save Timers'}
        </button>
      </div>
    </div>
  );
}