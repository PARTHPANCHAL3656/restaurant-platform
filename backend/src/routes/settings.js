import express from "express"
import staffAuth from "../middleware/auth.js"
import { getSettings, updateSettings } from "../controllers/settingsController.js"

const router = express.Router()

router.get("/", getSettings)
router.patch("/", staffAuth, updateSettings)

export default router