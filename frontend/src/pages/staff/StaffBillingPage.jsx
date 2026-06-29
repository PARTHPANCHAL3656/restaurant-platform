import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStaff } from '../../context/StaffContext';

export default function StaffBillingPage() {
  const { invoices, markInvoicePaid } = useStaff();
  const location = useLocation();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    location.state?.selectInvoiceId || (invoices[0]?.id || 'INV-042')
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (location.state?.selectInvoiceId) {
      setSelectedInvoiceId(location.state.selectInvoiceId);
    }
  }, [location.state?.selectInvoiceId]);

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.table.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B1F2B] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-label-caps uppercase tracking-widest font-bold">
            <span className="w-1 h-1 rounded-full bg-[#D4AF37]" /> Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FBF8F2] text-[#8B6B3F] border border-[#D8C6A5] text-[10px] font-label-caps uppercase tracking-widest font-bold">
            <span className="w-1 h-1 rounded-full bg-[#8B6B3F]" /> Pending
          </span>
        );
      case 'partially-paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F3F2] text-[#4A4A4A] border border-[#C2B29A] text-[10px] font-label-caps uppercase tracking-widest font-bold">
            <span className="w-1 h-1 rounded-full bg-[#4A4A4A]" /> Partially Paid
          </span>
        );
      default:
        return null;
    }
  };

  const handleMarkAsPaid = (invoiceId) => {
    markInvoicePaid(invoiceId);
  };

  // Motion stagger settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] relative select-none">
      
      {/* Left side: Invoice List */}
      <div className="flex-grow flex flex-col bg-[#faf9f8] p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 border border-[#E5E1DA]">
            <div>
              <h3 className="font-serif text-lg text-ink-navy font-semibold">Transactions Ledger</h3>
              <p className="text-xs text-subtle-text">Review and settle digital order invoices.</p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72 shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text text-sm">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice, guest or table..." 
                className="w-full bg-transparent border-b border-[#D4AF37]/20 py-2 pl-9 pr-4 focus:outline-none focus:border-saffron-gold focus:ring-1 focus:ring-[#D4AF37]/15 font-body-md text-xs placeholder:text-subtle-text/30 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Mobile: Invoice Cards (sm and below) */}
          <div className="sm:hidden space-y-3">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoiceId(inv.id)}
                className={`bg-white border border-[#E5E1DA] p-4 cursor-pointer transition-all duration-200 ${
                  selectedInvoiceId === inv.id ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30' : 'hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-xs text-ink-navy">{inv.id}</span>
                  {getStatusBadge(inv.status)}
                </div>
                <div className="flex justify-between items-end mt-3">
                  <div>
                    <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-wider">{inv.table} • {inv.guest}</p>
                    <p className="font-label-caps text-[9px] text-subtle-text mt-0.5">{inv.date}</p>
                  </div>
                  <span className="font-serif text-lg text-[#D4AF37] font-bold">${inv.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Ledger Table (sm and above) */}
          <div className="hidden sm:block bg-white border border-[#E5E1DA] overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-[#f4f3f2] border-b border-[#E5E1DA] font-label-caps text-subtle-text uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-5">Invoice</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-[#E5E1DA]"
                >
                  {filteredInvoices.map((inv) => (
                    <motion.tr 
                      key={inv.id}
                      variants={rowVariants}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`cursor-pointer hover:bg-[#FBF8F2] hover:shadow-[0_4px_20px_rgba(212,175,55,0.04)] transition-all duration-300 group ${
                        selectedInvoiceId === inv.id ? 'bg-[#D4AF37]/5 font-semibold' : ''
                      }`}
                    >
                      <td className={`p-4 pl-5 font-mono font-bold text-ink-navy border-l-2 transition-all duration-300 ${
                        selectedInvoiceId === inv.id ? 'border-l-[#D4AF37]' : 'border-l-transparent group-hover:border-l-[#D4AF37]'
                      }`}>
                        {inv.id}
                      </td>
                      <td className="p-4 text-ink-navy">{inv.table}</td>
                      <td className="p-4 text-ink-navy">{inv.guest}</td>
                      <td className="p-4 text-subtle-text">{inv.date}</td>
                      <td className="p-4 font-bold font-mono text-ink-navy">${inv.amount.toFixed(2)}</td>
                      <td className="p-4">{getStatusBadge(inv.status)}</td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile overlay backdrop */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSelectedInvoiceId(null)} />
      )}
      {/* Right side: Invoice Preview */}
      <div className={`fixed md:static inset-y-0 right-0 z-50 md:z-auto bg-white border-l border-[#E5E1DA] shrink-0 transition-all duration-300 shadow-2xl flex flex-col ${
        selectedInvoice ? 'w-full md:w-96 translate-x-0' : 'w-full md:w-96 translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
      }`}>
        {selectedInvoice && (
          <div className="h-full flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E1DA] shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-serif text-lg text-ink-navy font-semibold">Invoice Details</h3>
                  <p className="text-[10px] font-mono text-subtle-text tracking-widest uppercase mt-0.5">{selectedInvoice.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedInvoiceId(null)}
                  className="p-1 hover:bg-[#f4f3f2] rounded-full transition-colors focus:outline-none text-subtle-text"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto hide-scrollbar text-xs">
              <div className="space-y-2 border-b border-[#E5E1DA] pb-4">
                <div className="flex justify-between">
                  <span className="text-subtle-text">Table:</span>
                  <span className="font-bold text-ink-navy">{selectedInvoice.table}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Guest Name:</span>
                  <span className="font-bold text-ink-navy">{selectedInvoice.guest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Date Issued:</span>
                  <span className="text-ink-navy">{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Payment Type:</span>
                  <span className="text-ink-navy font-semibold">{selectedInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Tally */}
              <div className="space-y-3">
                <h4 className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase font-bold">Tally Summary</h4>
                <div className="space-y-2 border-b border-[#E5E1DA] pb-4">
                  <div className="flex justify-between text-subtle-text">
                    <span>Menu Subtotal</span>
                    <span>${(selectedInvoice.amount / 1.175).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-subtle-text">
                    <span>Service Charge (12.5%)</span>
                    <span>${(selectedInvoice.amount * 0.125 / 1.175).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-subtle-text">
                    <span>GST (5%)</span>
                    <span>${(selectedInvoice.amount * 0.05 / 1.175).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="font-serif text-sm text-ink-navy font-bold uppercase">Total Charges</span>
                  <span className="font-serif text-2xl text-[#D4AF37] font-bold">${selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] space-y-3 shrink-0">
              {selectedInvoice.status !== 'paid' && (
                <button 
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md rounded-none cursor-pointer"
                >
                  Mark as Paid (Direct Cash)
                </button>
              )}
              <button 
                onClick={() => alert('Sending print command to reception terminal...')}
                className="w-full h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
              >
                Print Invoice Chit
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
