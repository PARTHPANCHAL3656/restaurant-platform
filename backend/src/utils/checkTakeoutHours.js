// Mirrors the same day-range/time parsing logic used on the frontend
// (TakeoutStartPage.jsx) so "are we open for takeout right now" can never
// disagree between what the customer's browser checked and what the
// server actually allows. The frontend check alone was bypassable by
// hitting the API directly.
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function parseDayRange(daysStr) {
  const parts = daysStr.split("-").map(s => s.trim())
  if (parts.length === 1) {
    const idx = DAY_NAMES.indexOf(parts[0])
    return idx === -1 ? [] : [idx]
  }
  const startIdx = DAY_NAMES.indexOf(parts[0])
  const endIdx = DAY_NAMES.indexOf(parts[1])
  if (startIdx === -1 || endIdx === -1) return []
  const result = []
  let i = startIdx
  while (true) {
    result.push(i)
    if (i === endIdx) break
    i = (i + 1) % 7
  }
  return result
}

function parseTimeToday(timeStr) {
  const match = timeStr && timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return null
  let [, h, m, meridiem] = match
  h = parseInt(h, 10)
  if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12
  if (meridiem.toUpperCase() === "AM" && h === 12) h = 0
  const d = new Date()
  d.setHours(h, parseInt(m, 10), 0, 0)
  return d
}

function getTodaysHours(openingHours) {
  const today = new Date().getDay()
  for (const entry of openingHours || []) {
    if (parseDayRange(entry.days).includes(today)) {
      const [openPart, closePart] = entry.hours.split("-").map(s => s.trim())
      return { open: parseTimeToday(openPart), close: parseTimeToday(closePart) }
    }
  }
  return null
}

// Last pickup slot is 30 minutes before actual closing — same cutoff the
// frontend picker enforces, kept here so the two can't drift apart.
export function isOpenForTakeout(openingHours) {
  const todaysHours = getTodaysHours(openingHours)
  if (!todaysHours || !todaysHours.open || !todaysHours.close) return false

  const now = new Date()
  const lastPickup = new Date(todaysHours.close.getTime() - 30 * 60000)

  return now >= todaysHours.open && now <= lastPickup
}