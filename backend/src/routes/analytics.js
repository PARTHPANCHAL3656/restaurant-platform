import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  getRevenueStats,
  getAOV,
  getFootfall,
  getRushHours,
  getItemPerformance,
  getOrderLog
} from "../controllers/analyticsController.js"

const router = express.Router()

router.get("/revenue", staffAuth, getRevenueStats)
router.get("/aov", staffAuth, getAOV)
router.get("/footfall", staffAuth, getFootfall)
router.get("/rush-hours", staffAuth, getRushHours)
router.get("/items", staffAuth, getItemPerformance)
router.get("/order-log", staffAuth, getOrderLog)

export default router