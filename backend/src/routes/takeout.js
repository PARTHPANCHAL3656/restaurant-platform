import express from "express"
import { startTakeoutSession, resumeTakeoutSession } from "../controllers/takeoutController.js"

const router = express.Router()

// Public — a customer starts this themselves, no staff/QR-scan involved.
router.post("/start", startTakeoutSession)
router.post("/resume", resumeTakeoutSession)

export default router