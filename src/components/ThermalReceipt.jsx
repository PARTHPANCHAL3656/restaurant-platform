import React from 'react';
import { formatINR } from '../utils/currency';

const value = (entry, fallback = '---') => entry || fallback;

function percentOf(part, whole) {
  if (!whole) return '0';
  return Number(((part / whole) * 100).toFixed(2)).toString();
}

/**
 * Thermal receipt layout for 80 mm (302 px) roll paper.
 * Rendered off-screen and captured with html2canvas-pro + jsPDF.
 * The PDF page size is driven by the element's scrollHeight so the bill
 * stays as one long, scrollable page instead of a fixed A4 sheet.
 */
export default function ThermalReceipt({ restaurantInfo, invoice, heading = 'TAX INVOICE' }) {
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const serviceCharge = Number(invoice.serviceCharge || 0);
  const packagingFee = Number(invoice.packagingFee || 0);
  const gst = Number(invoice.gst || 0);
  const total = Number(invoice.total ?? invoice.amount ?? 0);

  const orderSourceSuffix =
    invoice.orderSource === 'Reservation' ? ' (Reserved)' :
    invoice.orderSource === 'Walk-in' ? ' (Walk-in)' :
    '';

  return (
    <section className="thermal-receipt">
      {/* Brand header */}
      <header className="thermal-brand">
        <h2>{restaurantInfo.legalBusinessName.toUpperCase()}</h2>
        <p className="thermal-tagline">{restaurantInfo.tagline}</p>
        <p className="thermal-address">{restaurantInfo.address}</p>
        <p className="thermal-licences">
          GSTIN: {restaurantInfo.gstin} &nbsp;|&nbsp; FSSAI: {restaurantInfo.fssai} &nbsp;|&nbsp; SAC: {restaurantInfo.sacCode}
        </p>
      </header>

      <p className="thermal-title">{heading}</p>

      {/* Invoice meta — 2-column grid. Cashier/Customer only appear once a
          real invoice exists to source them from - showing '---' for data
          that was never collected is more misleading than just omitting
          the row. */}
      <dl className="thermal-meta">
        <div><dt>INV No:</dt><dd>{value(invoice.number)}</dd></div>
        <div><dt>Table:</dt><dd>{value(invoice.table)}{orderSourceSuffix}</dd></div>
        <div><dt>Date:</dt><dd>{value(invoice.date)}</dd></div>
        <div><dt>Time:</dt><dd>{value(invoice.time)}</dd></div>
        {(invoice.cashier || invoice.guest) && (
          <>
            <div><dt>Cashier:</dt><dd>{value(invoice.cashier)}</dd></div>
            <div><dt>Customer:</dt><dd>{value(invoice.guest)}</dd></div>
          </>
        )}
      </dl>

      {/* Items table */}
      <table className="thermal-items">
        <thead>
          <tr>
            <th className="col-item">Item Name</th>
            <th className="col-qty">Qty</th>
            <th className="col-rate">Rate</th>
            <th className="col-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const qty = item.qty ?? item.quantity ?? 1;
            return (
              <tr key={`${item.name}-${index}`}>
                <td className="col-item">{item.name}</td>
                <td className="col-qty">{qty}</td>
                <td className="col-rate">{formatINR(item.price)}</td>
                <td className="col-amt">{formatINR(item.price * qty)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <section className="thermal-summary" aria-label="Invoice totals">
        <div className="thermal-row">
          <span>Sub Total</span>
          <strong>{formatINR(subtotal)}</strong>
        </div>
        {serviceCharge > 0 && (
          <div className="thermal-row">
            <span>Service Charge @ {percentOf(serviceCharge, subtotal)}%</span>
            <strong>{formatINR(serviceCharge)}</strong>
          </div>
        )}
        {packagingFee > 0 && (
          <div className="thermal-row">
            <span>{restaurantInfo.packagingFeeLabel || 'Packaging Charges'}</span>
            <strong>{formatINR(packagingFee)}</strong>
          </div>
        )}
        <div className="thermal-row">
          <span>CGST @ {percentOf(gst / 2, subtotal)}%</span>
          <strong>{formatINR(gst / 2)}</strong>
        </div>
        <div className="thermal-row">
          <span>SGST @ {percentOf(gst / 2, subtotal)}%</span>
          <strong>{formatINR(gst / 2)}</strong>
        </div>
        <div className="thermal-grand">
          <span>Grand Total</span>
          <strong>{formatINR(total)}</strong>
        </div>
      </section>

      {/* Payment details — omitted entirely pre-invoice, since there is no
          real payment method or status yet to report. */}
      {(invoice.paymentMethod || invoice.status) && (
        <section className="thermal-payment">
          <p className="thermal-payment-title">Payment Details</p>
          <div className="thermal-row">
            <span>Method:</span>
            <strong>{value(invoice.paymentMethod)}</strong>
          </div>
          <div className="thermal-row">
            <span>Status:</span>
            <strong>{value(invoice.status)}</strong>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="thermal-footer">
        <p className="thermal-thanks">Thank You! Visit Again.</p>
        <p>Phone: {restaurantInfo.primaryPhone} &nbsp;|&nbsp; Email: {restaurantInfo.email}</p>
        <p className="thermal-disclaimer">
          {restaurantInfo.billFooterNote}
        </p>
      </footer>
    </section>
  );
}
