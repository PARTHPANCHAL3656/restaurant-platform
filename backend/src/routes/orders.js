import express from "express"
import staffAuth from "../middleware/auth.js"
import tableSession from "../middleware/tableSession.js"
import {
  addItems,
  getMyOrder,
  getOrderByTable,
  getAllActiveOrders,
  updateOrderStatus,
  updateRoundStatus
} from "../controllers/orderController.js"

const router = express.Router()

// Customer routes — need valid table QR token
router.post("/add-items", tableSession, addItems)     // place order / order more
router.get("/my-order", tableSession, getMyOrder)     // get bill summary

// Staff routes
router.get("/all-active", staffAuth, getAllActiveOrders)
router.get("/table/:tableNumber", staffAuth, getOrderByTable)
router.patch("/:id/status", staffAuth, updateOrderStatus)
router.patch("/:id/rounds/:round/status", staffAuth, updateRoundStatus)

export default router