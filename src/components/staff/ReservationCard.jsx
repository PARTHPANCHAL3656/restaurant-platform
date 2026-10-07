import React, { useState } from 'react';

// One online reservation in the Tables & Reservations sidebar. Used by both
// tabs: view="pending" shows Confirm / Reject, view="confirmed" shows the
// seating, holding and no-show controls. Presentational only — every real
// action is passed in from StaffTablesPage.
export default function ReservationCard({
  reservation: res,
  view,
  timing,
  minutesLate = 0,
  canManage,
  largePartyThreshold,
  availableTables,
  onConfirm,
  onReject,
  onSeat,
  onHold,
  onNoShow,
  onGuestCancelled
}) {
  const [panel, setPanel] = useState(null); // null | 'seat' | 'hold'
  const [tableId, setTableId] = useState('');

  const isLate = timing === 'late';
  const isPast = timing === 'past';
  const isFuture = timing === 'future';
  // A threshold of 0 means the large-party rule is off.
  const isLargeParty = largePartyThreshold > 0 && res.partySize >= largePartyThreshold;
  const staffBlockedFromConfirm = isLargeParty && !canManage;
  const hasHeldTable = !!res.table;
  const fitTables = availableTables.filter(t => t.seats >= res.partySize);

  const openPanel = (mode) => {
    setTableId(fitTables[0] ? fitTables[0].id : '');
    setPanel(mode);
  };

  const submitPanel = async () => {
    if (!tableId) return;
    if (panel === 'seat') await onSeat(tableId);
    if (panel === 'hold') await onHold(tableId);
    setPanel(null);
  };

  const cardTone = isLate
    ? 'border-red-500 bg-red-50'
    : isPast
      ? 'border-red-200 bg-red-50/40'
      : 'border-muted-border bg-white';

  const noShowButton = (
    <button
      onClick={() => onNoShow()}
      className="flex-1 py-1.5 bg-red-900/10 text-red-700 font-bold text-[10px] uppercase tracking-widest hover:bg-red-900/20 cursor-pointer"
    >
      Mark No-Show
    </button>
  );

  return (
    <div className={`border p-3 space-y-2 text-xs ${cardTone}`}>
      {/* Time + badges */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-serif font-bold text-ink-navy text-xl leading-none">{res.time}</span>
          <span className={`font-serif text-base leading-none ${isPast ? 'text-red-600 font-semibold' : 'text-ink-navy/70'}`}>
            {res.date}{isPast ? ' — passed' : ''}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isLate && (
            <span className="bg-red-600 text-white text-[8px] font-black tracking-widest px-2 py-0.5 uppercase animate-pulse">
              Late · {minutesLate} min
            </span>
          )}
          {isLargeParty && (
            <span className="bg-saffron-gold/15 text-saffron-gold text-[8px] font-black tracking-widest px-2 py-0.5 uppercase">
              Large Party
            </span>
          )}
        </div>
      </div>

      <h4 className="font-body-md font-semibold text-ink-navy text-[13px]">{res.guest}</h4>
      <div className="flex justify-between text-subtle-text text-[11px] font-label-caps">
        <span>Party of {res.partySize}</span>
        {view === 'confirmed' && (
          <span className="text-saffron-gold font-bold">
            {hasHeldTable ? `Table ${res.table} held` : 'No table held'}
          </span>
        )}
      </div>

      {res.phone && (
        <a href={`tel:${res.phone}`} className="inline-flex items-center gap-1 text-[11px] text-ink-navy underline decoration-saffron-gold">
          <span className="material-symbols-outlined text-[14px]">call</span>{res.phone}
        </a>
      )}

      {/* Special request — shown up front so the manager knows what they're saying yes to */}
      {res.specialRequest && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 italic text-ink-navy">
          <span className="font-label-caps text-[9px] uppercase tracking-wider font-bold text-yellow-800 block not-italic">Special request</span>
          "{res.specialRequest}"
        </div>
      )}

      {res.referenceCode && (
        <div className="text-[10px] text-subtle-text font-mono">{res.referenceCode}</div>
      )}

      {isLate && (
        <p className="text-[11px] text-red-700 font-semibold">
          Call the guest before marking a no-show. Nothing is removed automatically.
        </p>
      )}

      {/* PENDING actions */}
      {view === 'pending' && (
        <>
          <div className="flex gap-2 pt-2 border-t border-muted-border">
            <button
              onClick={onConfirm}
              disabled={staffBlockedFromConfirm || isPast}
              className="flex-1 py-1.5 bg-saffron-gold text-ink-navy font-bold text-[10px] uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => onReject()}
              className="flex-1 py-1.5 bg-red-900/10 text-red-700 font-bold text-[10px] uppercase tracking-widest hover:bg-red-900/20 cursor-pointer"
            >
              Reject
            </button>
          </div>
          {staffBlockedFromConfirm && (
            <p className="text-[10px] text-subtle-text italic">Parties of {largePartyThreshold}+ need a Manager or Owner to confirm.</p>
          )}
          {isPast && (
            <p className="text-[10px] text-red-600 italic">This date has passed — reject it.</p>
          )}
        </>
      )}

      {/* CONFIRMED actions */}
      {view === 'confirmed' && (
        <div className="pt-2 border-t border-muted-border space-y-2">
          {(timing === 'today' || isLate) && panel === null && (
            <div className="flex gap-2">
              {hasHeldTable ? (
                <button
                  onClick={() => onSeat(null)}
                  className="flex-1 py-1.5 bg-saffron-gold text-ink-navy font-bold text-[10px] uppercase tracking-widest hover:brightness-110 cursor-pointer"
                >
                  Seat Guest ({res.table})
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openPanel('seat')}
                    className="flex-1 py-1.5 bg-saffron-gold text-ink-navy font-bold text-[10px] uppercase tracking-widest hover:brightness-110 cursor-pointer"
                  >
                    Seat Guest
                  </button>
                  <button
                    onClick={() => openPanel('hold')}
                    className="flex-1 py-1.5 border border-ink-navy text-ink-navy font-bold text-[10px] uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream cursor-pointer"
                  >
                    Hold Table
                  </button>
                </>
              )}
            </div>
          )}

          {/* A later-dated reservation can still be held ahead of time — a
              Manager may want to lock in a table for a big booking days out.
              It can't be "seated" yet since the guest isn't due. */}
          {isFuture && !hasHeldTable && panel === null && (
            <button
              onClick={() => openPanel('hold')}
              className="w-full py-1.5 border border-ink-navy text-ink-navy font-bold text-[10px] uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream cursor-pointer"
            >
              Hold Table In Advance
            </button>
          )}

          {panel !== null && (
            <div className="p-2 bg-canvas-cream border border-muted-border space-y-2">
              <span className="font-label-caps text-[9px] uppercase tracking-widest font-bold text-subtle-text block">
                {panel === 'seat' ? 'Seat at which table?' : 'Hold which table?'}
              </span>
              {fitTables.length === 0 ? (
                <p className="text-[11px] text-red-600 italic">No free table fits a party of {res.partySize}.</p>
              ) : (
                <select
                  value={tableId}
                  onChange={e => setTableId(e.target.value)}
                  className="w-full bg-white border border-muted-border p-2 text-xs"
                >
                  {fitTables.map(t => (
                    <option key={t.id} value={t.id}>Table {t.id} ({t.seats} seats)</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  onClick={submitPanel}
                  disabled={!tableId}
                  className="flex-1 py-1.5 bg-saffron-gold text-ink-navy font-bold text-[10px] uppercase tracking-widest disabled:opacity-40 cursor-pointer"
                >
                  {panel === 'seat' ? 'Seat Now' : 'Hold'}
                </button>
                <button
                  onClick={() => setPanel(null)}
                  className="flex-1 py-1.5 border border-ink-navy text-ink-navy font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {panel === null && (
            <div className="flex gap-2 items-center">
              {(timing === 'today' || isLate || isPast) && noShowButton}
              <button
                onClick={() => onGuestCancelled()}
                className="flex-1 py-1.5 border border-muted-border text-subtle-text font-bold text-[10px] uppercase tracking-widest hover:text-ink-navy hover:border-ink-navy cursor-pointer"
                title="The guest called to cancel — no no-show strike is recorded"
              >
                Guest Cancelled
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}