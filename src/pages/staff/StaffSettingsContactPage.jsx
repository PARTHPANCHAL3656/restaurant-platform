import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { fillEmptyFields } from '../../utils/settingsHelpers';

export default function StaffSettingsContactPage() {
  const { restaurantInfo, updateContactInfo } = useStaff();
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';

  const [form, setForm] = useState({
    primaryPhone: restaurantInfo.primaryPhone,
    whatsappNumber: restaurantInfo.whatsappNumber,
    secondaryPhone: restaurantInfo.secondaryPhone,
    email: restaurantInfo.email,
    googleMapsUrl: restaurantInfo.googleMapsUrl,
    googleMapsEmbedUrl: restaurantInfo.googleMapsEmbedUrl
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      primaryPhone: restaurantInfo.primaryPhone,
      whatsappNumber: restaurantInfo.whatsappNumber,
      secondaryPhone: restaurantInfo.secondaryPhone,
      email: restaurantInfo.email,
      googleMapsUrl: restaurantInfo.googleMapsUrl,
      googleMapsEmbedUrl: restaurantInfo.googleMapsEmbedUrl
    });
  }, [restaurantInfo.primaryPhone, restaurantInfo.whatsappNumber, restaurantInfo.secondaryPhone, restaurantInfo.email, restaurantInfo.googleMapsUrl, restaurantInfo.googleMapsEmbedUrl]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    // whatsappNumber and secondaryPhone stay out of this list on purpose
    // — they're genuinely optional and should stay clearable.
    const requiredKeys = ['primaryPhone', 'email', 'googleMapsUrl', 'googleMapsEmbedUrl'];
    const safeForm = fillEmptyFields(form, restaurantInfo, requiredKeys);
    setForm(safeForm);
    setIsSaving(true);
    try {
      await updateContactInfo(safeForm);
      setSavedMessage('Saved. This updates the website immediately.');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="p-4 md:p-6 max-w-2xl">
        <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>
        <div className="bg-white border border-muted-border p-6 mt-6">
          <h2 className="font-serif text-xl text-ink-navy font-semibold mb-2">Contact &amp; Location</h2>
          <p className="text-sm text-subtle-text">
            This section is Owner-only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Contact &amp; Location</h2>
        <p className="text-xs text-subtle-text mb-5">
          Shown on the footer, contact page, and landing page. Owner-only.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={form.primaryPhone}
              onChange={(e) => updateField('primaryPhone', e.target.value)}
              placeholder="Primary phone"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={form.secondaryPhone}
              onChange={(e) => updateField('secondaryPhone', e.target.value)}
              placeholder="Reservation phone"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <input
            type="text"
            value={form.whatsappNumber}
            onChange={(e) => updateField('whatsappNumber', e.target.value)}
            placeholder="WhatsApp number (optional, e.g. 919876543210)"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="Email"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.googleMapsUrl}
            onChange={(e) => updateField('googleMapsUrl', e.target.value)}
            placeholder="Google Maps link (Get Directions button)"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.googleMapsEmbedUrl}
            onChange={(e) => updateField('googleMapsEmbedUrl', e.target.value)}
            placeholder="Google Maps embed URL (the map shown on the site)"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
        </div>

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
          {isSaving ? 'Saving...' : 'Save Contact & Location'}
        </button>
      </div>
    </div>
  );
}