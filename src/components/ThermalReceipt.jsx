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
  // cgst/sgst/rates are only present on invoices generated after this
  // field existed — older invoices fall back to the old 50/50 estimate
  // so they still render instead of showing blank or NaN.
  const discount = Number(invoice.discount || 0);
  const cgstAmount = invoice.cgst !== undefined ? Number(invoice.cgst) : gst / 2;
  const sgstAmount = invoice.sgst !== undefined ? Number(invoice.sgst) : gst / 2;
  const cgstRateDisplay = invoice.cgstRate !== undefined ? invoice.cgstRate : percentOf(cgstAmount, subtotal);
  const sgstRateDisplay = invoice.sgstRate !== undefined ? invoice.sgstRate : percentOf(sgstAmount, subtotal);

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
        {invoice.cashier && (
          <div><dt>Cashier:</dt><dd>{value(invoice.cashier)}</dd></div>
        )}
        {invoice.guest && (
          <div><dt>Customer:</dt><dd>{value(invoice.guest)}</dd></div>
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
        {discount > 0 && (
          <div className="thermal-row">
            <span>Repeat Customer Discount</span>
            <strong>-{formatINR(discount)}</strong>
          </div>
        )}
        {serviceCharge > 0 && (
          <div className="thermal-row">
            <span>Service Charge @ {invoice.serviceChargePercent !== undefined ? invoice.serviceChargePercent : percentOf(serviceCharge, subtotal)}%</span>
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
          <span>CGST @ {cgstRateDisplay}%</span>
          <strong>{formatINR(cgstAmount)}</strong>
        </div>
        <div className="thermal-row">
          <span>SGST @ {sgstRateDisplay}%</span>
          <strong>{formatINR(sgstAmount)}</strong>
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
