import jwt from "jsonwebtoken"
const VALID_ROLES = ["OWNER", "MANAGER", "STAFF"]

// Attach this to any route that only staff should access
const staffAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token. Staff access only." })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!VALID_ROLES.includes(decoded.role)) {
      return res.status(403).json({ error: "Not authorized as staff." })
    }

    req.staff = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." })
  }
}

export default staffAuth