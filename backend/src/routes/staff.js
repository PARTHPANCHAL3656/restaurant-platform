import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import { listStaff, createStaff, updateStaff, resetStaffPassword } from "../controllers/staffController.js"

const router = express.Router()

// Every route here is Owner-only — no Manager access at all, unlike
// Settings, which lets Managers touch a couple of sections. Staff
// Accounts is Owner-only end to end per the guide.
router.use(staffAuth, requireRole("OWNER"))

router.get("/", listStaff)
router.post("/", createStaff)
router.patch("/:id", updateStaff)
router.patch("/:id/password", resetStaffPassword)

export default router