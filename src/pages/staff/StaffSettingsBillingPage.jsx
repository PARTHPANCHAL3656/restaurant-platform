import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { fillEmptyFields } from '../../utils/settingsHelpers';

export default function StaffSettingsBillingPage() {
  const { restaurantInfo, updateBillingInfo } = useStaff();
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';

  const [form, setForm] = useState({
    cgstRate: restaurantInfo.cgstRate,
    sgstRate: restaurantInfo.sgstRate,
    pricesIncludeGst: restaurantInfo.pricesIncludeGst,
    serviceChargeEnabled: restaurantInfo.serviceChargeEnabled,
    serviceChargePercent: restaurantInfo.serviceChargePercent,
    serviceChargeTaxable: restaurantInfo.serviceChargeTaxable,
    packagingFeeEnabled: restaurantInfo.packagingFeeEnabled,
    packagingFeeAmount: restaurantInfo.packagingFeeAmount,
    packagingFeeLabel: restaurantInfo.packagingFeeLabel,
    billFooterNote: restaurantInfo.billFooterNote,
    takeoutBillNote: restaurantInfo.takeoutBillNote,
    invoicePrefix: restaurantInfo.invoicePrefix
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      cgstRate: restaurantInfo.cgstRate,
      sgstRate: restaurantInfo.sgstRate,
      pricesIncludeGst: restaurantInfo.pricesIncludeGst,
      serviceChargeEnabled: restaurantInfo.serviceChargeEnabled,
      serviceChargePercent: restaurantInfo.serviceChargePercent,
      serviceChargeTaxable: restaurantInfo.serviceChargeTaxable,
      packagingFeeEnabled: restaurantInfo.packagingFeeEnabled,
      packagingFeeAmount: restaurantInfo.packagingFeeAmount,
      packagingFeeLabel: restaurantInfo.packagingFeeLabel,
      billFooterNote: restaurantInfo.billFooterNote,
      takeoutBillNote: restaurantInfo.takeoutBillNote,
      invoicePrefix: restaurantInfo.invoicePrefix
    });
  }, [restaurantInfo.cgstRate, restaurantInfo.sgstRate, restaurantInfo.pricesIncludeGst, restaurantInfo.serviceChargeEnabled, restaurantInfo.serviceChargePercent, restaurantInfo.serviceChargeTaxable, restaurantInfo.packagingFeeEnabled, restaurantInfo.packagingFeeAmount, restaurantInfo.packagingFeeLabel, restaurantInfo.billFooterNote, restaurantInfo.takeoutBillNote, restaurantInfo.invoicePrefix]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError('');
    const requiredKeys = ['cgstRate', 'sgstRate', 'serviceChargePercent', 'packagingFeeAmount', 'packagingFeeLabel', 'invoicePrefix', 'billFooterNote', 'takeoutBillNote'];
    const safeForm = fillEmptyFields(form, restaurantInfo, requiredKeys);
    const numericForm = {
      ...safeForm,
      cgstRate: Number(safeForm.cgstRate),
      sgstRate: Number(safeForm.sgstRate),
      serviceChargePercent: Number(safeForm.serviceChargePercent),
      packagingFeeAmount: Number(safeForm.packagingFeeAmount)
    };
    if (numericForm.cgstRate < 0 || numericForm.sgstRate < 0 || numericForm.serviceChargePercent < 0 || numericForm.packagingFeeAmount < 0) {
      setError('Rates and amounts cannot be negative.');
      return;
    }
    setForm(numericForm);
    setIsSaving(true);
    try {
      await updateBillingInfo(numericForm);
      setSavedMessage('Saved. New rates apply to every bill generated from now on — bills already issued keep their original numbers.');
      setTimeout(() => setSavedMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner) {
    return <Navigate to="/staff/settings" replace />;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6 space-y-6">
        <div>
          <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Tax, Fees &amp; Billing Rules</h2>
          <p className="text-xs text-subtle-text">
            This is the exact math used on every real bill and invoice — dine-in and takeout. Owner-only.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">GST</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:flex-1">
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">CGST %</span>
              <input
                type="number"
                step="0.01"
                value={form.cgstRate}
                onChange={(e) => updateField('cgstRate', e.target.value)}
                className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
            <div className="w-full sm:flex-1">
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">SGST %</span>
              <input
                type="number"
                step="0.01"
                value={form.sgstRate}
                onChange={(e) => updateField('sgstRate', e.target.value)}
                className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-subtle-text">
            <input
              type="checkbox"
              checked={form.pricesIncludeGst}
              onChange={(e) => updateField('pricesIncludeGst', e.target.checked)}
            />
            Menu prices already include GST
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Service Charge (dine-in only)</h3>
          <label className="flex items-center gap-2 text-sm text-subtle-text">
            <input
              type="checkbox"
              checked={form.serviceChargeEnabled}
              onChange={(e) => updateField('serviceChargeEnabled', e.target.checked)}
            />
            Apply service charge on dine-in bills
          </label>
          <div>
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Service Charge %</span>
            <input
              type="number"
              step="0.01"
              value={form.serviceChargePercent}
              onChange={(e) => updateField('serviceChargePercent', e.target.value)}
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-subtle-text">
            <input
              type="checkbox"
              checked={form.serviceChargeTaxable}
              onChange={(e) => updateField('serviceChargeTaxable', e.target.checked)}
            />
            GST applies on top of service charge (not just the food subtotal)
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Packaging Fee (takeout only)</h3>
          <label className="flex items-center gap-2 text-sm text-subtle-text">
            <input
              type="checkbox"
              checked={form.packagingFeeEnabled}
              onChange={(e) => updateField('packagingFeeEnabled', e.target.checked)}
            />
            Charge a packaging fee on takeout orders
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:flex-1">
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Amount (₹)</span>
              <input
                type="number"
                step="1"
                value={form.packagingFeeAmount}
                onChange={(e) => updateField('packagingFeeAmount', e.target.value)}
                className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
            <div className="w-full sm:flex-1">
              <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Bill line text</span>
              <input
                type="text"
                value={form.packagingFeeLabel}
                onChange={(e) => updateField('packagingFeeLabel', e.target.value)}
                className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Invoice Numbering &amp; Notes</h3>
          <div>
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Invoice prefix (e.g. SG)</span>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => updateField('invoicePrefix', e.target.value)}
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <div>
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Bill footer note</span>
            <textarea
              value={form.billFooterNote}
              onChange={(e) => updateField('billFooterNote', e.target.value)}
              rows={2}
              className="w-full border border-muted-border px-3 py-2 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <div>
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Takeout-specific note</span>
            <textarea
              value={form.takeoutBillNote}
              onChange={(e) => updateField('takeoutBillNote', e.target.value)}
              rows={2}
              className="w-full border border-muted-border px-3 py-2 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
        )}
        {savedMessage && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">{savedMessage}</p>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Billing Rules'}
        </button>
      </div>
    </div>
  );
}