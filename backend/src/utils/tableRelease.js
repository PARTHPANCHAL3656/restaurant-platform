import Table from "../models/Table.js"
import Order from "../models/Order.js"
import Invoice from "../models/Invoice.js"
import { io } from "../index.js"
import Settings from "../models/Settings.js"
import { ensureRounds, applyRoundStatus, deriveStatus, servedThrough } from "./orderRounds.js"

// True when every item on the order appears on the invoice in at least the
// same quantity. Used by the automatic paths only: if a guest ordered more
// after the bill was paid, those items were never billed, so the server
// must not close the table on its own.
export function invoiceCoversOrder(invoice, order) {
  const keyOf = (item) => item.itemId || item.name
  const billed = new Map()
  for (const item of invoice.items) {
    billed.set(keyOf(item), (billed.get(keyOf(item)) || 0) + item.qty)
  }
  const ordered = new Map()
  for (const item of order.items) {
    ordered.set(keyOf(item), (ordered.get(keyOf(item)) || 0) + item.qty)
  }
  for (const [key, qty] of ordered) {
    if ((billed.get(key) || 0) < qty) return false
  }
  return true
}

// The one place a table session is closed and the table goes back to
// "available". Manual release, the timer and the receipt download all end
// up here, so they all clean up and notify clients in exactly the same way.
// reason: "manual" | "auto" | "receipt" (sent to clients with the events).
export async function releaseTableSession(table, reason = "manual") {
  if (table.currentOrderId) {
    await Order.findByIdAndUpdate(table.currentOrderId, { status: "Served" })
  }

  table.status = "available"
  table.currentSessionId = null
  table.currentOrderId = null
  table.guestName = ""
  table.arrivalTime = ""
  table.notes = ""
  table.guestCount = 0
  table.reservationId = null
  table.qrDataUrl = ""
  table.token = ""
  table.autoReleaseAt = null
  await table.save()

  io.emit("table:released", { tableId: table._id, status: "available", tableNumber: table.tableNumber, reason })
  io.emit("table:updated", { tableId: table._id, status: "available", tableNumber: table.tableNumber })
}

// Automatic release (timer or receipt download). Returns:
//   "released"     - table was freed
//   "skipped"      - paid, but items were added after the bill; staff are told
//   "not-eligible" - no paid invoice for this table's current session
export async function autoReleaseTable(table, reason) {
  if (!table.currentSessionId) return "not-eligible"

  const invoice = await Invoice.findOne({ sessionId: table.currentSessionId })
  if (!invoice || invoice.status !== "paid") return "not-eligible"

  const order = table.currentOrderId ? await Order.findById(table.currentOrderId) : null
  if (order && !invoiceCoversOrder(invoice, order)) {
    table.autoReleaseAt = null
    await table.save()
    io.to("staff").emit("table:autoReleaseSkipped", { tableNumber: table.tableNumber })
    io.emit("table:updated", { tableId: table._id, status: table.status, tableNumber: table.tableNumber })
    return "skipped"
  }

  await releaseTableSession(table, reason)
  return "released"
}

// Kitchen safety net. A round that has been "Ready" (sent out) for longer than
// the Owner's auto-serve setting (2-10 minutes, default 5) is marked Served, so
// a forgotten tap never blocks the bill or leaves a table stuck. Rounds that
// haven't been sent out are never auto-served.
export async function autoServeReadyRounds() {
  const settings = await Settings.getSingleton()
  const minutes = Math.min(10, Math.max(2, Number(settings.billing?.autoServeMinutes) || 5))
  const cutoff = Date.now() - minutes * 60 * 1000

  const orders = await Order.find({
    orderType: { $ne: "takeout" },
    status: { $in: ["Received", "Preparing", "Ready"] },
    $or: [
      { "rounds.status": "Ready" },
      { status: "Ready", rounds: { $size: 0 } } // older orders without a rounds list
    ]
  })

  for (const order of orders) {
    ensureRounds(order)
    let changed = false
    for (const r of order.rounds) {
      const since = new Date(r.readyAt || order.updatedAt).getTime()
      if (r.status === "Ready" && since <= cutoff) {
        applyRoundStatus(r, "Served")
        changed = true
      }
    }
    if (!changed) continue

    order.status = deriveStatus(order)
    order.servedThroughRound = servedThrough(order)
    try {
      await order.save()
    } catch (err) {
      continue // updated elsewhere at the same moment; the next sweep retries
    }

    io.emit("order:statusChanged", { orderId: order._id, tableNumber: order.tableNumber, status: order.status })
    io.emit("order:updated", { orderId: order._id, tableNumber: order.tableNumber, status: order.status })
    io.to("staff").emit("order:autoServed", { tableNumber: order.tableNumber })
  }
}

// Runs every 30 seconds (and once shortly after boot). Each due table is
// claimed atomically first, so two sweeps - or a sweep racing a manual
// release - can never both act on it.
export async function runAutoReleaseSweep() {
  const due = await Table.find({ autoReleaseAt: { $ne: null, $lte: new Date() } }).select("_id")

  for (const { _id } of due) {
    const table = await Table.findOneAndUpdate(
      { _id, autoReleaseAt: { $ne: null, $lte: new Date() } },
      { $set: { autoReleaseAt: null } },
      { new: true }
    )
    if (table && table.currentSessionId) {
      await autoReleaseTable(table, "auto")
    }
  }
}