import Counter from "../models/Counter.js"
// SG-<YY>-<00001> - resets to 00001 every year at midnight IST (not UTC
// midnight, which would flip the counter over 5.5 hours late relative to
// an actual Indian midnight). Minted once, at order creation, and carried
// through to the invoice later rather than being (re)computed at invoice
// time - that's what lets a customer's pre-invoice bill and staff's
// eventual tax invoice show the exact same number, no matter which side
// looks first.
//
// The year is embedded directly in the counter's _id (e.g. "billNumber-
// 2026"), so a new year automatically starts a brand new counter document
// at 1 via upsert - no separate "did the year change, reset it" branch to
// get wrong, and no race between concurrent requests around the rollover.
//
// setDefaultsOnInsert:true matters here - without it, a raw upsert does
// NOT apply the schema's `default: 0`, so $inc on a document that doesn't
// exist yet increments an absent field starting from nothing, handing out
// "1" as if it were the schema default rather than 0+1. (This is exactly
// why the previous version of this file produced "INV-1" instead of
// "INV-1001" - the seq default never actually applied on insert.)
export async function nextBillNumber() {
  const yearIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' })
  const yy = yearIST.slice(-2)
  const counter = await Counter.findOneAndUpdate(
    { _id: `billNumber-${yearIST}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  return `SG-${yy}-${String(counter.seq).padStart(5, '0')}`
}
