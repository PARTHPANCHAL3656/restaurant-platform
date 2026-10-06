import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getRevenueStats,
  getAOV,
  getFootfall,
  getRushHours,
  getItemPerformance,
  getOrderLog
} from "../controllers/analyticsController.js"

const router = express.Router()

// Revenue, item and customer data: Owner and Manager only. The sidebar
// already hides Analytics from Staff; this makes the server agree.
router.use(staffAuth, requireRole("OWNER", "MANAGER"))

router.get("/revenue", getRevenueStats)
router.get("/aov", getAOV)
router.get("/footfall", getFootfall)
router.get("/rush-hours", getRushHours)
router.get("/items", getItemPerformance)
router.get("/order-log", getOrderLog)

export default router