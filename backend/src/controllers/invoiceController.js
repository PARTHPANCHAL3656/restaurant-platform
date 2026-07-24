import Invoice from "../models/Invoice.js"
import Table from "../models/Table.js"
import Order from "../models/Order.js"
import Reservation from "../models/Reservation.js"
import { io } from "../index.js"

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

    const subtotal = Math.round(order.items.reduce((sum, i) => sum + i.price * i.qty, 0))
    const serviceCharge = Math.round(subtotal * 0.10)
    const gst = Math.round(subtotal * 0.075)
    const total = Math.round(subtotal + serviceCharge + gst)

    // Generate unique sequential invoice number
    const count = await Invoice.countDocuments()
    const invoiceNumber = `INV-${1000 + count + 1}`

    const invoice = await Invoice.create({
      invoiceNumber,
      sessionId: table.currentSessionId,
      reservationId: table.reservationId || null,
      orderId: order._id,
      tableId: table._id,
      tableNumber: table.tableNumber,
      guestName: table.guestName || "Guest",
      items: order.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      serviceCharge,
      gst,
      total,
      status: "unpaid",
      generatedBy: req.body?.generatedBy || "Floor Manager"
    })

    // Presenting bill sets order status to Served
    order.status = "Served"
    await order.save()

    io.emit("invoice:generated", invoice)
    io.emit("order:updated", { orderId: order._id, tableNumber: order.tableNumber, status: order.status })

    res.status(201).json(invoice)
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

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!invoice) return res.status(404).json({ error: "Invoice not found." })

    if (invoice.status === "paid") {
      io.emit("invoice:paid", invoice)
    } else {
      io.emit("invoice:updated", invoice)
    }

    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}