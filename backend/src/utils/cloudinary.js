import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Staff-uploaded dish photos arrive as base64 data URIs in the request
// body (the frontend already does this via FileReader - unchanged).
// This uploads that to Cloudinary and returns a real, permanent URL plus
// the asset's public_id (needed later to delete it). Demo dishes use a
// plain filename string ("hara-bhara-kebab.webp") which is NOT a data
// URI, so this is a no-op for them - they keep using the static bundled
// asset pipeline exactly as before.
export const uploadMenuImageIfNeeded = async (imageValue) => {
  if (!imageValue || !imageValue.startsWith("data:")) {
    return { image: imageValue, imagePublicId: "" }
  }

  const result = await cloudinary.uploader.upload(imageValue, {
    folder: "spice-garden/menu",
    // Cap the stored master at 1600px wide - plenty for any card/hero use
    // on this site, keeps storage/bandwidth down without any visible loss
    // for how these are ever displayed.
    transformation: [{ width: 1600, crop: "limit" }]
  })

  return { image: result.secure_url, imagePublicId: result.public_id }
}

// Called when a dish with an uploaded (non-demo) photo is permanently
// deleted, so its image doesn't sit in Cloudinary storage forever.
// Never throws - a failed cleanup shouldn't block the actual delete.
export const deleteMenuImageIfOwned = async (publicId) => {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    console.error("Cloudinary cleanup failed for", publicId, err.message)
  }
}