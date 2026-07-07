import Table from "../models/Table.js"
import Invoice from "../models/Invoice.js"
import Order from "../models/Order.js"
import WaitingList from "../models/WaitingList.js"
import Reservation from "../models/Reservation.js"
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

    const { reservationId } = req.body
    let guestName = `Table ${table.tableNumber} Guest`
    let guestCount = 2
    let notes = ""
    let resId = null

    if (reservationId) {
      const reservation = await Reservation.findById(reservationId)
      if (reservation) {
        reservation.status = "seated"
        reservation.arrivalTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        await reservation.save()

        guestName = reservation.name
        guestCount = reservation.guests
        notes = reservation.notes || ""
        resId = reservation._id
      }
    }

    // Generate table session credentials
    const { sessionId, token, qrDataUrl } = await generateTableToken(table._id, table.tableNumber)

    const order = await Order.create({
      tableId: table._id,
      tableNumber: table.tableNumber,
      sessionId,
      items: [],
      status: "Received",
      guestName,
      reservationId: resId
    })

    table.status = "occupied"
    table.currentSessionId = sessionId
    table.currentOrderId = order._id
    table.guestName = guestName
    table.guestCount = guestCount
    table.notes = notes
    table.reservationId = resId
    table.arrivalTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    table.qrDataUrl = qrDataUrl
    table.token = token
    await table.save()

    io.emit("table:updated", { tableId: table._id, status: "occupied", tableNumber: table.tableNumber })
    io.emit("waitingList:updated")

    res.json({
      message: `Table ${table.tableNumber} assigned.`,
      qrUrl: qrDataUrl,
      qrDataUrl,
      sessionId,
      token,
      table,
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

    // Verify invoice is paid before freeing, if there was a session
    if (table.currentSessionId) {
      const invoice = await Invoice.findOne({ sessionId: table.currentSessionId })
      if (invoice && invoice.status !== "paid") {
        return res.status(400).json({ error: "Cannot release table. Invoice has not been paid." })
      }
    }

    // Close the active order
    if (table.currentOrderId) {
      await Order.findByIdAndUpdate(table.currentOrderId, { status: "Served" })
    }

    // Reset the table
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
    await table.save()

    // Notify all clients
    io.emit("table:released", { tableId: table._id, status: "available", tableNumber: table.tableNumber })
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
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const list = await Reservation.find({
      $or: [
        { status: "Waiting" },
        { status: { $in: ["pending", "confirmed"] }, date: todayStr }
      ]
    }).sort({ date: 1, time: 1 })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/waiting
export const addToWaitingList = async (req, res) => {
  try {
    const { name, phone, partySize, notes } = req.body
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const timeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })

    const entry = await Reservation.create({
      name,
      phone,
      guests: partySize,
      date: todayStr,
      time: timeStr,
      notes: notes || "",
      source: "Walk-in",
      status: "Waiting"
    })
    io.emit("waitingList:updated")
    res.status(201).json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/tables/waiting/:id
export const removeFromWaitingList = async (req, res) => {
  try {
    const resDoc = await Reservation.findById(req.params.id)
    if (resDoc) {
      if (resDoc.source === 'Walk-in') {
        await Reservation.findByIdAndDelete(req.params.id)
      } else {
        resDoc.status = 'seated'
        await resDoc.save()
      }
    }
    io.emit("waitingList:updated")
    res.json({ message: "Removed from waiting list." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/tables/:id/status
// Staff updates table status explicitly (e.g. available, cleaning)
export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["available", "occupied", "reserved", "cleaning"]
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." })
    }

    const table = await Table.findById(req.params.id)
    if (!table) return res.status(404).json({ error: "Table not found." })

    table.status = status
    await table.save()

    io.emit("table:updated", { tableId: table._id, status: table.status, tableNumber: table.tableNumber })
    res.json(table)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
