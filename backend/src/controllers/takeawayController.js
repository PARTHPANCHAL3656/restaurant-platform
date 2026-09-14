import TakeawayOrder from "../models/TakeawayOrder.js"
import { io } from "../index.js"

// POST /api/takeaway
// Staff logs a new takeaway order (phone-in or counter walk-up).
// Protected by staffAuth
export const createTakeawayOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, items, notes, paymentMethod } = req.body

    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: "Customer name and phone are required." })
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided." })
    }

    // Generate a unique sequential order number, same convention as invoices (INV-1000+n)
    const count = await TakeawayOrder.countDocuments()
    const orderNumber = `TA-${1000 + count + 1}`

    const order = await TakeawayOrder.create({
      orderNumber,
      customerName,
      customerPhone,
      items,
      notes: notes || "",
      paymentMethod: paymentMethod || "Pending"
    })

    io.emit("takeaway:new", order)

    res.status(201).json({
      message: `Takeaway order ${orderNumber} created.`,
      order
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/takeaway/all-active
// Staff sees every takeaway order still in progress (not yet completed/cancelled)
// Protected by staffAuth
export const getAllActiveTakeawayOrders = async (req, res) => {
  try {
    const orders = await TakeawayOrder.find({
      status: { $in: ["Received", "Preparing", "Ready for Pickup"] }
    }).sort({ createdAt: 1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/takeaway/:id/status
// Staff advances a takeaway order (Received -> Preparing -> Ready for Pickup -> Completed),
// or cancels it.
// Protected by staffAuth
export const updateTakeawayOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["Received", "Preparing", "Ready for Pickup", "Completed", "Cancelled"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    const order = await TakeawayOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: "Takeaway order not found." })

    order.status = status
    await order.save()

    io.emit("takeaway:updated", {
      orderId: order._id,
      status: order.status
    })

    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}