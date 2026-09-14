import mongoose from "mongoose"

// Snapshot of a menu item at the time it was added to a takeaway order
const takeawayItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name:   { type: String, required: true },
  price:  { type: Number, required: true },
  qty:    { type: Number, required: true, min: 1 }
}, { _id: false })

const takeawayOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true  // e.g. "TA-1041"
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  items: [takeawayItemSchema],
  notes: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Received", "Preparing", "Ready for Pickup", "Completed", "Cancelled"],
    default: "Received"
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Online", "Pending"],
    default: "Pending"
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

// Auto-calculate total before saving, same convention as Order.js
takeawayOrderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
  next()
})

export default mongoose.model("TakeawayOrder", takeawayOrderSchema)