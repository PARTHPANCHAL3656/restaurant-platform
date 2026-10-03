import Invoice from "../models/Invoice.js"
import Table from "../models/Table.js"
import Order from "../models/Order.js"
import Reservation from "../models/Reservation.js"
import Customer from "../models/Customer.js"
import Settings from "../models/Settings.js"
import { calculateBill } from "../utils/calculateBill.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { legalSnapshotFrom } from "../utils/legalSnapshot.js"
import { io } from "../index.js"

// Reservation.source is "Customer" (a real advance booking) or "Walk-in"
// (seated from the Guest Queue) — the correct distinction, unlike
// "does this table have a reservationId at all," which both cases satisfy.
async function resolveOrderSource(table) {
  if (!table.reservationId) return "Walk-in"
  const reservation = await Reservation.findById(table.reservationId)
  if (!reservation) return "Walk-in"
  return reservation.source === "Walk-in" ? "Walk-in" : "Reservation"
}

// POST /api/invoices/table/:id
// Staff generates a final bill for a table's current order.
// Protected by staffAuth
export const generateInvoiceForTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) return res.status(404).json({ error: "Table not found." })

    if (!table.currentOrderId || !table.currentSessionId) {
      return res.status(400).json({ error: "This table has no active session to invoice." })
    }

    // Prevent duplicate invoice generation for the same session
    const existingInvoice = await Invoice.findOne({ sessionId: table.currentSessionId })
    if (existingInvoice) {
      return res.status(200).json(existingInvoice)
    }

    const order = await Order.findById(table.currentOrderId)
    if (!order || order.items.length === 0) {
      return res.status(400).json({ error: "No items to invoice for this table." })
    }

    // The bill can only be presented once the food has actually been served.
    // Generating it must never push an order through the kitchen workflow on
    // staff's behalf - it used to jump a just-placed order straight to Served
    // and skip Order Management entirely.
    if (order.status !== "Served") {
      const waitingOn = {
        Received: "hasn't been started by the kitchen yet",
        Preparing: "is still being prepared",
        Ready: "is ready but hasn't been served to the guest yet"
      }[order.status]
      return res.status(409).json({
        code: "ORDER_NOT_SERVED",
        orderStatus: order.status,
        error: waitingOn
          ? `This order ${waitingOn}. Mark it as Served in Order Management before generating the invoice.`
          : `This order is ${String(order.status).toLowerCase()}, so it can't be invoiced.`
      })
    }

    // Backup phone capture: if the guest skipped the optional phone field
    // on their own cart page, staff can supply it here right before billing.
    // Never overwrite a phone that's already on file — same rule orderController uses.
    if (req.body?.guestPhone && !order.guestPhone) {
      order.guestPhone = req.body.guestPhone
      await order.save()
    }

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

    // Reuse the number already minted on this order at creation time (see
    // utils/nextBillNumber.js) so the customer's pre-invoice bill and this
    // tax invoice show the identical number. Orders created before this
    // field existed have no billNumber — fall back to the old counting
    // method so legacy in-flight orders can still be invoiced.
    const invoiceNumber = order.billNumber || `INV-${1000 + (await Invoice.countDocuments()) + 1}`

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
      generatedBy: req.staff.name
    })

    // The order is already Served (checked above), so its status is not
    // touched here - only the invoice is created.
    io.emit("invoice:generated", invoice)
    io.emit("order:updated", { orderId: order._id, tableNumber: order.tableNumber, status: order.status })

    res.status(201).json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/invoices/my-invoice
// Customer looks up the REAL invoice for their own table session, once
// staff has presented the bill (generateInvoiceForTable). Scoped to their
// own session only via tableSession — never exposes the full invoice list.
// Returns 404 until staff presents the bill; the frontend treats that as
// "order in progress, no bill yet" rather than an error.
export const getMyInvoice = async (req, res) => {
  try {
    const { sessionId } = req.tableSession
    const invoice = await Invoice.findOne({ sessionId })
 
    if (!invoice) {
      return res.status(404).json({ error: "No bill has been presented for this table yet." })
    }
 
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/invoices/my-bill-preview
// Customer-facing live estimate for a table session that hasn't been
// formally invoiced yet. Runs the exact same calculateBill() the real
// invoice will use, with the exact same repeat-customer check — so this
// number can never drift from what generateInvoiceForTable eventually
// charges. The previous version of this estimate was computed entirely
// client-side with different logic, which is exactly how a customer
// could see one total, then get charged a different one moments later.
export const getMyBillPreview = async (req, res) => {
  try {
    const { sessionId } = req.tableSession

    const existingInvoice = await Invoice.findOne({ sessionId })
    if (existingInvoice) {
      return res.status(200).json(existingInvoice)
    }

    // Dine-in orders hang off the table. Takeout has no table at all, so its
    // order is found directly by the session id in the customer's token.
    const table = await Table.findOne({ currentSessionId: sessionId })
    let order = null
    if (table) {
      order = table.currentOrderId ? await Order.findById(table.currentOrderId) : null
    } else {
      order = await Order.findOne({ sessionId, orderType: "takeout", status: { $ne: "Cancelled" } })
    }
    if (!order) {
      return res.status(404).json({ error: "No active order for this session." })
    }
    if (order.items.length === 0) {
      return res.status(404).json({ error: "No items to estimate yet." })
    }
    const isTakeout = order.orderType === "takeout"

    const settings = await Settings.getSingleton()
    const normalizedPhone = normalizePhone(order.guestPhone)
    const existingCustomer = normalizedPhone ? await Customer.findOne({ phone: normalizedPhone }) : null
    const isRepeatCustomer = Boolean(
      existingCustomer && existingCustomer.visitCount >= settings.billing.repeatCustomerVisitThreshold
    )

    const bill = calculateBill({
      items: order.items,
      orderType: isTakeout ? "takeout" : "dine-in",
      billing: settings.billing,
      isRepeatCustomer
    })

    // Same identity fields the real invoice will carry, so the customer's
    // bill summary already shows their name, table / pickup number and
    // order source instead of placeholders.
    res.json({
      items: order.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
      ...bill,
      orderType: isTakeout ? "takeout" : "dine-in",
      orderNumber: isTakeout ? order.orderNumber : undefined,
      tableNumber: isTakeout ? undefined : table.tableNumber,
      guestName: (isTakeout ? order.guestName : table.guestName) || "Guest",
      partySize: isTakeout ? null : (table.guestCount || null),
      orderSource: isTakeout ? "Takeout" : await resolveOrderSource(table),
      createdAt: order.createdAt,
      legalSnapshot: legalSnapshotFrom(settings)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/invoices
// Staff sees all invoices, newest first
// Protected by staffAuth
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/invoices/:id
// Staff marks an invoice paid / refunded
// Protected by staffAuth
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body
    const validStatuses = ["unpaid", "paid", "refunded"]

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." })
    }

    const update = {}
    if (status) update.status = status
    if (paymentMethod) update.paymentMethod = paymentMethod

    const wasAlreadyPaid = (await Invoice.findById(req.params.id))?.status === "paid"

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!invoice) return res.status(404).json({ error: "Invoice not found." })

    if (invoice.status === "paid") {
      // Only record a visit the first time this invoice is marked paid -
      // guards against double-counting if staff toggle status back and forth.
      const phone = normalizePhone(invoice.guestPhone)
      if (phone && !wasAlreadyPaid) {
        await Customer.findOneAndUpdate(
          { phone },
          {
            $set: { name: invoice.guestName || "", lastVisit: new Date() },
            $setOnInsert: { firstVisit: new Date() },
            $inc: { visitCount: 1, totalSpend: invoice.total }
          },
          { upsert: true, new: true }
        )
      }
      io.emit("invoice:paid", invoice)

      // A takeout order has no table to release, so it had no equivalent to
      // "table:released" — the only event that ends a customer's browser
      // session (see CartContext.jsx). The session must survive pickup
      // (status "Served") so the customer can still reach this page and
      // pull their bill — it only ends once the bill is actually marked
      // paid, mirroring how dine-in stays open through serving and only
      // closes on the staff's own explicit "end this" action.
      if (invoice.orderType === "takeout" && invoice.sessionId) {
        io.emit("takeout:sessionEnded", { sessionId: invoice.sessionId, invoiceId: invoice._id })
      }
    } else {
      io.emit("invoice:updated", invoice)
    }

    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id)
    res.json({ message: "Invoice deleted." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}