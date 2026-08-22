import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { formatINR } from '../../utils/currency';
import { exportAnalyticsToExcel, exportAnalyticsToPDF } from '../../utils/analyticsExport';

// Small helper: format a Mongo $dateTrunc ISO string as "12 Aug"
const formatDay = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function AnalyticsOverview() {
  const [revenue, setRevenue] = useState(null);
  const [aov, setAov] = useState(null);
  const [footfall, setFootfall] = useState(null);
  const [items, setItems] = useState(null);
  const [rushHours, setRushHours] = useState(null);
  const [repeatCustomers, setRepeatCustomers] = useState(null);
  const [retention, setRetention] = useState(null);
  const [churnList, setChurnList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const [revenueRes, aovRes, footfallRes, itemsRes, rushRes, crmRes, retentionRes, churnRes] = await Promise.all([
          api.get('/api/analytics/revenue', { params: { period: 'day', range: 14 } }),
          api.get('/api/analytics/aov', { params: { period: 'day', range: 14 } }),
          api.get('/api/analytics/footfall', { params: { range: 30 } }),
          api.get('/api/analytics/items', { params: { limit: 5 } }),
          api.get('/api/analytics/rush-hours'),
          api.get('/api/crm/discount-eligible'),
          api.get('/api/crm/retention-rate'),
          api.get('/api/crm/churn-list'),
        ]);

        if (cancelled) return;
        setRevenue(revenueRes.data);
        setAov(aovRes.data);
        setFootfall(footfallRes.data);
        setItems(itemsRes.data);
        setRushHours(rushRes.data);
        setRepeatCustomers(crmRes.data);
        setRetention(retentionRes.data);
        setChurnList(churnRes.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-subtle-text text-xs font-label-caps uppercase tracking-wider">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FDFCFB] border border-red-200 p-6 text-xs text-red-600">
        Could not load analytics: {error}
      </div>
    );
  }

  const growthUp = (revenue?.growthPercent ?? 0) >= 0;
  const maxRushCount = rushHours
    ? Math.max(1, ...rushHours.grid.flat())
    : 1;

  const chartData = (revenue?.series || []).map(s => ({
    label: formatDay(s.period),
    revenue: s.revenue
  }));

  // Single bundle passed to both export functions — same data already
  // rendered on this page, just handed off as raw JSON for Part 5.
  const exportData = { revenue, aov, footfall, rushHours, items, repeatCustomers, retention, churnList };

  return (
    <div className="space-y-8">

      {/* Export Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => exportAnalyticsToExcel(exportData)}
          className="flex items-center gap-2 border border-[#D4AF37]/40 text-ink-navy font-label-caps text-[10px] uppercase tracking-wider px-4 py-2.5 hover:bg-[#D4AF37]/10 transition-colors duration-300 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">table_view</span>
          Export Excel
        </button>
        <button
          onClick={() => exportAnalyticsToPDF(exportData)}
          className="flex items-center gap-2 border border-[#D4AF37]/40 text-ink-navy font-label-caps text-[10px] uppercase tracking-wider px-4 py-2.5 hover:bg-[#D4AF37]/10 transition-colors duration-300 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
          Export PDF
        </button>
      </div>

      {/* Today vs Previous Period */}
      <div className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs flex items-center justify-between">
        <div>
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="font-serif text-3xl text-ink-navy">{formatINR(revenue?.currentPeriodRevenue)}</p>
        </div>
        <div className="text-right">
          <p className={`font-label-caps text-[10px] uppercase tracking-wider mb-1 ${growthUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {growthUp ? '▲' : '▼'} {Math.abs(revenue?.growthPercent ?? 0)}% vs yesterday
          </p>
          <p className="font-sans text-[11px] text-subtle-text">Yesterday: {formatINR(revenue?.previousPeriodRevenue)}</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs">
        <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">Revenue — Last 14 Days</p>
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
        <div className="col-span-12 lg:col-span-6 bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs">
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">Top Items by Revenue</p>
          {items?.topByRevenue?.length > 0 ? (
            <div className="space-y-3">
              {items.topByRevenue.map((it, i) => (
                <div key={it.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-[#D4AF37] w-4">{i + 1}</span>
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
        <div className="col-span-12 lg:col-span-6 bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs">
          <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-4">
            Repeat Customers {repeatCustomers ? `(≥ ${repeatCustomers.threshold} visits)` : ''}
          </p>
          {repeatCustomers?.customers?.filter(c => c.discountEligible).length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {repeatCustomers.customers.filter(c => c.discountEligible).map((c) => (
                <div key={c.phone} className="flex items-center justify-between text-xs border-b border-[#E5E1DA]/50 pb-2 last:border-0">
                  <div>
                    <p className="text-ink-navy font-semibold">{c.name || c.phone}</p>
                    <p className="text-subtle-text">{c.visitCount} visits · {formatINR(c.totalSpend)} spent</p>
                  </div>
                  <span className="font-label-caps text-[9px] bg-[#D4AF37]/15 text-[#8a6f1f] px-2 py-1 uppercase tracking-wider">
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
      <div className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs overflow-x-auto">
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