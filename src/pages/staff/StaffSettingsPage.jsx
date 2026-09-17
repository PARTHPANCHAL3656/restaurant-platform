import React, { useState, useEffect } from 'react';
import { useStaff } from '../../context/StaffContext';

export default function StaffSettingsPage() {
  const { restaurantInfo, updateOpeningHours } = useStaff();
  const [hours, setHours] = useState(restaurantInfo.openingHours);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHours(restaurantInfo.openingHours);
  }, [restaurantInfo.openingHours]);

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
    const invalid = hours.some(h => !h.days.trim() || !h.hours.trim());
    if (invalid) {
      setError('Every row needs both a days range and hours — remove any empty rows.');
      return;
    }
    setIsSaving(true);
    try {
      await updateOpeningHours(hours);
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
      <h2 className="font-serif text-xl text-ink-navy font-semibold">Settings</h2>
      <p className="text-xs text-subtle-text mt-1 mb-6">
        Changes here apply across the site immediately — no code changes or redeploys needed.
      </p>

      <div className="bg-white border border-muted-border p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg text-ink-navy">Opening Hours</h3>
        </div>
        <p className="text-xs text-subtle-text mb-5">
          Used to set the pickup-time cutoff on the takeout order page, and displayed on the website.
          Each row is a day range (e.g. "Monday - Thursday") and its hours (e.g. "12:00 PM - 10:30 PM").
        </p>

        <div className="space-y-3">
          {hours.map((entry, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <input
                type="text"
                value={entry.days}
                onChange={(e) => updateEntry(idx, 'days', e.target.value)}
                placeholder="e.g. Monday - Thursday"
                className="flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
              <input
                type="text"
                value={entry.hours}
                onChange={(e) => updateEntry(idx, 'hours', e.target.value)}
                placeholder="e.g. 12:00 PM - 10:30 PM"
                className="flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
              <button
                onClick={() => removeEntry(idx)}
                className="text-red-500 hover:text-red-600 p-2"
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
    </div>
  );
}