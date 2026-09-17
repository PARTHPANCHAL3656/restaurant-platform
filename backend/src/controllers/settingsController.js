import Settings from "../models/Settings.js"

// GET /api/settings
// Public — the customer-facing takeout page needs opening hours without
// being logged in, to know when pickup slots stop being offered.
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton()
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/settings
// Staff-only. Lets an owner/manager update opening hours themselves
// without needing a developer to change and redeploy source code.
export const updateSettings = async (req, res) => {
  try {
    const { openingHours } = req.body

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
    await settings.save()

    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}