import mongoose from "mongoose"

const invoiceItemSchema = new mongoose.Schema({
  itemId: { type: String, default: "" },
  name:  { type: String, required: true },
  price: { type: Number, required: true },
  qty:   { type: Number, required: true }
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation"
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  // "dine-in" invoices always have a tableId/tableNumber. "takeout"
  // invoices don't — they're identified by orderNumber instead.
  orderType: {
    type: String,
    enum: ["dine-in", "takeout"],
    default: "dine-in"
  },
  orderNumber: {
    type: String,
    default: ""
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: function () { return this.orderType === "dine-in" }
  },
  tableNumber: {
    type: Number,
    required: function () { return this.orderType === "dine-in" }
  },
  guestName: {
    type: String,
    default: "Guest"
  },
  guestPhone: {
    type: String,
    default: ""
  },
  // Party size at the moment of billing. Only populated for invoices
  // generated after this field was added — older invoices will show
  // null here since Table.guestCount gets overwritten on every reseating
  // and was never snapshotted before now.
  partySize: {
    type: Number,
    default: null
  },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  serviceCharge: { type: Number, required: true },
  // The rate actually applied, snapshotted — same reasoning as
  // cgstRate/sgstRate. Deriving this later as serviceCharge÷subtotal
  // breaks the instant a repeat-customer discount changes what subtotal
  // the charge was actually computed against.
  serviceChargePercent: { type: Number, default: 0 },
  packagingFee: { type: Number, default: 0 },
  // gst stays as the combined total (used in bill math elsewhere);
  // cgst/sgst/cgstRate/sgstRate are the actual applied split, snapshotted
  // at generation time so the receipt never has to guess or re-derive a
  // percentage from amounts later — and so CGST and SGST can genuinely
  // differ if they're ever configured that way.
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  gst: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  // Snapshotted at generation time from the Reservation's own `source`
  // field, instead of being re-guessed later from whether a
  // reservationId happens to exist — a walk-in seated from the Guest
  // Queue also gets a Reservation record (for table-assignment
  // bookkeeping), so "has a reservationId" was never a safe proxy for
  // "was actually booked in advance."
  orderSource: { type: String, enum: ["Reservation", "Walk-in", "Takeout"], default: "Walk-in" },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid"
  },
  paymentMethod: {
    type: String,
    default: "—"
  },
  generatedBy: {
    type: String,
    default: "Floor Manager"
  }
}, { timestamps: true })

export default mongoose.model("Invoice", invoiceSchema)