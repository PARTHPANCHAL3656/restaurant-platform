import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"

// A password-reset path that needs no paid Render feature (Shell is a
// paid add-on) and adds no new public HTTP endpoint — zero new attack
// surface. To use it: log into Render's dashboard (free, your own
// account) -> this service -> Environment tab -> add
// EMERGENCY_RESET_USERNAME and EMERGENCY_RESET_PASSWORD -> save (Render
// redeploys automatically on an env var change). The app checks for
// these two variables once, right after it starts, resets that one
// account's password if both are present, and logs the result.
// Afterward, remove both variables from Render's Environment tab —
// otherwise every future restart resets the same password again.
export async function runEmergencyPasswordResetIfConfigured() {
  const username = process.env.EMERGENCY_RESET_USERNAME
  const password = process.env.EMERGENCY_RESET_PASSWORD

  if (!username || !password) return

  if (password.length < 8) {
    console.error("[emergency-reset] EMERGENCY_RESET_PASSWORD must be at least 8 characters — skipped.")
    return
  }

  try {
    const staff = await Staff.findOne({ username: username.trim().toLowerCase() })
    if (!staff) {
      console.error(`[emergency-reset] No staff account found with username "${username}" — skipped.`)
      return
    }

    staff.passwordHash = await bcrypt.hash(password, 10)
    await staff.save()

    console.log(`[emergency-reset] Password reset for "${staff.username}" (${staff.role}). Remove EMERGENCY_RESET_USERNAME/EMERGENCY_RESET_PASSWORD from Render's Environment tab now.`)
  } catch (err) {
    console.error("[emergency-reset] Failed:", err.message)
  }
}