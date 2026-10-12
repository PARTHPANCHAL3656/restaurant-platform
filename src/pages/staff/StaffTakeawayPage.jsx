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
// A ticket sitting in New or Preparing this long (since it last moved) is
// flagged, and the Cancel option appears on it.
const STALE_MIN = 45;
// Flagging a no-show cancels the order and blocks the customer, so staff can't
// do it until the order has been Ready for this long.
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

// "Just now", "6 mins ago", "2 hrs ago". Worked out from the clock on every
// tick, so it never goes stale while the board stays open.
const ago = (ms) => {
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'} ago`;
};

function Ticket({ ticket, now, confirming, onBump, onFlagNoShow, onCancel }) {
  const stage = STAGE[ticket.status];
  const elapsedMs = now - ticket.since;
  const minutes = elapsedMs / 60000;
  const late = ticket.status === 'new'
    ? minutes >= LATE_NEW_MIN
    : ticket.status === 'preparing'
      ? minutes >= LATE_PREPARING_MIN
      : minutes >= OVERDUE_READY_MIN;
  const itemCount = ticket.items.reduce((n, i) => n + i.qty, 0);
  const stuck = (ticket.status === 'new' || ticket.status === 'preparing') && minutes >= STALE_MIN;
  const compact = ticket.status === 'ready';
  const noShowWait = Math.max(0, Math.ceil(MIN_NOSHOW_WAIT_MIN - minutes));

  return (
    <div className={`bg-white border ${stuck ? 'border-red-400' : stage.border} shadow-sm flex flex-col`}>
      <div className={`${stage.header} px-4 py-3`}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-2xl font-bold leading-none whitespace-nowrap">{ticket.label}</span>
          <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm whitespace-nowrap ${late ? 'bg-red-600 text-white' : 'bg-white text-ink-navy'}`}>
            {clock(elapsedMs)}
          </span>
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} · Pickup {ticket.pickupTime || 'ASAP'}
        </div>
      </div>

      {stuck && (
        <p className="px-4 pt-3 text-[11px] text-red-600 font-bold uppercase tracking-wide">
          {ticket.status === 'new'
            ? `Likely abandoned. Not started in ${STALE_MIN}+ min`
            : `Cooking for ${STALE_MIN}+ min. Check on it`}
        </p>
      )}
      {ticket.status === 'ready' && late && (
        <p className="px-4 pt-3 text-[11px] text-red-600 font-bold uppercase tracking-wide">
          Overdue. Still waiting for pickup
        </p>
      )}

      <div className="px-4 pt-3">
        <p className="text-sm font-semibold text-ink-navy">{ticket.guestName}</p>
        <p className="text-[11px] uppercase tracking-wider text-subtle-text">
          {ticket.guestPhone} · Ordered {ago(now - ticket.createdMs)}
        </p>
      </div>

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

      <p className="px-4 pb-3 text-[11px] text-subtle-text">
        Items subtotal {formatINR(ticket.subtotal)} · before GST and fees
      </p>

      {stuck && (
        <button
          type="button"
          onClick={onCancel}
          className="mx-4 mb-3 text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-1 text-left cursor-pointer"
        >
          Cancel this order
        </button>
      )}
      {ticket.status === 'ready' && (
        minutes >= MIN_NOSHOW_WAIT_MIN ? (
          <button
            type="button"
            onClick={onFlagNoShow}
            className="mx-4 mb-3 text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-1 text-left cursor-pointer"
          >
            Flag as no-show
          </button>
        ) : (
          <p className="mx-4 mb-3 text-[11px] text-subtle-text/70">
            No-show option in {noShowWait} min. They may just be running late.
          </p>
        )
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

  const [noShowOrderId, setNoShowOrderId] = useState(null);
  const [noShowReason, setNoShowReason] = useState('');
  const [hasCalledCustomer, setHasCalledCustomer] = useState(false);

  // ---- Tickets: one per live takeout order that has items, oldest first.
  // A guest who has started an order but not added anything yet has no ticket. ----
  const tickets = useMemo(() => {
    const list = [];
    for (const o of orders) {
      if (o.orderType !== 'takeout') continue;
      if (o.status !== 'new' && o.status !== 'preparing' && o.status !== 'ready') continue;
      if (!o.items || o.items.length === 0) continue;
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
        guestPhone: o.guestPhone,
        pickupTime: o.pickupTime,
        subtotal: o.items.reduce((sum, i) => sum + i.price * i.qty, 0),
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

  const noShowOrder = orders.find(o => o.id === noShowOrderId && o.orderType === 'takeout');

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

  // ---- Cancel and no-show ----
  const cancelStuck = (t) => {
    if (window.confirm(`Cancel ${t.label}? It looks abandoned. This does NOT block the customer from ordering again.`)) {
      cancelOrder(t.orderId);
    }
  };

  const closeNoShowModal = () => {
    setNoShowOrderId(null);
    setNoShowReason('');
    setHasCalledCustomer(false);
  };

  const confirmNoShow = () => {
    flagCustomerNoShow(noShowOrder.guestPhone, noShowOrder.id, noShowReason);
    closeNoShowModal();
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
              now={now}
              confirming={confirmKey === t.key}
              onBump={() => bump(t)}
              onFlagNoShow={() => setNoShowOrderId(t.orderId)}
              onCancel={() => cancelStuck(t)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-80px)] md:overflow-hidden select-none bg-surface">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-muted-border bg-white shrink-0">
        <p className="text-xs text-subtle-text">
          {tickets.length} open {tickets.length === 1 ? 'order' : 'orders'}
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

      {/* No-Show Confirmation Modal */}
      {noShowOrder && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={closeNoShowModal}>
          <div className="bg-white w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-red-600 text-white">
              <h3 className="font-serif text-xl">Flag {noShowOrder.table} as No-Show?</h3>
              <p className="text-xs text-white/80 mt-1">
                This cancels the order and blocks {noShowOrder.guestPhone} from placing new online takeout orders.
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
                  I called <strong>{noShowOrder.guestPhone}</strong> and confirmed they are not coming, or could not reach them after trying.
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