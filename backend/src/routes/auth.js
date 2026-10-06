import express from "express"
import rateLimit from "express-rate-limit"
import { staffLogin, changePassword, getRecoveryStatus, generateRecoveryCodes, recoverAccess } from "../controllers/authController.js"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"

const router = express.Router()

// Brute-force protection for the login form. Only FAILED attempts count, so
// a full shift of staff signing in from the restaurant's one WiFi address
// never locks anyone out, while someone guessing passwords hits the wall at 20.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many failed attempts. Please try again in a few minutes." }
})

// Same idea for "type your current password": a stolen session must not be
// able to guess the password through the change-password form.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many failed attempts. Please try again in a few minutes." }
})

// The public "I'm locked out" form: 5 failed tries per hour per address.
// The codes carry ~80 bits of randomness, so guessing is hopeless anyway —
// this just keeps the endpoint from being a free punching bag.
const recoverLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many failed recovery attempts. Please try again in an hour." }
})

// POST /api/auth/login
router.post("/login", loginLimiter, staffLogin)

// GET /api/auth/me — who does the database say I am RIGHT NOW?
// staffAuth already loaded the account fresh, so this just reports it. The
// frontend uses it to notice a role change (e.g. a demotion) without waiting
// for the user to log out and back in.
router.get("/me", staffAuth, (req, res) => {
  res.json({ name: req.staff.name, role: req.staff.role })
})

// POST /api/auth/change-password — any signed-in account, current password required
router.post("/change-password", staffAuth, passwordChangeLimiter, changePassword)

// Owner recovery codes — status and (re)generation need an Owner session
router.get("/recovery-codes", staffAuth, requireRole("OWNER"), getRecoveryStatus)
router.post("/recovery-codes", staffAuth, requireRole("OWNER"), passwordChangeLimiter, generateRecoveryCodes)

// POST /api/auth/recover — public, uses a recovery code instead of a session
router.post("/recover", recoverLimiter, recoverAccess)

export default router