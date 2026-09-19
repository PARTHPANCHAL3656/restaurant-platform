// Run once per deployment: node src/scripts/seedOwner.js
// Requires OWNER_SEED_USERNAME and OWNER_SEED_PASSWORD set in the environment
// (Render dashboard env vars, or a local .env for testing).
import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"

async function seed() {
  const username = process.env.OWNER_SEED_USERNAME
  const password = process.env.OWNER_SEED_PASSWORD

  if (!username || !password) {
    console.error("Set OWNER_SEED_USERNAME and OWNER_SEED_PASSWORD before running this script.")
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const existing = await Staff.findOne({ role: "OWNER" })
  if (existing) {
    console.log(`An OWNER account already exists (${existing.username}). Nothing done.`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await Staff.create({
    username: username.trim().toLowerCase(),
    passwordHash,
    name: "Owner",
    role: "OWNER"
  })

  console.log(`Owner account created: ${owner.username}`)
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})