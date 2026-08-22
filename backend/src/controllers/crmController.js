import Customer from "../models/Customer.js"

// -------------------------------------------------------
// SHARED GROUND RULES FOR CRM (Part 3):
// - "Repeat customer" / discount-eligible = visitCount >= 3 (lifetime)
// - "Churned" = lastVisit older than 30 days
// These thresholds are intentionally hardcoded constants below, not
// magic numbers scattered in queries — change them in ONE place if
// the business rule ever changes.
// -------------------------------------------------------
const REPEAT_VISIT_THRESHOLD = 3
const CHURN_DAYS = 30

// GET /api/crm/repeat-customers
// Every customer with visitCount >= 3, sorted by most frequent first.
// This IS the discount-eligible list — see getDiscountEligible below,
// which is the same query, just reshaped for the "give a discount" UI.
export const getRepeatCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({
      visitCount: { $gte: REPEAT_VISIT_THRESHOLD }
    })
      .sort({ visitCount: -1 })
      .select("phone name visitCount totalSpend firstVisit lastVisit")

    res.json({
      threshold: REPEAT_VISIT_THRESHOLD,
      count: customers.length,
      customers
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/crm/discount-eligible
// Same rule as repeat customers (visitCount >= 3), but returns a flag
// per customer instead of a filtered list — built for the Part 4 UI
// where staff sees ALL customers with a one-tap discount toggle, and
// eligible ones are pre-marked rather than hidden.
export const getDiscountEligible = async (req, res) => {
  try {
    const customers = await Customer.find({})
      .sort({ visitCount: -1 })
      .select("phone name visitCount totalSpend lastVisit")

    const withEligibility = customers.map((c) => ({
      phone: c.phone,
      name: c.name,
      visitCount: c.visitCount,
      totalSpend: c.totalSpend,
      lastVisit: c.lastVisit,
      discountEligible: c.visitCount >= REPEAT_VISIT_THRESHOLD
    }))

    res.json({
      threshold: REPEAT_VISIT_THRESHOLD,
      customers: withEligibility
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/crm/retention-rate
// Industry-standard loyalty metric: % of all known customers who are
// repeat visitors. Uses the SAME threshold as discount eligibility
// (visitCount >= 3) — deliberately, so "retained" and "discount eligible"
// always mean the same customer segment across the whole app.
export const getRetentionRate = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({})
    const repeatCustomers = await Customer.countDocuments({
      visitCount: { $gte: REPEAT_VISIT_THRESHOLD }
    })

    const retentionRate = totalCustomers === 0
      ? 0
      : Number(((repeatCustomers / totalCustomers) * 100).toFixed(1))

    res.json({
      threshold: REPEAT_VISIT_THRESHOLD,
      totalCustomers,
      repeatCustomers,
      retentionRate
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/crm/churn-list
// Customers who were real visitors (visitCount >= 1, i.e. not junk records)
// but haven't been seen in 30+ days. Sorted so the longest-gone / highest
// past value customers surface first — the ones most worth a re-engagement
// nudge (a call, an SMS offer, etc).
export const getChurnList = async (req, res) => {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - CHURN_DAYS)

    const customers = await Customer.find({
      visitCount: { $gte: 1 },
      lastVisit: { $lt: cutoff }
    })
      .sort({ lastVisit: 1 }) // longest-gone first
      .select("phone name visitCount totalSpend lastVisit")

    const withDaysSince = customers.map((c) => ({
      phone: c.phone,
      name: c.name,
      visitCount: c.visitCount,
      totalSpend: c.totalSpend,
      lastVisit: c.lastVisit,
      daysSinceLastVisit: Math.floor((Date.now() - c.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    }))

    res.json({
      churnThresholdDays: CHURN_DAYS,
      count: withDaysSince.length,
      customers: withDaysSince
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}