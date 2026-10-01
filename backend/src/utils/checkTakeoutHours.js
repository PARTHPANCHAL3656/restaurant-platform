// Mirrors the same day-range/time parsing logic used on the frontend
// (TakeoutStartPage.jsx) so "are we open for takeout right now" can never
// disagree between what the customer's browser checked and what the
// server actually allows. The frontend check alone was bypassable by
// hitting the API directly.
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// The opening hours in Settings are written in the restaurant's local time.
// The server (Render) runs in UTC, so "now" must be read in the restaurant's
// timezone - never from the server's own clock.
const RESTAURANT_TZ = process.env.RESTAURANT_TIMEZONE || "Asia/Kolkata"

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

// "10:30 PM" -> minutes since midnight (1350), or null if it doesn't parse.
function parseMinutes(timeStr) {
  const match = timeStr && timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return null
  let [, h, m, meridiem] = match
  h = parseInt(h, 10)
  if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12
  if (meridiem.toUpperCase() === "AM" && h === 12) h = 0
  return h * 60 + parseInt(m, 10)
}

// Weekday (0 = Sunday) and minutes since midnight, as the restaurant sees them.
function nowInRestaurantTime(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TZ,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date)
  const get = (type) => parts.find(p => p.type === type).value
  return {
    day: DAY_NAMES.indexOf(get("weekday")),
    minutes: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10)
  }
}

function getTodaysHours(openingHours, day) {
  for (const entry of openingHours || []) {
    if (parseDayRange(entry.days).includes(day)) {
      const [openPart, closePart] = entry.hours.split("-").map(s => s.trim())
      return { open: parseMinutes(openPart), close: parseMinutes(closePart) }
    }
  }
  return null
}

// Last pickup slot is 30 minutes before actual closing - same cutoff the
// frontend picker enforces, kept here so the two can't drift apart.
// `now` is only a parameter so this can be tested at a fixed moment.
export function isOpenForTakeout(openingHours, now = new Date()) {
  const { day, minutes } = nowInRestaurantTime(now)
  const todaysHours = getTodaysHours(openingHours, day)
  if (!todaysHours || todaysHours.open === null || todaysHours.close === null) return false

  const lastPickup = todaysHours.close - 30

  return minutes >= todaysHours.open && minutes <= lastPickup
}

// 810 -> "1:30 PM"
function formatMinutes(total) {
  const h24 = Math.floor(total / 60) % 24
  const m = total % 60
  return `${((h24 + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`
}

// Validates a takeout request against today's pickup window and returns
// null when it's fine, or the message to show the customer.
//   - "ASAP" needs the restaurant to be open right now.
//   - A specific time ("1:30 PM") can be ordered ahead at ANY hour, as long
//     as that time falls inside today's pickup window and hasn't passed yet.
// Last pickup is 30 minutes before closing, same as the frontend picker.
export function checkPickupTime(openingHours, pickupTime, now = new Date()) {
  const { day, minutes } = nowInRestaurantTime(now)
  const todaysHours = getTodaysHours(openingHours, day)
  if (!todaysHours || todaysHours.open === null || todaysHours.close === null) {
    return "We couldn't confirm today's hours. Please call the restaurant to place a takeout order."
  }

  const lastPickup = todaysHours.close - 30
  const window = `${formatMinutes(todaysHours.open)} - ${formatMinutes(lastPickup)}`

  if (minutes > lastPickup) {
    return `We've stopped taking pickup orders for today. Pickup hours are ${window}.`
  }

  if (!pickupTime || pickupTime === "ASAP") {
    return minutes >= todaysHours.open
      ? null
      : `We're not open yet. Choose a pickup time between ${window} to order ahead.`
  }

  const wanted = parseMinutes(pickupTime)
  if (wanted === null) return "That pickup time isn't valid. Please choose another time."
  if (wanted < todaysHours.open || wanted > lastPickup) {
    return `Pickup times today run ${window}. Please choose a time in that window.`
  }
  if (wanted < minutes) return "That time has already passed today. Please choose a later time."

  return null
}