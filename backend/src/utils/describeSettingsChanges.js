// Turns an old/new pair for a flat settings section (legal, contact,
// billing, links) into human-readable change lines for the audit log.
// Only compares top-level keys present in `after` — there are no
// nested objects left in any of these sections to worry about (socials
// moved out of `contact` into `links` a few rounds back).
export function describeFieldChanges(before, after) {
  const changes = []
  for (const key of Object.keys(after)) {
    const oldValue = before ? before[key] : undefined
    const newValue = after[key]
    if (oldValue !== newValue) {
      changes.push(`${key} changed from "${formatValue(oldValue)}" to "${formatValue(newValue)}"`)
    }
  }
  return changes
}

// Same idea for openingHours, which is a list, not a flat field bag —
// diffs row by row so a change reads like `"Monday - Thursday" hours
// changed from 12:00 PM - 10:30 PM to 9:00 AM - 10:00 PM` instead of
// just "openingHours was updated."
export function describeOpeningHoursChanges(before, after) {
  const changes = []
  const maxLen = Math.max(before.length, after.length)
  for (let i = 0; i < maxLen; i++) {
    const oldEntry = before[i]
    const newEntry = after[i]
    if (!oldEntry && newEntry) {
      changes.push(`Added "${newEntry.days}": ${newEntry.hours}`)
    } else if (oldEntry && !newEntry) {
      changes.push(`Removed "${oldEntry.days}" (was ${oldEntry.hours})`)
    } else if (oldEntry.days !== newEntry.days || oldEntry.hours !== newEntry.hours) {
      const label = oldEntry.days === newEntry.days ? oldEntry.days : `${oldEntry.days} → ${newEntry.days}`
      if (oldEntry.hours !== newEntry.hours) {
        changes.push(`"${label}" hours changed from ${oldEntry.hours} to ${newEntry.hours}`)
      } else {
        changes.push(`Renamed "${oldEntry.days}" to "${newEntry.days}"`)
      }
    }
  }
  return changes
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "(empty)"
  if (typeof value === "boolean") return value ? "on" : "off"
  return String(value)
}