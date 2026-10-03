import Order from "../models/Order.js"
import Customer from "../models/Customer.js"
import Settings from "../models/Settings.js"
import { generateTakeoutToken, signTakeoutToken } from "../utils/generateTakeoutToken.js"
import { nextBillNumber } from "../utils/nextBillNumber.js"
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
    const count = await Order.countDocuments({ orderType: "takeout" })
    const orderNumber = `TA-${1000 + count + 1}`
    const billNumber = await nextBillNumber()

    await Order.create({
      orderType: "takeout",
      sessionId,
      orderNumber,
      billNumber,
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
    const { guestPhone } = req.body
    const phone = normalizePhone(guestPhone)

    if (phone.length !== 10) {
      return res.status(400).json({ error: "Please enter a valid 10-digit phone number." })
    }

    const order = await Order.findOne({
      guestPhone: phone,
      orderType: "takeout",
      status: { $in: ["Received", "Preparing", "Ready"] }
    }).sort({ createdAt: -1 })

    if (!order) {
      return res.status(404).json({ error: "We couldn't find an active takeout order for this number. Start a new one below." })
    }

    const { token, menuUrl } = signTakeoutToken(order.sessionId)

    res.json({ sessionId: order.sessionId, token, menuUrl, orderNumber: order.orderNumber, status: order.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}