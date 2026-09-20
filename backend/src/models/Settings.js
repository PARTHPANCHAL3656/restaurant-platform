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
    name: { type: String, default: "Spice Garden" },
    tagline: { type: String, default: "Modern Indian Fine Dining" },
    address: { type: String, default: "12 Alkapuri Boulevard, Vadodara, Gujarat 390007" },
    gstin: { type: String, default: "24AABCS1429B1Z8", trim: true },
    fssai: { type: String, default: "21423011000123", trim: true }
  },

  // Guest-facing contact details. Owner-only to edit.
  contact: {
    phone: { type: String, default: "+91 265 234 5678" },
    reservationPhone: { type: String, default: "+91 70960 34960" },
    email: { type: String, default: "concierge@spicegarden.com" },
    socials: {
      instagram: { type: String, default: "@spicegarden.vadodara" },
      facebook: { type: String, default: "spicegarden.vadodara" },
      twitter: { type: String, default: "@spicegardenvd" }
    }
  },

  // External ordering links. Owner or Manager can edit — these change
  // more often than legal/contact info and carry no compliance risk.
  links: {
    zomato: { type: String, default: "" },
    swiggy: { type: String, default: "" }
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