import Order from "../models/Order.js"
import Customer from "../models/Customer.js"
import Settings from "../models/Settings.js"
import { generateTakeoutToken, signTakeoutToken } from "../utils/generateTakeoutToken.js"
import { nextTakeoutNumber } from "../utils/nextTakeoutNumber.js"
import { checkPickupTime } from "../utils/checkTakeoutHours.js"
import { normalizePhone } from "../utils/normalizePhone.js"

// POST /api/takeout/start
// Public — no login required. A customer taps "Start Takeout Order" on the
// website/landing page (no QR scan needed) and this spins up a brand new
// session for just them, the same way a staff table-assignment does for
// dine-in — just with no table attached.
export const startTakeoutSession = async (req, res) => {
  try {
    const { guestName, guestPhone, pickupTime } = req.body

    if (!guestName || !guestPhone) {
      return res.status(400).json({ error: "Name and phone number are required to start a takeout order." })
    }

    const phone = normalizePhone(guestPhone)
    if (phone.length !== 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit phone number." })
    }

    // The no-OTP anti-ghosting policy: a phone flagged after a past
    // no-show can't self-start a new takeout order online.
    const existingCustomer = await Customer.findOne({ phone })
    if (existingCustomer?.isBlacklisted) {
      return res.status(403).json({
        error: "Online ordering is unavailable for this number. Please call the restaurant directly."
      })
    }

    // Server-side hours check, so it can't be bypassed by skipping the
    // frontend picker. "ASAP" needs us open right now; a specific pickup
    // time can be ordered ahead at any hour as long as it lands inside
    // today's pickup window.
    const settings = await Settings.getSingleton()
    const hoursError = checkPickupTime(settings.openingHours, pickupTime)
    if (hoursError) {
      return res.status(403).json({ error: hoursError })
    }

    const { sessionId, token, menuUrl } = generateTakeoutToken()
    const orderNumber = await nextTakeoutNumber()

    await Order.create({
      orderType: "takeout",
      sessionId,
      orderNumber,
      guestName,
      guestPhone: phone,
      pickupTime: pickupTime || "ASAP",
      items: [],
      status: "Received"
    })

    res.status(201).json({ sessionId, token, menuUrl, orderNumber })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/takeout/resume
// Public. A customer who closed the tab, cleared their browser, or switched
// devices can get back into their still-open order with just their phone
// number — no QR code needed, since each session already has its own
// unique sessionId regardless of how many other customers are ordering
// at the same time.
export const resumeTakeoutSession = async (req, res) => {
  try {
    const { guestPhone, orderNumber } = req.body
    const phone = normalizePhone(guestPhone)
    const wanted = String(orderNumber || "").trim().toUpperCase()

    if (phone.length !== 10 || !wanted) {
      return res.status(400).json({ error: "Please enter your phone number and your order number." })
    }

    // A phone number alone is not enough to open someone's order: it must
    // come with the order number shown when the order was started. Any
    // mismatch gets the same answer, so nothing can be guessed from it.
    const order = await Order.findOne({
      guestPhone: phone,
      orderNumber: wanted,
      orderType: "takeout",
      status: { $in: ["Received", "Preparing", "Ready"] }
    })

    if (!order) {
      return res.status(404).json({ error: "We couldn't find an active takeout order with that phone number and order number. Please check both, or call the restaurant." })
    }

    const { token, menuUrl } = signTakeoutToken(order.sessionId)

    res.json({ sessionId: order.sessionId, token, menuUrl, orderNumber: order.orderNumber, status: order.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}