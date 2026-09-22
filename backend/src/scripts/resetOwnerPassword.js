// Run this from Render's Environment Console (Shell tab) when a staff
// member is locked out and there's nobody else with Owner access able
// to use the in-app password reset (Staff Accounts settings page) —
// most importantly, when the ONLY Owner forgets their own password.
//
//   RESET_USERNAME=owner RESET_PASSWORD="NewStrongPass123!" node src/scripts/resetOwnerPassword.js
//
// Works for any staff account by username, not just OWNER — no reason
// to restrict it further since running this at all already requires
// trusted access to the Render dashboard.
import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"

async function resetPassword() {
  const username = process.env.RESET_USERNAME
  const password = process.env.RESET_PASSWORD

  if (!username || !password) {
    console.error("Set RESET_USERNAME and RESET_PASSWORD before running this script.")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.")
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const staff = await Staff.findOne({ username: username.trim().toLowerCase() })
  if (!staff) {
    console.error(`No staff account found with username "${username}".`)
    process.exit(1)
  }

  staff.passwordHash = await bcrypt.hash(password, 10)
  await staff.save()

  console.log(`Password reset for ${staff.username} (${staff.role}).`)
  process.exit(0)
}

resetPassword().catch(err => {
  console.error(err)
  process.exit(1)
})