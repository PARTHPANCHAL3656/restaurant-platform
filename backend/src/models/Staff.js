import mongoose from "mongoose"

const staffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["OWNER", "MANAGER", "STAFF"], required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model("Staff", staffSchema)