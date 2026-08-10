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
  }
}, { timestamps: true })

export default mongoose.model("Customer", customerSchema)