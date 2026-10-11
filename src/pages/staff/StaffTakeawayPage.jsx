import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStaff } from '../../context/StaffContext';
import { formatINR } from '../../utils/currency';
import { isKitchenSoundOn, getKitchenAudio, playKitchenChime } from '../../utils/kitchenChime';

// One ticket = one takeout order (takeout has no rounds). The chef taps Start,
// then Ready for pickup; whoever is at the counter taps Picked Up when the
// customer collects. Picked Up creates the bill, so it is never automatic and
// it needs a second tap. Dine-in lives on the Order Management page.
const NEXT = { new: 'Preparing', preparing: 'Ready', ready: 'Served' };
const BUTTON_LABEL = { new: 'Start', preparing: 'Ready for pickup', ready: 'Picked up' };
const MOVED_TO = { Received: 'New', Preparing: 'Preparing', Ready: 'Ready for pickup', Served: 'Picked up' };
const BACKEND_NAME = { new: 'Received', preparing: 'Preparing', ready: 'Ready', served: 'Served' };

// Minutes after which a ticket turns red.
const LATE_NEW_MIN = 5;
const LATE_PREPARING_MIN = 20;
const OVERDUE_READY_MIN = 25;
// An order stuck in New or Preparing this long was probably abandoned.
const STALE_MIN = 45;
// Flagging a no-show cancels the order and blocks the customer, so staff can't
// open that flow until the order has been Ready for this long.
const MIN_NOSHOW_WAIT_MIN = 15;

const STAGE = {
  new: {
    title: 'New',
    header: 'bg-saffron-gold/20 text-ink-navy border-b border-saffron-gold/40',
    button: 'bg-saffron-gold text-ink-navy',
    pill: 'bg-saffron-gold/15 text-saffron-gold',
    border: 'border-saffron-gold/50'
  },
  preparing: {
    title: 'Preparing',
    header: 'bg-blue-100 text-blue-900 border-b border-blue-200',
    button: 'bg-blue-800 text-white',
    pill: 'bg-blue-100 text-blue-800',
    border: 'border-blue-200'
  },
  ready: {
    title: 'Ready for Pickup',
    header: 'bg-green-100 text-green-900 border-b border-green-200',
    button: 'bg-green-800 text-white',
    pill: 'bg-green-100 text-green-800',
    border: 'border-green-200'
  }
};

function useNow(ms) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Ticket({ ticket, num, now, confirming, onBump, onOpen }) {
  const stage = STAGE[ticket.status];
  const elapsedMs = now - ticket.since;
  const minutes = elapsedMs / 60000;
  const late = ticket.status === 'new'
    ? minutes >= LATE_NEW_MIN
    : ticket.status === 'preparing'
      ? minutes >= LATE_PREPARING_MIN
      : minutes >= OVERDUE_READY_MIN;
  const itemCount = ticket.items.reduce((n, i) => n + i.qty, 0);
  const stale = (ticket.status === 'new' || ticket.status === 'preparing')
    && (now - ticket.createdMs) / 60000 >= STALE_MIN;
  const compact = ticket.status === 'ready';

  return (
    <div className={`bg-white border ${stale ? 'border-red-400' : stage.border} shadow-sm flex flex-col`}>
      <div
        onClick={onOpen}
        className={`${stage.header} px-4 py-3 cursor-pointer`}
        title="Tap for details"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-2xl font-bold leading-none whitespace-nowrap">{ticket.label}</span>
          <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm whitespace-nowrap ${late ? 'bg-red-600 text-white' : 'bg-white text-ink-navy'}`}>
            {clock(elapsedMs)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest">
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'} · Pickup {ticket.pickupTime || 'ASAP'}</span>
          {num ? <span className="opacity-70">Key {num}</span> : null}
        </div>
      </div>

      {stale && (
        <p className="px-4 pt-3 text-[11px] text-red-600 font-bold uppercase tracking-wide">
          Likely abandoned. No progress in {STALE_MIN}+ min
        </p>
      )}
      {ticket.status === 'ready' && late && (
        <p className="px-4 pt-3 text-[11px] text-red-600 font-bold uppercase tracking-wide">
          Overdue. Still waiting for pickup
        </p>
      )}

      <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle-text">{ticket.guestName}</p>

      <ul className="px-4 py-3 space-y-1.5">
        {ticket.items.map((item, idx) => (
          <li key={idx} className={`flex gap-2 ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="font-bold text-saffron-gold w-8 shrink-0">{item.qty}x</span>
            <span className="font-semibold text-ink-navy">{item.name}</span>
          </li>
        ))}
      </ul>

      {ticket.notes && ticket.status !== 'ready' && (
        <p className="mx-4 mb-3 text-sm bg-yellow-50 border border-yellow-200 text-ink-navy px-3 py-2">
          Note: {ticket.notes}
        </p>
      )}

      <button
        type="button"
        onClick={onBump}
        className={`mx-4 mb-4 h-14 ${confirming ? 'bg-red-700 text-white' : stage.button} font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer`}
      >
        {confirming ? 'Tap again to confirm' : BUTTON_LABEL[ticket.status]}
      </button>
    </div>
  );
}

export default function StaffTakeawayPage() {
  const { orders, moveTakeout, cancelOrder, flagCustomerNoShow } = useStaff();
  const now = useNow(1000);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [hasCalledCustomer, setHasCalledCustomer] = useState(false);

  // ---- Tickets: one per live takeout order, oldest first ----
  const tickets = useMemo(() => {
    const list = [];
    for (const o of orders) {
      if (o.orderType !== 'takeout') continue;
      if (o.status !== 'new' && o.status !== 'preparing' && o.status !== 'ready') continue;
      const createdMs = new Date(o.createdAt).getTime();
      const stamp = o.status === 'new'
        ? o.createdAt
        : o.status === 'preparing'
          ? (o.startedAt || o.createdAt)
          : (o.readyAt || o.createdAt);
      list.push({
        key: o.id,
        orderId: o.id,
        label: o.table,
        status: o.status,
        items: o.items,
        notes: o.notes,
        guestName: o.guestName,
        pickupTime: o.pickupTime,
        since: new Date(stamp).getTime(),
        createdMs
      });
    }
    return list.sort((a, b) => a.createdMs - b.createdMs);
  }, [orders]);

  const columns = useMemo(() => ({
    new: tickets.filter(t => t.status === 'new'),
    preparing: tickets.filter(t => t.status === 'preparing'),
    ready: tickets.filter(t => t.status === 'ready')
  }), [tickets]);

  // Numbered in the order they appear on screen (1-9), for the keyboard.
  const numbered = useMemo(() => [...columns.new, ...columns.preparing, ...columns.ready], [columns]);
  const numberOf = (key) => {
    const i = numbered.findIndex(t => t.key === key);
    return i >= 0 && i < 9 ? i + 1 : 0;
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId && o.orderType === 'takeout');

  // ---- Moving tickets, with a 10-second Undo. Picked Up has no Undo because
  // it creates the bill. ----
  const pendingRef = useRef(new Set());
  const undoTimer = useRef(null);
  const [message, setMessage] = useState('');
  const [lastAction, setLastAction] = useState(null);

  const move = useCallback(async (orderId, label, from, to, isUndo) => {
    if (pendingRef.current.has(orderId)) return;
    pendingRef.current.add(orderId);
    setMessage('');
    clearTimeout(undoTimer.current);
    if (isUndo) {
      setLastAction(null);
    } else {
      setLastAction({ orderId, label, from, to, canUndo: to !== 'Served' });
      undoTimer.current = setTimeout(() => setLastAction(null), 10000);
    }
    try {
      await moveTakeout(orderId, to);
    } catch (err) {
      setLastAction(null);
      setMessage(err.message || 'Could not update this order. Please try again.');
    } finally {
      pendingRef.current.delete(orderId);
    }
  }, [moveTakeout]);

  // Picked Up needs a second tap on the same ticket within 3 seconds.
  const confirmRef = useRef(null);
  const confirmTimer = useRef(null);
  const [confirmKey, setConfirmKey] = useState(null);

  const bump = (t) => {
    if (t.status === 'ready') {
      if (confirmRef.current !== t.key) {
        confirmRef.current = t.key;
        setConfirmKey(t.key);
        clearTimeout(confirmTimer.current);
        confirmTimer.current = setTimeout(() => {
          confirmRef.current = null;
          setConfirmKey(null);
        }, 3000);
        return;
      }
      clearTimeout(confirmTimer.current);
      confirmRef.current = null;
      setConfirmKey(null);
    }
    move(t.orderId, t.label, BACKEND_NAME[t.status], NEXT[t.status], false);
  };

  const undo = () => {
    if (!lastAction || !lastAction.canUndo) return;
    move(lastAction.orderId, lastAction.label, lastAction.to, lastAction.from, true);
  };

  // ---- Keyboard: 1-9 moves that ticket on, 0 undoes ----
  const numberedRef = useRef(numbered);
  const bumpRef = useRef(bump);
  const undoRef = useRef(undo);
  numberedRef.current = numbered;
  bumpRef.current = bump;
  undoRef.current = undo;

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '0') { undoRef.current(); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= 9) {
        const t = numberedRef.current[n - 1];
        if (t) bumpRef.current(t);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => {
    clearTimeout(undoTimer.current);
    clearTimeout(confirmTimer.current);
  }, []);

  // ---- Chime when a new order arrives (the switch is in Settings → Operations) ----
  const [soundOn] = useState(() => isKitchenSoundOn());

  // Browsers only allow sound after a tap, so after a reload the first tap wakes it.
  useEffect(() => {
    if (!soundOn) return undefined;
    const wake = () => getKitchenAudio();
    window.addEventListener('pointerdown', wake, { once: true });
    return () => window.removeEventListener('pointerdown', wake);
  }, [soundOn]);

  const seenNew = useRef(null);
  useEffect(() => {
    const current = new Set(columns.new.map(t => t.key));
    if (seenNew.current && soundOn) {
      for (const k of current) {
        if (!seenNew.current.has(k)) { playKitchenChime(); break; }
      }
    }
    seenNew.current = current; // first load only sets the baseline, no chime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, soundOn]);

  // ---- Keep the screen awake while the board is open ----
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
      } catch (e) { /* not supported or refused */ }
    };
    request();
    const onVisible = () => { if (document.visibilityState === 'visible') request(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, []);

  // ---- Details panel: phone, total, cancel abandoned, no-show ----
  const orderTotal = (order) => order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const minutesSinceReady = (order) => {
    if (!order || !order.readyAt) return 0;
    return (now - new Date(order.readyAt).getTime()) / 60000;
  };
  const canFlagNoShow = (order) => order && order.status === 'ready' && minutesSinceReady(order) >= MIN_NOSHOW_WAIT_MIN;
  const minutesUntilEligible = (order) => Math.max(0, Math.ceil(MIN_NOSHOW_WAIT_MIN - minutesSinceReady(order)));
  const isStale = (order) => {
    if (!order || (order.status !== 'new' && order.status !== 'preparing')) return false;
    return (now - new Date(order.createdAt).getTime()) / 60000 >= STALE_MIN;
  };

  const closeNoShowModal = () => {
    setNoShowModalOpen(false);
    setNoShowReason('');
    setHasCalledCustomer(false);
  };

  const confirmNoShow = () => {
    flagCustomerNoShow(selectedOrder.guestPhone, selectedOrder.id, noShowReason);
    closeNoShowModal();
    setSelectedOrderId(null);
  };

  const renderColumn = (status) => {
    const stage = STAGE[status];
    const list = columns[status];
    return (
      <div className="flex flex-col min-h-0 bg-white border border-muted-border p-4">
        <div className="flex justify-between items-center pb-4 border-b border-muted-border mb-4 shrink-0">
          <h3 className="font-serif text-md text-ink-navy font-semibold">{stage.title}</h3>
          <span className={`${stage.pill} text-xs px-2.5 py-0.5 font-bold rounded-full`}>{list.length}</span>
        </div>
        <div
          className="grid gap-3 content-start md:overflow-y-auto flex-grow min-h-0 hide-scrollbar"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          data-lenis-prevent
        >
          {list.length === 0 && (
            <p className="text-xs italic text-subtle-text">Nothing here right now.</p>
          )}
          {list.map(t => (
            <Ticket
              key={t.key}
              ticket={t}
              num={numberOf(t.key)}
              now={now}
              confirming={confirmKey === t.key}
              onBump={() => bump(t)}
              onOpen={() => setSelectedOrderId(t.orderId)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col-reverse md:flex-row md:h-[calc(100vh-80px)] relative select-none md:overflow-hidden bg-surface">
      <div className="flex-grow flex flex-col min-h-0 min-w-0">
        <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-muted-border bg-white shrink-0">
          <p className="text-xs text-subtle-text">
            {tickets.length} open {tickets.length === 1 ? 'order' : 'orders'} · Tap a ticket's top bar for details
          </p>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-red-600">{message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_0.8fr] gap-4 p-4 md:p-6 flex-grow min-h-0">
          {renderColumn('new')}
          {renderColumn('preparing')}
          {renderColumn('ready')}
        </div>
      </div>

      {/* Details slide-over panel */}
      {selectedOrder && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSelectedOrderId(null)} />}
      <div className={`fixed md:static inset-y-0 right-0 z-50 md:z-auto bg-white border-l border-muted-border shrink-0 min-h-0 transition-all duration-300 shadow-2xl flex flex-col ${
        selectedOrder ? 'w-full md:w-96 translate-x-0' : 'w-full md:w-96 translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
      }`}>
        {selectedOrder && (
          <div className="h-full flex flex-col justify-between">
            <div className="p-6 bg-ink-navy text-canvas-cream shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-label-caps text-[9px] text-saffron-gold tracking-widest font-bold uppercase block mb-1">
                    {selectedOrder.table}
                  </span>
                  <h3 className="font-serif text-2xl">{selectedOrder.guestName}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined normal-case">close</span>
                </button>
              </div>
              <p className="text-[11px] text-canvas-cream/60 font-label-caps tracking-widest uppercase">
                {selectedOrder.guestPhone} • Ordered {selectedOrder.time}
              </p>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto p-6 space-y-6 hide-scrollbar" data-lenis-prevent>
              <div className="space-y-3 pb-6 border-b border-muted-border text-xs">
                <div className="flex justify-between">
                  <span className="text-subtle-text">Pickup Time:</span>
                  <span className="font-bold text-ink-navy">{selectedOrder.pickupTime || 'ASAP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Order Total:</span>
                  <span className="font-bold font-mono text-ink-navy">{formatINR(orderTotal(selectedOrder))}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold">Items</h4>
                <ul className="space-y-3.5 text-xs text-ink-navy divide-y divide-muted-border/50">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center pt-3.5 first:pt-0">
                      <div>
                        <span className="font-bold text-saffron-gold mr-3">{item.qty}x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono">{formatINR(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs italic text-ink-navy rounded-xs">
                  <p className="font-semibold text-yellow-800 font-label-caps text-[9px] uppercase tracking-wider mb-1">Special Notes</p>
                  <p>"{selectedOrder.notes}"</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-muted-border bg-canvas-cream shrink-0 space-y-3">
              {isStale(selectedOrder) && (
                <button
                  onClick={() => {
                    if (window.confirm('Cancel this order? Looks abandoned: no items progress in a while. This does NOT block the customer from ordering again.')) {
                      cancelOrder(selectedOrder.id);
                      setSelectedOrderId(null);
                    }
                  }}
                  className="w-full text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-2 cursor-pointer"
                >
                  Cancel Abandoned Order
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                canFlagNoShow(selectedOrder) ? (
                  <button
                    onClick={() => setNoShowModalOpen(true)}
                    className="w-full text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-2 cursor-pointer"
                  >
                    Flag as No-Show
                  </button>
                ) : (
                  <p className="text-center text-[11px] text-subtle-text/70 py-2">
                    No-show option available in {minutesUntilEligible(selectedOrder)} min. Give them time, they might just be running late.
                  </p>
                )
              )}
              {!isStale(selectedOrder) && selectedOrder.status !== 'ready' && (
                <p className="text-center text-[11px] text-subtle-text/70 py-2">
                  Move this order on from its ticket on the board.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* No-Show Confirmation Modal */}
      {noShowModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={closeNoShowModal}>
          <div className="bg-white w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-red-600 text-white">
              <h3 className="font-serif text-xl">Flag {selectedOrder.table} as No-Show?</h3>
              <p className="text-xs text-white/80 mt-1">
                This cancels the order and blocks {selectedOrder.guestPhone} from placing new online takeout orders.
                The food already prepared for this order will go to waste.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">
                  Reason
                </label>
                <select
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  className="w-full mt-1 border border-muted-border px-3 h-11 text-sm focus:outline-none focus:border-red-400 bg-white"
                >
                  <option value="">Select a reason...</option>
                  <option value="No answer after calling">No answer after calling</option>
                  <option value="Customer confirmed cancelling">Customer confirmed cancelling</option>
                  <option value="Wrong number / unreachable">Wrong number / unreachable</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCalledCustomer}
                  onChange={(e) => setHasCalledCustomer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600"
                />
                <span className="text-xs text-ink-navy">
                  I called <strong>{selectedOrder.guestPhone}</strong> and confirmed they are not coming, or could not reach them after trying.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeNoShowModal}
                  className="flex-1 border border-muted-border text-ink-navy text-xs font-semibold uppercase tracking-widest py-3 hover:bg-canvas-cream cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNoShow}
                  disabled={!hasCalledCustomer || !noShowReason}
                  className="flex-1 bg-red-600 text-white text-xs font-semibold uppercase tracking-widest py-3 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Confirm No-Show
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lastAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink-navy text-canvas-cream px-5 py-3 shadow-2xl flex items-center gap-4 text-sm">
          <span>{lastAction.label} moved to {MOVED_TO[lastAction.to]}</span>
          {lastAction.canUndo && (
            <button
              type="button"
              onClick={undo}
              className="text-saffron-gold font-bold uppercase tracking-widest text-xs cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}