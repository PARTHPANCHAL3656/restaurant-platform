import Settings from "../models/Settings.js"
import { describeFieldChanges, describeOpeningHoursChanges } from "../utils/describeSettingsChanges.js"

const MAX_AUDIT_LOG_ENTRIES = 50

// GET /api/settings
// Public — the customer-facing takeout page needs opening hours without
// being logged in, and the guest bill/landing page need brand, contact,
// GSTIN/FSSAI and ordering links too. Nothing in this document is
// sensitive (no staff credentials live here), so one endpoint serves
// both guests and staff.
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton()
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/settings
// Route already requires OWNER or MANAGER (see routes/settings.js). But
// legal/contact/billing info feeds straight onto every tax invoice, so
// only OWNER may touch those three sections — a MANAGER can still
// update opening hours and the Zomato/Swiggy links, which carry no
// compliance risk if they get it wrong.
export const updateSettings = async (req, res) => {
  try {
    const { openingHours, legal, contact, billing, links } = req.body

    if ((legal || contact || billing) && req.staff.role !== "OWNER") {
      return res.status(403).json({ error: "Only the Owner can edit business/legal, contact, or billing details." })
    }

    if (openingHours && !Array.isArray(openingHours)) {
      return res.status(400).json({ error: "openingHours must be an array." })
    }
    if (openingHours) {
      for (const entry of openingHours) {
        if (!entry.days || !entry.hours) {
          return res.status(400).json({ error: "Each opening hours entry needs both days and hours." })
        }
      }
    }

    const settings = await Settings.getSingleton()
    // Snapshot taken before anything is overwritten, so every diff below
    // compares against what was actually in the database a moment ago.
    const before = settings.toObject()

    const auditEntries = []
    const recordChange = (section, changes) => {
      if (changes.length) {
        auditEntries.push({
          section,
          updatedBy: req.staff.name,
          role: req.staff.role,
          changes,
          timestamp: new Date()
        })
      }
    }

    if (openingHours) {
      recordChange("openingHours", describeOpeningHoursChanges(before.openingHours, openingHours))
      settings.openingHours = openingHours
    }
    // Merged field-by-field, not replaced wholesale — sending just
    // { legal: { gstin: "..." } } updates only the GSTIN and leaves
    // name/tagline/address/fssai untouched. openingHours stays a full
    // replace above since it's a list, not a field bag.
    if (legal) {
      recordChange("legal", describeFieldChanges(before.legal, legal))
      settings.legal = { ...settings.legal.toObject(), ...legal }
    }
    if (contact) {
      recordChange("contact", describeFieldChanges(before.contact, contact))
      settings.contact = { ...settings.contact.toObject(), ...contact }
    }
    if (billing) {
      recordChange("billing", describeFieldChanges(before.billing, billing))
      settings.billing = { ...settings.billing.toObject(), ...billing }
    }
    if (links) {
      recordChange("links", describeFieldChanges(before.links, links))
      settings.links = { ...settings.links.toObject(), ...links }
    }

    settings.auditLog.push(...auditEntries)
    if (settings.auditLog.length > MAX_AUDIT_LOG_ENTRIES) {
      settings.auditLog = settings.auditLog.slice(-MAX_AUDIT_LOG_ENTRIES)
    }

    await settings.save()

    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}