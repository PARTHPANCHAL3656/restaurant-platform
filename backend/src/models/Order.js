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
  // "dine-in" orders always have a tableId/tableNumber. "takeout" orders
  // never do — they're identified by sessionId + orderNumber instead.
  orderType: {
    type: String,
    enum: ["dine-in", "takeout"],
    default: "dine-in"
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: function () { return this.orderType === "dine-in" }
  },
  tableNumber: {
    type: Number,
    required: function () { return this.orderType === "dine-in" }  // denormalized for easy staff display
  },
  // Only set for takeout orders, e.g. "TA-1041" — the human-readable
  // identifier a customer gives at the counter, since there's no table.
  orderNumber: {
    type: String,
    default: ""
  },
  // The SAME "INV-####" sequence staff invoices use, minted once at order
  // creation (see utils/nextBillNumber.js) and later copied onto the
  // Invoice as-is rather than a new number being generated at that point.
  // Lets the customer's pre-invoice bill and staff's tax invoice always
  // show the identical number. Blank on orders created before this field
  // existed — invoiceController falls back to the old counting method for
  // those.
  billNumber: {
    type: String,
    default: ""
  },
  // Only meaningful for takeout: "ASAP" or a specific scheduled time string.
  pickupTime: {
    type: String,
    default: ""
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
  // Every round up to and including this number has already been served.
  // A new round added after this stays clearly separated in the kitchen view.
  servedThroughRound: {
    type: Number,
    default: 0
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
}, { timestamps: true, optimisticConcurrency: true })

// Auto-calculate total before saving
orderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + item.price * item.qty
  }, 0)
  next()
})

export default mongoose.model("Order", orderSchema)