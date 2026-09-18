import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  seedMenuItems
} from "../controllers/menuController.js"

const router = express.Router()

// Public route for menu viewing
router.get("/", getAllMenuItems)

// Owner/Manager only
router.post("/seed", staffAuth, requireRole("OWNER", "MANAGER"), seedMenuItems)
router.post("/", staffAuth, requireRole("OWNER", "MANAGER"), createMenuItem)
router.patch("/:id", staffAuth, requireRole("OWNER", "MANAGER"), updateMenuItem)
router.delete("/:id", staffAuth, requireRole("OWNER", "MANAGER"), deleteMenuItem)

export default router