import jwt from "jsonwebtoken"

// Hardcoded staff ID allowlist — swap these for your team's real staff IDs
const VALID_STAFF_IDS = [
  "SG-1001",
  "SG-1002",
  "SG-1003",
  "SG-1004",
  "SG-1005",
]

// POST /api/staff/login
// Staff enters staffId + password → gets JWT to use on all protected routes
export const staffLogin = async (req, res) => {
  try {
    const { staffId, password } = req.body

    if (!staffId || !VALID_STAFF_IDS.includes(staffId.trim().toUpperCase())) {
      return res.status(401).json({ error: "Unrecognized staff ID." })
    }

    if (password !== process.env.STAFF_PASSWORD) {
      return res.status(401).json({ error: "Wrong password." })
    }

    const token = jwt.sign(
      { role: "staff", staffId: staffId.trim().toUpperCase() },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    )

    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}