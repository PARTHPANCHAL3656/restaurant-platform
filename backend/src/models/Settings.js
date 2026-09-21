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
    invoicePrefix: { type: String, default: "SG", trim: true }
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