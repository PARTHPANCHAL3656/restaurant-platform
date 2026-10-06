import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getAllTables,
  seedTables,
  assignTable,
  freeTable,
  reserveTable,
  getWaitingList,
  addToWaitingList,
  removeFromWaitingList,
  updateTableStatus
} from "../controllers/tableController.js"

const router = express.Router()

// Public
router.get("/", getAllTables)

// Staff only
router.post("/seed", staffAuth, requireRole("OWNER"), seedTables)  // first-run only: refuses if tables exist
router.post("/:id/assign", staffAuth, assignTable)  // assign → returns QR
router.post("/:id/free", staffAuth, freeTable)      // free table after payment
router.patch("/:id/reserve", staffAuth, reserveTable)
router.patch("/:id/status", staffAuth, updateTableStatus)

// Waiting list — walk-ins only, host-entered. Was briefly public
// ("anyone can add themselves") but nothing customer-facing ever called
// it; locked to staff since it's a host action, not a guest one.
router.get("/waiting", staffAuth, getWaitingList)
router.post("/waiting", staffAuth, addToWaitingList)
router.delete("/waiting/:id", staffAuth, removeFromWaitingList)   // staff removes

export default router