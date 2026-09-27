// Shared reservation-slot math: lead time / advance-window validation
// against the rules an Owner/Manager configures in Settings → Operations
// (settings.reservations — see models/Settings.js).

// Parses a 12-hour slot string ("8:00 PM") into 24-hour {hours, minutes}.
// Returns null if the string doesn't match the expected format.
export function parseTimeSlot(timeStr) {
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec((timeStr || "").trim())
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0

  return { hours, minutes }
}

// Combines a "YYYY-MM-DD" date string and a "8:00 PM" time slot into a
// real Date, interpreted as that wall-clock time in Asia/Kolkata (the
// restaurant is India-only for now — same fixed offset the rest of the
// codebase already assumes for guest-facing time strings).
export function combineDateAndSlot(dateStr, timeStr) {
  const parsedTime = parseTimeSlot(timeStr)
  if (!dateStr || !parsedTime) return null

  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return null

  const utcMs = Date.UTC(year, month - 1, day, parsedTime.hours, parsedTime.minutes) - (5.5 * 60 * 60 * 1000)
  return new Date(utcMs)
}

// Validates a requested reservation slot against the configured booking
// window. Returns { ok: true, requestedAt } or { ok: false, error }.
export function validateBookingWindow(dateStr, timeStr, rules) {
  const requestedAt = combineDateAndSlot(dateStr, timeStr)
  if (!requestedAt) {
    return { ok: false, error: "Invalid date or time slot." }
  }

  const now = new Date()
  const minLeadMs = (rules.resMinLeadTimeHours ?? 0) * 60 * 60 * 1000
  if (requestedAt.getTime() - now.getTime() < minLeadMs) {
    return {
      ok: false,
      error: `Reservations need at least ${rules.resMinLeadTimeHours} hours' notice. Please choose a later time or call us directly for last-minute requests.`
    }
  }

  const maxAdvanceMs = (rules.resMaxAdvanceDays ?? 3650) * 24 * 60 * 60 * 1000
  if (requestedAt.getTime() - now.getTime() > maxAdvanceMs) {
    return {
      ok: false,
      error: `We only take bookings up to ${rules.resMaxAdvanceDays} days in advance.`
    }
  }

  return { ok: true, requestedAt }
}