import crypto from "crypto"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"
import { logStaffChange, revokeStaffSockets } from "./staffController.js"
// A real bcrypt hash of a throwaway string. Login compares against it when the
// username doesn't exist, so every attempt costs the same ~70ms and response
// time can't reveal which usernames are real.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10)

// POST /api/auth/login
// Staff enters username + password → gets JWT to use on all protected routes
export const staffLogin = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." })
    }
    // Strings only — a JSON body like {"username": {"$gt": ""}} must never
    // reach the database query.
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Username and password are required." })
    }

    const staff = await Staff.findOne({ username: username.trim().toLowerCase() })

    const match = await bcrypt.compare(password, staff ? staff.passwordHash : DUMMY_HASH)
    if (!staff || !staff.active || !match) {
      return res.status(401).json({ error: "Incorrect username or password." })
    }

    const token = jwt.sign(
      { staffId: staff._id, username: staff.username, name: staff.name, role: staff.role, tv: staff.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "12h", algorithm: "HS256" }
    )

    res.json({ token, name: staff.name, role: staff.role })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/auth/change-password
// Any signed-in account can change its own password. The current password is
// required so a stolen or left-open session can't quietly lock the real owner
// out. A wrong current password answers 400, not 401/403 — the frontend treats
// those as "session expired" / "permission denied" and would react wrongly.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Current and new password are required." })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." })
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "New password must be different from the current one." })
    }

    const staff = await Staff.findById(req.staff.staffId)
    if (!staff || !staff.active) {
      return res.status(401).json({ error: "Session is no longer valid. Please sign in again." })
    }

    const match = await bcrypt.compare(currentPassword, staff.passwordHash)
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect." })
    }

    staff.passwordHash = await bcrypt.hash(newPassword, 10)
    // Every other session this account has open is now signed out. This one
    // stays alive: it gets a fresh token carrying the new version.
    staff.tokenVersion = (staff.tokenVersion || 0) + 1
    await staff.save()
    revokeStaffSockets(staff._id)

    await logStaffChange(
      { name: staff.name, role: staff.role },
      ["Changed their own password"]
    )

    const token = jwt.sign(
      { staffId: staff._id, username: staff.username, name: staff.name, role: staff.role, tv: staff.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "12h", algorithm: "HS256" }
    )

    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: "Could not change password." })
  }
}

// ---------------------------------------------------------------------------
// Owner recovery codes
// ---------------------------------------------------------------------------
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 32 symbols, no I / O / 0 / 1
const CODE_COUNT = 10

// Hashing: codes carry 80 random bits, so a fast hash is safe — nobody can
// brute-force 2^80 — and it lets the lookup be one database query.
const hashCode = (normalized) =>
  crypto.createHash("sha256").update(normalized).digest("hex")

// Accept whatever a person types off a printout: any case, with or without
// dashes or spaces.
const normalizeCode = (input) =>
  String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "")

// 16 random symbols shown as XXXX-XXXX-XXXX-XXXX. 256 is divisible by 32, so
// masking each random byte to 5 bits picks every symbol equally often.
const makeCode = () => {
  const bytes = crypto.randomBytes(16)
  let out = ""
  for (const b of bytes) out += CODE_ALPHABET[b & 31]
  return out.match(/.{4}/g).join("-")
}

// GET /api/auth/recovery-codes   (Owner only)
// How many unused codes are left — never the codes themselves.
export const getRecoveryStatus = async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff.staffId).select("+recoveryCodes")
    res.json({ remaining: staff?.recoveryCodes?.length || 0 })
  } catch (err) {
    res.status(500).json({ error: "Could not load recovery codes." })
  }
}

// POST /api/auth/recovery-codes   (Owner only, current password required)
// Replaces any existing set. The plain codes are returned this one time and
// never stored. A wrong password answers 400 (not 401/403) so the frontend
// doesn't mistake it for an expired session.
export const generateRecoveryCodes = async (req, res) => {
  try {
    const { currentPassword } = req.body
    if (typeof currentPassword !== "string" || !currentPassword) {
      return res.status(400).json({ error: "Enter your current password to generate codes." })
    }

    const staff = await Staff.findById(req.staff.staffId)
    if (!staff || !staff.active) {
      return res.status(401).json({ error: "Session is no longer valid. Please sign in again." })
    }

    const match = await bcrypt.compare(currentPassword, staff.passwordHash)
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect." })
    }

    const codes = Array.from({ length: CODE_COUNT }, makeCode)
    staff.recoveryCodes = codes.map((c) => hashCode(normalizeCode(c)))
    await staff.save()

    await logStaffChange(
      { name: staff.name, role: staff.role },
      ["Generated a new set of recovery codes"]
    )

    res.json({ codes })
  } catch (err) {
    res.status(500).json({ error: "Could not generate recovery codes." })
  }
}

// POST /api/auth/recover   (PUBLIC — the owner is locked out, so there is no session)
// { username, code, newPassword }. Every failure returns the same message, so
// the form can't be used to find out which usernames exist or which part was
// wrong. Failures are 400 so the frontend doesn't read them as "session expired".
export const recoverAccess = async (req, res) => {
  const fail = () =>
    res.status(400).json({ error: "That username or recovery code isn't valid." })

  try {
    const { username, code, newPassword } = req.body

    if (typeof username !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
      return fail()
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." })
    }

    const normalized = normalizeCode(code)
    if (normalized.length !== 16) return fail()
    const hash = hashCode(normalized)

    const query = {
      username: username.trim().toLowerCase(),
      active: true,
      role: "OWNER",
      recoveryCodes: hash
    }

    // Cheap check first, so wrong guesses never cost a bcrypt hash.
    if (!(await Staff.exists(query))) return fail()

    const passwordHash = await bcrypt.hash(newPassword, 10)

    // One atomic step: the code is burned in the same write that resets the
    // password, so a code can never be used twice, even by two requests at once.
    const staff = await Staff.findOneAndUpdate(
      query,
      {
        $set: { passwordHash },
        $pull: { recoveryCodes: hash },
        $inc: { tokenVersion: 1 }
      },
      { new: true }
    ).select("+recoveryCodes")

    if (!staff) return fail()

    revokeStaffSockets(staff._id)

    await logStaffChange(
      { name: staff.name, role: staff.role },
      [`Password reset using a recovery code (${staff.recoveryCodes.length} left)`]
    )

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: "Could not reset access." })
  }
}