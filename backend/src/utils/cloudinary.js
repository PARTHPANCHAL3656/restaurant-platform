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

  // Resize is an "incoming" transformation - it actually shrinks the master
  // file Cloudinary stores, which matters for the free tier's credit usage.
  const result = await cloudinary.uploader.upload(imageValue, {
    folder: "spice-garden/menu",
    transformation: [{ width: 1600, crop: "limit" }]
  })

  // fetch_format/quality are DELIVERY-time parameters - Cloudinary decides
  // the actual bytes (WebP/AVIF/JPEG) per request based on what the
  // requesting browser supports, cached at the edge after that. This is
  // why they're built into the URL via cloudinary.url() rather than
  // passed to uploader.upload() above - that's the documented pattern.
  const deliveryUrl = cloudinary.url(result.public_id, {
    secure: true,
    fetch_format: "auto",
    quality: "auto"
  })

  return { image: deliveryUrl, imagePublicId: result.public_id }
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