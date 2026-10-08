import Table from "../models/Table.js"
import Invoice from "../models/Invoice.js"
import Order from "../models/Order.js"
import WaitingList from "../models/WaitingList.js"
import Reservation from "../models/Reservation.js"
import { generateTableToken } from "../utils/generateTableToken.js"
import { nextBillNumber } from "../utils/nextBillNumber.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { releaseHeldTable } from "./reservationController.js"
import { releaseTableSession } from "../utils/tableRelease.js"
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

// POST /api/tables/seed   (Owner only)
// First-run helper: creates the 10 starter tables in an EMPTY database. It
// refuses to run if any tables already exist — it used to wipe the whole
// collection first, which any staff login could trigger mid-service.
export const seedTables = async (req, res) => {
  try {
    if (await Table.exists({})) {
      return res.status(409).json({ error: "Tables already exist. Nothing was changed." })
    }

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

    const { reservationId, waitlistId } = req.body
    let guestName = `Table ${table.tableNumber} Guest`
    let guestPhone = ""
    let guestCount = 2
    let notes = ""
    let resId = null

    if (reservationId) {
      const reservation = await Reservation.findById(reservationId)
      if (reservation) {
        // reserveTable() (holding a table ahead of arrival) already checks
        // party size against capacity — this is the same check for the
        // other way a reservation reaches a table: seating it directly.
        // Without it here too, a party could be seated at a table too
        // small for them with no validation at all.
        if (reservation.guests > table.capacity) {
          return res.status(400).json({ error: `Table ${table.tableNumber} seats ${table.capacity} — too small for a party of ${reservation.guests}.` })
        }

        // If this reservation's hold currently lives on a DIFFERENT table
        // (e.g. staff used "Assign Table" to seat it somewhere other than
        // the tile it was originally held on), free that old tile now.
        // Without this, the old table keeps reservationId pointing at a
        // reservation that has already moved on — so a later cancel/no-show
        // release (which only looks up the table by reservationId) can find
        // the wrong table, or none, and leave the original stuck "reserved".
        await releaseHeldTable(reservation, table._id)

        reservation.status = "seated"
        reservation.arrivalTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
        reservation.table = "T-" + String(table.tableNumber).padStart(2, '0')
        await reservation.save()

        guestName = reservation.name
        guestPhone = reservation.phone || ""
        guestCount = reservation.guests
        notes = reservation.notes || ""
        resId = reservation._id
      }
    } else if (waitlistId) {
      // Seating a walk-in straight from the waitlist — no Reservation
      // document involved at all, so table.reservationId stays null.
      const waitlistEntry = await WaitingList.findById(waitlistId)
      if (waitlistEntry) {
        if (waitlistEntry.partySize > table.capacity) {
          return res.status(400).json({ error: `Table ${table.tableNumber} seats ${table.capacity} — too small for a party of ${waitlistEntry.partySize}.` })
        }

        guestName = waitlistEntry.name
        guestPhone = waitlistEntry.phone || ""
        guestCount = waitlistEntry.partySize
        notes = waitlistEntry.notes || ""
        await WaitingList.findByIdAndDelete(waitlistId)
        io.emit("waitingList:updated")
      }
    }

    // Generate table session credentials
    const { sessionId, token, qrDataUrl } = await generateTableToken(table._id, table.tableNumber)
    const billNumber = await nextBillNumber()

    const order = await Order.create({
      tableId: table._id,
      tableNumber: table.tableNumber,
      sessionId,
      billNumber,
      items: [],
      status: "Received",
      guestName,
      guestPhone,
      reservationId: resId
    })

    table.status = "occupied"
    table.currentSessionId = sessionId
    table.currentOrderId = order._id
    table.guestName = guestName
    table.guestCount = guestCount
    table.notes = notes
    table.reservationId = resId
    table.arrivalTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' })
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
      const order = table.currentOrderId ? await Order.findById(table.currentOrderId) : null
      const hasUnbilledItems = order && order.items && order.items.length > 0

      const invoice = await Invoice.findOne({ sessionId: table.currentSessionId })

      if (hasUnbilledItems && !invoice) {
        return res.status(400).json({ error: "This table has unbilled items. Generate an invoice before releasing the table." })
      }
      if (invoice && invoice.status !== "paid") {
        return res.status(400).json({ error: "Cannot release table. Invoice has not been paid." })
      }
    }

    // Same cleanup the automatic paths use (utils/tableRelease.js). A manual
    // release always works, and it clears any pending auto-release timer.
    await releaseTableSession(table, "manual")

    res.json({ message: `Table ${table.tableNumber} is now free.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/tables/:id/reserve
// Staff holds a specific table for a confirmed reservation ahead of the
// guest's arrival — flips the floor map tile to "reserved" (yellow) and
// links the two records both ways, so a later no-show can find and
// release this exact table (see updateReservationStatus).
export const reserveTable = async (req, res) => {
  try {
    const { reservationId } = req.body
    const table = await Table.findById(req.params.id)
    if (!table) return res.status(404).json({ error: "Table not found." })
    if (table.status !== "available") {
      return res.status(400).json({ error: "Only an available table can be held for a reservation." })
    }

    let reservation = null
    if (reservationId) {
      reservation = await Reservation.findById(reservationId)
      if (!reservation) return res.status(404).json({ error: "Reservation not found." })
      if (reservation.status !== "confirmed") {
        return res.status(400).json({ error: "Only a confirmed reservation can have a table held." })
      }
      if (reservation.guests > table.capacity) {
        return res.status(400).json({ error: `Table ${table.tableNumber} seats ${table.capacity} — too small for a party of ${reservation.guests}.` })
      }
    }

    table.status = "reserved"
    if (reservation) {
      // Same reassignment guard as assignTable: if this reservation was
      // already holding a different table, free that one first so it
      // doesn't sit "reserved" forever, orphaned from the reservation that
      // moved on.
      await releaseHeldTable(reservation, table._id)

      table.reservationId = reservation._id
      table.guestName = reservation.name
      table.guestCount = reservation.guests
      table.notes = reservation.notes || ""
      table.arrivalTime = reservation.time

      reservation.table = "T-" + String(table.tableNumber).padStart(2, '0')
      await reservation.save()
    }
    await table.save()

    io.emit("table:updated", { tableId: table._id, status: "reserved", tableNumber: table.tableNumber })
    res.json(table)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/tables/waiting
// Walk-in waitlist ONLY — people physically standing in the lobby.
// Online/phone reservations never appear here, full stop. (This used to
// query the shared Reservation collection for pending + today's confirmed
// bookings alongside real walk-ins — that's exactly why an online
// reservation could show up on the host's Guest Queue screen with a
// Confirm/Reject button, right next to actual walk-ins, and get
// misclicked into the wrong flow. Reservations now live exclusively under
// Tables & Reservations — see reservationController.js.)
export const getWaitingList = async (req, res) => {
  try {
    const list = await WaitingList.find({ status: "waiting" }).sort({ vip: -1, createdAt: 1 })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tables/waiting
// Staff-entered only — a host adds a party physically standing in the
// lobby. Not guest-facing (route now requires staffAuth — see routes/tables.js).
export const addToWaitingList = async (req, res) => {
  try {
    const { name, phone, partySize, notes, vip } = req.body

    if (!name || !partySize) {
      return res.status(400).json({ error: "Guest name and party size are required." })
    }

    const partySizeNum = parseInt(partySize, 10)
    if (!Number.isInteger(partySizeNum) || partySizeNum < 1 || partySizeNum > 10) {
      return res.status(400).json({ error: "Party size must be between 1 and 10 guests." })
    }

    // Same rule as takeout: a phone number is exactly 10 digits. A half-typed
    // number breaks repeat-customer matching and callbacks, so it is rejected
    // here even if the staff screen is bypassed. Leaving it empty is allowed.
    const cleanedPhone = phone ? normalizePhone(phone) : ""
    if (phone && !cleanedPhone) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits." })
    }

    const entry = await WaitingList.create({
      name,
      phone: cleanedPhone,
      partySize: partySizeNum,
      notes: notes || "",
      vip: !!vip
    })
    io.emit("waitingList:updated")
    res.status(201).json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/tables/waiting/:id
// Staff removes a party from the walk-in waitlist — either because they
// just got seated (assignTable deletes the entry itself in that case) or
// because they left before a table opened up.
export const removeFromWaitingList = async (req, res) => {
  try {
    await WaitingList.findByIdAndDelete(req.params.id)
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
