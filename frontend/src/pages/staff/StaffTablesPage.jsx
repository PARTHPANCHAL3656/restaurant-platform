import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to resolve QR code image path
const getQrImage = (tableId) => {
  const tableNum = tableId.replace('T-', '');
  return new URL(`../../assets/images/qr/table-${tableNum}.png`, import.meta.url).href;
};

export default function StaffTablesPage() {
  const navigate = useNavigate();
  const { 
    tables, 
    queue, 
    invoices,
    orders,
    tableQrData,
    assignTable, 
    releaseTable,
    checkInGuest,
    cancelReservation,
    markTableCleaning,
    markTableAvailable
  } = useStaff();

  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState(null);

  // Modal / Sub-view states
  const [showQrModal, setShowQrModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Mock upcoming reservations
  const upcomingReservations = [
    { time: '6:30 PM', guest: 'Rahul Sharma', partySize: 4, table: 'T-03', vip: false },
    { time: '7:00 PM', guest: 'Priya Mehta', partySize: 2, table: 'T-06', vip: false },
    { time: '7:30 PM', guest: 'Aarav Kapoor', partySize: 3, table: 'T-08', vip: true }
  ];

  const getTableStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'border border-[#D4AF37] text-[#D4AF37] bg-white';
      case 'occupied':
        return 'bg-[#1A1F2C] text-canvas-cream border border-[#1A1F2C]';
      case 'reserved':
        return 'bg-[#f4f3f2] border border-[#E5E1DA] text-ink-navy/70';
      case 'cleaning':
        return 'bg-[#D4AF37]/10 border border-dashed border-[#D4AF37]/50 text-subtle-text';
      default:
        return 'bg-white border border-[#E5E1DA] text-[#1a1c1c]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'occupied':
        return 'restaurant';
      case 'cleaning':
        return 'sanitizer';
      case 'reserved':
      case 'available':
      default:
        return 'event_seat';
    }
  };

  const currentTable = tables.find(t => t.id === selectedTableId);

  // Real QR data from the backend, if this table was assigned this session.
  // Falls back to a static placeholder image for mock/offline mode or
  // tables assigned before this page loaded.
  const liveQr = selectedTableId ? tableQrData[selectedTableId] : null;

  // Estimated order subtotal & details lookup
  const currentTableOrder = orders.find(o => o.table === selectedTableId);

  const handleSeatParty = (queueId) => {
    if (!selectedTableId) return;
    assignTable(queueId, selectedTableId);
    setShowAssignForm(false);
  };

  const handleConfirmRelease = () => {
    if (!selectedTableId) return;
    releaseTable(selectedTableId);
    setShowReleaseConfirm(false);
    setSelectedTableId(null);
  };

  // Find invoice ID for current table to pre-select in Billing page
  const handleGenerateInvoice = () => {
    if (!selectedTableId || !currentTable) return;
    // Find existing unpaid invoice for this table
    const tableInvoice = invoices.find(inv => inv.table === selectedTableId && inv.status !== 'paid');
    
    // Pass invoice details in navigation state
    navigate('/staff/billing', { 
      state: { 
        selectInvoiceId: tableInvoice ? tableInvoice.id : 'INV-041' 
      } 
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] relative select-none">
      
      {/* Mobile backdrop for left drawer */}
      {leftDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setLeftDrawerOpen(false)} />
      )}
      {/* Left Drawer (Collapsible Reservations Summary) */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto bg-white border-r border-[#E5E1DA] flex flex-col shrink-0 transition-all duration-300 ${
        leftDrawerOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full md:-translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
      }`}>
        <div className="p-6 flex justify-between items-center border-b border-[#E5E1DA] shrink-0">
          <h3 className="font-serif text-md text-ink-navy font-semibold">Upcoming Reservations</h3>
          <button 
            onClick={() => setLeftDrawerOpen(false)}
            className="text-subtle-text hover:text-[#D4AF37] focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">first_page</span>
          </button>
        </div>

        {/* Reservations List */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow hide-scrollbar">
          <div className="space-y-4">
            {upcomingReservations.map((res, i) => (
              <div 
                key={i}
                className="pb-4 border-b border-[#E5E1DA] last:border-b-0 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-serif font-bold text-ink-navy text-sm">{res.time}</span>
                  {res.vip && (
                    <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-black tracking-widest px-2 py-0.5 uppercase">
                      VIP Priority
                    </span>
                  )}
                </div>
                <h4 className="font-body-md font-semibold text-ink-navy">{res.guest}</h4>
                <div className="flex justify-between text-subtle-text text-[11px] font-label-caps">
                  <span>Party of {res.partySize}</span>
                  <span className="text-[#D4AF37] font-bold">Table {res.table}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View full queue button */}
        <div className="p-4 border-t border-[#E5E1DA] shrink-0">
          <button 
            onClick={() => navigate('/staff/guest-queue')}
            className="w-full h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
          >
            View Full Guest Queue
          </button>
        </div>
      </div>

      {/* Hero Workspace: Floor Map Grid */}
      <div className="flex-grow bg-[#fdfcfb] overflow-auto p-4 md:p-8 lg:p-16 flex flex-col items-center relative min-h-[500px]">
        
        {/* Toggle Left Drawer Button */}
        {!leftDrawerOpen && (
          <button 
            onClick={() => setLeftDrawerOpen(true)}
            className="absolute top-6 left-6 bg-white border border-[#E5E1DA] p-3 shadow-md hover:text-[#D4AF37] transition-all focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined">last_page</span>
          </button>
        )}

        {/* Floor Map Legend */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 bg-white/70 backdrop-blur-md px-6 py-3.5 border border-[#E5E1DA] shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 border border-[#D4AF37]" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#f4f3f2]" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#1A1F2C]" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 animate-pulse" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Cleaning</span>
          </div>
        </div>

        {/* Dotted Floor Grid Map */}
        <div 
          className="flex-grow flex items-center justify-center min-h-[400px] w-full max-w-4xl"
          style={{
            backgroundImage: 'radial-gradient(#E5E1DA 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-8">
            {tables.map((tbl) => (
              <button
                key={tbl.id}
                onClick={() => setSelectedTableId(tbl.id)}
                className={`w-40 h-40 flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 cursor-pointer relative ${getTableStatusClass(tbl.status)} ${
                  selectedTableId === tbl.id ? 'ring-4 ring-[#D4AF37]/30 scale-103' : ''
                }`}
              >
                {selectedTableId === tbl.id && (
                  <div className="absolute -top-3 bg-[#D4AF37] text-[#030612] text-[8px] font-black px-2.5 py-0.5 uppercase tracking-wider">
                    Selected
                  </div>
                )}
                
                {/* Table Number */}
                <span className="text-xs font-label-caps tracking-widest">{tbl.id}</span>
                
                {/* Status Icon */}
                <span className="material-symbols-outlined text-3xl">
                  {getStatusIcon(tbl.status)}
                </span>
                
                {/* Status Text & Guest Name (only if occupied) */}
                <div className="text-[9px] font-bold uppercase tracking-wider text-center px-2">
                  <p className="opacity-60">{tbl.status}</p>
                  {tbl.status === 'occupied' && tbl.guestName && (
                    <p className="mt-0.5 font-serif capitalize text-xs tracking-normal font-medium">{tbl.guestName}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Right Drawer (Contextual Table Details Panel) */}
      <AnimatePresence>
        {selectedTableId && currentTable && (
          <>
            {/* Drawer Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTableId(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 bg-white border-l border-[#E5E1DA] shadow-2xl flex flex-col w-full sm:w-[75vw] lg:w-[440px] h-screen overflow-hidden"
            >
              <div className="h-full flex flex-col justify-between">
                
                {/* Drawer Header */}
                <div className="p-6 bg-[#1A1F2C] text-canvas-cream shrink-0 flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-2xl">Table {selectedTableId}</h3>
                    <p className="text-[#D4AF37] font-label-caps text-[9px] tracking-widest mt-1 uppercase font-bold">
                      {currentTable.status} • {selectedTableId === 'T-14' ? 'Garden Terrace' : 'Dining Room'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedTableId(null)}
                    className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs text-ink-navy">
                  
                  {/* Status Specific Section */}
                  {currentTable.status === 'occupied' && (
                    <div className="space-y-6">
                      
                      {/* Section details */}
                      <div className="space-y-3.5 border-b border-[#E5E1DA] pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">{selectedTableId === 'T-14' ? 'Garden Terrace' : 'Dining Room'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Assigned Waiter:</span>
                          <span className="font-bold">Rahul Sharma</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Arrival Time:</span>
                          <span className="font-bold">{currentTable.arrivalTime || '8:30 PM'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Estimated Finish:</span>
                          <span className="font-bold text-[#D4AF37]">9:45 PM</span>
                        </div>
                      </div>

                      {/* Guest Notes */}
                      {currentTable.notes && (
                        <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 italic rounded-xs">
                          <span className="font-label-caps text-[9px] text-[#D4AF37] uppercase font-bold tracking-widest block mb-1">Diner Preferences</span>
                          <p>"{currentTable.notes}"</p>
                        </div>
                      )}

                      {/* Current Order Summary */}
                      <div className="space-y-4">
                        <h4 className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold">Current Bill Items</h4>
                        {currentTable.items.length > 0 ? (
                          <ul className="space-y-3 border-b border-[#E5E1DA] pb-4">
                            {currentTable.items.map((item, i) => (
                              <li key={i} className="flex justify-between items-center">
                                <span>{item.qty}x {item.name}</span>
                                <span className="font-bold font-mono">${(item.price * item.qty).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-6 text-subtle-text italic border border-[#E5E1DA]">
                            No items ordered yet.
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-2">
                          <span className="font-label-caps text-[10px] text-subtle-text uppercase">Total Charges</span>
                          <span className="font-serif text-2xl font-bold">${currentTable.billTotal.toFixed(2)}</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {currentTable.status === 'reserved' && (
                    <div className="space-y-6">
                      
                      {/* Reservation Info */}
                      <div className="space-y-3.5 border-b border-[#E5E1DA] pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Reserved Guest:</span>
                          <span className="font-bold">{currentTable.guestName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Table Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Arrival Time:</span>
                          <span className="font-bold text-[#D4AF37]">{currentTable.arrivalTime}</span>
                        </div>
                      </div>

                      {/* Guest Preferences */}
                      {currentTable.notes && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 italic text-yellow-800 rounded-xs">
                          <span className="font-label-caps text-[9px] uppercase tracking-widest font-bold block mb-1">Reservation Note</span>
                          <p>"{currentTable.notes}"</p>
                        </div>
                      )}

                    </div>
                  )}

                  {currentTable.status === 'available' && (
                    <div className="space-y-6">
                      
                      {/* Available table stats */}
                      <div className="space-y-3.5 border-b border-[#E5E1DA] pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">{selectedTableId === 'T-14' ? 'Garden Terrace' : 'Dining Room'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Cleaning Status:</span>
                          <span className="font-bold text-green-600">Clean & Sanitized</span>
                        </div>
                      </div>

                      {/* Assign waitlist party selector */}
                      {showAssignForm ? (
                        <div className="p-4 border border-[#E5E1DA] bg-[#fdfcfb] space-y-4">
                          <h4 className="font-serif text-sm font-semibold">Seat Waitlist Party</h4>
                          {queue.length === 0 ? (
                            <p className="text-xs text-subtle-text italic">No parties currently in guest queue.</p>
                          ) : (
                            <div className="space-y-3">
                              <select 
                                id="seat_party_select"
                                className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none cursor-pointer"
                              >
                                {queue.map(guest => (
                                  <option key={guest.id} value={guest.id}>
                                    {guest.name} (Party of {guest.partySize})
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const selectEl = document.getElementById('seat_party_select');
                                    if (selectEl) handleSeatParty(selectEl.value);
                                  }}
                                  className="py-2 px-4 bg-[#D4AF37] text-[#030612] font-label-caps text-[10px] uppercase font-bold tracking-wider hover:bg-[#B8962F] transition-all cursor-pointer"
                                >
                                  Assign Table
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setShowAssignForm(false)}
                                  className="py-2 px-4 border border-ink-navy text-ink-navy font-label-caps text-[10px] uppercase tracking-wider hover:bg-ink-navy hover:text-white transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-subtle-text">This table is vacant. You can manually assign reservations or seat walk-ins.</p>
                      )}

                    </div>
                  )}

                  {currentTable.status === 'cleaning' && (
                    <div className="space-y-6">
                      
                      {/* Cleaning stats */}
                      <div className="space-y-3.5 border-b border-[#E5E1DA] pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">{selectedTableId === 'T-14' ? 'Garden Terrace' : 'Dining Room'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Status:</span>
                          <span className="font-bold text-[#D4AF37] animate-pulse">Staff Sanitizing...</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] shrink-0 space-y-3">
                  
                  {currentTable.status === 'occupied' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setShowQrModal(true)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          View QR
                        </button>
                        <button 
                          onClick={() => setShowOrderModal(true)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          View Order
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleGenerateInvoice}
                          className="h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                        >
                          Generate Invoice
                        </button>
                        <button 
                          onClick={() => setShowReleaseConfirm(true)}
                          className="h-[56px] bg-red-950 text-white font-cta-label text-cta-label uppercase tracking-widest hover:bg-red-900 transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          Release Table
                        </button>
                      </div>
                    </>
                  )}

                  {currentTable.status === 'reserved' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => checkInGuest(currentTable.id)}
                          className="h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                        >
                          Check In Guest
                        </button>
                        <button 
                          onClick={() => setShowAssignForm(true)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          Assign Table
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setShowQrModal(true)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          View QR
                        </button>
                        <button 
                          onClick={() => cancelReservation(currentTable.id)}
                          className="h-[56px] bg-red-900/10 text-red-700 font-cta-label text-cta-label uppercase tracking-widest hover:bg-red-900/20 transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </>
                  )}

                  {currentTable.status === 'available' && (
                    <>
                      <button 
                        onClick={() => setShowAssignForm(true)}
                        className="w-full h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                      >
                        Assign Reservation
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setShowQrModal(true)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          View QR
                        </button>
                        <button 
                          onClick={() => markTableCleaning(currentTable.id)}
                          className="h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          Mark Cleaning
                        </button>
                      </div>
                    </>
                  )}

                  {currentTable.status === 'cleaning' && (
                    <>
                      <button 
                        onClick={() => markTableAvailable(currentTable.id)}
                        className="w-full h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                      >
                        Mark Available
                      </button>
                      <button 
                        onClick={() => setShowQrModal(true)}
                        className="w-full h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                      >
                        View QR
                      </button>
                    </>
                  )}

                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Center Modal: View QR */}
      <AnimatePresence>
        {showQrModal && selectedTableId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E5E1DA] max-w-sm w-full p-8 shadow-2xl relative text-center text-ink-navy space-y-6"
            >
              <div>
                <h3 className="font-serif text-2xl font-bold">Table {selectedTableId}</h3>
                <p className="font-label-caps text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold mt-1">Scan to Order</p>
              </div>

              {/* QR Image */}
              <div className="w-48 h-48 mx-auto border border-[#E5E1DA] p-3 bg-white flex items-center justify-center">
                <img 
                  src={liveQr ? liveQr.qrDataUrl : getQrImage(selectedTableId)} 
                  alt={`QR for Table ${selectedTableId}`} 
                  className="w-full h-full object-contain"
                />
              </div>

              {liveQr ? (
                <div className="space-y-2">
                  <p className="font-sans text-[11px] leading-relaxed text-subtle-text">
                    Live session — scanning opens the digital menu for this table.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(liveQr.menuUrl);
                      alert('Menu link copied — paste it in a browser to test without scanning.');
                    }}
                    className="font-mono text-[10px] text-[#D4AF37] underline break-all cursor-pointer hover:text-ink-navy transition-colors"
                  >
                    {liveQr.menuUrl}
                  </button>
                </div>
              ) : (
                <p className="font-sans text-[11px] leading-relaxed text-subtle-text">
                  Guests can scan this QR to access the digital menu and place orders directly from their table.
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => alert('Sending print job to reception chit printer...')}
                    className="py-3 border border-ink-navy text-ink-navy font-cta-label text-[10px] uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                  >
                    Print QR
                  </button>
                  <button 
                    onClick={() => alert('Initiating download of high-resolution QR asset...')}
                    className="py-3 border border-ink-navy text-ink-navy font-cta-label text-[10px] uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
                  >
                    Download QR
                  </button>
                </div>
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="w-full h-[56px] bg-ink-navy text-white font-cta-label text-cta-label uppercase tracking-widest hover:bg-black transition-colors duration-300 cursor-pointer rounded-none"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center Modal: View Current Order Details */}
      <AnimatePresence>
        {showOrderModal && selectedTableId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E5E1DA] max-w-md w-full p-8 shadow-2xl relative text-ink-navy space-y-6"
            >
              <div className="flex justify-between items-start border-b border-[#E5E1DA] pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold">Kitchen Order Details</h3>
                  <p className="font-mono text-[10px] text-subtle-text uppercase mt-0.5">
                    {currentTableOrder ? currentTableOrder.id : 'ORD-402'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="text-subtle-text hover:text-ink-navy focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4 text-xs">
                <div className="flex justify-between font-label-caps text-[9px] text-subtle-text uppercase font-bold tracking-wider">
                  <span>Ordered Dish</span>
                  <span>Kitchen Status</span>
                </div>

                <div className="space-y-3 divide-y divide-[#E5E1DA]/50 max-h-48 overflow-y-auto pr-2">
                  {currentTable && currentTable.items.length > 0 ? (
                    currentTable.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center pt-3 first:pt-0">
                        <span className="font-medium">
                          <strong className="text-saffron-gold mr-2">{item.qty}x</strong> {item.name}
                        </span>
                        <span className="bg-[#FBF8F2] text-[#8B6B3F] border border-[#D8C6A5] px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {currentTableOrder ? currentTableOrder.status : 'Preparing'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-subtle-text py-4">No active kitchen orders logged.</p>
                  )}
                </div>

                {/* Notes */}
                {currentTableOrder?.notes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 text-[11px] italic rounded-xs">
                    <p className="font-label-caps text-[9px] uppercase tracking-wider font-bold text-yellow-800 mb-0.5">Preparation Notes</p>
                    <p>"{currentTableOrder.notes}"</p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-[#E5E1DA] font-serif text-lg font-bold">
                  <span>Subtotal:</span>
                  <span>${currentTable ? currentTable.billTotal.toFixed(2) : '0.00'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => {
                    setShowOrderModal(false);
                    navigate('/staff/orders');
                  }}
                  className="w-full h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                >
                  Go to Order Management
                </button>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="w-full py-3.5 border border-ink-navy text-ink-navy font-cta-label text-[10px] uppercase tracking-widest hover:bg-ink-navy hover:text-white transition-colors duration-300 cursor-pointer rounded-none text-center"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center Modal: Release Table Confirmation */}
      <AnimatePresence>
        {showReleaseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E5E1DA] max-w-sm w-full p-8 shadow-2xl relative text-ink-navy text-center space-y-6"
            >
              <div className="space-y-3">
                <span className="material-symbols-outlined text-red-500 text-4xl">logout</span>
                <h3 className="font-serif text-xl font-bold">Release Table?</h3>
                <p className="font-sans text-xs text-subtle-text leading-relaxed">
                  This will mark the table as available for the next guests, and clear all active orders and diner statistics from the floor plan.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setShowReleaseConfirm(false)}
                  className="flex-grow h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmRelease}
                  className="flex-grow h-[56px] bg-red-950 text-white font-cta-label text-cta-label uppercase tracking-widest hover:bg-red-900 transition-all duration-300 cursor-pointer rounded-none font-bold"
                >
                  Release Table
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
