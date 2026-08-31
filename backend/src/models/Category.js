import mongoose from "mongoose"

// Categories are their own collection now, not just implied by whatever
// string happens to be sitting in MenuItem.category. This is what lets
// staff create an empty category (e.g. "Soups") before adding a single
// dish to it — previously a category only "existed" if at least one item
// already used that exact string.
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  // Controls left-to-right tab order in the staff UI. Not exposed for
  // reordering yet — new categories just go to the end (see controller).
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      return ret;
    }
  }
})

export default mongoose.model("Category", categorySchema)