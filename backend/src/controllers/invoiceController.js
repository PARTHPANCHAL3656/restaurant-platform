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
import { autoReleaseTable, unservedRounds } from "../utils/tableRelease.js"
import { createDineInInvoice, resolveOrderSource } from "../utils/createInvoice.js"
import { ensureBillNumber } from "../utils/nextBillNumber.js"

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
    // Once ANY round has been served the bill can be presented; later rounds
    // are added to it in place. (The same rule the automatic sweep uses.)
    const anyServed = order.status === "Served" || (order.rounds || []).some(r => r.status === "Served")
    if (!anyServed) {
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

    // The invoice itself is built in utils/createInvoice.js, the same code
    // the automatic sweep uses.
    const invoice = await createDineInInvoice({ table, order, generatedBy: req.staff.name })

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

    const existing = await Invoice.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: "Invoice not found." })

    // Paid is final. It can still be refunded, but never set back to unpaid.
    if (existing.status === "paid" && status === "unpaid") {
      return res.status(409).json({ error: "This invoice is already paid and can't be set back to unpaid." })
    }

    // Paying while a round is still being prepared ("paying ahead") needs a
    // deliberate yes. The table then stays occupied until that round has been
    // served, and an item that can't be served has to be refunded by hand.
    if (status === "paid" && existing.status === "unpaid" && existing.orderType !== "takeout" && existing.orderId && req.body?.payAhead !== true) {
      const cookingOrder = await Order.findById(existing.orderId)
      const cooking = unservedRounds(cookingOrder)
      if (cooking.length > 0) {
        const names = cooking.map(r => `Round ${r.round}`).join(" and ")
        return res.status(409).json({
          code: "ROUNDS_COOKING",
          error: `${names} ${cooking.length > 1 ? "are" : "is"} still being prepared.`
        })
      }
    }

    let invoice
    let justPaid = false
    if (status === "paid") {
      // The flip to paid is a single atomic step, so a double-click or two
      // staff screens can only ever "win" once. Only the winner runs the
      // side effects below (customer stats, events, the release timer).
      invoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, status: "unpaid" },
        { ...update, paidAt: new Date() },
        { new: true }
      )
      if (!invoice) return res.json(existing) // already paid or refunded: nothing to do
      justPaid = true
    } else {
      invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
    }

    if (justPaid) {
      const phone = normalizePhone(invoice.guestPhone)
      if (phone) {
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
      io.to("staff").emit("invoice:paid", invoice)

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

      // Dine-in safety net: if staff forget to release the table after
      // payment, the server releases it once the grace period from Settings
      // runs out (never less than 5 minutes). Matching on this invoice's own
      // sessionId means it can never arm a timer on a newer party's table.
      if (invoice.orderType !== "takeout" && invoice.tableId) {
        // Paid ahead with a round still cooking: the timer is armed later, by
        // the sweep in utils/tableRelease.js, once that round has been served.
        const payOrder = invoice.orderId ? await Order.findById(invoice.orderId) : null
        if (unservedRounds(payOrder).length === 0) {
          const settings = await Settings.getSingleton()
          const minutes = Math.max(5, Number(settings.billing?.tableAutoReleaseMinutes) || 10)
          const armed = await Table.findOneAndUpdate(
            { _id: invoice.tableId, currentSessionId: invoice.sessionId },
            { $set: { autoReleaseAt: new Date(Date.now() + minutes * 60 * 1000) } },
            { new: true }
          )
          if (armed) {
            io.emit("table:updated", { tableId: armed._id, status: armed.status, tableNumber: armed.tableNumber })
          }
        }
      }
    } else {
      io.to("staff").emit("invoice:updated", invoice)
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

// POST /api/invoices/my-invoice/receipt-downloaded
// The guest's bill page calls this right after the receipt PDF is saved.
// Only meaningful once the invoice is paid. If the table is still held on
// this guest's session it is released now (unless items were added after
// the bill - see autoReleaseTable). Needs only the guest's own session token.
export const markReceiptDownloaded = async (req, res) => {
  try {
    const { sessionId } = req.tableSession
    const invoice = await Invoice.findOne({ sessionId })
    if (!invoice) {
      return res.status(404).json({ error: "No bill found for this session." })
    }
    if (invoice.status !== "paid") {
      return res.json({ released: false })
    }

    if (!invoice.receiptDownloadedAt) {
      invoice.receiptDownloadedAt = new Date()
      await invoice.save()
    }

    let released = false
    if (invoice.orderType !== "takeout" && invoice.tableId) {
      const table = await Table.findOne({ _id: invoice.tableId, currentSessionId: sessionId })
      if (table) {
        released = (await autoReleaseTable(table, "receipt")) === "released"
      }
    }

    res.json({ released })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}