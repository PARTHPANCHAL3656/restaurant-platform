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