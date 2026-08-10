import mongoose from "mongoose"

// Each item in the order (snapshot of menu item at time of order)
const orderItemSchema = new mongoose.Schema({
  itemId:   { type: String, required: true },  // e.g. "str_001"
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true, min: 1 },
  // Tracks which "round" this item was ordered in
  // Round 1 = first order, Round 2 = ordered more, etc.
  round:    { type: Number, default: 1 }
}, { _id: false })

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true
  },
  tableNumber: {
    type: Number,
    required: true  // denormalized for easy staff display
  },
  // Same sessionId as what's in the JWT token
  // This is how we find the right order when customer places/adds items
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  currentRound: {
    type: Number,
    default: 1   // increments each time customer clicks "Order More"
  },
  status: {
    type: String,
    enum: ["Received", "Preparing", "Ready", "Served"],
    default: "Received"
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  guestName: {
    type: String,
    default: ""
  },
  guestPhone: {
    type: String,
    default: ""
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation",
    default: null
  }
}, { timestamps: true })

// Auto-calculate total before saving
orderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
  next()
})

export default mongoose.model("Order", orderSchema)