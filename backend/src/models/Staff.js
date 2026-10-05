import mongoose from "mongoose"

const staffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  // Permission level — drives what routes/pages this account can reach.
  role: { type: String, enum: ["OWNER", "MANAGER", "STAFF"], required: true },
  // Job function — purely a record-keeping label (Cook, Waiter, Cashier,
  // Cleaning, etc.), printed nowhere, unrelated to permissions. A STAFF
  // role account and a MANAGER account can both be "Waiter" or "Cook";
  // this field answers "what do they actually do," role answers "what
  // can they access."
  jobTitle: { type: String, default: "", trim: true },
  active: { type: Boolean, default: true },
  // Bumped whenever the password is reset. Every issued JWT carries the
  // version it was signed with, so a bump instantly invalidates all of
  // that account's existing sessions.
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model("Staff", staffSchema)