import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR } from '../../utils/currency';
import { cleanPhone } from '../../utils/phone';
import ReservationCard from '../../components/staff/ReservationCard';
import { getReservationTiming, compareReservations, getMinutesUntilSlot } from '../../utils/reservationTime';

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
    markTableAvailable,
    reservations,
    finalizeTableBill,
    updateReservationStatus,
    reservationRules,
    holdTableForReservation
  } = useStaff();

  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState(null);

  // Modal / Sub-view states
  const [showQrModal, setShowQrModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showPhoneCaptureModal, setShowPhoneCaptureModal] = useState(false);
  const [billingPhoneInput, setBillingPhoneInput] = useState('');

  // Reservations sidebar: which tab is showing, and which list the "assign"
  // form on an available table is drawing from (walk-ins and reservations
  // are never mixed in one dropdown).
  const [resTab, setResTab] = useState('pending');
  const [assignMode, setAssignMode] = useState(null); // null | 'walkin' | 'reservation'

  // Re-evaluate "late" every 30s without needing any other event to fire.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const staffRole = sessionStorage.getItem('staffRole');
  const canManage = staffRole === 'OWNER' || staffRole === 'MANAGER';

  const graceMinutes = reservationRules.resHoldGraceMinutes;
  const largePartyThreshold = reservationRules.resRequireManagerLargeParties;

  // Each reservation with where it sits relative to right now
  // (today / late / past / future) — see utils/reservationTime.js.
  const withTiming = (list) => list
    .map(r => ({ r, ...getReservationTiming(r, graceMinutes, now) }))
    .sort((a, b) => compareReservations(a.r, b.r));

  // Tab A — online requests waiting for a yes/no
  const pendingRequests = withTiming(reservations.filter(r => r.status === 'pending'));

  // Tab B — accepted reservations, split by date so nothing disappears
  const confirmedAll = withTiming(reservations.filter(r => r.status === 'confirmed'));
  const todayConfirmed = confirmedAll.filter(x => x.timing === 'today' || x.timing === 'late');
  const earlierConfirmed = confirmedAll.filter(x => x.timing === 'past');
  const laterConfirmed = confirmedAll.filter(x => x.timing === 'future');
  const lateReservations = todayConfirmed.filter(x => x.timing === 'late');
  const lateReservationIds = new Set(lateReservations.map(x => x.r.id));

  const availableTablesList = tables.filter(t => t.status === 'available');

  // A reservation can be seated well before its booked time (holding the
  // table ahead of arrival is fine — actually checking them in isn't, past a
  // point, since the kitchen/floor may not be ready for whatever the booking
  // needs, e.g. a birthday cake). 30 minutes early is close enough to let
  // through silently; anything more asks for a confirm so a misclick or an
  // over-eager guest doesn't jump the queue by accident.
  const confirmEarlySeating = (reservation) => {
    const minutesUntil = getMinutesUntilSlot(reservation, now);
    if (minutesUntil === null || minutesUntil <= 30) return true;
    const hrs = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    const early = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
    return window.confirm(
      `${reservation.guest}'s reservation is for ${reservation.time} — that's ${early} from now. Seat them early anyway? Their table won't have had time to prep any special requests.`
    );
  };

  const renderReservationCard = ({ r, timing, minutesLate }, view) => (
    <ReservationCard
      key={r.id}
      reservation={r}
      view={view}
      timing={timing}
      minutesLate={minutesLate}
      canManage={canManage}
      largePartyThreshold={largePartyThreshold}
      availableTables={availableTablesList}
      onConfirm={() => updateReservationStatus(r.id, 'confirmed')}
      onReject={() => {
        if (window.confirm(`Reject ${r.guest}'s request for ${r.time} on ${r.date}? They will see it as declined.`)) {
          updateReservationStatus(r.id, 'rejected');
        }
      }}
      onSeat={async (tableId) => {
        if (!confirmEarlySeating(r)) return;
        // A held table means the guest is checking in to it; otherwise
        // they're being seated at whichever free table was just picked.
        if (r.table) await checkInGuest(r.table);
        else await assignTable(r.id, tableId);
      }}
      onHold={(tableId) => holdTableForReservation(r.id, tableId)}
      onNoShow={() => {
        if (window.confirm(`Mark ${r.guest} as a no-show? This frees their table and adds a no-show strike to their phone number. Only do this after trying to call them.`)) {
          updateReservationStatus(r.id, 'no-show');
        }
      }}
      onGuestCancelled={() => {
        if (window.confirm(`Cancel ${r.guest}'s reservation because they called to cancel? No no-show strike is recorded.`)) {
          updateReservationStatus(r.id, 'cancelled');
        }
      }}
    />
  );

  const getEstimatedFinish = (arrivalTimeStr) => {
    if (!arrivalTimeStr) return '—';
    try {
      const parts = arrivalTimeStr.split(' ');
      const timeParts = parts[0].split(':');
      let hours = parseInt(timeParts[0]);
      let minutes = parseInt(timeParts[1]);
      const ampm = parts[1] ? parts[1].toUpperCase() : '';
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes + 75);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '—';
    }
  };

  const getTableStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'border border-saffron-gold text-saffron-gold bg-white';
      case 'occupied':
        return 'bg-ink-navy text-canvas-cream border border-ink-navy';
      case 'reserved':
        return 'bg-amber-100 border border-amber-400 text-amber-900';
      case 'cleaning':
        return 'bg-saffron-gold/10 border border-dashed border-saffron-gold/50 text-subtle-text';
      default:
        return 'bg-white border border-muted-border text-[#1a1c1c]';
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
  const sessionMenuUrl = liveQr ? liveQr.menuUrl : (currentTable && currentTable.token ? `${window.location.origin}/menu?token=${currentTable.token}` : null);

  // Estimated order subtotal & details lookup
  const currentTableOrder = orders.find(o => o.table === selectedTableId);

  // The invoice can only be generated once the food is served. Look the order
  // up by the table's own current order (not just the table name) so an old
  // served order from an earlier guest can never unlock the button.
  const invoiceOrder = currentTable && currentTable.currentOrderId
    ? orders.find(o => o.id === currentTable.currentOrderId)
    : currentTableOrder;
  const invoiceWaitingOn = invoiceOrder && invoiceOrder.status !== 'served' ? invoiceOrder.status : null;

  // Walk-ins and reservations are kept as two separate lists on purpose.
  const walkInParties = queue.map(q => ({ id: q.id, name: q.name, partySize: q.partySize }));
  // Today's confirmed reservations that don't already have a table held
  // (ones with a held table are checked in from their own table instead).
  const seatableReservations = todayConfirmed
    .filter(x => !x.r.table)
    .map(x => ({ id: x.r.id, name: x.r.guest, partySize: x.r.partySize, time: x.r.time }));

  const handleSeatParty = (queueId) => {
    if (!selectedTableId) return;
    // This id might be a walk-in (never "early" — they're already here) or
    // a reservation seated straight from an available table's drawer.
    const matchedReservation = reservations.find(r => r.id === queueId);
    if (matchedReservation && !confirmEarlySeating(matchedReservation)) return;
    assignTable(queueId, selectedTableId);
    setShowAssignForm(false);
  };

  const handleHoldReservation = async (reservationId) => {
    if (!selectedTableId) return;
    const ok = await holdTableForReservation(reservationId, selectedTableId);
    if (ok) setShowAssignForm(false);
  };

  const handleConfirmRelease = () => {
    if (!selectedTableId) return;
    releaseTable(selectedTableId);
    setShowReleaseConfirm(false);
    setSelectedTableId(null);
  };

  // Find or generate invoice ID for current table and redirect to Billing page
  const handleGenerateInvoice = async () => {
    if (!selectedTableId || !currentTable) return;

    // If this guest's order has no phone on file yet (walk-in who skipped
    // the optional field on their own cart page), give staff one last
    // chance to add it before the invoice — and the Customer link — locks in.
    if (currentTableOrder && !currentTableOrder.guestPhone) {
      setBillingPhoneInput('');
      setShowPhoneCaptureModal(true);
      return;
    }

    const invoice = await finalizeTableBill(selectedTableId);
    if (invoice) {
      navigate('/staff/billing', { 
        state: { 
          selectInvoiceId: invoice.id 
        } 
      });
    }
  };

  // Called from the phone-capture modal — with or without a phone typed in
  const handleConfirmGenerateInvoice = async (phone) => {
    setShowPhoneCaptureModal(false);
    if (!selectedTableId) return;

    const invoice = await finalizeTableBill(selectedTableId, phone || undefined);
    if (invoice) {
      navigate('/staff/billing', {
        state: {
          selectInvoiceId: invoice.id
        }
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] relative select-none overflow-hidden">
      
      {/* Mobile backdrop for left drawer */}
      {leftDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setLeftDrawerOpen(false)} />
      )}
      {/* Left Drawer (Collapsible Reservations Summary) */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto bg-white border-r border-muted-border flex flex-col shrink-0 min-h-0 transition-all duration-300 ${
        leftDrawerOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full md:-translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
      }`}>
        <div className="p-6 flex justify-between items-center border-b border-muted-border shrink-0">
          <h3 className="font-serif text-md text-ink-navy font-semibold">Reservations</h3>
          <button 
            onClick={() => setLeftDrawerOpen(false)}
            className="text-subtle-text hover:text-saffron-gold focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">first_page</span>
          </button>
        </div>

        {/* Pending Requests / Today's Confirmed tabs */}
        <div className="grid grid-cols-2 border-b border-muted-border shrink-0">
          <button
            onClick={() => setResTab('pending')}
            className={`py-3 text-[10px] font-label-caps uppercase tracking-widest font-bold cursor-pointer transition-colors ${
              resTab === 'pending' ? 'text-ink-navy border-b-2 border-saffron-gold' : 'text-subtle-text hover:text-ink-navy'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 bg-saffron-gold text-ink-navy px-1.5 py-0.5 text-[9px] rounded-full">{pendingRequests.length}</span>
            )}
          </button>
          <button
            onClick={() => setResTab('confirmed')}
            className={`py-3 text-[10px] font-label-caps uppercase tracking-widest font-bold cursor-pointer transition-colors ${
              resTab === 'confirmed' ? 'text-ink-navy border-b-2 border-saffron-gold' : 'text-subtle-text hover:text-ink-navy'
            }`}
          >
            Today's Confirmed
            {todayConfirmed.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] rounded-full text-white ${lateReservations.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-ink-navy'}`}>
                {lateReservations.length > 0 ? `${lateReservations.length} late` : todayConfirmed.length}
              </span>
            )}
          </button>
        </div>

        {/* Reservations List */}
        <div className="p-4 space-y-4 overflow-y-auto min-h-0 flex-grow hide-scrollbar" data-lenis-prevent>
          {resTab === 'pending' ? (
            pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-subtle-text italic text-xs">No requests waiting for a decision</div>
            ) : (
              pendingRequests.map(x => renderReservationCard(x, 'pending'))
            )
          ) : (
            <>
              {todayConfirmed.length === 0 ? (
                <div className="text-center py-8 text-subtle-text italic text-xs">No confirmed reservations for today</div>
              ) : (
                todayConfirmed.map(x => renderReservationCard(x, 'confirmed'))
              )}

              {earlierConfirmed.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="font-label-caps text-[9px] uppercase tracking-widest font-bold text-red-600">Earlier days — still unresolved</h5>
                  {earlierConfirmed.map(x => renderReservationCard(x, 'confirmed'))}
                </div>
              )}

              {laterConfirmed.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="font-label-caps text-[9px] uppercase tracking-widest font-bold text-subtle-text">Later dates</h5>
                  {laterConfirmed.map(x => renderReservationCard(x, 'confirmed'))}
                </div>
              )}
            </>
          )}
        </div>

        {/* View full queue button */}
        <div className="p-4 border-t border-muted-border shrink-0">
          <button 
            onClick={() => navigate('/staff/guest-queue')}
            className="w-full h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer rounded-none text-center"
          >
            View Walk-in Waitlist
          </button>
        </div>
      </div>

      {/* Hero Workspace: Floor Map Grid */}
      <div className="flex-grow bg-canvas-cream overflow-auto p-4 md:p-8 lg:p-16 flex flex-col items-center relative min-h-0">
        
        {/* Toggle Left Drawer Button */}
        {!leftDrawerOpen && (
          <button 
            onClick={() => setLeftDrawerOpen(true)}
            className="absolute top-6 left-6 bg-white border border-muted-border p-3 shadow-md hover:text-saffron-gold transition-all focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined">last_page</span>
            {(lateReservations.length > 0 || pendingRequests.length > 0) && (
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${lateReservations.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-saffron-gold'}`} />
            )}
          </button>
        )}

        {/* Floor Map Legend */}
        <div className="shrink-0 relative z-10 mb-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 bg-white/70 backdrop-blur-md px-6 py-3.5 border border-muted-border shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 border border-saffron-gold" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-100 border border-amber-400" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-ink-navy" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-saffron-gold/20 border border-saffron-gold/50 animate-pulse" />
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-subtle-text">Cleaning</span>
          </div>
        </div>

        {/* Dotted Floor Grid Map */}
        <div 
          className="w-full max-w-4xl min-h-[400px]"
          style={{
            backgroundImage: 'radial-gradient(#E5E1DA 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-8 justify-center">
            {tables.map((tbl) => (
              <button
                key={tbl.id}
                onClick={() => setSelectedTableId(tbl.id)}
                className={`w-40 h-40 flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 cursor-pointer relative ${getTableStatusClass(tbl.status)} ${
                  selectedTableId === tbl.id ? 'ring-4 ring-saffron-gold/30 scale-103' : ''
                } ${
                  tbl.status === 'reserved' && lateReservationIds.has(tbl.reservationId) ? 'ring-2 ring-red-500 animate-pulse' : ''
                }`}
              >
                {selectedTableId === tbl.id && (
                  <div className="absolute -top-3 bg-saffron-gold text-midnight-black text-[8px] font-black px-2.5 py-0.5 uppercase tracking-wider">
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
                  {(tbl.status === 'occupied' || tbl.status === 'reserved') && tbl.guestName && (
                    <p className="mt-0.5 font-serif capitalize text-xs tracking-normal font-medium">{tbl.guestName}</p>
                  )}
                  {tbl.status === 'reserved' && tbl.arrivalTime && (
                    <p className="mt-0.5 opacity-80">{tbl.arrivalTime}</p>
                  )}
                  {tbl.status === 'reserved' && lateReservationIds.has(tbl.reservationId) && (
                    <p className="mt-0.5 text-red-600 font-black">LATE</p>
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
              className="fixed right-0 top-0 bottom-0 z-50 bg-white border-l border-muted-border shadow-2xl flex flex-col w-full sm:w-[75vw] lg:w-[440px] h-screen overflow-hidden"
            >
              <div className="h-full flex flex-col justify-between">
                
                {/* Drawer Header */}
                <div className="p-6 bg-ink-navy text-canvas-cream shrink-0 flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-2xl">Table {selectedTableId}</h3>
                    <p className="text-saffron-gold font-label-caps text-[9px] tracking-widest mt-1 uppercase font-bold">
                      {currentTable.status} • Dining Room
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
                <div className="flex-grow min-h-0 overflow-y-auto p-6 space-y-6 text-xs text-ink-navy" data-lenis-prevent>
                  
                  {/* Status Specific Section */}
                  {currentTable.status === 'occupied' && (
                    <div className="space-y-6">
                      
                      {/* Section details */}
                      <div className="space-y-3.5 border-b border-muted-border pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">Dining Room</span>
                        </div>
                          <div className="flex justify-between">
                          <span className="text-subtle-text">Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Party Size:</span>
                          <span className="font-bold">{currentTable.guestCount || '—'} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Host:</span>
                          <span className="font-bold">{currentTable.guestName || 'Walk-in Guest'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Arrival Time:</span>
                          <span className="font-bold">{currentTable.arrivalTime || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Estimated Finish:</span>
                          <span className="font-bold text-saffron-gold">{getEstimatedFinish(currentTable.arrivalTime)}</span>
                        </div>
                      </div>

                      {/* Guest Notes */}
                      {currentTable.notes && (
                        <div className="p-4 bg-saffron-gold/5 border border-saffron-gold/20 italic rounded-xs">
                          <span className="font-label-caps text-[9px] text-saffron-gold uppercase font-bold tracking-widest block mb-1">Diner Preferences</span>
                          <p>"{currentTable.notes}"</p>
                        </div>
                      )}

                      {/* Current Order Summary */}
                      <div className="space-y-4">
                        <h4 className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold">Current Bill Items</h4>
                        {currentTable.items.length > 0 ? (
                          <ul className="space-y-3 border-b border-muted-border pb-4">
                            {currentTable.items.map((item, i) => (
                              <li key={i} className="flex justify-between items-center">
                                <span>{item.qty}x {item.name}</span>
                                <span className="font-bold font-mono">{formatINR((item.price * item.qty))}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-6 text-subtle-text italic border border-muted-border">
                            No items ordered yet.
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-2">
                          <span className="font-label-caps text-[10px] text-subtle-text uppercase">Total Charges</span>
                          <span className="font-serif text-2xl font-bold">{formatINR(currentTable.billTotal)}</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {currentTable.status === 'reserved' && (
                    <div className="space-y-6">
                      
                      {/* Reservation Info */}
                      <div className="space-y-3.5 border-b border-muted-border pb-6">
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
                          <span className="font-bold text-saffron-gold">{currentTable.arrivalTime}</span>
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
                      <div className="space-y-3.5 border-b border-muted-border pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">Dining Room</span>
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

                      {/* Seat a walk-in OR a reservation — two separate lists, never mixed */}
                      {showAssignForm && assignMode === 'walkin' ? (
                        <div className="p-4 border border-muted-border bg-canvas-cream space-y-4">
                          <h4 className="font-serif text-sm font-semibold">Seat a Walk-in</h4>
                          {walkInParties.length === 0 ? (
                            <p className="text-xs text-subtle-text italic">No walk-ins are waiting.</p>
                          ) : (
                            <div className="space-y-3">
                              <select 
                                id="seat_party_select"
                                className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none cursor-pointer"
                              >
                                {walkInParties.map(guest => (
                                  <option key={guest.id} value={guest.id} disabled={guest.partySize > currentTable.seats}>
                                    {guest.name} (Party of {guest.partySize}){guest.partySize > currentTable.seats ? ' — too big for this table' : ''}
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
                                  className="py-2 px-4 bg-saffron-gold text-midnight-black font-label-caps text-[10px] uppercase font-bold tracking-wider hover:bg-[#B8962F] transition-all cursor-pointer"
                                >
                                  Seat Walk-in
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
                      ) : showAssignForm && assignMode === 'reservation' ? (
                        <div className="p-4 border border-muted-border bg-canvas-cream space-y-4">
                          <h4 className="font-serif text-sm font-semibold">Assign a Reservation</h4>
                          <p className="text-[10px] text-subtle-text">Today's confirmed reservations that don't have a table yet.</p>
                          {seatableReservations.length === 0 ? (
                            <p className="text-xs text-subtle-text italic">No confirmed reservations are waiting for a table.</p>
                          ) : (
                            <div className="space-y-3">
                              <select 
                                id="seat_reservation_select"
                                className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none cursor-pointer"
                              >
                                {seatableReservations.map(r => (
                                  <option key={r.id} value={r.id} disabled={r.partySize > currentTable.seats}>
                                    {r.time} — {r.name} (Party of {r.partySize}){r.partySize > currentTable.seats ? ' — too big for this table' : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const selectEl = document.getElementById('seat_reservation_select');
                                    if (selectEl && selectEl.value) handleHoldReservation(selectEl.value);
                                  }}
                                  className="py-2 px-4 bg-amber-200 text-amber-900 font-label-caps text-[10px] uppercase font-bold tracking-wider hover:bg-amber-300 transition-all cursor-pointer"
                                >
                                  Hold Table
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const selectEl = document.getElementById('seat_reservation_select');
                                    if (selectEl && selectEl.value) handleSeatParty(selectEl.value);
                                  }}
                                  className="py-2 px-4 bg-saffron-gold text-midnight-black font-label-caps text-[10px] uppercase font-bold tracking-wider hover:bg-[#B8962F] transition-all cursor-pointer"
                                >
                                  Seat Now
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
                        <p className="text-xs text-subtle-text">This table is vacant. Seat a walk-in from the waitlist, or hold/seat a confirmed reservation.</p>
                      )}

                    </div>
                  )}

                  {currentTable.status === 'cleaning' && (
                    <div className="space-y-6">
                      
                      {/* Cleaning stats */}
                      <div className="space-y-3.5 border-b border-muted-border pb-6">
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Section:</span>
                          <span className="font-bold">Dining Room</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Capacity:</span>
                          <span className="font-bold">{currentTable.seats} Guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-subtle-text">Status:</span>
                          <span className="font-bold text-saffron-gold animate-pulse">Staff Sanitizing...</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-muted-border bg-canvas-cream shrink-0 space-y-3">
                  
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
                      {invoiceWaitingOn && (
                        <p className="text-[11px] leading-snug text-ink-navy bg-saffron-gold/10 border border-saffron-gold/40 p-3" role="status">
                          This order is {invoiceWaitingOn === 'new' ? 'still waiting for the kitchen' : invoiceWaitingOn === 'preparing' ? 'still being prepared' : 'ready but not served yet'}. Mark it as Served in Order Management before generating the invoice.
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleGenerateInvoice}
                          disabled={Boolean(invoiceWaitingOn) || !canManage}
                          title={canManage ? '' : 'Only a Manager or Owner can generate the invoice'}
                          className="h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                        >
                          {canManage ? 'Generate Invoice' : 'Manager Bills This'}
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
                          onClick={() => {
                            if (currentTable.reservationId) {
                              updateReservationStatus(currentTable.reservationId, 'cancelled');
                            } else {
                              cancelReservation(currentTable.id); // Fallback for mock
                            }
                          }}
                          className="h-[56px] bg-red-900/10 text-red-700 font-cta-label text-cta-label uppercase tracking-widest hover:bg-red-900/20 transition-all duration-300 cursor-pointer rounded-none text-center"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </>
                  )}

                  {currentTable.status === 'available' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => { setAssignMode('walkin'); setShowAssignForm(true); }}
                          className="h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                        >
                          Seat Walk-in
                        </button>
                        <button 
                          onClick={() => { setAssignMode('reservation'); setShowAssignForm(true); }}
                          className="h-[56px] bg-amber-200 text-amber-900 font-cta-label text-cta-label uppercase tracking-widest hover:bg-amber-300 active:scale-98 transition-all duration-300 cursor-pointer shadow-md rounded-none text-center font-bold"
                        >
                          Reservation
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
              className="bg-white border border-muted-border max-w-sm w-full p-8 shadow-2xl relative text-center text-ink-navy space-y-6"
            >
              <div>
                <h3 className="font-serif text-2xl font-bold">Table {selectedTableId}</h3>
                <p className="font-label-caps text-[9px] text-saffron-gold uppercase tracking-widest font-bold mt-1">Scan to Order</p>
              </div>

              {/* QR Image */}
              <div className="w-48 h-48 mx-auto border border-muted-border p-3 bg-white flex items-center justify-center">
                <img 
                  src={liveQr ? liveQr.qrDataUrl : (currentTable && currentTable.qrImage && currentTable.qrImage.startsWith('data:') ? currentTable.qrImage : getQrImage(selectedTableId))} 
                  alt={`QR for Table ${selectedTableId}`} 
                  className="w-full h-full object-contain"
                />
              </div>

              {sessionMenuUrl ? (
                <div className="space-y-2">
                  <p className="font-sans text-[11px] leading-relaxed text-subtle-text">
                    Live session — scanning opens the digital menu for this table.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sessionMenuUrl);
                      alert('Menu link copied — paste it in a browser to test without scanning.');
                    }}
                    className="font-mono text-[10px] text-saffron-gold underline break-all cursor-pointer hover:text-ink-navy transition-colors"
                  >
                    {sessionMenuUrl}
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
              className="bg-white border border-muted-border max-w-md w-full p-8 shadow-2xl relative text-ink-navy space-y-6"
            >
              <div className="flex justify-between items-start border-b border-muted-border pb-4">
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

                <div className="space-y-3 divide-y divide-muted-border/50 max-h-48 overflow-y-auto pr-2" data-lenis-prevent>
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

                <div className="flex justify-between pt-4 border-t border-muted-border font-serif text-lg font-bold">
                  <span>Subtotal:</span>
                  <span>{currentTable ? formatINR(currentTable.billTotal) : '₹0'}</span>
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

      {/* Center Modal: no phone on file - add one (10 digits) or skip, before the invoice */}
      <AnimatePresence>
        {showPhoneCaptureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-muted-border max-w-sm w-full p-8 shadow-2xl relative text-ink-navy text-center space-y-6"
            >
              <button
                onClick={() => setShowPhoneCaptureModal(false)}
                aria-label="Cancel"
                className="absolute top-3 right-3 text-subtle-text hover:text-ink-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="space-y-3">
                <span className="material-symbols-outlined text-saffron-gold text-4xl">call</span>
                <h3 className="font-serif text-xl font-bold">Guest phone number</h3>
                <p className="font-sans text-xs text-subtle-text leading-relaxed">
                  No phone number is on file for this guest. Add it to link this visit to their customer record, or skip to continue without one.
                </p>
              </div>

              <div className="space-y-1 text-left">
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  placeholder="10-digit mobile number"
                  value={billingPhoneInput}
                  onChange={(e) => setBillingPhoneInput(cleanPhone(e.target.value))}
                  className="w-full bg-surface-container-low border border-muted-border p-3 text-sm outline-none focus:border-saffron-gold"
                />
                {billingPhoneInput.length > 0 && billingPhoneInput.length < 10 && (
                  <p className="text-[10px] text-subtle-text/70">Enter all 10 digits ({billingPhoneInput.length} of 10).</p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => handleConfirmGenerateInvoice()}
                  className="flex-grow h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleConfirmGenerateInvoice(billingPhoneInput)}
                  disabled={billingPhoneInput.length !== 10}
                  className="flex-grow h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all duration-300 cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save & Generate
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
              className="bg-white border border-muted-border max-w-sm w-full p-8 shadow-2xl relative text-ink-navy text-center space-y-6"
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
