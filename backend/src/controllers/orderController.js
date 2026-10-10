import Order from "../models/Order.js"
import Invoice from "../models/Invoice.js"
import { io } from "../index.js"
import Settings from "../models/Settings.js"
import Customer from "../models/Customer.js"
import { calculateBill } from "../utils/calculateBill.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { legalSnapshotFrom } from "../utils/legalSnapshot.js"
import { refreshUnpaidInvoice } from "../utils/refreshInvoice.js"
import { autoReleaseTable } from "../utils/tableRelease.js"
import { STEPS, ensureRounds, deriveStatus, servedThrough, applyRoundStatus, setUnservedRoundsTo } from "../utils/orderRounds.js"
import Table from "../models/Table.js"

// POST /api/orders/add-items
// Customer places first order OR adds more items (same endpoint for both)
// Protected by tableSession middleware
export const addItems = async (req, res) => {
  try {
    const { tableId, sessionId } = req.tableSession
    const { items, guestPhone } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided." })
    }

    // Once the bill is paid the visit is over. A paid invoice is final, so
    // anything ordered now could never be billed. Refuse it, and close the
    // table out right away instead of waiting for the safety-net timer.
    const paidInvoice = await Invoice.findOne({ sessionId, status: "paid" })
    if (paidInvoice) {
      if (paidInvoice.orderType !== "takeout" && tableId) {
        const table = await Table.findOne({ _id: tableId, currentSessionId: sessionId })
        if (table) {
          await autoReleaseTable(table, "paid-order-attempt")
        }
      }
      return res.status(409).json({
        error: "This bill has already been paid, so no more orders can be placed on this table. For anything else, please speak to our manager, visit us again, or book a reservation.",
        code: "BILL_PAID"
      })
    }

    // Two diners at the same table can tap "place order" at the same instant.
    // Both requests would otherwise read the same order, merge items in memory,
    // and save - whichever save lands second silently overwrites the first
    // (a classic lost-update race). Order.js now has optimisticConcurrency:true,
    // so a save() based on stale data throws VersionError instead of overwriting.
    // We catch that and retry against fresh data, up to MAX_RETRIES times.
    const MAX_RETRIES = 5
    let order = null
    let round = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const current = await Order.findOne({ sessionId })

      if (!current) {
        return res.status(404).json({ error: "No active order found for this table." })
      }

      // A takeout order is one handoff, and the staff board shows it as a flat
      // list. Once the kitchen has started it, adding items would re-list
      // everything already cooked as new, so it's closed to additions.
      if (current.orderType === "takeout" && current.status !== "Received") {
        return res.status(409).json({
          error: "Your takeout order is already being prepared, so items can't be added to it. Please place a new takeout order instead.",
          code: "TAKEOUT_LOCKED"
        })
      }

      if (guestPhone && !current.guestPhone) {
        current.guestPhone = guestPhone
      }

      round = current.currentRound
      const newItems = items.map(item => ({ ...item, round }))

      newItems.forEach(newItem => {
        const existingInThisRound = current.items.find(
          i => i.itemId === newItem.itemId && i.round === round
        )
        if (existingInThisRound) {
          existingInThisRound.qty += newItem.qty
        } else {
          current.items.push(newItem)
        }
      })

      if (current.orderType === "takeout") {
        current.status = "Received"
      } else {
        // Dine-in: each round has its own status, so a new round never resets
        // one that's already being cooked or waiting to be served.
        ensureRounds(current)
        current.rounds.push({ round, status: "Received", placedAt: new Date() })
        current.status = deriveStatus(current)
      }
      current.currentRound = round + 1

      try {
        order = await current.save()
        break // saved cleanly, no one else wrote in between - done
      } catch (err) {
        const isConflict = err.name === "VersionError"
        if (isConflict && attempt < MAX_RETRIES - 1) {
          continue // someone else's order landed first - re-read and redo the merge
        }
        throw err
      }
    }

    if (!order) {
      return res.status(409).json({
        error: "This table's order is being updated by someone else right now. Please try again."
      })
    }

    // If a bill was already generated and nobody has paid it yet, bring it up
    // to date with this round (same invoice number) so the new items are never
    // left off the bill. A paid invoice is final and is not touched.
    try {
      const refreshedInvoice = await refreshUnpaidInvoice(order)
      if (refreshedInvoice) {
        io.emit("invoice:generated", { invoiceId: refreshedInvoice._id })
      }
    } catch (invoiceErr) {
      console.error("Could not refresh the unpaid invoice after a new round:", invoiceErr)
    }

    // Full order (items, notes, takeout guest details) — staff room only.
    io.to("staff").emit("order:new", order)
    io.emit("order:updated", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status,
      round
    })

    res.status(201).json({
      message: `Order placed for Table ${order.tableNumber}.`,
      order
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/orders/my-order
// Customer gets their full running bill (all rounds combined)
// Protected by tableSession middleware
export const getMyOrder = async (req, res) => {
  try {
    const { sessionId } = req.tableSession
    const order = await Order.findOne({ sessionId })

    if (!order) {
      return res.status(404).json({ error: "No active order found." })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/orders/table/:tableNumber
// Staff views the full order for a specific table
// Protected by staffAuth middleware
export const getOrderByTable = async (req, res) => {
  try {
    const order = await Order.findOne({
      tableNumber: req.params.tableNumber,
      status: { $in: ["Received", "Preparing", "Ready"] }
    })

    if (!order) {
      return res.status(404).json({ error: "No active order for this table." })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/orders/all-active
// Staff sees all active orders across all tables
// Protected by staffAuth middleware
export const getAllActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ["Received", "Preparing", "Ready"] } }).sort({ createdAt: 1 })
    // Older orders without a rounds list get one built on the fly (not saved).
    orders.forEach(o => ensureRounds(o))
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/orders/:id/rounds/:round/status
// Kitchen board: move ONE round of a dine-in order along
// Received → Preparing → Ready → Served. Going forward may skip a step; going
// back is allowed one step at a time (the board's Undo). A served round can't
// be un-served once a bill exists.
export const updateRoundStatus = async (req, res) => {
  try {
    const { status } = req.body
    const roundNumber = Number(req.params.round)

    if (!STEPS.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Order not found." })
    if (order.orderType === "takeout") {
      return res.status(400).json({ error: "Takeout orders don't use rounds." })
    }

    ensureRounds(order)
    const round = order.rounds.find(r => r.round === roundNumber)
    if (!round) return res.status(404).json({ error: "Round not found." })

    const from = STEPS.indexOf(round.status)
    const to = STEPS.indexOf(status)
    if (to === from) return res.json(order)
    if (to < from && from - to !== 1) {
      return res.status(409).json({ error: "A round can only be moved back one step." })
    }
    if (round.status === "Served" && to < from) {
      const invoice = await Invoice.findOne({ sessionId: order.sessionId })
      if (invoice) {
        return res.status(409).json({ error: "A bill has already been generated, so this round can't be un-served." })
      }
    }

    applyRoundStatus(round, status)
    order.status = deriveStatus(order)
    order.servedThroughRound = servedThrough(order)
    await order.save()

    io.emit("order:statusChanged", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status
    })
    io.emit("order:updated", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status,
      round: roundNumber
    })

    res.json(order)
  } catch (err) {
    if (err.name === "VersionError") {
      return res.status(409).json({ error: "This order was just updated by someone else. Please try again." })
    }
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/orders/:id/status
// Staff updates order status (Received → Preparing → Ready → Served)
// Protected by staffAuth middleware
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, noShowReason } = req.body
    const validStatuses = ["Received", "Preparing", "Ready", "Served", "Cancelled"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Order not found." })

    order.status = status
    if (status === "Ready" && !order.readyAt) {
      order.readyAt = new Date()
    }
    if (status === "Cancelled" && noShowReason) {
      order.noShowReason = noShowReason
    }
    if (status === "Served") {
      // Everything ordered up to this point is now considered served.
      // If the guest orders again later, only that new round will show
      // as needing prep - this round won't reappear in the queue.
      order.servedThroughRound = order.currentRound - 1
    }

    // Dine-in orders also track a status per round (the kitchen board works
    // per round). Keep those in step when this whole-order endpoint is used:
    // every round that isn't already served moves to the new status.
    if (order.orderType !== "takeout" && status !== "Cancelled") {
      ensureRounds(order)
      setUnservedRoundsTo(order, status)
      order.status = deriveStatus(order)
      order.servedThroughRound = servedThrough(order)
    }
    await order.save()

    // Takeout has no "Generate Bill" step the way dine-in does (staff just
    // confirms pickup) — so this is the only moment a takeout order ever
    // gets billed. Without it, takeout revenue never reaches invoices,
    // payment tracking, or analytics at all.
    let generatedInvoice = null
    if (status === "Served" && order.orderType === "takeout") {
      const existingInvoice = await Invoice.findOne({ sessionId: order.sessionId })
      if (!existingInvoice && order.items.length > 0) {
        const settings = await Settings.getSingleton()

        const normalizedPhone = normalizePhone(order.guestPhone)
        const existingCustomer = normalizedPhone ? await Customer.findOne({ phone: normalizedPhone }) : null
        const isRepeatCustomer = Boolean(
          existingCustomer && existingCustomer.visitCount >= settings.billing.repeatCustomerVisitThreshold
        )

        const { subtotal, discount, serviceCharge, packagingFee, cgst, sgst, gst, cgstRate, sgstRate, serviceChargePercent, total } = calculateBill({
          items: order.items,
          orderType: "takeout",
          billing: settings.billing,
          isRepeatCustomer
        })

        const invoiceNumber = order.billNumber || `INV-${1000 + (await Invoice.countDocuments()) + 1}`

        generatedInvoice = await Invoice.create({
          invoiceNumber,
          sessionId: order.sessionId,
          orderId: order._id,
          orderType: "takeout",
          orderNumber: order.orderNumber,
          guestName: order.guestName || "Guest",
          guestPhone: order.guestPhone || "",
          orderSource: "Takeout",
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

        // Customers' bill pages only use this as a "refetch now" signal, so
        // send the id and nothing else — the full invoice has customer details.
        io.emit("invoice:generated", { invoiceId: generatedInvoice._id })
      }
    }

    // Notify customer — their status page updates live
    io.emit("order:statusChanged", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status
    })

    // Notify all staff views
    io.emit("order:updated", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status
    })

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}