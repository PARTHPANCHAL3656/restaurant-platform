import express from "express"
import staffAuth from "../middleware/auth.js"
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

// Staff routes
router.post("/", staffAuth, createCategory)
// Must come before "/:id" — otherwise Express matches "reorder" as an :id.
router.patch("/reorder", staffAuth, reorderCategories)
router.patch("/:id", staffAuth, renameCategory)
router.delete("/:id", staffAuth, deleteCategory)

export default router