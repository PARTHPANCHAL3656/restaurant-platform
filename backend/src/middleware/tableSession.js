import jwt from "jsonwebtoken"
import Table from "../models/Table.js"
import Order from "../models/Order.js"

// Attach this to customer routes that need a valid table OR takeout session
// Verifies the token from the QR code URL (or the takeout self-service start)
const tableSession = async (req, res, next) => {
  // Token comes from Authorization header: "Bearer eyJ..."
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No session token. Scan the QR code to access the menu." })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { sessionId, orderType } = decoded

    // Takeout sessions have no table — the Order document itself, still
    // open (not Served/Cancelled), IS the source of truth for validity.
    if (orderType === "takeout") {
      const order = await Order.findOne({ sessionId, orderType: "takeout" })

      if (!order || order.status === "Served" || order.status === "Cancelled") {
        return res.status(401).json({
          error: "Session expired. This takeout order is no longer active.",
          sessionEnded: true,
          status: "closed"
        })
      }

      req.tableSession = { sessionId, orderType: "takeout" }
      return next()
    }

    // Dine-in path — unchanged.
    const { tableId } = decoded

    // Check that the table's currentSessionId still matches
    // If staff freed the table, sessionId won't match → session is dead
    const table = await Table.findById(tableId)

    if (!table) {
      return res.status(404).json({ error: "Table not found." })
    }

    if (table.currentSessionId !== sessionId || (table.status !== 'occupied' && table.status !== 'reserved')) {
      return res.status(401).json({
        error: "Session expired. This table has been reset by staff.",
        sessionEnded: true,
        status: "closed"
      })
    }

    // Attach to request so controllers can use it
    req.tableSession = { tableId, sessionId, tableNumber: decoded.tableNumber, orderType: "dine-in" }
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please scan the QR code again." })
  }
}

// A lighter check for the one thing that should still work after a table
// is released or a takeout order is marked served: looking up an invoice
// that already exists. tableSession's strict "is this table/order still
// active" rule is correct for ordering and for live bill *estimates* (no
// point estimating a bill for an order that's already done), but it was
// also blocking the customer from ever seeing the REAL, already-generated
// invoice once staff wrapped things up — which could happen within
// seconds of the bill being presented. This only verifies the JWT is
// genuinely theirs; it doesn't care whether the table/order is still open.
export const invoiceLookupSession = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No session token. Scan the QR code to access the menu." })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.tableSession = { sessionId: decoded.sessionId, orderType: decoded.orderType || "dine-in" }
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please scan the QR code again." })
  }
}

export default tableSession