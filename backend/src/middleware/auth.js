import jwt from "jsonwebtoken"
import Staff from "../models/Staff.js"
const VALID_ROLES = ["OWNER", "MANAGER", "STAFF"]

// Attach this to any route that only staff should access.
//
// The token only proves who signed in. Whether that account is still allowed
// in, and what role it has RIGHT NOW, is decided by the database on every
// request — so deactivating, deleting, demoting or resetting the password of
// an account takes effect immediately instead of whenever its 12-hour token
// happens to expire.
const staffAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token. Staff access only." })
  }

  const token = authHeader.split(" ")[1]

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." })
  }

  if (!decoded.staffId || !VALID_ROLES.includes(decoded.role)) {
    return res.status(403).json({ error: "Not authorized as staff." })
  }

  try {
    const staff = await Staff.findById(decoded.staffId).select("username name role active tokenVersion")

    // Tokens issued before tokenVersion existed carry no "tv" — treat as 0.
    if (!staff || !staff.active || (decoded.tv ?? 0) !== (staff.tokenVersion ?? 0)) {
      return res.status(401).json({ error: "Session is no longer valid. Please sign in again." })
    }

    // Identity and role come from the database, never from the token.
    req.staff = {
      staffId: staff._id.toString(),
      username: staff.username,
      name: staff.name,
      role: staff.role
    }
    next()
  } catch (err) {
    // A database hiccup must not look like "logged out" — the frontend
    // signs people out on 401, so answer 500 here.
    return res.status(500).json({ error: "Could not verify session." })
  }
}

export default staffAuth