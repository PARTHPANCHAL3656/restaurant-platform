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
    <section className="thermal-receipt bg-white text-black font-mono text-[11px] leading-[1.35]">
      <header className="text-center">
        <h2 className="text-[16px] font-bold tracking-[0.08em]">{restaurantInfo.name.toUpperCase()}</h2>
        <p className="text-[9px] mt-0.5">{restaurantInfo.tagline}</p>
        <p className="text-[9px] mt-2 leading-snug">{restaurantInfo.address}</p>
        <p className="text-[9px] mt-1">GSTIN: {restaurantInfo.gstin}</p>
        <p className="text-[9px]">FSSAI: {restaurantInfo.fssai}</p>
        <p className="font-bold tracking-[0.16em] text-[10px] mt-3">{heading}</p>
      </header>

      <div className="thermal-rule" />

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
        <dt>Invoice No.</dt><dd className="text-right font-bold">{invoice.number}</dd>
        <dt>Table</dt><dd className="text-right font-bold">{invoice.table}</dd>
        {invoice.guest && <><dt>Customer Name</dt><dd className="text-right font-bold break-words">{invoice.guest}</dd></>}
        <dt>Date</dt><dd className="text-right">{invoice.date}</dd>
        <dt>Time</dt><dd className="text-right">{invoice.time}</dd>
        {invoice.paymentMethod && <><dt>Payment Type</dt><dd className="text-right">{invoice.paymentMethod}</dd></>}
      </dl>

      <div className="thermal-rule" />

      <table className="w-full table-fixed text-[10px]">
        <colgroup><col className="w-[47%]" /><col className="w-[12%]" /><col className="w-[20%]" /><col className="w-[21%]" /></colgroup>
        <thead className="border-b border-black">
          <tr className="uppercase text-[9px]"><th className="pb-1 text-left">Item</th><th className="pb-1 text-center">Qty</th><th className="pb-1 text-right">Rate</th><th className="pb-1 text-right">Amount</th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="align-top">
              <td className="py-1.5 pr-1 break-words">{item.name}</td>
              <td className="py-1.5 text-center">{item.qty ?? item.quantity}</td>
              <td className="py-1.5 text-right whitespace-nowrap">{formatINR(item.price)}</td>
              <td className="py-1.5 text-right whitespace-nowrap">{formatINR(item.price * (item.qty ?? item.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="thermal-rule" />

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
        <div className="flex justify-between"><span>Service Charge{serviceCharge ? ` @ ${percent(serviceCharge)}%` : ''}</span><span>{formatINR(serviceCharge)}</span></div>
        <div className="flex justify-between"><span>CGST @ {percent(gst / 2)}%</span><span>{formatINR(gst / 2)}</span></div>
        <div className="flex justify-between"><span>SGST @ {percent(gst / 2)}%</span><span>{formatINR(gst / 2)}</span></div>
      </div>

      <div className="mt-2 border-y-2 border-black py-2 flex justify-between font-bold text-[13px] uppercase">
        <span>Grand Total</span><span>{formatINR(total)}</span>
      </div>

      <footer className="text-center pt-3 text-[9px] leading-snug">
        <p className="font-bold text-[10px]">Thank You! Visit Again.</p>
        <p className="mt-1">Prices are inclusive of applicable taxes. Please verify the bill before payment - no complaints will be entertained thereafter.</p>
      </footer>
    </section>
  );
}
