import React, { useState, useEffect } from 'react';
import { useStaff } from '../../context/StaffContext';

export default function StaffSettingsPage() {
  const { restaurantInfo, updateOpeningHours, updateLegalInfo } = useStaff();
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';

  const [hours, setHours] = useState(restaurantInfo.openingHours);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  const [legalForm, setLegalForm] = useState({
    name: restaurantInfo.name,
    tagline: restaurantInfo.tagline,
    address: restaurantInfo.address,
    gstin: restaurantInfo.gstin,
    fssai: restaurantInfo.fssai
  });
  const [isSavingLegal, setIsSavingLegal] = useState(false);
  const [legalSavedMessage, setLegalSavedMessage] = useState('');
  const [legalError, setLegalError] = useState('');

  useEffect(() => {
    setHours(restaurantInfo.openingHours);
  }, [restaurantInfo.openingHours]);

  useEffect(() => {
    setLegalForm({
      name: restaurantInfo.name,
      tagline: restaurantInfo.tagline,
      address: restaurantInfo.address,
      gstin: restaurantInfo.gstin,
      fssai: restaurantInfo.fssai
    });
  }, [restaurantInfo.name, restaurantInfo.tagline, restaurantInfo.address, restaurantInfo.gstin, restaurantInfo.fssai]);

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

  const updateLegalField = (field, value) => {
    setLegalForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveLegal = async () => {
    setLegalError('');
    const invalid = !legalForm.name.trim() || !legalForm.address.trim() || !legalForm.gstin.trim() || !legalForm.fssai.trim();
    if (invalid) {
      setLegalError('Business name, address, GSTIN and FSSAI number are all required — they print on every invoice.');
      return;
    }
    setIsSavingLegal(true);
    try {
      await updateLegalInfo(legalForm);
      setLegalSavedMessage('Saved. This updates the website, bills, and invoices immediately.');
      setTimeout(() => setLegalSavedMessage(''), 4000);
    } catch (err) {
      setLegalError(err.response?.data?.error || err.message || 'Could not save. Please try again.');
    } finally {
      setIsSavingLegal(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h2 className="font-serif text-xl text-ink-navy font-semibold">Settings</h2>
      <p className="text-xs text-subtle-text mt-1 mb-6">
        Changes here apply across the site immediately — no code changes or redeploys needed.
      </p>

      {isOwner && (
        <div className="bg-white border border-muted-border p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-lg text-ink-navy">Business &amp; Legal</h3>
          </div>
          <p className="text-xs text-subtle-text mb-5">
            Printed on every tax invoice and shown on the website. Owner-only — GSTIN and FSSAI
            changes affect legal compliance, so Managers cannot edit this section.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={legalForm.name}
              onChange={(e) => updateLegalField('name', e.target.value)}
              placeholder="Business / brand name"
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={legalForm.tagline}
              onChange={(e) => updateLegalField('tagline', e.target.value)}
              placeholder="Tagline"
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={legalForm.address}
              onChange={(e) => updateLegalField('address', e.target.value)}
              placeholder="Full address"
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={legalForm.gstin}
                onChange={(e) => updateLegalField('gstin', e.target.value)}
                placeholder="GSTIN"
                className="flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
              <input
                type="text"
                value={legalForm.fssai}
                onChange={(e) => updateLegalField('fssai', e.target.value)}
                placeholder="FSSAI number"
                className="flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
          </div>

          {legalError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{legalError}</p>
          )}
          {legalSavedMessage && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mt-4">{legalSavedMessage}</p>
          )}

          <button
            onClick={handleSaveLegal}
            disabled={isSavingLegal}
            className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSavingLegal ? 'Saving...' : 'Save Business & Legal Info'}
          </button>
        </div>
      )}

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