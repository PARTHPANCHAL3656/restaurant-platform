import Counter from "../models/Counter.js"
 
// Same "INV-####" sequence billing management has always used - now minted
// once, at order creation, and carried through to the invoice later rather
// than being (re)computed at invoice time. That's what lets a customer's
// pre-invoice bill and staff's eventual tax invoice show the exact same
// number, no matter which side looks first.
export async function nextBillNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "billNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return `INV-${counter.seq}`
}
