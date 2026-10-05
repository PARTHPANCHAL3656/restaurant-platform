import express from "express"
import { staffLogin } from "../controllers/authController.js"
import staffAuth from "../middleware/auth.js"

const router = express.Router()

// POST /api/auth/login
router.post("/login", staffLogin)

// GET /api/auth/me — who does the database say I am RIGHT NOW?
// staffAuth already loaded the account fresh, so this just reports it. The
// frontend uses it to notice a role change (e.g. a demotion) without waiting
// for the user to log out and back in.
router.get("/me", staffAuth, (req, res) => {
  res.json({ name: req.staff.name, role: req.staff.role })
})

export default router