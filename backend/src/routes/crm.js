import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  getRepeatCustomers,
  getDiscountEligible,
  getRetentionRate,
  getChurnList
} from "../controllers/crmController.js"

const router = express.Router()

router.get("/repeat-customers", staffAuth, getRepeatCustomers)
router.get("/discount-eligible", staffAuth, getDiscountEligible)
router.get("/retention-rate", staffAuth, getRetentionRate)
router.get("/churn-list", staffAuth, getChurnList)

export default router