import Order from "../models/Order.js"
import { io } from "../index.js"

// POST /api/orders/add-items
// Customer places first order OR adds more items (same endpoint for both)
// Protected by tableSession middleware
export const addItems = async (req, res) => {
  try {
    const { tableId, sessionId } = req.tableSession
    const { items } = req.body
    // items = [{ itemId, name, price, qty }, ...]

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided." })
    }

    // Find the active order for this session
    const order = await Order.findOne({ sessionId, status: "active" })

    if (!order) {
      return res.status(404).json({ error: "No active order found for this table." })
    }

    // Tag items with the current round number
    const round = order.currentRound
    const newItems = items.map(item => ({ ...item, round }))

    // Merge with existing items
    // If the same itemId already exists from a PREVIOUS round, add as new entry
    // (keeps round history clean on staff side)
    // If same itemId in SAME round already somehow exists, increment qty
    newItems.forEach(newItem => {
      const existingInThisRound = order.items.find(
        i => i.itemId === newItem.itemId && i.round === round
      )
      if (existingInThisRound) {
        existingInThisRound.qty += newItem.qty
      } else {
        order.items.push(newItem)
      }
    })

    // Increment round for next "Order More" click
    order.currentRound += 1

    await order.save()  // totalAmount auto-recalculated by pre-save hook

    // Notify staff dashboard of new order
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
    const order = await Order.findOne({ sessionId, status: "active" })

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
      status: "active"
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
    const orders = await Order.find({ status: { $in: ["active", "billed"] } }).sort({ createdAt: 1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/orders/:id/status
// Staff updates order status (placed → preparing → served)
// Protected by staffAuth middleware
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["active", "billed", "closed"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!order) return res.status(404).json({ error: "Order not found." })

    // Notify customer — their status page updates live
    io.emit("order:statusChanged", {
      orderId: order._id,
      tableNumber: order.tableNumber,
      status: order.status
    })

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}