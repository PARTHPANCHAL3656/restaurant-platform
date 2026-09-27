import mongoose from "mongoose"

const openingHoursEntrySchema = new mongoose.Schema({
  days: { type: String, required: true },   // e.g. "Monday - Thursday"
  hours: { type: String, required: true }   // e.g. "12:00 PM - 10:30 PM"
}, { _id: false })

// Singleton — there is only ever one Settings document. getSingleton()
// below always operates on the first (and only) document that exists,
// creating one with schema defaults the first time it's called.
const settingsSchema = new mongoose.Schema({
  openingHours: {
    type: [openingHoursEntrySchema],
    default: [
      { days: "Monday - Thursday", hours: "12:00 PM - 10:30 PM" },
      { days: "Friday - Saturday", hours: "12:00 PM - 11:30 PM" },
      { days: "Sunday", hours: "12:00 PM - 10:00 PM" }
    ]
  },

  // Business identity + tax/licence numbers printed on every invoice.
  // Owner-only to edit — enforced in settingsController.js, not here.
  legal: {
    legalBusinessName: { type: String, default: "Spice Garden" },
    tagline: { type: String, default: "Modern Indian Fine Dining" },
    address: { type: String, default: "12 Alkapuri Boulevard, Vadodara, Gujarat 390007" },
    gstin: { type: String, default: "24AABCS1429B1Z8", trim: true },
    fssai: { type: String, default: "21423011000123", trim: true },
    sacCode: { type: String, default: "996331", trim: true }
  },

  // Guest-facing contact details. Owner-only to edit.
  contact: {
    primaryPhone: { type: String, default: "+91 265 234 5678" },
    whatsappNumber: { type: String, default: "" },
    secondaryPhone: { type: String, default: "+91 70960 34960" },
    email: { type: String, default: "concierge@spicegarden.com" },
    googleMapsUrl: { type: String, default: "https://www.google.com/maps/search/?api=1&query=12+Alkapuri+Boulevard%2C+Vadodara%2C+Gujarat+390007" },
    googleMapsEmbedUrl: { type: String, default: "https://www.google.com/maps?q=Alkapuri,+Vadodara,+Gujarat+390007&output=embed" }
  },

  // External ordering + social links. Owner or Manager can edit — these
  // change more often than legal/contact info and carry no compliance
  // risk. Social links used to live under `contact` (Owner-only) — moved
  // here to match the Owner+Manager access they should actually have.
  links: {
    zomato: { type: String, default: "" },
    swiggy: { type: String, default: "" },
    instagram: { type: String, default: "https://instagram.com/spicegarden.vadodara" },
    facebook: { type: String, default: "https://facebook.com/spicegarden.vadodara" },
    twitter: { type: String, default: "https://twitter.com/spicegardenvd" }
  },

  // The "second wall" — staff cannot quietly change tax math. Owner-only.
  // Defaults below preserve exactly what was already hardcoded across the
  // app (10% service charge, 3.75%+3.75% GST) so this deploy changes
  // nothing until you actually edit it. The 7.5% total GST is NOT a real
  // Indian restaurant slab (5% or 18% are) — verify and correct this.
  billing: {
    gstMode: { type: String, enum: ["GST_5", "GST_18", "CUSTOM"], default: "CUSTOM" },
    cgstRate: { type: Number, default: 3.75 },
    sgstRate: { type: Number, default: 3.75 },
    pricesIncludeGst: { type: Boolean, default: false },
    serviceChargeEnabled: { type: Boolean, default: true },
    serviceChargePercent: { type: Number, default: 10 },
    serviceChargeTaxable: { type: Boolean, default: false },
    packagingFeeEnabled: { type: Boolean, default: true },
    packagingFeeAmount: { type: Number, default: 30 },
    packagingFeeLabel: { type: String, default: "Packaging Charges" },
    billFooterNote: { type: String, default: "Please verify the bill before payment. No complaints will be entertained thereafter." },
    takeoutBillNote: { type: String, default: "Pay at counter. Collect within 20 min of ready time." },
    invoicePrefix: { type: String, default: "SG", trim: true },
    // Same rule crmController.js already used as a hardcoded constant
    // (REPEAT_VISIT_THRESHOLD = 3) — now the single, configurable source
    // of truth both the CRM "repeat customers" list and real invoice
    // discounting read from.
    // Defaults to OFF — a discount program is a deliberate business
    // decision an Owner should turn on, not something that silently
    // starts giving money away the moment repeat customers exist.
    repeatCustomerDiscountEnabled: { type: Boolean, default: false },
    repeatCustomerVisitThreshold: { type: Number, default: 3 },
    repeatCustomerDiscountPercent: { type: Number, default: 5 }
  },

  // Reservation-booking rules an Owner/Manager configures from Settings →
  // Operations. These automate the boundaries so the host doesn't have to
  // eyeball the clock — enforced in reservationController.js via
  // utils/reservationRules.js. Owner or Manager may edit (same access as
  // openingHours/links) — no compliance risk if they get it wrong.
  reservations: {
    // Stops a guest booking a table minutes before they want to sit down
    // (e.g. from the parking lot).
    resMinLeadTimeHours: { type: Number, default: 2 },
    // Stops guests booking months out and forgetting.
    resMaxAdvanceDays: { type: Number, default: 14 },
    // No-show grace period — how long a confirmed reservation holds its
    // table before staff can flag it late and, if the guest still hasn't
    // shown, mark it a no-show to free the table. Never auto-cancels — a
    // Manager always makes that call, every time (reservationController.js).
    resHoldGraceMinutes: { type: Number, default: 15 },
    // Party size at or above which confirming the request requires a
    // Manager or Owner rather than any staff member.
    resRequireManagerLargeParties: { type: Number, default: 8 },
    // If true, a new booking request for a slot with no remaining table
    // capacity is declined immediately instead of sitting in Pending.
    resAutoRejectIfFull: { type: Boolean, default: true }
  },

  // Last 50 settings changes — who changed which section, when, and
  // exactly what changed (e.g. `["cgstRate changed from \"3.75\" to
  // \"2.5\""]`). Capped by slicing in the controller after every save,
  // not by a Mongo-side limit, so it stays a plain array you can read
  // normally.
  auditLog: {
    type: [{
      section: { type: String, required: true },
      updatedBy: { type: String, required: true },
      role: { type: String, required: true },
      changes: { type: [String], default: [] },
      timestamp: { type: Date, default: Date.now }
    }],
    default: []
  }
}, { timestamps: true })

settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({})
  if (!doc) {
    doc = await this.create({})
  }
  return doc
}

export default mongoose.model("Settings", settingsSchema)