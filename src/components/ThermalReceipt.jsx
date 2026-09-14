import React from 'react';
import { formatINR } from '../utils/currency';

const value = (entry, fallback = '---') => entry || fallback;

// Structured POS layout: the grid is CSS, while every printed value is live data.
export default function ThermalReceipt({ restaurantInfo, invoice, heading = 'TAX INVOICE' }) {
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const serviceCharge = Number(invoice.serviceCharge || 0);
  const gst = Number(invoice.gst || 0);
  const total = Number(invoice.total ?? invoice.amount ?? 0);
  const percent = (amount) => subtotal ? Number(((amount / subtotal) * 100).toFixed(2)).toString() : '0';

  return (
    <section className="thermal-receipt thermal-grid bg-white text-black">
      <header className="thermal-grid-brand">
        <h2>{restaurantInfo.name.toUpperCase()}</h2>
        <p>{restaurantInfo.tagline}</p>
        <p>{restaurantInfo.address}</p>
        <p>GSTIN: {restaurantInfo.gstin} &nbsp;|&nbsp; FSSAI: {restaurantInfo.fssai}</p>
      </header>
      <p className="thermal-grid-title">{heading}</p>

      <dl className="thermal-grid-meta">
        <div><dt>INV No:</dt><dd>{value(invoice.number)}</dd></div>
        <div><dt>Table:</dt><dd>{value(invoice.table)}</dd></div>
        <div><dt>Date:</dt><dd>{value(invoice.date)}</dd></div>
        <div><dt>Time:</dt><dd>{value(invoice.time)}</dd></div>
        <div><dt>Cashier:</dt><dd>{value(invoice.cashier)}</dd></div>
        <div><dt>Customer:</dt><dd>{value(invoice.guest)}</dd></div>
      </dl>

      <table className="thermal-grid-items">
        <colgroup><col className="w-[52%]" /><col className="w-[12%]" /><col className="w-[17%]" /><col className="w-[19%]" /></colgroup>
        <thead><tr><th>Item Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td>{item.name}</td><td>{item.qty ?? item.quantity}</td><td>{formatINR(item.price)}</td><td>{formatINR(item.price * (item.qty ?? item.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="thermal-grid-summary" aria-label="Invoice totals">
        <div><span>Sub Total</span><strong>{formatINR(subtotal)}</strong></div>
        <div><span>Service Charge @ {percent(serviceCharge)}%</span><strong>{formatINR(serviceCharge)}</strong></div>
        <div><span>CGST @ {percent(gst / 2)}%</span><strong>{formatINR(gst / 2)}</strong></div>
        <div><span>SGST @ {percent(gst / 2)}%</span><strong>{formatINR(gst / 2)}</strong></div>
        <div className="thermal-grid-grand"><span>Grand Total</span><strong>{formatINR(total)}</strong></div>
      </section>

      <section className="thermal-grid-payment">
        <p>Payment Details</p>
        <div><span>Method:</span><strong>{value(invoice.paymentMethod, 'Pay at Counter')}</strong></div>
        <div><span>Status:</span><strong>{value(invoice.status, 'Pending')}</strong></div>
      </section>

      <footer className="thermal-grid-footer">
        <p className="thermal-grid-thanks">Thank You! Visit Again.</p>
        <p>Phone: {restaurantInfo.phone} &nbsp;|&nbsp; Email: {restaurantInfo.email}</p>
        <p>Please verify the bill before payment. No complaints will be entertained thereafter.</p>
      </footer>
    </section>
  );
}
