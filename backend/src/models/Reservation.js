import mongoose from "mongoose"

const reservationSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  phone:  { type: String, required: true },
  date:   { type: String, required: true },  // "2024-07-15"
  time:   { type: String, required: true },  // "19:30"
  guests: { type: Number, required: true },
  notes:  { type: String, default: "" },      // Special request
  source: { type: String, enum: ["Customer", "Walk-in"], default: "Customer" },
  arrivalTime: { type: String, default: "" },
  // Display code of the table staff has held/seated this reservation at
  // (e.g. "T-01") — set by /api/tables/:id/reserve or /:id/assign,
  // cleared on release or no-show.
  table: { type: String, default: "" },
  // Human-readable code shown to the guest and used for the phone-number
  // status lookup — set in the pre-validate hook below.
  referenceCode: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "seated", "cancelled", "rejected", "no-show"],
    default: "pending"
  }
}, { timestamps: true })

// "RES-" + the last 6 hex chars of the document's own _id — no separate
// counter collection needed, and it's stable/unique for free.
reservationSchema.pre("validate", function (next) {
  if (!this.referenceCode) {
    this.referenceCode = `RES-${this._id.toString().slice(-6).toUpperCase()}`
  }
  next()
})

export default mongoose.model("Reservation", reservationSchema)