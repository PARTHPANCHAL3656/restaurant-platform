import Order from "../models/Order.js"
import Invoice from "../models/Invoice.js"
import { io } from "../index.js"
import Settings from "../models/Settings.js"
import Customer from "../models/Customer.js"
import { calculateBill } from "../utils/calculateBill.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { legalSnapshotFrom } from "../utils/legalSnapshot.js"
import { refreshUnpaidInvoice } from "../utils/refreshInvoice.js"
import { autoReleaseTable, releaseTableSession } from "../utils/tableRelease.js"
import { REJECT_REASONS, guestMessageForCancelled } from "../utils/cancelReasons.js"
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
        // ensureRounds can create this very round itself (from the items that
        // were just added above), carrying the order's old status. Make sure
        // it exists exactly once and starts as Received.
        const placedRound = current.rounds.find(r => r.round === round)
        if (placedRound) {
          placedRound.status = "Received"
          placedRound.placedAt = new Date()
          placedRound.startedAt = null
          placedRound.readyAt = null
          placedRound.servedAt = null
        } else {
          current.rounds.push({ round, status: "Received", placedAt: new Date() })
        }
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

    // Once a takeout order is picked up, its tracking closes after the
    // "takeout session end" time set in Settings → Operations. Tell the guest's
    // browser when, so a page that is already open can end itself at that moment.
    const data = order.toObject()
    if (order.orderType === "takeout" && order.status === "Served") {
      const settings = await Settings.getSingleton()
      const minutes = settings.billing.takeoutSessionEndMinutes || 15
      const pickedUp = new Date(order.pickedUpAt || order.updatedAt).getTime()
      data.sessionEndsAt = new Date(pickedUp + minutes * 60000).toISOString()
    }

    res.json(data)
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
    // Repair what's stored so the board, the Tables panel and billing all agree:
    // older orders get their rounds list, and an order whose saved status no
    // longer matches its rounds (for example after a duplicate round was
    // collapsed) is corrected. Orders that turn out to be fully served drop off.
    const live = []
    for (const o of orders) {
      const changed = ensureRounds(o)
      const derived = deriveStatus(o)
      if (changed || derived !== o.status) {
        o.status = derived
        o.servedThroughRound = servedThrough(o)
        try {
          await o.save()
        } catch (err) {
          // updated elsewhere at the same moment; the next load fixes it
        }
      }
      if (["Received", "Preparing", "Ready"].includes(o.status)) live.push(o)
    }
    res.json(live)
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

// POST /api/orders/:id/reject   { reason }
// Staff turns an order away BEFORE the kitchen starts it: a takeout order, or
// the very first order at a table (Round 1, with nothing else ordered). Staff
// pick one of the quick reasons in utils/cancelReasons.js and never type one;
// the guest is shown a friendly line for it. Once the kitchen has started, an
// order can't be rejected. For a table, the table is released and the guest's
// session ends. Protected by staffAuth middleware
export const rejectOrder = async (req, res) => {
  try {
    const { reason } = req.body
    if (!REJECT_REASONS[reason]) {
      return res.status(400).json({ error: "Please choose a reason." })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Order not found." })

    let table = null
    if (order.orderType === "takeout") {
      if (order.status !== "Received") {
        return res.status(409).json({ error: "The kitchen has already started this order, so it can't be rejected." })
      }
    } else {
      ensureRounds(order)
      const roundNumbers = new Set(order.rounds.map(r => r.round))
      if (roundNumbers.size !== 1 || order.rounds[0].status !== "Received") {
        return res.status(409).json({ error: "Only a table's first order, before the kitchen starts it, can be rejected." })
      }
      if (await Invoice.findOne({ sessionId: order.sessionId })) {
        return res.status(409).json({ error: "A bill already exists for this table, so the order can't be rejected." })
      }
      table = await Table.findOne({ currentOrderId: order._id })
    }

    // A table's session is closed first. Releasing marks the order Served, so
    // the order is set to Cancelled after it. The guest's screen gets the
    // friendly line with the release event.
    if (table) {
      const settings = await Settings.getSingleton()
      await releaseTableSession(table, "rejected", {
        message: guestMessageForCancelled({ cancelReason: reason }, settings.contact.primaryPhone)
      })
    }

    order.status = "Cancelled"
    order.cancelReason = reason
    order.cancelledAt = new Date()
    await order.save()

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

    // Takeout is one ticket with no rounds, so its moves are checked here
    // (dine-in moves go through the per-round endpoint). Forward any number of
    // steps, back one step at most, never back out of Picked Up (the bill
    // exists by then), and a cancelled order stays cancelled.
    if (order.orderType === "takeout") {
      const TAKEOUT_RANK = { Received: 0, Preparing: 1, Ready: 2, Served: 3 }
      if (order.status === "Cancelled") {
        return res.status(409).json({ error: "This order was cancelled and can't be changed." })
      }
      if (order.status === "Served" && status !== "Served") {
        return res.status(409).json({ error: "This order has already been picked up and billed, so it can't be moved back or cancelled." })
      }
      if (status !== "Cancelled" && TAKEOUT_RANK[status] < TAKEOUT_RANK[order.status] - 1) {
        return res.status(400).json({ error: "An order can only be moved back one step." })
      }
    }

    order.status = status
    if (status === "Ready" && !order.readyAt) {
      order.readyAt = new Date()
    }
    if (order.orderType === "takeout") {
      if (status === "Preparing" && !order.startedAt) {
        order.startedAt = new Date()
      }
      if (status === "Served" && !order.pickedUpAt) {
        order.pickedUpAt = new Date()
      }
      // Undoing a step clears its timestamp, so the board timers (and the
      // 15-minute no-show wait) start again from the right moment.
      if (status === "Received") {
        order.startedAt = null
        order.readyAt = null
      }
      if (status === "Preparing") {
        order.readyAt = null
      }
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