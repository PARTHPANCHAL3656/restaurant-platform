import mongoose from "mongoose"

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  tag: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  // Set only for photos uploaded through the staff dashboard (Cloudinary
  // asset id) - lets us delete the actual stored file when the dish is
  // permanently deleted, instead of leaving orphaned images in storage.
  // Demo dishes use static bundled images and never set this.
  imagePublicId: { type: String, default: "" },
  available: { type: Boolean, default: true },
  special: { type: Boolean, default: false },
  foodType: { type: String, default: "Non-Vegetarian" },
  prepTime: { type: String, default: "15 min" },
  spiceLevel: { type: String, default: "Medium" }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      return ret;
    }
  }
})

export default mongoose.model("MenuItem", menuItemSchema)
