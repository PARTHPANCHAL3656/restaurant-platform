import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { formatINR } from './currency';

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

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `spice_garden_analytics_${dateStr}.xlsx`);
}

// Draws a simple bordered table using jsPDF's own primitives — no external
// table plugin needed, which sidesteps a jspdf-autotable v2-vs-v4 peer
// conflict. colWidths (mm) must sum to <= 182 (A4 width minus margins).
function drawTable(doc, { startY, head, rows, colWidths }) {
  const marginLeft = 14;
  const rowHeight = 6;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  let y = startY;

  doc.setFillColor(212, 175, 55);
  doc.setTextColor(26, 31, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.rect(marginLeft, y, tableWidth, rowHeight, 'F');
  let x = marginLeft;
  head.forEach((h, i) => {
    doc.text(String(h), x + 2, y + rowHeight - 2);
    x += colWidths[i];
  });
  y += rowHeight;

  doc.setFont('helvetica', 'normal');
  rows.forEach((row, rIdx) => {
    if (y + rowHeight > 280) {
      doc.addPage();
      y = 20;
    }
    if (rIdx % 2 === 1) {
      doc.setFillColor(250, 249, 248);
      doc.rect(marginLeft, y, tableWidth, rowHeight, 'F');
    }
    x = marginLeft;
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 2, y + rowHeight - 2);
      x += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

// Builds a single formatted PDF report with one table per dataset.
export function exportAnalyticsToPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateStr = new Date().toLocaleDateString('en-IN');
  let cursorY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Spice Garden — Analytics Report', 14, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  cursorY += 6;
  doc.text(`Generated: ${dateStr}`, 14, cursorY);
  cursorY += 8;

  const addSection = (title, head, rows, colWidths) => {
    if (!rows || rows.length === 0) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 31, 44);
    doc.text(title, 14, cursorY);
    cursorY += 3;
    cursorY = drawTable(doc, { startY: cursorY, head, rows, colWidths });
    cursorY += 10;
    if (cursorY > 270) {
      doc.addPage();
      cursorY = 20;
    }
  };

  if (data.revenue) {
    addSection(
      `Revenue — Growth: ${data.revenue.growthPercent}% vs previous period`,
      ['Date', 'Revenue', 'Orders'],
      (data.revenue.series || []).map((r) => [
        new Date(r.period).toLocaleDateString('en-IN'),
        formatINR(r.revenue),
        r.orders
      ]),
      [50, 70, 62]
    );
  }

  if (data.items) {
    addSection(
      'Top Items by Revenue',
      ['Rank', 'Item', 'Qty Sold', 'Revenue'],
      (data.items.topByRevenue || []).map((it, i) => [i + 1, it.name, it.qtySold, formatINR(it.revenue)]),
      [20, 80, 40, 42]
    );
  }

  if (data.retention) {
    addSection(
      'Retention',
      ['Total Customers', 'Repeat Customers', 'Retention Rate'],
      [[data.retention.totalCustomers, data.retention.repeatCustomers, `${data.retention.retentionRate}%`]],
      [60, 60, 62]
    );
  }

  if (data.repeatCustomers) {
    addSection(
      `Repeat Customers (>= ${data.repeatCustomers.threshold} visits)`,
      ['Name', 'Phone', 'Visits', 'Total Spend'],
      (data.repeatCustomers.customers || [])
        .filter((c) => c.discountEligible)
        .map((c) => [c.name || '—', c.phone, c.visitCount, formatINR(c.totalSpend)]),
      [50, 45, 35, 52]
    );
  }

  if (data.churnList) {
    addSection(
      `Churn List (no visit in ${data.churnList.churnThresholdDays}+ days)`,
      ['Name', 'Phone', 'Visits', 'Days Since Last Visit'],
      (data.churnList.customers || []).map((c) => [c.name || '—', c.phone, c.visitCount, c.daysSinceLastVisit]),
      [45, 40, 30, 67]
    );
  }

  doc.save(`spice_garden_analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
}