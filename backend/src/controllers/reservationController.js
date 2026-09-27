import Reservation from "../models/Reservation.js"
import Table from "../models/Table.js"
import Customer from "../models/Customer.js"
import Settings from "../models/Settings.js"
import { io } from "../index.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { validateBookingWindow } from "../utils/reservationRules.js"

// How many guests a date+time slot still has room for, across all tables
// venue-wide. A simplification (it doesn't model individual table turns
// through the evening) but matches what was asked for: disable/decline a
// slot once its total covers are booked out.
async function getSlotAvailability(date, time, excludeReservationId = null) {
  const tables = await Table.find()
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0)

  const query = { date, time, status: { $in: ["pending", "confirmed"] } }
  if (excludeReservationId) query._id = { $ne: excludeReservationId }

  const existing = await Reservation.find(query)
  const reservedGuests = existing.reduce((sum, r) => sum + r.guests, 0)

  return {
    totalCapacity,
    reservedGuests,
    remainingCapacity: Math.max(0, totalCapacity - reservedGuests)
  }
}

// POST /api/reservations
// Public — customer books a table from the website
export const createReservation = async (req, res) => {
  try {
    const { name, phone, date, time, guests, notes } = req.body

    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({ error: "All fields are required." })
    }

    const guestCount = parseInt(guests, 10)
    if (!guestCount || guestCount < 1) {
      return res.status(400).json({ error: "Party size must be at least 1 guest." })
    }

    const settings = await Settings.getSingleton()
    const rules = settings.reservations

    // Lead time / advance-window check — e.g. no booking 8 PM at 7:55 PM,
    // no booking 6 months out. Enforced here regardless of what the form
    // already blocked client-side.
    const windowCheck = validateBookingWindow(date, time, rules)
    if (!windowCheck.ok) {
      return res.status(400).json({ error: windowCheck.error })
    }

    // Slot-capacity check — only actually rejects the request if the
    // Owner/Manager has resAutoRejectIfFull switched on. Off, and a full
    // slot still lands in Pending for a human to sort out manually (no
    // invented "max reservations per day" cap either way).
    const availability = await getSlotAvailability(date, time)
    if (rules.resAutoRejectIfFull && guestCount > availability.remainingCapacity) {
      return res.status(409).json({
        error: "We're fully booked for that time slot. Please try another time."
      })
    }

    const reservation = await Reservation.create({
      name,
      phone,
      date,
      time,
      guests: guestCount,
      notes: notes || "",
      source: "Customer",
      status: "pending"
    })

    // Notify staff dashboard of new reservation
    io.emit("reservation:new", reservation)

    res.status(201).json({
      message: `Request received — reference ${reservation.referenceCode}. We'll confirm within 2 hours.`,
      reservation
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/reservations
// Staff sees all reservations — sorted by newest first
// Protected by staffAuth
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 })
    res.json(reservations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/reservations/:id
// Staff updates status: confirmed / seated / cancelled / rejected / no-show
// Protected by staffAuth
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["pending", "confirmed", "seated", "cancelled", "rejected", "no-show"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." })
    }

    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) return res.status(404).json({ error: "Reservation not found." })

    const settings = await Settings.getSingleton()
    const largePartyThreshold = settings.reservations.resRequireManagerLargeParties

    if (status === "confirmed" && reservation.guests >= largePartyThreshold && req.staff.role === "STAFF") {
      return res.status(403).json({ error: `Parties of ${largePartyThreshold}+ need a Manager or Owner to confirm.` })
    }

    if (status === "no-show") {
      if (reservation.status !== "confirmed") {
        return res.status(400).json({ error: "Only a confirmed reservation can be marked a no-show." })
      }
      if (req.staff.role === "STAFF") {
        return res.status(403).json({ error: "Only a Manager or Owner can mark a reservation as a no-show." })
      }

      // Free whichever table was being held for this reservation, if any.
      // This is the ONLY automatic side effect of a no-show — there is no
      // auto-cancel timer and this never runs on its own; it only fires
      // from the Manager's explicit click.
      const heldTable = await Table.findOne({ reservationId: reservation._id })
      if (heldTable && heldTable.status === "reserved") {
        heldTable.status = "available"
        heldTable.reservationId = null
        heldTable.guestName = ""
        heldTable.guestCount = 0
        heldTable.notes = ""
        heldTable.arrivalTime = ""
        await heldTable.save()
        io.emit("table:updated", { tableId: heldTable._id, status: "available", tableNumber: heldTable.tableNumber })
      }

      // A strike, not a blacklist. The existing takeout no-show flow has
      // its own isBlacklisted flag (Customer.js) — this deliberately never
      // touches it. A Manager decides by hand what a repeat strike means.
      const phone = normalizePhone(reservation.phone)
      if (phone) {
        await Customer.findOneAndUpdate(
          { phone },
          { $inc: { noShowStrikes: 1 }, $setOnInsert: { name: reservation.name } },
          { upsert: true }
        )
      }

      reservation.table = ""
    }

    reservation.status = status
    await reservation.save()

    io.emit("reservation:updated", reservation)

    res.json(reservation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/reservations/:id
// Staff deletes a reservation (optional)
// Protected by staffAuth
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id)
    if (reservation) {
      io.emit("reservation:updated", { _id: req.params.id, deleted: true })
    }
    res.json({ message: "Reservation deleted." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/reservations/availability?date=&time=&guests=
// Public — lets the guest-facing form grey out a time slot that's
// already at capacity before the guest submits anything. The server-side
// check in createReservation is still the actual source of truth.
export const getReservationAvailability = async (req, res) => {
  try {
    const { date, time, guests } = req.query
    if (!date || !time) {
      return res.status(400).json({ error: "date and time are required." })
    }

    const settings = await Settings.getSingleton()
    const rules = settings.reservations

    const windowCheck = validateBookingWindow(date, time, rules)
    const availability = await getSlotAvailability(date, time)
    const requestedGuests = parseInt(guests, 10) || 1

    const available = windowCheck.ok &&
      (!rules.resAutoRejectIfFull || requestedGuests <= availability.remainingCapacity)

    res.json({
      available,
      reason: !windowCheck.ok ? windowCheck.error : (!available ? "Fully booked for this time slot." : null),
      remainingCapacity: availability.remainingCapacity
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/reservations/status/:phone
// Public — the guest-facing "Check Reservation" tracker. Returns the most
// recent request for that phone number, so a guest who never got a call
// can check without needing to remember a reference code.
export const getReservationStatusByPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone)
    if (!phone) {
      return res.status(400).json({ error: "Enter a valid 10-digit phone number." })
    }

    const reservation = await Reservation
      .findOne({ phone: new RegExp(phone + "$"), source: "Customer" })
      .sort({ createdAt: -1 })

    if (!reservation) {
      return res.status(404).json({ error: "No reservation found for that phone number." })
    }

    res.json({
      referenceCode: reservation.referenceCode,
      status: reservation.status,
      name: reservation.name,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}