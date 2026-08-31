import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { exportAnalyticsToExcel } from '../../utils/analyticsExport';

// Format a Mongo $dateTrunc ISO string to match the active bucket size:
// day -> "12 Aug", week -> "12 Aug" (week start), month -> "Aug 2026"
const formatPeriodLabel = (isoString, period) => {
  const d = new Date(isoString);
  if (period === 'month') {
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day', range: 14, comparisonLabel: 'vs yesterday' },
  { value: 'week', label: 'Week', range: 12, comparisonLabel: 'vs last week' },
  { value: 'month', label: 'Month', range: 12, comparisonLabel: 'vs last month' }
];

export default function AnalyticsOverview() {
  const [revenue, setRevenue] = useState(null);
  const [aov, setAov] = useState(null);
  const [footfall, setFootfall] = useState(null);
  const [items, setItems] = useState(null);
  const [rushHours, setRushHours] = useState(null);
  const [repeatCustomers, setRepeatCustomers] = useState(null);
  const [retention, setRetention] = useState(null);
  const [customerOverview, setCustomerOverview] = useState(null);
  const [churnList, setChurnList] = useState(null);
  const [orderLog, setOrderLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenuePeriod, setRevenuePeriod] = useState('day');

  // Everything except revenue/AOV loads once — those two reload separately
  // below whenever the Day/Week/Month toggle changes.
  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const [footfallRes, itemsRes, rushRes, crmRes, retentionRes, overviewRes, churnRes, orderLogRes] = await Promise.all([
          api.get('/api/analytics/footfall', { params: { range: 30 } }),
          api.get('/api/analytics/items', { params: { limit: 5 } }),
          api.get('/api/analytics/rush-hours'),
          api.get('/api/crm/discount-eligible'),
          api.get('/api/crm/retention-rate'),
          api.get('/api/crm/customer-overview'),
          api.get('/api/crm/churn-list'),
          api.get('/api/analytics/order-log', { params: { limit: 500 } }),
        ]);

        if (cancelled) return;
        setFootfall(footfallRes.data);
        setItems(itemsRes.data);
        setRushHours(rushRes.data);
        setRepeatCustomers(crmRes.data);
        setRetention(retentionRes.data);
        setCustomerOverview(overviewRes.data);
        setChurnList(churnRes.data);
        setOrderLog(orderLogRes.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();
    return () => { cancelled = true; };
  }, []);

  // Revenue + AOV reload whenever the Day/Week/Month toggle changes, so
  // switching to "Month" gives a genuine month-over-month view rather
  // than just relabeling the same 14 daily buckets.
  useEffect(() => {
    let cancelled = false;
    const opt = PERIOD_OPTIONS.find((p) => p.value === revenuePeriod);

    async function loadRevenue() {
      try {
        const [revenueRes, aovRes] = await Promise.all([
          api.get('/api/analytics/revenue', { params: { period: opt.value, range: opt.range } }),
          api.get('/api/analytics/aov', { params: { period: opt.value, range: opt.range } }),
        ]);
        if (cancelled) return;
        setRevenue(revenueRes.data);
        setAov(aovRes.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load revenue analytics.');
      }
    }

    loadRevenue();
    return () => { cancelled = true; };
  }, [revenuePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-subtle-text text-xs font-label-caps uppercase tracking-wider">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-canvas-cream border border-red-200 p-6 text-xs text-red-600">
        Could not load analytics: {error}
      </div>
    );
  }

  const growthUp = (revenue?.growthPercent ?? 0) >= 0;
  const maxRushCount = rushHours
    ? Math.max(1, ...rushHours.grid.flat())
    : 1;

  const chartData = (revenue?.series || []).map(s => ({
    label: formatPeriodLabel(s.period, revenuePeriod),
    revenue: s.revenue
  }));

  const activePeriod = PERIOD_OPTIONS.find((p) => p.value === revenuePeriod);

  // Single bundle passed to both export functions — same data already
  // rendered on this page, just handed off as raw JSON for Part 5.
  const exportData = { revenue, aov, footfall, rushHours, items, repeatCustomers, retention, customerOverview, churnList, orderLog };

  return (
    <div className="space-y-8">

      {/* Export Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => exportAnalyticsToExcel(exportData)}
          className="flex items-center gap-2 border border-saffron-gold/40 text-ink-navy font-label-caps text-[10px] uppercase tracking-wider px-4 py-2.5 hover:bg-saffron-gold/10 transition-colors duration-300 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">table_view</span>
          Export Excel
        </button>
      </div>

      {/* Day / Week / Month toggle — drives both the summary card and the trend chart below */}
      <div className="flex justify-end">
        <div className="inline-flex border border-saffron-gold/30">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRevenuePeriod(opt.value)}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                revenuePeriod === opt.value
                  ? 'bg-ink-navy text-canvas-cream'
                  : 'text-ink-navy hover:bg-saffron-gold/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current vs Previous Period */}
      <div className="bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs flex items-center justify-between">
        <div>
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">
            This {activePeriod.label}'s Revenue
          </p>
          <p className="font-serif text-3xl text-ink-navy">{formatINR(revenue?.currentPeriodRevenue)}</p>
        </div>
        <div className="text-right">
          <p className={`font-label-caps text-[10px] uppercase tracking-wider mb-1 ${growthUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {growthUp ? '▲' : '▼'} {Math.abs(revenue?.growthPercent ?? 0)}% {activePeriod.comparisonLabel}
          </p>
          <p className="font-sans text-[11px] text-subtle-text">
            Previous {activePeriod.label.toLowerCase()}: {formatINR(revenue?.previousPeriodRevenue)}
          </p>
        </div>
      </div>

      {/* Customer Overview — every customer with a phone on file, not just repeat ones */}
      <div className="bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs">
        <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">Customer Overview</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-serif text-2xl text-ink-navy">{customerOverview?.totalCustomers ?? '—'}</p>
            <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-wider mt-1">Total Customers</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-ink-navy">{customerOverview?.newCustomers ?? '—'}</p>
            <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-wider mt-1">
              New {customerOverview ? `(${customerOverview.newPercent}%)` : ''}
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl text-ink-navy">{customerOverview?.returningCustomers ?? '—'}</p>
            <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-wider mt-1">
              Returning {customerOverview ? `(${customerOverview.returningPercent}%)` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs">
        <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">
          Revenue — Last {activePeriod.range} {activePeriod.label}{activePeriod.range === 1 ? '' : 's'}
        </p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-subtle-text py-8 text-center">No paid invoices yet in this window.</p>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Top Items */}
        <div className="col-span-12 lg:col-span-6 bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs">
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">Top Items by Revenue</p>
          {items?.topByRevenue?.length > 0 ? (
            <div className="space-y-3">
              {items.topByRevenue.map((it, i) => (
                <div key={it.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-saffron-gold w-4">{i + 1}</span>
                    <span className="text-ink-navy font-semibold">{it.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-ink-navy font-semibold">{formatINR(it.revenue)}</span>
                    <span className="text-subtle-text ml-2">({it.qtySold} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-subtle-text py-6 text-center">No billed items yet.</p>
          )}
        </div>

        {/* Repeat Customers */}
        <div className="col-span-12 lg:col-span-6 bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs">
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">
            Repeat Customers {repeatCustomers ? `(≥ ${repeatCustomers.threshold} visits)` : ''}
          </p>
          {repeatCustomers?.customers?.filter(c => c.discountEligible).length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {repeatCustomers.customers.filter(c => c.discountEligible).map((c) => (
                <div key={c.phone} className="flex items-center justify-between text-xs border-b border-muted-border/50 pb-2 last:border-0">
                  <div>
                    <p className="text-ink-navy font-semibold">{c.name || c.phone}</p>
                    <p className="text-subtle-text">{c.visitCount} visits · {formatINR(c.totalSpend)} spent</p>
                  </div>
                  <span className="font-label-caps text-[9px] bg-saffron-gold/15 text-[#8a6f1f] px-2 py-1 uppercase tracking-wider">
                    Eligible
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-subtle-text py-6 text-center">No repeat customers yet.</p>
          )}
        </div>
      </div>

      {/* Rush Hour Heatmap */}
      <div className="bg-canvas-cream border border-saffron-gold/15 p-6 shadow-xs overflow-x-auto">
        <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">Rush Hours</p>
        {rushHours && (
          <table className="min-w-full text-[9px] border-collapse">
            <thead>
              <tr>
                <th className="w-10"></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="text-subtle-text font-normal px-0.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rushHours.dayLabels.map((day, dayIdx) => (
                <tr key={day}>
                  <td className="text-subtle-text font-label-caps uppercase pr-2">{day}</td>
                  {rushHours.grid[dayIdx].map((count, hourIdx) => {
                    const intensity = count / maxRushCount;
                    return (
                      <td
                        key={hourIdx}
                        title={`${day} ${hourIdx}:00 — ${count} orders`}
                        className="w-4 h-4 p-0"
                      >
                        <div
                          className="w-4 h-4"
                          style={{
                            backgroundColor: count === 0
                              ? '#f4f3f2'
                              : `rgba(212, 175, 55, ${0.15 + intensity * 0.85})`
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}