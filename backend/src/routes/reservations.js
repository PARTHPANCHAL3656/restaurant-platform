import express from "express"
import rateLimit from "express-rate-limit"
import staffAuth from "../middleware/auth.js"
import {
  createReservation,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getReservationAvailability,
  getReservationStatusByPhone
} from "../controllers/reservationController.js"

const router = express.Router()

// Failed lookups only: 10 per 15 minutes per address. Guessing a phone number
// plus a reference code isn't realistic at that rate; this just keeps the
// public endpoint from being a free punching bag.
const statusLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." }
})

router.post("/", createReservation)                              // public — customer books
router.get("/availability", getReservationAvailability)          // public — slot capacity check
router.get("/status/:phone", statusLookupLimiter, getReservationStatusByPhone)  // public — needs phone + reference code
router.get("/", staffAuth, getAllReservations)                   // staff views all
router.patch("/:id", staffAuth, updateReservationStatus)        // staff updates status
router.delete("/:id", staffAuth, deleteReservation)             // staff deletes

export default router