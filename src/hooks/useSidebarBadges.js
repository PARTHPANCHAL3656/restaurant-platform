import { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../utils/socket';

// Which sidebar page "owns" which counter. Opening that page clears it.
// (Guest Queue is not here on purpose - it shows a live count, see below.)
const PAGE_TO_KEY = {
  '/staff/orders': 'orders',          // new dine-in orders / "order more" rounds
  '/staff/takeaway': 'takeaway',      // new takeout orders / rounds
  '/staff/billing': 'billing',        // newly generated invoices
  '/staff/tables': 'reservations',    // new customer reservation requests
};

const EMPTY = { orders: 0, takeaway: 0, billing: 0, reservations: 0 };

// sessionStorage (not localStorage) on purpose: the staff login lives in
// sessionStorage too, so closing the tab = logout = counters start fresh.
const STORAGE_KEY = 'staffSidebarBadges';

const readStored = (openPageKey) => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    const next = { ...EMPTY };
    for (const key of Object.keys(EMPTY)) {
      const n = Number(parsed[key]);
      next[key] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    }
    // Refreshing while sitting on a page counts as having seen it.
    if (openPageKey) next[openPageKey] = 0;
    return next;
  } catch {
    return EMPTY;
  }
};

/**
 * Sidebar notification counters for the staff portal.
 *
 * @param {object}  opts
 * @param {boolean} opts.enabled    only listen while a staff member is logged in
 * @param {string}  opts.pathname   current route (from useLocation)
 * @param {number}  opts.queueCount parties currently waiting in the guest queue
 * @returns {{ badges: Record<string, number>, total: number }}
 *          badges: { orders, takeaway, billing, reservations, queue }
 */
export default function useSidebarBadges({ enabled, pathname, queueCount = 0 }) {
  const [counts, setCounts] = useState(() => readStored(PAGE_TO_KEY[pathname]));
  const [lastPathname, setLastPathname] = useState(pathname);
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Always holds the counter key of the page being viewed right now, so the
  // socket handlers (which are created once) can see it without re-subscribing.
  const activeKeyRef = useRef(PAGE_TO_KEY[pathname] || null);
  useEffect(() => {
    activeKeyRef.current = PAGE_TO_KEY[pathname] || null;
  }, [pathname]);

  // Opening a page clears its counter. (React's "adjust state while rendering"
  // pattern - cheaper and cleaner than doing it in an effect.)
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    const key = PAGE_TO_KEY[pathname];
    if (key) setCounts((prev) => (prev[key] ? { ...prev, [key]: 0 } : prev));
  }

  // Logging out wipes every counter.
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setCounts(EMPTY);
  }

  // Coming back to a tab that was sitting on a page clears that page's counter
  // (events that arrived while the tab was hidden still counted).
  useEffect(() => {
    const onVisible = () => {
      const key = activeKeyRef.current;
      if (!document.hidden && key) {
        setCounts((prev) => (prev[key] ? { ...prev, [key]: 0 } : prev));
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Live socket events -> bump the right counter.
  useEffect(() => {
    if (!enabled) return undefined;

    const bump = (key) => {
      // Staff is looking at that exact page in a visible tab: they see the
      // item arrive, no badge needed.
      if (activeKeyRef.current === key && !document.hidden) return;
      setCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    };

    // Fires for the first order AND for every "order more" round.
    const onOrderNew = (order) => bump(order?.orderType === 'takeout' ? 'takeaway' : 'orders');
    const onInvoiceGenerated = () => bump('billing');
    // Walk-in reservations are typed in by staff themselves - only count
    // requests that customers made online.
    const onReservationNew = (reservation) => {
      if (reservation?.source === 'Walk-in') return;
      bump('reservations');
    };

    socket.on('order:new', onOrderNew);
    socket.on('invoice:generated', onInvoiceGenerated);
    socket.on('reservation:new', onReservationNew);
    return () => {
      socket.off('order:new', onOrderNew);
      socket.off('invoice:generated', onInvoiceGenerated);
      socket.off('reservation:new', onReservationNew);
    };
  }, [enabled]);

  // Survive a page refresh (and forget everything on logout).
  useEffect(() => {
    try {
      if (enabled) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked - badges just won't survive a refresh */
    }
  }, [counts, enabled]);

  return useMemo(() => {
    const live = enabled ? counts : EMPTY;
    const badges = { ...live, queue: enabled ? Math.max(0, Number(queueCount) || 0) : 0 };
    const total = badges.orders + badges.takeaway + badges.billing + badges.reservations;
    return { badges, total };
  }, [counts, enabled, queueCount]);
}
