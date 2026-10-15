import mongoose from "mongoose"

// Each item in the order (snapshot of menu item at time of order)
const orderItemSchema = new mongoose.Schema({
  itemId:   { type: String, required: true },  // e.g. "str_001"
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true, min: 1 },
  // Tracks which "round" this item was ordered in
  // Round 1 = first order, Round 2 = ordered more, etc.
  round:    { type: Number, default: 1 },
  // When this item was last added or increased. The kitchen board uses it to
  // flag items that joined a ticket after it was first placed.
  addedAt:  { type: Date, default: Date.now }
}, { _id: false })

// Dine-in orders are cooked and served round by round, so each round carries
// its own status and timestamps (the timestamps also feed future wait-time
// estimates). Takeout orders don't use this.
const roundSchema = new mongoose.Schema({
  round:     { type: Number, required: true },
  status:    { type: String, enum: ["Received", "Preparing", "Ready", "Served"], default: "Received" },
  placedAt:  { type: Date, default: Date.now },
  startedAt: { type: Date, default: null },
  readyAt:   { type: Date, default: null },
  servedAt:  { type: Date, default: null }
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
  // Set when status first becomes "Ready" — lets staff see how long a
  // takeout order has been sitting unpicked-up, since prepared food left
  // too long is wasted money if the customer never shows.
  readyAt: {
    type: Date,
    default: null
  },
  // Takeout only: set when the chef first taps Start (status becomes
  // "Preparing"). Cleared if that move is undone. Feeds the board timers and,
  // later, wait-time estimates.
  startedAt: {
    type: Date,
    default: null
  },
  // Takeout only: when the order was marked Picked Up. The guest's tracking
  // session ends a set number of minutes after this (Settings → Operations).
  pickedUpAt: {
    type: Date,
    default: null
  },
  // Set when staff turn an order away before the kitchen starts it. A code
  // from utils/cancelReasons.js; the guest is shown a friendly line for it.
  cancelReason: {
    type: String,
    default: ""
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  // Takeout only: when the guest first placed items. The order itself is
  // created earlier, when they enter their name and phone, which can be well
  // before that. Used for the kitchen timers and the 5-minute "call to
  // cancel" window.
  placedAt: {
    type: Date,
    default: null
  },
  // Set only when a takeout order is cancelled via the no-show flow —
  // a permanent record of why, for accountability if a customer disputes
  // being blacklisted later.
  noShowReason: {
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
  rounds: [roundSchema],
    status: {
    type: String,
    enum: ["Received", "Preparing", "Ready", "Served", "Cancelled"],
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