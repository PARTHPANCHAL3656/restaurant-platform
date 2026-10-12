import Counter from "../models/Counter.js"
import Settings from "../models/Settings.js"

// <PREFIX>-<0001> ... <9999>, for example TA-0007. Counts up from 0001 and
// starts again every year at midnight in India, the same way nextBillNumber.js
// does for invoices. Minted once, when the takeout order is created, and the
// same number is carried onto the bill, so the kitchen board, the guest's
// page and the bill always show the same one.
//
// The year is part of the counter's _id, so a new year starts a fresh counter
// by itself, and two orders placed at the same instant can never be handed the
// same number (the old "count the orders and add one" approach could).
//
// If a very busy year goes past 9999 orders, the numbers start again from
// 0001. That is safe because a pickup order is only live for a few hours.
export async function nextTakeoutNumber() {
  const settings = await Settings.getSingleton()
  const yearIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' })
  const counter = await Counter.findOneAndUpdate(
    { _id: `takeoutNumber-${yearIST}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  const n = ((counter.seq - 1) % 9999) + 1
  const prefix = settings.billing.takeoutOrderPrefix || "TA"
  return `${prefix}-${String(n).padStart(4, '0')}`
}