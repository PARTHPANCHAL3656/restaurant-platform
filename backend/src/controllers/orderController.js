import Order from "../models/Order.js"
import { io } from "../index.js"

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

      current.status = "Received"
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

    io.emit("order:new", order)
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
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/orders/:id/status
// Staff updates order status (Received → Preparing → Ready → Served)
// Protected by staffAuth middleware
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["Received", "Preparing", "Ready", "Served"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Order not found." })

    order.status = status
    if (status === "Served") {
      // Everything ordered up to this point is now considered served.
      // If the guest orders again later, only that new round will show
      // as needing prep - this round won't reappear in the queue.
      order.servedThroughRound = order.currentRound - 1
    }
    await order.save()

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