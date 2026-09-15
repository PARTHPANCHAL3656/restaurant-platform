import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  getRepeatCustomers,
  getDiscountEligible,
  getRetentionRate,
  getCustomerOverview,
  getChurnList,
  setCustomerBlacklist
} from "../controllers/crmController.js"

const router = express.Router()

router.get("/repeat-customers", staffAuth, getRepeatCustomers)
router.get("/discount-eligible", staffAuth, getDiscountEligible)
router.get("/retention-rate", staffAuth, getRetentionRate)
router.get("/customer-overview", staffAuth, getCustomerOverview)
router.get("/churn-list", staffAuth, getChurnList)
router.patch("/customers/:phone/blacklist", staffAuth, setCustomerBlacklist)

export default router