import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Sidebar / bell notification counters for the staff portal.
 *
 * A badge counts things that BOTH
 *   (1) still need attention  - and -
 *   (2) you have not looked at yet.
 *
 * It is worked out from the lists the staff app already loads (reservations,
 * orders, invoices) instead of counting socket events, so it can never get
 * out of step with what is really on screen:
 *
 *   Tables & Reservations -> customer reservation requests still "pending"
 *   Order Management      -> dine-in orders (or new "order more" rounds) still "new"
 *   Takeaway Orders       -> takeout orders (or new rounds) still "new"
 *   Billing & Invoices    -> invoices still "unpaid"
 *   Guest Queue           -> (live) parties currently waiting
 *
 * Confirming / starting / paying something removes it from the count, and
 * opening a page (in a visible tab) marks everything on it as seen.
 */

// Which sidebar page "owns" which counter.
const PAGE_TO_GROUP = {
  '/staff/orders': 'orders',
  '/staff/takeaway': 'takeaway',
  '/staff/billing': 'billing',
  '/staff/tables': 'reservations',
};
const GROUPS = ['orders', 'takeaway', 'billing', 'reservations'];

// sessionStorage (not localStorage) on purpose: the staff login lives in
// sessionStorage too, so closing the tab = logout = counters start fresh.
const STORAGE_KEY = 'staffSidebarSeen';
const MAX_REMEMBERED = 3000;
const FRESH = { baselined: false, keys: {} };

const readSeen = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (parsed && parsed.baselined === true && parsed.keys && typeof parsed.keys === 'object') {
      return { baselined: true, keys: parsed.keys };
    }
  } catch {
    /* ignore - treat as first visit */
  }
  return FRESH;
};

const withKeys = (keys, list) => {
  const next = { ...keys };
  for (const k of list) next[k] = true;
  return next;
};

export default function useSidebarBadges({
  enabled,
  ready,
  pathname,
  queueCount = 0,
  reservations = [],
  orders = [],
  invoices = [],
}) {
  const [seen, setSeen] = useState(readSeen);
  const [wasEnabled, setWasEnabled] = useState(enabled);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  // Know whether the tab is actually on screen.
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  // Everything that currently needs attention, as "group|id" keys.
  const pending = useMemo(() => {
    const out = { orders: [], takeaway: [], billing: [], reservations: [] };

    for (const r of reservations) {
      // Walk-ins are typed in by staff themselves - only customer requests count.
      if (r.status === 'pending' && r.source !== 'Walk-in') out.reservations.push(`reservations|${r.id}`);
    }
    for (const o of orders) {
      if (o.status !== 'new') continue; // already being prepared / ready = handled
      // An "order more" round on the same order gets a new round number -> new key.
      let round = 1;
      for (const item of o.items || []) round = Math.max(round, Number(item.round) || 1);
      if (o.orderType === 'takeout') out.takeaway.push(`takeaway|${o.id}:${round}`);
      else out.orders.push(`orders|${o.id}:${round}`);
    }
    for (const inv of invoices) {
      if (inv.status === 'unpaid') out.billing.push(`billing|${inv.id}`);
    }
    return out;
  }, [reservations, orders, invoices]);

  const live = Boolean(enabled && ready);

  // --- state adjustments that must happen while rendering (no effects needed) ---

  // Logging out forgets everything.
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setSeen(FRESH);
  }

  if (live) {
    if (!seen.baselined) {
      // First load of this session: whatever already exists is not "new".
      setSeen({ baselined: true, keys: withKeys(seen.keys, GROUPS.flatMap((g) => pending[g])) });
    } else {
      // Looking at a page (tab visible) = everything on it is seen.
      const group = PAGE_TO_GROUP[pathname];
      if (group && visible) {
        const unseen = pending[group].filter((k) => !seen.keys[k]);
        if (unseen.length) setSeen({ baselined: true, keys: withKeys(seen.keys, unseen) });
      }
    }
  }

  // Survive a page refresh (and forget everything on logout).
  useEffect(() => {
    try {
      if (!enabled) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (!seen.baselined) return;
      let keys = seen.keys;
      const all = Object.keys(keys);
      if (all.length > MAX_REMEMBERED) {
        keys = Object.fromEntries(all.slice(-MAX_REMEMBERED).map((k) => [k, true]));
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ baselined: true, keys }));
    } catch {
      /* storage blocked - badges just won't survive a refresh */
    }
  }, [seen, enabled]);

  // Bell -> "Mark all as seen".
  const markAllSeen = useCallback(() => {
    setSeen((prev) => ({ baselined: true, keys: withKeys(prev.keys, GROUPS.flatMap((g) => pending[g])) }));
  }, [pending]);

  return useMemo(() => {
    const badges = { orders: 0, takeaway: 0, billing: 0, reservations: 0, queue: 0 };
    if (live && seen.baselined) {
      for (const g of GROUPS) badges[g] = pending[g].filter((k) => !seen.keys[k]).length;
    }
    badges.queue = enabled ? Math.max(0, Number(queueCount) || 0) : 0;
    const total = badges.orders + badges.takeaway + badges.billing + badges.reservations;
    return { badges, total, markAllSeen };
  }, [live, enabled, seen, pending, queueCount, markAllSeen]);
}
