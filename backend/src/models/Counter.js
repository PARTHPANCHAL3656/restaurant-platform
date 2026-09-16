import mongoose from "mongoose"
 
// A tiny, standard MongoDB auto-increment pattern. findOneAndUpdate's $inc
// is atomic at the document level, so two requests landing at the same
// instant (e.g. two tables both starting a session, or a dine-in order and
// a takeout order created seconds apart) can never be handed the same
// number - unlike `Model.countDocuments() + 1`, which reads-then-computes
// and can hand out the same "next" number to both if neither has saved yet.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
})
 
export default mongoose.model("Counter", counterSchema)
