import Settings from "../models/Settings.js"

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
// legal/contact info feeds straight onto every tax invoice, so only
// OWNER may touch those two sections — a MANAGER can still update
// opening hours and the Zomato/Swiggy links, which carry no compliance
// risk if they get it wrong.
export const updateSettings = async (req, res) => {
  try {
    const { openingHours, legal, contact, links } = req.body

    if ((legal || contact) && req.staff.role !== "OWNER") {
      return res.status(403).json({ error: "Only the Owner can edit business/legal or contact details." })
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
    if (openingHours) settings.openingHours = openingHours
    if (legal) settings.legal = legal
    if (contact) settings.contact = contact
    if (links) settings.links = links
    await settings.save()

    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}