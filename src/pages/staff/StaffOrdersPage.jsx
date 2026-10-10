import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStaff } from '../../context/StaffContext';

// One ticket = one round of one table. Chef taps Start, then Send out; the
// waiter taps Served. Takeout lives on its own page.
const NEXT = { Received: 'Preparing', Preparing: 'Ready', Ready: 'Served' };
const BUTTON_LABEL = { Received: 'Start', Preparing: 'Send out', Ready: 'Served' };
const MOVED_TO = { Preparing: 'Preparing', Ready: 'Ready to serve', Served: 'Served', Received: 'New' };

// Stage colours reuse what the old column count pills already used.
const STAGE = {
  Received: {
    title: 'New',
    header: 'bg-saffron-gold text-ink-navy',
    button: 'bg-saffron-gold text-ink-navy',
    pill: 'bg-saffron-gold/15 text-saffron-gold',
    border: 'border-saffron-gold/50'
  },
  Preparing: {
    title: 'Preparing',
    header: 'bg-blue-800 text-white',
    button: 'bg-blue-800 text-white',
    pill: 'bg-blue-100 text-blue-800',
    border: 'border-blue-800/30'
  },
  Ready: {
    title: 'Ready to Serve',
    header: 'bg-green-800 text-white',
    button: 'bg-green-800 text-white',
    pill: 'bg-green-100 text-green-800',
    border: 'border-green-800/30'
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

// While cooking, urgency follows the slowest dish's prep time. Waiting to be
// started or picked up, anything over 2 minutes needs a look, over 5 is late.
function urgency(status, elapsedMin, prepMin) {
  if (status === 'Preparing') {
    if (elapsedMin >= prepMin * 1.5) return 'late';
    if (elapsedMin >= prepMin) return 'warn';
    return 'ok';
  }
  if (elapsedMin >= 5) return 'late';
  if (elapsedMin >= 2) return 'warn';
  return 'ok';
}

function Ticket({ ticket, num, now, prepMin, busy, onBump }) {
  const stage = STAGE[ticket.status];
  const elapsedMs = now - ticket.since;
  const level = urgency(ticket.status, elapsedMs / 60000, prepMin);
  const chip = level === 'late' ? 'bg-red-600 text-white' : level === 'warn' ? 'bg-white text-ink-navy' : '';
  const compact = ticket.status === 'Ready';

  return (
    <div className={`bg-white border ${stage.border} shadow-sm flex flex-col`}>
      <div className={`${stage.header} px-4 py-3 flex items-center justify-between gap-3`}>
        <span className="flex items-baseline gap-3 min-w-0">
          {num ? <span className="text-[10px] font-bold opacity-70">#{num}</span> : null}
          <span className="font-serif text-2xl font-bold leading-none truncate">{ticket.table}</span>
          <span className="text-xs font-semibold uppercase tracking-widest">Round {ticket.round}</span>
        </span>
        <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-sm ${chip}`}>{clock(elapsedMs)}</span>
      </div>

      <ul className="px-4 py-3 space-y-1">
        {ticket.items.map((item, idx) => (
          <li key={idx} className={compact ? 'text-sm' : 'text-lg'}>
            <span className="font-bold text-saffron-gold mr-2">{item.qty}x</span>
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
        disabled={busy}
        className={`mx-4 mb-4 h-14 ${stage.button} font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all disabled:opacity-60 cursor-pointer`}
      >
        {BUTTON_LABEL[ticket.status]}
      </button>
    </div>
  );
}

export default function StaffOrdersPage() {
  const { orders, advanceRound, menuItems } = useStaff();
  const now = useNow(1000);

  // ---- Tickets: one per unserved round of every dine-in order ----
  const tickets = useMemo(() => {
    const list = [];
    for (const o of orders) {
      if (o.orderType === 'takeout') continue;
      for (const r of o.rounds || []) {
        if (r.status === 'Served') continue;
        const stamp = r.status === 'Received' ? r.placedAt : r.status === 'Preparing' ? (r.startedAt || r.placedAt) : (r.readyAt || r.placedAt);
        list.push({
          key: `${o.id}:${r.round}`,
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
    }
    return list.sort((a, b) => a.placed - b.placed);
  }, [orders]);

  const columns = useMemo(() => ({
    Received: tickets.filter(t => t.status === 'Received'),
    Preparing: tickets.filter(t => t.status === 'Preparing'),
    Ready: tickets.filter(t => t.status === 'Ready')
  }), [tickets]);

  // Numbered in the order they appear on screen (1-9), for the keyboard.
  const numbered = useMemo(() => [...columns.Received, ...columns.Preparing, ...columns.Ready], [columns]);
  const numberOf = (key) => {
    const i = numbered.findIndex(t => t.key === key);
    return i >= 0 && i < 9 ? i + 1 : 0;
  };

  const prepMinutes = (items) => {
    const longest = items.reduce((m, i) => {
      const found = (menuItems || []).find(x => x.name === i.name);
      const n = parseInt(found && found.prepTime, 10);
      return Math.max(m, Number.isFinite(n) ? n : 0);
    }, 0);
    return longest || 15;
  };

  // ---- Moving tickets, with a 10-second Undo ----
  const busyRef = useRef(false);
  const undoTimer = useRef(null);
  const [message, setMessage] = useState('');
  const [lastAction, setLastAction] = useState(null);

  const move = useCallback(async (orderId, round, label, from, to, isUndo) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setMessage('');
    try {
      await advanceRound(orderId, round, to);
      clearTimeout(undoTimer.current);
      if (isUndo) {
        setLastAction(null);
      } else {
        setLastAction({ orderId, round, label, from, to });
        undoTimer.current = setTimeout(() => setLastAction(null), 10000);
      }
    } catch (err) {
      setMessage(err.message || 'Could not update this ticket. Please try again.');
    } finally {
      busyRef.current = false;
    }
  }, [advanceRound]);

  const bump = (t) => move(t.orderId, t.round, `${t.table} Round ${t.round}`, t.status, NEXT[t.status], false);
  const undo = () => {
    if (!lastAction) return;
    move(lastAction.orderId, lastAction.round, lastAction.label, lastAction.to, lastAction.from, true);
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
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
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

  // ---- Chime when a new ticket arrives ----
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('kdsSound') === 'on');
  const audioRef = useRef(null);

  const getAudio = () => {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioRef.current.state === 'suspended') audioRef.current.resume();
    } catch (e) { /* no audio available */ }
    return audioRef.current;
  };

  const chime = () => {
    const ctx = getAudio();
    if (!ctx) return;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem('kdsSound', next ? 'on' : 'off');
    if (next) chime(); // confirms the sound works
  };

  // Browsers only allow sound after a tap, so after a reload the first tap wakes it.
  useEffect(() => {
    if (!soundOn) return undefined;
    const wake = () => getAudio();
    window.addEventListener('pointerdown', wake, { once: true });
    return () => window.removeEventListener('pointerdown', wake);
  }, [soundOn]);

  const seenNew = useRef(null);
  useEffect(() => {
    const current = new Set(columns.Received.map(t => t.key));
    if (seenNew.current && soundOn) {
      for (const k of current) {
        if (!seenNew.current.has(k)) { chime(); break; }
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

  const renderColumn = (status, cols) => {
    const stage = STAGE[status];
    const list = columns[status];
    return (
      <div className="flex flex-col min-h-0 bg-white border border-muted-border p-4">
        <div className="flex justify-between items-center pb-4 border-b border-muted-border mb-4 shrink-0">
          <h3 className="font-serif text-md text-ink-navy font-semibold">{stage.title}</h3>
          <span className={`${stage.pill} text-xs px-2.5 py-0.5 font-bold rounded-full`}>{list.length}</span>
        </div>
        <div className={`grid gap-3 content-start grid-cols-1 ${cols} md:overflow-y-auto flex-grow min-h-0 hide-scrollbar`} data-lenis-prevent>
          {list.length === 0 && (
            <p className="text-xs italic text-subtle-text">Nothing here right now.</p>
          )}
          {list.map(t => (
            <Ticket
              key={t.key}
              ticket={t}
              num={numberOf(t.key)}
              now={now}
              prepMin={prepMinutes(t.items)}
              busy={false}
              onBump={() => bump(t)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-80px)] md:overflow-hidden select-none bg-surface">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-muted-border bg-white shrink-0">
        <p className="text-xs text-subtle-text">{tickets.length} open {tickets.length === 1 ? 'ticket' : 'tickets'}</p>
        <div className="flex items-center gap-3">
          {message && <span className="text-xs text-red-600">{message}</span>}
          <button
            type="button"
            onClick={toggleSound}
            className="text-[11px] uppercase tracking-widest border border-muted-border px-3 h-9 text-ink-navy hover:border-saffron-gold transition-colors cursor-pointer"
          >
            Sound {soundOn ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_0.8fr] gap-4 p-4 md:p-6 flex-grow min-h-0">
        {renderColumn('Received', '2xl:grid-cols-2')}
        {renderColumn('Preparing', '2xl:grid-cols-2')}
        {renderColumn('Ready', '')}
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
