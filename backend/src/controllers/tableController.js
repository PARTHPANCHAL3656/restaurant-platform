import Table from "../models/Table.js"
import Order from "../models/Order.js"
import WaitingList from "../models/WaitingList.js"
import { generateTableToken } from "../utils/generateTableToken.js"
import { io } from "../index.js"

// GET /api/tables
// Staff sees all 10 tables with their current status
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 })
    res.json(tables)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/seed
// Run once to create the 10 tables in MongoDB — DELETE this route after use
export const seedTables = async (req, res) => {
  try {
    await Table.deleteMany({})

    const tables = [
      { tableNumber: 1, capacity: 6 },
      { tableNumber: 2, capacity: 6 },
      { tableNumber: 3, capacity: 6 },
      { tableNumber: 4, capacity: 6 },
      { tableNumber: 5, capacity: 6 },
      { tableNumber: 6, capacity: 6 },
      { tableNumber: 7, capacity: 6 },
      { tableNumber: 8, capacity: 6 },
      { tableNumber: 9, capacity: 10 },
      { tableNumber: 10, capacity: 10 }
    ]

    await Table.insertMany(tables)
    res.json({ message: "10 tables created successfully." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/:id/assign
// Staff assigns a table → creates session + order → returns QR code
// In backend/src/controllers/tableController.js
// Find the assignTable function and replace the res.json at the bottom with this:

export const assignTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)

    if (!table) return res.status(404).json({ error: "Table not found." })
    if (table.status === "occupied") {
      return res.status(400).json({ error: "Table is already occupied." })
    }

    // ← token is now destructured (was missing before)
    const { sessionId, token, qrDataUrl } = await generateTableToken(table._id, table.tableNumber)

    const order = await Order.create({
      tableId: table._id,
      tableNumber: table.tableNumber,
      sessionId,
      items: [],
      status: "active"
    })

    table.status = "occupied"
    table.currentSessionId = sessionId
    table.currentOrderId = order._id
    await table.save()

    io.emit("table:updated", { tableId: table._id, status: "occupied", tableNumber: table.tableNumber })

    res.json({
      message: `Table ${table.tableNumber} assigned.`,
      qrDataUrl,
      sessionId,
      token,        // ← THIS was missing — the actual JWT for the customer
      orderId: order._id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/:id/free
// Staff manually frees the table after customer pays at counter
export const freeTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)

    if (!table) return res.status(404).json({ error: "Table not found." })

    // Close the active order
    if (table.currentOrderId) {
      await Order.findByIdAndUpdate(table.currentOrderId, { status: "closed" })
    }

    // Reset the table
    table.status = "available"
    table.currentSessionId = null
    table.currentOrderId = null
    await table.save()

    // Notify all clients
    io.emit("table:updated", { tableId: table._id, status: "available", tableNumber: table.tableNumber })

    res.json({ message: `Table ${table.tableNumber} is now free.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/tables/:id/reserve
// Staff marks a table as reserved (from a reservation booking)
export const reserveTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status: "reserved" },
      { new: true }
    )
    io.emit("table:updated", { tableId: table._id, status: "reserved", tableNumber: table.tableNumber })
    res.json(table)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/tables/waiting
export const getWaitingList = async (req, res) => {
  try {
    const list = await WaitingList.find().sort({ createdAt: 1 })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/waiting
export const addToWaitingList = async (req, res) => {
  try {
    const { name, phone, partySize } = req.body
    const entry = await WaitingList.create({ name, phone, partySize })
    io.emit("waitingList:updated")
    res.status(201).json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/tables/waiting/:id
export const removeFromWaitingList = async (req, res) => {
  try {
    await WaitingList.findByIdAndDelete(req.params.id)
    io.emit("waitingList:updated")
    res.json({ message: "Removed from waiting list." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
