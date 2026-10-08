import mongoose from "mongoose"

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true   // 6 or 10
  },
  status: {
    type: String,
    enum: ["available", "occupied", "reserved", "cleaning"],
    default: "available"
  },
  // Set when staff assigns a table — cleared on free
  currentSessionId: {
    type: String,
    default: null
  },
  // Points to the active Order document
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },
  guestName: {
    type: String,
    default: ""
  },
  arrivalTime: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    default: ""
  },
  waiter: {
    type: String,
    default: "Rahul Sharma"
  },
  guestCount: {
    type: Number,
    default: 0
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation",
    default: null
  },
  qrDataUrl: {
    type: String,
    default: ""
  },
  token: {
    type: String,
    default: ""
  },
  // Set when this table's bill is marked paid; the server sweeper releases
  // the table at this time if staff haven't done it first. Cleared on every
  // release. Stored in the database so a server restart or a Render wake-up
  // from sleep doesn't forget it.
  autoReleaseAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

export default mongoose.model("Table", tableSchema)