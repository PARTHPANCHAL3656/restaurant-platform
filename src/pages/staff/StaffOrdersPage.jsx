import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStaff } from '../../context/StaffContext';
import { isKitchenSoundOn, getKitchenAudio, playKitchenChime } from '../../utils/kitchenChime';

// One ticket = one round of one table. Chef taps Start, then Send out; the
// waiter taps Served. Takeout lives on its own page.
const NEXT = { Received: 'Preparing', Preparing: 'Ready', Ready: 'Served' };
const BUTTON_LABEL = { Received: 'Start', Preparing: 'Send out', Ready: 'Served' };
const MOVED_TO = { Preparing: 'Preparing', Ready: 'Ready to serve', Served: 'Served', Received: 'New' };
const RANK = { Received: 0, Preparing: 1, Ready: 2, Served: 3 };

// Stage colours reuse what the old column count pills already used:
// soft tinted headers, one solid button colour per stage.
const STAGE = {
  Received: {
    title: 'New',
    header: 'bg-saffron-gold/20 text-ink-navy border-b border-saffron-gold/40',
    button: 'bg-saffron-gold text-ink-navy',
    pill: 'bg-saffron-gold/15 text-saffron-gold',
    border: 'border-saffron-gold/50'
  },
  Preparing: {
    title: 'Preparing',
    header: 'bg-blue-100 text-blue-900 border-b border-blue-200',
    button: 'bg-blue-800 text-white',
    pill: 'bg-blue-100 text-blue-800',
    border: 'border-blue-200'
  },
  Ready: {
    title: 'Ready to Serve',
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

function Ticket({ ticket, now, prepMin, onBump }) {
  const stage = STAGE[ticket.status];
  const elapsedMs = now - ticket.since;
  const minutes = elapsedMs / 60000;
  // Late = cooking longer than the slowest dish should take, or waiting over
  // 5 minutes to be started / picked up.
  const late = ticket.status === 'Preparing' ? minutes >= prepMin : minutes >= 5;
  const compact = ticket.status === 'Ready';
  const itemCount = ticket.items.reduce((n, i) => n + i.qty, 0);

  return (
    <div className={`bg-white border ${stage.border} shadow-sm flex flex-col`}>
      <div className={`${stage.header} px-4 py-3`}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-2xl font-bold leading-none whitespace-nowrap">{ticket.table}</span>
          <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm whitespace-nowrap ${late ? 'bg-red-600 text-white' : 'bg-white text-ink-navy'}`}>
            {clock(elapsedMs)}
          </span>
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest">
          Round {ticket.round} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
      </div>

      <ul className="px-4 py-3 space-y-1.5">
        {ticket.items.map((item, idx) => (
          <li key={idx} className={`flex gap-2 ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="font-bold text-saffron-gold w-8 shrink-0">{item.qty}x</span>
            <span className="font-semibold text-ink-navy">{item.name}</span>
          </li>
        ))}
      </ul>

      {ticket.notes && ticket.status !== 'Ready' && (
        <p className="mx-4 mb-3 text-sm bg-yellow-50 border border-yellow-200 text-ink-navy px-3 py-2">
          Note: {ticket.notes}
        </p>
      )}

      <button
        type="button"
        onClick={onBump}
        className={`mx-4 mb-4 h-14 ${stage.button} font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer`}
      >
        {BUTTON_LABEL[ticket.status]}
      </button>
    </div>
  );
}

export default function StaffOrdersPage() {
  const { orders, advanceRound, menuItems } = useStaff();
  const now = useNow(1000);

  // ---- Tickets: one per unserved round of every dine-in order. If the data
  // ever holds the same round twice, only the most advanced copy is used. ----
  const tickets = useMemo(() => {
    const best = new Map();
    for (const o of orders) {
      if (o.orderType === 'takeout') continue;
      for (const r of o.rounds || []) {
        const key = `${o.id}:${r.round}`;
        const prev = best.get(key);
        if (!prev || RANK[r.status] > RANK[prev.r.status]) best.set(key, { o, r });
      }
    }
    const list = [];
    for (const [key, { o, r }] of best) {
      if (r.status === 'Served') continue;
      const stamp = r.status === 'Received' ? r.placedAt : r.status === 'Preparing' ? (r.startedAt || r.placedAt) : (r.readyAt || r.placedAt);
      list.push({
        key,
        orderId: o.id,
        table: o.table,
        round: r.round,
        status: r.status,
        items: o.items.filter(i => (i.round || 1) === r.round),
        notes: o.notes,
        since: new Date(stamp).getTime(),
        placed: new Date(r.placedAt).getTime()
      });
    }
    return list.sort((a, b) => a.placed - b.placed);
  }, [orders]);

  const columns = useMemo(() => ({
    Received: tickets.filter(t => t.status === 'Received'),
    Preparing: tickets.filter(t => t.status === 'Preparing'),
    Ready: tickets.filter(t => t.status === 'Ready')
  }), [tickets]);

  const prepMinutes = (items) => {
    const longest = items.reduce((m, i) => {
      const found = (menuItems || []).find(x => x.name === i.name);
      const n = parseInt(found && found.prepTime, 10);
      return Math.max(m, Number.isFinite(n) ? n : 0);
    }, 0);
    return longest || 15;
  };

  // ---- Moving tickets, with a 10-second Undo. The ticket moves at once; only
  // a second tap on the SAME ticket is ignored while its move is in flight. ----
  const pendingRef = useRef(new Set());
  const undoTimer = useRef(null);
  const [message, setMessage] = useState('');
  const [lastAction, setLastAction] = useState(null);

  const move = useCallback(async (orderId, round, label, from, to, isUndo) => {
    const key = `${orderId}:${round}`;
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setMessage('');
    if (isUndo) {
      setLastAction(null);
    } else {
      clearTimeout(undoTimer.current);
      setLastAction({ orderId, round, label, from, to });
      undoTimer.current = setTimeout(() => setLastAction(null), 10000);
    }
    try {
      await advanceRound(orderId, round, to);
    } catch (err) {
      setLastAction(null);
      setMessage(err.message || 'Could not update this ticket. Please try again.');
    } finally {
      pendingRef.current.delete(key);
    }
  }, [advanceRound]);

  const bump = (t) => move(t.orderId, t.round, `${t.table} Round ${t.round}`, t.status, NEXT[t.status], false);
  const undo = () => {
    if (!lastAction) return;
    move(lastAction.orderId, lastAction.round, lastAction.label, lastAction.to, lastAction.from, true);
  };

  // ---- Chime when a new ticket arrives ----
  // The on/off switch lives in Settings → Operations (it is saved per device).
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
    const current = new Set(columns.Received.map(t => t.key));
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
              prepMin={prepMinutes(t.items)}
              onBump={() => bump(t)}
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
          {tickets.length} open {tickets.length === 1 ? 'ticket' : 'tickets'}
        </p>
        <div className="flex items-center gap-3">
          {message && <span className="text-xs text-red-600">{message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_0.8fr] gap-4 p-4 md:p-6 flex-grow min-h-0">
        {renderColumn('Received')}
        {renderColumn('Preparing')}
        {renderColumn('Ready')}
      </div>

      {lastAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink-navy text-canvas-cream px-5 py-3 shadow-2xl flex items-center gap-4 text-sm">
          <span>{lastAction.label} moved to {MOVED_TO[lastAction.to]}</span>
          <button
            type="button"
            onClick={undo}
            className="text-saffron-gold font-bold uppercase tracking-widest text-xs cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
