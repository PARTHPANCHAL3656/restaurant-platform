import ExcelJS from 'exceljs';

// -------------------------------------------------------
// Both functions below take the SAME shape of `data`:
// { revenue, aov, footfall, rushHours, items, repeatCustomers, retention, churnList }
// Each key is the raw JSON response from the matching Part 2/3 endpoint,
// or null if that fetch hasn't loaded/failed. This is purely a rendering
// layer — no new computation happens here, it just formats what the
// backend already computed.
//
// Uses exceljs instead of xlsx (SheetJS Community Edition) because the
// free xlsx build silently drops cell styling (bold/alignment) on write —
// verified by inspecting the written file's XML, which has no font or
// alignment info regardless of what's set on cell.s. exceljs supports
// both natively.
// -------------------------------------------------------

// Adds a worksheet built from an array of row objects (same shape as
// XLSX.utils.json_to_sheet). `headers` fixes the column order/labels so a
// sheet still gets a proper header row even when there are zero data rows.
// Bolds the header row and right-aligns every cell, then auto-fits each
// column's width to the longest value (header included) so nothing is
// ever clipped.
function addSheet(workbook, sheetName, rows, headers) {
  const keys = headers || (rows[0] ? Object.keys(rows[0]) : []);
  const ws = workbook.addWorksheet(sheetName);
  ws.columns = keys.map((key) => ({ header: key, key }));
  rows.forEach((row) => ws.addRow(row));
  autoFitAndStyle(ws);
  return ws;
}

// Adds a worksheet from a raw array-of-arrays (used for the Rush Hours
// grid, which isn't row-object shaped — same shape as XLSX.utils.aoa_to_sheet).
function addAoaSheet(workbook, sheetName, aoa) {
  const ws = workbook.addWorksheet(sheetName);
  aoa.forEach((row) => ws.addRow(row));
  autoFitAndStyle(ws);
  return ws;
}

// Shared styling pass: bold header row, right-align all cells, and set
// each column's width to fit its longest value plus a little padding.
function autoFitAndStyle(ws) {
  ws.getRow(1).font = { bold: true };
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { horizontal: 'right' };
      const len = cell.value == null ? 0 : String(cell.value).length;
      if (len > maxLen) maxLen = len;
    });
    col.width = maxLen + 2;
  });
}

// Builds a multi-sheet Excel workbook — one sheet per dataset — so it opens
// cleanly in Excel, Google Sheets, or LibreOffice with no extra setup.
export async function exportAnalyticsToExcel(data) {
  const wb = new ExcelJS.Workbook();

  const revenueRows = (data.revenue?.series || []).map((r) => ({
    Date: new Date(r.period).toLocaleDateString('en-IN'),
    Revenue: r.revenue,
    Orders: r.orders
  }));
  addSheet(wb, 'Revenue', revenueRows, ['Date', 'Revenue', 'Orders']);

  const aovRows = (data.aov?.series || []).map((r) => ({
    Date: new Date(r.period).toLocaleDateString('en-IN'),
    'Average Order Value': r.aov
  }));
  addSheet(wb, 'AOV', aovRows, ['Date', 'Average Order Value']);

  const footfallRows = (data.footfall?.series || []).map((r) => ({
    Date: new Date(r.date).toLocaleDateString('en-IN'),
    Covers: r.covers
  }));
  addSheet(wb, 'Footfall', footfallRows, ['Date', 'Covers']);

  if (data.rushHours) {
    const header = ['Day', ...Array.from({ length: 24 }, (_, h) => `${h}:00`)];
    const rows = data.rushHours.dayLabels.map((day, i) => [day, ...data.rushHours.grid[i]]);
    addAoaSheet(wb, 'Rush Hours', [header, ...rows]);
  }

  const itemRows = (data.items?.topByRevenue || []).map((it, i) => ({
    Rank: i + 1,
    Item: it.name,
    'Qty Sold': it.qtySold,
    Revenue: it.revenue
  }));
  addSheet(wb, 'Top Items', itemRows, ['Rank', 'Item', 'Qty Sold', 'Revenue']);

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
  addSheet(wb, 'All Items Ordered', allItemRows, ['Item', 'Category', 'Qty Sold', 'Revenue']);

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
  addSheet(wb, 'Top 3 By Category', topByCategoryRows, ['Category', 'Rank', 'Item', 'Qty Sold', 'Revenue']);

  const repeatRows = (data.repeatCustomers?.customers || [])
    .filter((c) => c.discountEligible)
    .map((c) => ({
      Name: c.name || '—',
      Phone: c.phone,
      'Visit Count': c.visitCount,
      'Total Spend': c.totalSpend,
      'Last Visit': c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN') : '—'
    }));
  addSheet(wb, 'Repeat Customers', repeatRows, ['Name', 'Phone', 'Visit Count', 'Total Spend', 'Last Visit']);

  const churnRows = (data.churnList?.customers || []).map((c) => ({
    Name: c.name || '—',
    Phone: c.phone,
    'Visit Count': c.visitCount,
    'Total Spend': c.totalSpend,
    'Days Since Last Visit': c.daysSinceLastVisit
  }));
  addSheet(wb, 'Churn List', churnRows, ['Name', 'Phone', 'Visit Count', 'Total Spend', 'Days Since Last Visit']);

  if (data.retention) {
    const retentionRows = [{
      'Retention Threshold (visits)': data.retention.threshold,
      'Total Customers': data.retention.totalCustomers,
      'Repeat Customers': data.retention.repeatCustomers,
      'Retention Rate (%)': data.retention.retentionRate
    }];
    addSheet(wb, 'Retention', retentionRows, ['Retention Threshold (visits)', 'Total Customers', 'Repeat Customers', 'Retention Rate (%)']);
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
    addSheet(wb, 'Customer Summary', summaryRows, ['Total Customers', 'New Customers', 'New (%)', 'Returning Customers', 'Returning (%)']);
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
  addSheet(wb, 'All Customers', allCustomerRows, ['Name', 'Phone', 'Status', 'Visit Count', 'Total Spend', 'First Visit', 'Last Visit', 'Discount Eligible']);

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
  addSheet(wb, 'Full Order Log', orderLogRows, ['Date', 'Invoice', 'Table', 'Guest', 'Phone', 'Party Size', 'Items', 'Payment Method', 'Subtotal', 'Service Charge', 'GST', 'Discount', 'Total']);

  const dateStr = new Date().toISOString().slice(0, 10);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spice_garden_analytics_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
