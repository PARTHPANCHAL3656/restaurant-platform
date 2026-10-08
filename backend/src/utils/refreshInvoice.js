import Invoice from "../models/Invoice.js"
import Settings from "../models/Settings.js"
import Customer from "../models/Customer.js"
import { calculateBill } from "./calculateBill.js"
import { normalizePhone } from "./normalizePhone.js"

// When a guest orders another round after the bill was generated but before
// it was paid, bring that same invoice (same number) up to date with the
// full order. A paid invoice is final and is never touched. Returns the
// updated invoice, or null if there was nothing to refresh.
export async function refreshUnpaidInvoice(order) {
  const invoice = await Invoice.findOne({ sessionId: order.sessionId, status: "unpaid" })
  if (!invoice) return null

  const settings = await Settings.getSingleton()

  const normalizedPhone = normalizePhone(order.guestPhone)
  const existingCustomer = normalizedPhone ? await Customer.findOne({ phone: normalizedPhone }) : null
  const isRepeatCustomer = Boolean(
    existingCustomer && existingCustomer.visitCount >= settings.billing.repeatCustomerVisitThreshold
  )

  const bill = calculateBill({
    items: order.items,
    orderType: invoice.orderType || "dine-in",
    billing: settings.billing,
    isRepeatCustomer
  })

  invoice.items = order.items.map(i => ({ itemId: i.itemId, name: i.name, price: i.price, qty: i.qty }))
  invoice.set({
    subtotal: bill.subtotal,
    discount: bill.discount,
    serviceCharge: bill.serviceCharge,
    serviceChargePercent: bill.serviceChargePercent,
    packagingFee: bill.packagingFee,
    cgst: bill.cgst,
    sgst: bill.sgst,
    cgstRate: bill.cgstRate,
    sgstRate: bill.sgstRate,
    gst: bill.gst,
    total: bill.total
  })
  await invoice.save()
  return invoice
}