import mongoose from "mongoose"

const customerSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true // normalized 10-digit number - this is the identity key
  },
  name: {
    type: String,
    default: ""
  },
  visitCount: {
    type: Number,
    default: 0
  },
  totalSpend: {
    type: Number,
    default: 0
  },
  firstVisit: {
    type: Date,
    default: Date.now
  },
  lastVisit: {
    type: Date,
    default: Date.now
  },
  // Set by staff when a takeout customer no-shows. Blocks that phone
  // number from starting new self-service takeout orders — the practical,
  // no-OTP-needed anti-ghosting policy instead of SMS/WhatsApp verification.
  isBlacklisted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

export default mongoose.model("Customer", customerSchema)