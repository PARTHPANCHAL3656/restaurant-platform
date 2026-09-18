import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"
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
      { staffId: staff._id, username: staff.username, name: staff.name, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    )

    res.json({ token, name: staff.name, role: staff.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}