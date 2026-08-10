import mongoose from "mongoose"

const invoiceItemSchema = new mongoose.Schema({
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
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true
  },
  tableNumber: {
    type: Number,
    required: true
  },
  guestName: {
    type: String,
    default: "Guest"
  },
  guestPhone: {
    type: String,
    default: ""
  },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  serviceCharge: { type: Number, required: true },
  gst: { type: Number, required: true },
  discount: { type: Number, default: 0 },
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