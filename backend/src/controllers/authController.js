import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"
import { logStaffChange, revokeStaffSockets } from "./staffController.js"
// POST /api/auth/login
// Staff enters username + password → gets JWT to use on all protected routes
export const staffLogin = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." })
    }

    const staff = await Staff.findOne({ username: username.trim().toLowerCase() })
    if (!staff || !staff.active) {
      return res.status(401).json({ error: "Incorrect username or password." })
    }

    const match = await bcrypt.compare(password, staff.passwordHash)
    if (!match) {
      return res.status(401).json({ error: "Incorrect username or password." })
    }

    const token = jwt.sign(
      { staffId: staff._id, username: staff.username, name: staff.name, role: staff.role, tv: staff.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "12h", algorithm: "HS256" }
    )

    res.json({ token, name: staff.name, role: staff.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/auth/change-password
// Any signed-in account can change its own password. The current password is
// required so a stolen or left-open session can't quietly lock the real owner
// out. A wrong current password answers 400, not 401/403 — the frontend treats
// those as "session expired" / "permission denied" and would react wrongly.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Current and new password are required." })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." })
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "New password must be different from the current one." })
    }

    const staff = await Staff.findById(req.staff.staffId)
    if (!staff || !staff.active) {
      return res.status(401).json({ error: "Session is no longer valid. Please sign in again." })
    }

    const match = await bcrypt.compare(currentPassword, staff.passwordHash)
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect." })
    }

    staff.passwordHash = await bcrypt.hash(newPassword, 10)
    // Every other session this account has open is now signed out. This one
    // stays alive: it gets a fresh token carrying the new version.
    staff.tokenVersion = (staff.tokenVersion || 0) + 1
    await staff.save()
    revokeStaffSockets(staff._id)

    await logStaffChange(
      { name: staff.name, role: staff.role },
      ["Changed their own password"]
    )

    const token = jwt.sign(
      { staffId: staff._id, username: staff.username, name: staff.name, role: staff.role, tv: staff.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "12h", algorithm: "HS256" }
    )

    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: "Could not change password." })
  }
}