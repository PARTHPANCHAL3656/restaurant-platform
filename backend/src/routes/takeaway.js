import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  createTakeawayOrder,
  getAllActiveTakeawayOrders,
  updateTakeawayOrderStatus
} from "../controllers/takeawayController.js"

const router = express.Router()

// All takeaway routes are staff-only for now — there's no customer-facing
// self-ordering flow yet, just staff logging phone-in/counter orders.
router.post("/", staffAuth, createTakeawayOrder)
router.get("/all-active", staffAuth, getAllActiveTakeawayOrders)
router.patch("/:id/status", staffAuth, updateTakeawayOrderStatus)

export default router