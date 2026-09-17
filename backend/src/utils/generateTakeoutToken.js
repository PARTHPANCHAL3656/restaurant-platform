import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

// Call this when a customer starts a self-service takeout order
// Returns: { sessionId, token, menuUrl }
export const generateTakeoutToken = () => {
  const sessionId = uuidv4()
  return signTakeoutToken(sessionId)
}

// Call this to re-issue a token for an ALREADY-EXISTING session (resuming
// an in-progress order on a different device, or after clearing storage).
// Same session, same order, just a fresh token to carry it.
export const signTakeoutToken = (sessionId) => {
  // JWT contains sessionId + orderType (no tableId — takeout has no table)
  // Same 8h expiry as dine-in sessions.
  const token = jwt.sign(
    { sessionId, orderType: "takeout" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  )

  // Reuses the exact same /menu flow dine-in guests use
  const menuUrl = `${process.env.FRONTEND_URL}/menu?token=${token}`

  return { sessionId, token, menuUrl }
}