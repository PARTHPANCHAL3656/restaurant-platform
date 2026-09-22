import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { fillEmptyFields } from '../../utils/settingsHelpers';

export default function StaffSettingsLegalPage() {
  const { restaurantInfo, updateLegalInfo } = useStaff();
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';

  const [form, setForm] = useState({
    legalBusinessName: restaurantInfo.legalBusinessName,
    tagline: restaurantInfo.tagline,
    address: restaurantInfo.address,
    gstin: restaurantInfo.gstin,
    fssai: restaurantInfo.fssai,
    sacCode: restaurantInfo.sacCode
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      legalBusinessName: restaurantInfo.legalBusinessName,
      tagline: restaurantInfo.tagline,
      address: restaurantInfo.address,
      gstin: restaurantInfo.gstin,
      fssai: restaurantInfo.fssai,
      sacCode: restaurantInfo.sacCode
    });
  }, [restaurantInfo.legalBusinessName, restaurantInfo.tagline, restaurantInfo.address, restaurantInfo.gstin, restaurantInfo.fssai, restaurantInfo.sacCode]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    const requiredKeys = ['legalBusinessName', 'tagline', 'address', 'gstin', 'fssai', 'sacCode'];
    const safeForm = fillEmptyFields(form, restaurantInfo, requiredKeys);
    setForm(safeForm);
    setIsSaving(true);
    try {
      await updateLegalInfo(safeForm);
      setSavedMessage('Saved. This updates the website, bills, and invoices immediately.');
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
          <h2 className="font-serif text-xl text-ink-navy font-semibold mb-2">Business &amp; Legal</h2>
          <p className="text-sm text-subtle-text">
            This section is Owner-only. GSTIN, FSSAI, and legal business details affect tax compliance,
            so only the Owner account can view and edit them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Business &amp; Legal</h2>
        <p className="text-xs text-subtle-text mb-5">
          Printed on every tax invoice and shown on the website. Owner-only — GSTIN, FSSAI and SAC
          changes affect legal compliance, so Managers cannot edit this section.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={form.legalBusinessName}
            onChange={(e) => updateField('legalBusinessName', e.target.value)}
            placeholder="Legal business name"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="Tagline"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Full address"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => updateField('gstin', e.target.value)}
              placeholder="GSTIN"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={form.fssai}
              onChange={(e) => updateField('fssai', e.target.value)}
              placeholder="FSSAI number"
              className="flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <input
            type="text"
            value={form.sacCode}
            onChange={(e) => updateField('sacCode', e.target.value)}
            placeholder="SAC code (e.g. 996331)"
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
          {isSaving ? 'Saving...' : 'Save Business & Legal Info'}
        </button>
      </div>
    </div>
  );
}