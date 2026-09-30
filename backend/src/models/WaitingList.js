import mongoose from "mongoose"

const waitingListSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  phone:      { type: String, default: "" },
  partySize:  { type: Number, required: true, min: 1, max: 10 },
  notified:   { type: Boolean, default: false },
  vip:        { type: Boolean, default: false },
  notes:      { type: String, default: "" },
  // "waiting" while in the lobby; removed outright once seated or
  // cancelled rather than kept around in another status — see
  // removeFromWaitingList in tableController.js.
  status:     { type: String, enum: ["waiting"], default: "waiting" }
}, { timestamps: true })

export default mongoose.model("WaitingList", waitingListSchema)