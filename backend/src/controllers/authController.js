import jwt from "jsonwebtoken"

// POST /api/staff/login
// Staff enters password → gets JWT to use on all protected routes
export const staffLogin = async (req, res) => {
  try {
    const { password } = req.body

    if (password !== process.env.STAFF_PASSWORD) {
      return res.status(401).json({ error: "Wrong password." })
    }

    const token = jwt.sign(
      { role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    )

    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}