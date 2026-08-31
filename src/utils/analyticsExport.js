import * as XLSX from 'xlsx';

// -------------------------------------------------------
// Both functions below take the SAME shape of `data`:
// { revenue, aov, footfall, rushHours, items, repeatCustomers, retention, churnList }
// Each key is the raw JSON response from the matching Part 2/3 endpoint,
// or null if that fetch hasn't loaded/failed. This is purely a rendering
// layer — no new computation happens here, it just formats what the
// backend already computed.
// -------------------------------------------------------

// Builds a multi-sheet Excel workbook — one sheet per dataset — so it opens
// cleanly in Excel, Google Sheets, or LibreOffice with no extra setup.
export function exportAnalyticsToExcel(data) {
  const wb = XLSX.utils.book_new();

  const revenueRows = (data.revenue?.series || []).map((r) => ({
    Date: new Date(r.period).toLocaleDateString('en-IN'),
    Revenue: r.revenue,
    Orders: r.orders
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueRows), 'Revenue');

  const aovRows = (data.aov?.series || []).map((r) => ({
    Date: new Date(r.period).toLocaleDateString('en-IN'),
    'Average Order Value': r.aov
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aovRows), 'AOV');

  const footfallRows = (data.footfall?.series || []).map((r) => ({
    Date: new Date(r.date).toLocaleDateString('en-IN'),
    Covers: r.covers
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(footfallRows), 'Footfall');

  if (data.rushHours) {
    const header = ['Day', ...Array.from({ length: 24 }, (_, h) => `${h}:00`)];
    const rows = data.rushHours.dayLabels.map((day, i) => [day, ...data.rushHours.grid[i]]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), 'Rush Hours');
  }

  const itemRows = (data.items?.topByRevenue || []).map((it, i) => ({
    Rank: i + 1,
    Item: it.name,
    'Qty Sold': it.qtySold,
    Revenue: it.revenue
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), 'Top Items');

  // Every item that has ever been billed, not just a top-N — the full
  // ordered-item ledger, one row per distinct menu item.
  const allItemRows = (data.items?.allItems || [])
    .slice()
    .sort((a, b) => b.qtySold - a.qtySold)
    .map((it) => ({
      Item: it.name,
      Category: it.category,
      'Qty Sold': it.qtySold,
      Revenue: it.revenue
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allItemRows), 'All Items Ordered');

  // Top 3 best sellers within each menu category, so a restaurant can see
  // what's actually working in Starters vs Mains vs Desserts etc., rather
  // than one flat top-10 that a single popular category can dominate.
  const topByCategoryQty = data.items?.topByCategoryQty || {};
  const topByCategoryRows = Object.keys(topByCategoryQty)
    .sort()
    .flatMap((category) =>
      topByCategoryQty[category].map((it, i) => ({
        Category: category,
        Rank: i + 1,
        Item: it.name,
        'Qty Sold': it.qtySold,
        Revenue: it.revenue
      }))
    );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topByCategoryRows), 'Top 3 By Category');

  const repeatRows = (data.repeatCustomers?.customers || [])
    .filter((c) => c.discountEligible)
    .map((c) => ({
      Name: c.name || '—',
      Phone: c.phone,
      'Visit Count': c.visitCount,
      'Total Spend': c.totalSpend,
      'Last Visit': c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN') : '—'
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(repeatRows), 'Repeat Customers');

  const churnRows = (data.churnList?.customers || []).map((c) => ({
    Name: c.name || '—',
    Phone: c.phone,
    'Visit Count': c.visitCount,
    'Total Spend': c.totalSpend,
    'Days Since Last Visit': c.daysSinceLastVisit
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(churnRows), 'Churn List');

  if (data.retention) {
    const retentionRows = [{
      'Retention Threshold (visits)': data.retention.threshold,
      'Total Customers': data.retention.totalCustomers,
      'Repeat Customers': data.retention.repeatCustomers,
      'Retention Rate (%)': data.retention.retentionRate
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(retentionRows), 'Retention');
  }

  // Customer Summary — new vs returning, a broader split (visitCount >= 2)
  // than the >= 3 discount-eligibility threshold used in Retention above.
  if (data.customerOverview) {
    const summaryRows = [{
      'Total Customers': data.customerOverview.totalCustomers,
      'New Customers': data.customerOverview.newCustomers,
      'New (%)': data.customerOverview.newPercent,
      'Returning Customers': data.customerOverview.returningCustomers,
      'Returning (%)': data.customerOverview.returningPercent
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Customer Summary');
  }

  // All Customers — every phone-captured customer, not filtered to
  // discount-eligible ones like the "Repeat Customers" sheet above.
  const allCustomerRows = (data.customerOverview?.customers || []).map((c) => ({
    Name: c.name || '—',
    Phone: c.phone,
    Status: c.isNew ? 'New' : 'Returning',
    'Visit Count': c.visitCount,
    'Total Spend': c.totalSpend,
    'First Visit': c.firstVisit ? new Date(c.firstVisit).toLocaleDateString('en-IN') : '—',
    'Last Visit': c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN') : '—',
    'Discount Eligible': c.discountEligible ? 'Yes' : 'No'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allCustomerRows), 'All Customers');

  // Full Order Log — one row per paid order, the complete detail view.
  // Every other sheet in this workbook aggregates across orders; this is
  // the only one that shows exactly what happened on each individual order.
  const orderLogRows = (data.orderLog?.orders || []).map((o) => ({
    Date: new Date(o.date).toLocaleString('en-IN'),
    Invoice: o.invoiceNumber,
    Table: o.table,
    Guest: o.guestName || '—',
    Phone: o.guestPhone || '—',
    'Party Size': o.partySize ?? '—',
    Items: o.items,
    'Payment Method': o.paymentMethod || '—',
    Subtotal: o.subtotal,
    'Service Charge': o.serviceCharge,
    GST: o.gst,
    Discount: o.discount,
    Total: o.total
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderLogRows), 'Full Order Log');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `spice_garden_analytics_${dateStr}.xlsx`);
}
