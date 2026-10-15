import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';

// The Manager's No-Show List. A no-show (a takeout order not collected, or a
// reservation marked no-show) adds a strike to the customer. Nobody is
// blocked automatically: the Manager decides here, and can undo it any time.
export default function StaffSettingsNoShowsPage() {
  const staffRole = typeof window !== 'undefined' ? sessionStorage.getItem('staffRole') : null;
  const allowed = staffRole === 'OWNER' || staffRole === 'MANAGER';

  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busyPhone, setBusyPhone] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/api/crm/no-shows');
      setRows(res.data.customers || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load the list.');
    }
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const setBlocked = async (row, blocked) => {
    if (blocked && !window.confirm(`Block ${row.phone} from starting online takeout orders? You can unblock them here at any time.`)) return;
    setBusyPhone(row.phone);
    try {
      await api.patch(`/api/crm/customers/${row.phone}/blacklist`, { isBlacklisted: blocked });
      setRows(prev => prev.map(r => (r.phone === row.phone ? { ...r, isBlacklisted: blocked } : r)));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not update. Please try again.');
    } finally {
      setBusyPhone('');
    }
  };

  if (!allowed) {
    return <Navigate to="/staff/settings" replace />;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">No-Show List</h2>
        <p className="text-xs text-subtle-text mb-5 leading-relaxed">
          Every missed takeout pickup or reservation adds a strike to a customer. Nobody is blocked automatically. You decide. A blocked number can't start new online takeout orders, and you can unblock it here at any time.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>
        )}

        {rows === null && !error && (
          <p className="text-xs italic text-subtle-text">Loading...</p>
        )}

        {rows && rows.length === 0 && (
          <p className="text-xs italic text-subtle-text">No no-shows recorded. That's a good sign.</p>
        )}

        {rows && rows.length > 0 && (
          <ul className="divide-y divide-muted-border border-t border-b border-muted-border">
            {rows.map(row => (
              <li key={row.phone} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-navy">
                    {row.name || 'Unnamed guest'} <span className="font-normal text-subtle-text">· {row.phone}</span>
                  </p>
                  <p className="text-[11px] text-subtle-text mt-0.5">
                    {row.noShowStrikes} {row.noShowStrikes === 1 ? 'strike' : 'strikes'}
                    {row.lastAt
                      ? ` · last takeout no-show ${new Date(row.lastAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}${row.lastOrderNumber ? ` (${row.lastOrderNumber})` : ''}${row.lastReason ? `: ${row.lastReason}` : ''}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${row.isBlacklisted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
                    {row.isBlacklisted ? 'Blocked' : 'Not blocked'}
                  </span>
                  <button
                    type="button"
                    disabled={busyPhone === row.phone}
                    onClick={() => setBlocked(row, !row.isBlacklisted)}
                    className={`text-xs font-semibold uppercase tracking-widest px-4 h-9 border disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${row.isBlacklisted ? 'border-ink-navy text-ink-navy hover:bg-ink-navy hover:text-canvas-cream' : 'border-red-300 text-red-600 hover:bg-red-600 hover:text-white'}`}
                  >
                    {row.isBlacklisted ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}