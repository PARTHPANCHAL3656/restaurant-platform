import Invoice from "../models/Invoice.js"
import Reservation from "../models/Reservation.js"
import Customer from "../models/Customer.js"
import Settings from "../models/Settings.js"
import { calculateBill } from "./calculateBill.js"
import { normalizePhone } from "./normalizePhone.js"
import { legalSnapshotFrom } from "./legalSnapshot.js"
import { ensureBillNumber } from "./nextBillNumber.js"
import { io } from "../index.js"

// Reservation.source is "Customer" (a real advance booking) or "Walk-in"
// (seated from the Guest Queue) — the correct distinction, unlike
// "does this table have a reservationId at all," which both cases satisfy.
export async function resolveOrderSource(table) {
  if (!table.reservationId) return "Walk-in"
  const reservation = await Reservation.findById(table.reservationId)
  if (!reservation) return "Walk-in"
  return reservation.source === "Walk-in" ? "Walk-in" : "Reservation"
}

// Creates the unpaid invoice for a table's current order. Used when staff tap
// Generate Invoice, and by the automatic sweep (utils/tableRelease.js) once a
// round has been served. The invoice number is taken here, and only here, so
// an order that never reaches an invoice can't use up a number.
export async function createDineInInvoice({ table, order, generatedBy }) {
  const settings = await Settings.getSingleton()

  const normalizedPhone = normalizePhone(order.guestPhone)
  const existingCustomer = normalizedPhone ? await Customer.findOne({ phone: normalizedPhone }) : null
  const isRepeatCustomer = Boolean(
    existingCustomer && existingCustomer.visitCount >= settings.billing.repeatCustomerVisitThreshold
  )

  const { subtotal, discount, serviceCharge, packagingFee, cgst, sgst, gst, cgstRate, sgstRate, serviceChargePercent, total } = calculateBill({
    items: order.items,
    orderType: "dine-in",
    billing: settings.billing,
    isRepeatCustomer
  })

  const orderSource = await resolveOrderSource(table)
  const invoiceNumber = await ensureBillNumber(order)

  const invoice = await Invoice.create({
    invoiceNumber,
    sessionId: table.currentSessionId,
    reservationId: table.reservationId || null,
    orderId: order._id,
    tableId: table._id,
    tableNumber: table.tableNumber,
    guestName: table.guestName || "Guest",
    guestPhone: order.guestPhone || "",
    partySize: table.guestCount || null,
    orderSource,
    legalSnapshot: legalSnapshotFrom(settings),
    items: order.items.map(i => ({ itemId: i.itemId, name: i.name, price: i.price, qty: i.qty })),
    subtotal,
    discount,
    serviceCharge,
    serviceChargePercent,
    packagingFee,
    cgst,
    sgst,
    cgstRate,
    sgstRate,
    gst,
    total,
    status: "unpaid",
    generatedBy
  })

  // Signal only — the full invoice has customer details (see orderController).
  io.emit("invoice:generated", { invoiceId: invoice._id })
  io.emit("order:updated", { orderId: order._id, tableNumber: order.tableNumber, status: order.status })

  return invoice
}