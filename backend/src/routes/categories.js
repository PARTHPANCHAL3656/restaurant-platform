import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getAllCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  reorderCategories
} from "../controllers/categoryController.js"

const router = express.Router()

// Public — the customer menu renders section headers from this list too.
router.get("/", getAllCategories)

// Owner/Manager only
router.post("/", staffAuth, requireRole("OWNER", "MANAGER"), createCategory)
// Must come before "/:id" — otherwise Express matches "reorder" as an :id.
router.patch("/reorder", staffAuth, requireRole("OWNER", "MANAGER"), reorderCategories)
router.patch("/:id", staffAuth, requireRole("OWNER", "MANAGER"), renameCategory)
router.delete("/:id", staffAuth, requireRole("OWNER", "MANAGER"), deleteCategory)

export default router