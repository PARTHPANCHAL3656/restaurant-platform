import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';

export default function StaffSettingsLinksPage() {
  const { restaurantInfo, updateLinksInfo } = useStaff();

  const [form, setForm] = useState({
    zomato: restaurantInfo.links.zomato,
    swiggy: restaurantInfo.links.swiggy,
    instagram: restaurantInfo.links.instagram,
    facebook: restaurantInfo.links.facebook,
    twitter: restaurantInfo.links.twitter
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      zomato: restaurantInfo.links.zomato,
      swiggy: restaurantInfo.links.swiggy,
      instagram: restaurantInfo.links.instagram,
      facebook: restaurantInfo.links.facebook,
      twitter: restaurantInfo.links.twitter
    });
  }, [restaurantInfo.links.zomato, restaurantInfo.links.swiggy, restaurantInfo.links.instagram, restaurantInfo.links.facebook, restaurantInfo.links.twitter]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      await updateLinksInfo(form);
      setSavedMessage('Saved. This updates the website immediately.');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Integrations &amp; Links</h2>
        <p className="text-xs text-subtle-text mb-5">
          Zomato/Swiggy buttons on the landing page, and the social icons in the footer.
          Owner or Manager can edit this.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={form.zomato}
              onChange={(e) => updateField('zomato', e.target.value)}
              placeholder="Zomato page URL"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={form.swiggy}
              onChange={(e) => updateField('swiggy', e.target.value)}
              placeholder="Swiggy page URL"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <input
            type="text"
            value={form.instagram}
            onChange={(e) => updateField('instagram', e.target.value)}
            placeholder="Instagram URL"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.facebook}
            onChange={(e) => updateField('facebook', e.target.value)}
            placeholder="Facebook URL"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          <input
            type="text"
            value={form.twitter}
            onChange={(e) => updateField('twitter', e.target.value)}
            placeholder="Twitter / X URL"
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
          {isSaving ? 'Saving...' : 'Save Links'}
        </button>
      </div>
    </div>
  );
}