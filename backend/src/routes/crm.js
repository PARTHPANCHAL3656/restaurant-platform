import express from "express"
import staffAuth from "../middleware/auth.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getRepeatCustomers,
  getDiscountEligible,
  getRetentionRate,
  getCustomerOverview,
  getChurnList,
  setCustomerBlacklist
} from "../controllers/crmController.js"

const router = express.Router()

router.get("/repeat-customers", staffAuth, requireRole("OWNER", "MANAGER"), getRepeatCustomers)
router.get("/discount-eligible", staffAuth, requireRole("OWNER", "MANAGER"), getDiscountEligible)
router.get("/retention-rate", staffAuth, requireRole("OWNER", "MANAGER"), getRetentionRate)
router.get("/customer-overview", staffAuth, requireRole("OWNER", "MANAGER"), getCustomerOverview)
router.get("/churn-list", staffAuth, requireRole("OWNER", "MANAGER"), getChurnList)
router.patch("/customers/:phone/blacklist", staffAuth, requireRole("OWNER", "MANAGER"), setCustomerBlacklist)

export default router