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
  },
  // Incremented automatically when a Manager/Owner marks a reservation as
  // a no-show (see reservationController.js). This is a count only — it
  // never flips isBlacklisted or blocks anything on its own. A Manager
  // decides what to do about a repeat no-show by hand; there's no
  // automatic reservation blacklist.
  noShowStrikes: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

export default mongoose.model("Customer", customerSchema)