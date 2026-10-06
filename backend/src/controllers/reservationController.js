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

// Frees whichever table is being held ("reserved") for this reservation,
// if any, and clears the reservation's own table link. Used by no-show,
// guest-cancelled, AND by a reassignment to a different table (see
// assignTable / reserveTable in tableController.js) so a yellow table can
// never be left stranded — including the case where a reservation's hold
// was moved to a different table and the original was never freed.
//
// keepTableId: pass the table currently being assigned/held so, if that
// happens to be the same table already holding this reservation, we don't
// bounce it available-then-occupied in the same request.
export async function releaseHeldTable(reservation, keepTableId = null) {
  const heldTable = await Table.findOne({ reservationId: reservation._id })
  if (
    heldTable &&
    heldTable.status === "reserved" &&
    String(heldTable._id) !== String(keepTableId || "")
  ) {
    heldTable.status = "available"
    heldTable.reservationId = null
    heldTable.guestName = ""
    heldTable.guestCount = 0
    heldTable.notes = ""
    heldTable.arrivalTime = ""
    await heldTable.save()
    io.emit("table:updated", { tableId: heldTable._id, status: "available", tableNumber: heldTable.tableNumber })
  }
  reservation.table = ""
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
    if (!guestCount || guestCount < 1 || guestCount > 10) {
      return res.status(400).json({ error: "Party size must be between 1 and 10 guests." })
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

    // Notify staff dashboard of new reservation — staff room only, because
    // this payload carries the guest's name and phone number.
    io.to("staff").emit("reservation:new", reservation)

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
      // Besides the strike below, this is the ONLY automatic side effect of
      // a no-show — there is no auto-cancel timer and this never runs on
      // its own; it only fires from the Manager's explicit click.
      await releaseHeldTable(reservation)

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

    }

    // A guest who phones to cancel must not leave their table stranded as
    // "reserved", and — unlike a no-show — earns no strike.
    if (status === "cancelled") {
      await releaseHeldTable(reservation)
    }

    reservation.status = status
    await reservation.save()

    io.to("staff").emit("reservation:updated", reservation)

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
      io.to("staff").emit("reservation:updated", { _id: req.params.id, deleted: true })
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

// GET /api/reservations/status/:phone?ref=RES-XXXXXX
// Public — the guest-facing "Check Reservation" tracker. It needs BOTH the
// phone number and the reference code shown when the request was made. Phone
// alone would let anyone who knows a person's number see their name and
// booking time. A wrong combination always gets the same answer, so the
// endpoint can't be used to find out whose number has a booking.
export const getReservationStatusByPhone = async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone)
    if (!phone) {
      return res.status(400).json({ error: "Enter a valid 10-digit phone number." })
    }

    const ref = typeof req.query.ref === "string" ? req.query.ref.trim().toUpperCase() : ""
    if (!/^RES-[0-9A-F]{6}$/.test(ref)) {
      return res.status(400).json({ error: "Enter the reference code from your booking confirmation (it looks like RES-3F9A2C)." })
    }

    const reservation = await Reservation.findOne({
      phone: new RegExp(phone + "$"),
      referenceCode: ref,
      source: "Customer"
    })

    if (!reservation) {
      return res.status(404).json({ error: "We couldn't find a reservation matching that phone number and reference code." })
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