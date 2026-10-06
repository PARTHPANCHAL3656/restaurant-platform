import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"
import { logStaffChange } from "../controllers/staffController.js"

// A password-reset path that needs no paid Render feature (Shell is a
// paid add-on) and adds no new public HTTP endpoint — zero new attack
// surface. To use it: log into Render's dashboard (free, your own
// account) -> this service -> Environment tab -> add
// EMERGENCY_RESET_USERNAME, EMERGENCY_RESET_PASSWORD (12+ characters) and
// EMERGENCY_RESET_EXPIRES (tomorrow's date, YYYY-MM-DD) -> save (Render
// redeploys automatically on an env var change). The app checks for
// these variables once, right after it starts, resets that one account's
// password (and reactivates it) if all three are present and the date
// hasn't passed, and records it in Recent Changes.
// Afterward, remove all three variables from Render's Environment tab.
// The expiry date means a forgotten variable goes dead on its own.
export async function runEmergencyPasswordResetIfConfigured() {
  const username = process.env.EMERGENCY_RESET_USERNAME
  const password = process.env.EMERGENCY_RESET_PASSWORD

  if (!username || !password) return

  if (password.length < 12) {
    console.error("[emergency-reset] EMERGENCY_RESET_PASSWORD must be at least 12 characters — skipped.")
    return
  }

  // A forgotten variable must not keep resetting the password on every
  // restart: the reset only runs while EMERGENCY_RESET_EXPIRES hasn't passed.
  const expires = process.env.EMERGENCY_RESET_EXPIRES
  const expiresAt = expires ? new Date(`${expires.trim()}T23:59:59Z`) : null
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
    console.error("[emergency-reset] EMERGENCY_RESET_EXPIRES is missing, malformed or already past (expected YYYY-MM-DD) — skipped. Remove the EMERGENCY_RESET_* variables from Render.")
    return
  }

  try {
    const staff = await Staff.findOne({ username: username.trim().toLowerCase() })
    if (!staff) {
      console.error(`[emergency-reset] No staff account found with username "${username}" — skipped.`)
      return
    }

    staff.passwordHash = await bcrypt.hash(password, 10)
    // Sign out every session this account already has open.
    staff.tokenVersion = (staff.tokenVersion || 0) + 1
    // Also reactivate it — a locked-out owner may have been deactivated.
    staff.active = true
    await staff.save()

    // Leave a trace in Recent Changes so a reset done through the server
    // environment is never invisible to the owners.
    await logStaffChange(
      { name: staff.name, role: staff.role },
      ["Password reset through the server's emergency reset"]
    )

    console.log(`[emergency-reset] Password reset for "${staff.username}" (${staff.role}). Remove EMERGENCY_RESET_USERNAME/EMERGENCY_RESET_PASSWORD from Render's Environment tab now.`)
  } catch (err) {
    console.error("[emergency-reset] Failed:", err.message)
  }
}