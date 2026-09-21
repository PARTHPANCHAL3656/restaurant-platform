import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"

const VALID_ROLES = ["OWNER", "MANAGER", "STAFF"]

// GET /api/staff
// Owner-only. Never returns passwordHash.
export const listStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select("-passwordHash").sort({ createdAt: 1 })
    res.json(staff)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/staff
// Owner-only. This is the UI replacement for running seedStaff.js from
// Render's shell console.
export const createStaff = async (req, res) => {
  try {
    const { username, password, name, role } = req.body

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: "Username, password, name, and role are all required." })
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Role must be OWNER, MANAGER, or STAFF." })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." })
    }

    const existing = await Staff.findOne({ username: username.trim().toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: "That username is already taken." })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const staff = await Staff.create({
      username: username.trim().toLowerCase(),
      passwordHash,
      name,
      role
    })

    const { passwordHash: _omit, ...safeStaff } = staff.toObject()
    res.status(201).json(safeStaff)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/staff/:id
// Owner-only. Changes role and/or active status. An Owner can never edit
// their own account through this endpoint — self role-changes and
// self-deactivation are exactly how an Owner locks themselves out, so
// it's blocked outright rather than partially allowed.
export const updateStaff = async (req, res) => {
  try {
    if (req.params.id === req.staff.staffId) {
      return res.status(400).json({ error: "You can't edit your own account here." })
    }

    const { role, active } = req.body
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Role must be OWNER, MANAGER, or STAFF." })
    }

    const staff = await Staff.findById(req.params.id)
    if (!staff) return res.status(404).json({ error: "Staff account not found." })

    // Guard against removing the last active Owner — if this account is
    // the only active OWNER, block anything that would leave zero
    // Owners able to log in.
    const wouldLoseOwnerStatus =
      (role && role !== "OWNER" && staff.role === "OWNER") ||
      (active === false && staff.role === "OWNER")
    if (wouldLoseOwnerStatus) {
      const ownerCount = await Staff.countDocuments({ role: "OWNER", active: true })
      if (ownerCount <= 1) {
        return res.status(400).json({ error: "Can't do that — this is the last active Owner account." })
      }
    }

    if (role) staff.role = role
    if (typeof active === "boolean") staff.active = active
    await staff.save()

    const { passwordHash: _omit, ...safeStaff } = staff.toObject()
    res.json(safeStaff)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/staff/:id/password
// Owner-only. Resets another staff member's password for when they
// forget it — there's no self-serve reset flow, so this is the only way.
export const resetStaffPassword = async (req, res) => {
  try {
    if (req.params.id === req.staff.staffId) {
      return res.status(400).json({ error: "You can't reset your own password here." })
    }

    const { password } = req.body
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." })
    }

    const staff = await Staff.findById(req.params.id)
    if (!staff) return res.status(404).json({ error: "Staff account not found." })

    staff.passwordHash = await bcrypt.hash(password, 10)
    await staff.save()

    res.json({ message: "Password reset." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}