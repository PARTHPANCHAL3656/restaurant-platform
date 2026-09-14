import React from 'react';
import { formatINR } from '../utils/currency';

// This stays deliberately plain: thermal printers reproduce dark, high-contrast
// type and simple rules much more reliably than branded card styling.
export default function ThermalReceipt({ restaurantInfo, invoice, heading = 'TAX INVOICE' }) {
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const serviceCharge = Number(invoice.serviceCharge || 0);
  const gst = Number(invoice.gst || 0);
  const total = Number(invoice.total ?? invoice.amount ?? 0);
  const percent = (amount) => subtotal ? Number((amount / subtotal * 100).toFixed(2)).toString() : '0';

  return (
    <section className="thermal-receipt bg-white text-black font-mono">
      <header className="thermal-brand">
        <h2>{restaurantInfo.name.toUpperCase()}</h2>
        <p className="thermal-tagline">{restaurantInfo.tagline}</p>
        <p className="thermal-address">{restaurantInfo.address}</p>
        <p className="thermal-license">GSTIN: {restaurantInfo.gstin} &nbsp; FSSAI: {restaurantInfo.fssai}</p>
      </header>

      <div className="thermal-rule" />
      <p className="thermal-heading">{heading}</p>
      <div className="thermal-rule" />

      <dl className="thermal-meta">
        <div><dt>Invoice No.</dt><dd>{invoice.number}</dd></div>
        <div><dt>Table No.</dt><dd>{invoice.table}</dd></div>
        {invoice.cashier && <div><dt>Cashier</dt><dd>{invoice.cashier}</dd></div>}
        {invoice.paymentMethod && <div><dt>Payment Type</dt><dd>{invoice.paymentMethod}</dd></div>}
        {invoice.guest && <div className="thermal-meta-full"><dt>Customer Name</dt><dd>{invoice.guest}</dd></div>}
        <div><dt>Date</dt><dd>{invoice.date}</dd></div>
        <div><dt>Time</dt><dd>{invoice.time}</dd></div>
      </dl>

      <div className="thermal-rule" />

      <table className="thermal-items">
        <colgroup><col className="w-[50%]" /><col className="w-[11%]" /><col className="w-[18%]" /><col className="w-[21%]" /></colgroup>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td>{item.name}</td>
              <td>{item.qty ?? item.quantity}</td>
              <td>{formatINR(item.price)}</td>
              <td>{formatINR(item.price * (item.qty ?? item.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="thermal-rule" />

      <div className="thermal-totals">
        <div><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
        <div><span>Service Charge{serviceCharge ? ` @ ${percent(serviceCharge)}%` : ''}</span><span>{formatINR(serviceCharge)}</span></div>
        <div><span>CGST @ {percent(gst / 2)}%</span><span>{formatINR(gst / 2)}</span></div>
        <div><span>SGST @ {percent(gst / 2)}%</span><span>{formatINR(gst / 2)}</span></div>
      </div>

      <div className="thermal-grand-total">
        <span>Grand Total</span><span>{formatINR(total)}</span>
      </div>

      <footer className="thermal-footer">
        <p className="thermal-thanks">Thank You! Visit Again.</p>
        <p>{restaurantInfo.phone} &nbsp;|&nbsp; {restaurantInfo.email}</p>
        <p>Prices are inclusive of applicable taxes.</p>
        <p>Please verify the bill before payment - no complaints will be entertained thereafter.</p>
      </footer>
    </section>
  );
}
