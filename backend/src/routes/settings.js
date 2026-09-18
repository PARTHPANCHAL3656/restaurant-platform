import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import { getSettings, updateSettings } from "../controllers/settingsController.js"

const router = express.Router()

router.get("/", getSettings)
router.patch("/", staffAuth, requireRole("OWNER", "MANAGER"), updateSettings)

export default router