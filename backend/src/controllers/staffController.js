import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"
import Settings from "../models/Settings.js"
import { io } from "../index.js"

const VALID_ROLES = ["OWNER", "MANAGER", "STAFF"]
const MAX_AUDIT_LOG_ENTRIES = 50

// Reuses the same Recent Changes log the Settings pages write to, so
// there's one unified audit trail instead of a second one staff has to
// know to look in a different place for. Never call this with the
// actual password value — only ever the fact that a reset happened.
async function logStaffChange(actor, changes) {
  if (!changes.length) return
  const settings = await Settings.getSingleton()
  settings.auditLog.push({
    section: "staff",
    updatedBy: actor.name,
    role: actor.role,
    changes,
    timestamp: new Date()
  })
  if (settings.auditLog.length > MAX_AUDIT_LOG_ENTRIES) {
    settings.auditLog = settings.auditLog.slice(-MAX_AUDIT_LOG_ENTRIES)
  }
  await settings.save()
  io.emit("settings:updated")
}

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
    const { username, password, name, role, jobTitle } = req.body

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
      role,
      jobTitle: jobTitle || ""
    })

    await logStaffChange(req.staff, [
      `Created account "${staff.username}" — ${name} (${role}${jobTitle ? ", " + jobTitle : ""})`
    ])

    const { passwordHash: _omit, ...safeStaff } = staff.toObject()
    res.status(201).json(safeStaff)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/staff/:id
// Owner-only. Role and active status can never be changed on your own
// account here — that's exactly how an Owner locks themselves out.
// name/jobTitle ARE allowed on your own account — renaming yourself or
// fixing your own job title carries no security risk, and this is the
// only way to fix an account whose name was set wrong at creation
// (e.g. seeded as "Owner" instead of an actual name).
export const updateStaff = async (req, res) => {
  try {
    const { role, active, name, jobTitle } = req.body
    const isSelf = req.params.id === req.staff.staffId

    if (isSelf && (role !== undefined || active !== undefined)) {
      return res.status(400).json({ error: "You can't change your own role or active status here." })
    }
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

    const changes = []
    const oldName = staff.name
    if (name && name !== staff.name) {
      changes.push(`${oldName}'s name changed to "${name}"`)
      staff.name = name
    }
    if (jobTitle !== undefined && jobTitle !== staff.jobTitle) {
      changes.push(`${staff.name}'s job title changed from "${staff.jobTitle || "none"}" to "${jobTitle || "none"}"`)
      staff.jobTitle = jobTitle
    }
    if (role && role !== staff.role) {
      changes.push(`${staff.name}'s role changed from ${staff.role} to ${role}`)
      staff.role = role
    }
    if (typeof active === "boolean" && active !== staff.active) {
      changes.push(`${staff.name} ${active ? "reactivated" : "deactivated"}`)
      staff.active = active
    }

    await staff.save()
    await logStaffChange(req.staff, changes)

    const { passwordHash: _omit, ...safeStaff } = staff.toObject()
    res.json(safeStaff)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/staff/:id
// Owner-only, a real delete (not deactivate). Same guards as updateStaff:
// can't delete yourself, can't delete the last active Owner. Existing
// invoices are unaffected — generatedBy is a name snapshotted at invoice
// time, not a live reference to this document, so deleting a Staff
// record never changes or breaks a past bill.
export const deleteStaff = async (req, res) => {
  try {
    if (req.params.id === req.staff.staffId) {
      return res.status(400).json({ error: "You can't delete your own account." })
    }

    const staff = await Staff.findById(req.params.id)
    if (!staff) return res.status(404).json({ error: "Staff account not found." })

    if (staff.role === "OWNER") {
      const ownerCount = await Staff.countDocuments({ role: "OWNER", active: true })
      if (ownerCount <= 1) {
        return res.status(400).json({ error: "Can't delete the last active Owner account." })
      }
    }

    await Staff.deleteOne({ _id: req.params.id })
    await logStaffChange(req.staff, [`Deleted account "${staff.username}" — ${staff.name} (${staff.role})`])

    res.json({ message: "Account deleted." })
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
    // Logs that a reset happened — never the new password itself.
    await logStaffChange(req.staff, [`Password reset for ${staff.name}`])

    res.json({ message: "Password reset." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}