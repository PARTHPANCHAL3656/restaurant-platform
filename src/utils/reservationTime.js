// Reservation time helpers for the staff UI. The restaurant runs on
// Asia/Kolkata wall-clock time, so "today" and "now" are always resolved in
// that zone — a staff laptop with the wrong timezone can't shift what counts
// as "today's" reservations or make a booking look late when it isn't.

const TZ = 'Asia/Kolkata';

// "2026-09-28" for right now in Kolkata.
export function getTodayIST(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: TZ });
}

// "8:00 PM" -> 1200 (minutes since midnight). null if it doesn't parse.
export function slotToMinutes(slot) {
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec((slot || '').trim());
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function nowMinutesIST(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(now);
  const hours = parseInt(parts.find(p => p.type === 'hour').value, 10) % 24;
  const minutes = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return hours * 60 + minutes;
}

// Where a reservation sits relative to right now:
//   'past'   - its date is before today (never resolved by staff)
//   'future' - its date is after today
//   'late'   - today, and more than graceMinutes past its booked time
//   'today'  - today, still within its time or grace window
// minutesLate is only meaningful for 'late' (whole minutes past the booked time).
export function getReservationTiming(reservation, graceMinutes, now = new Date()) {
  const today = getTodayIST(now);
  if (reservation.date < today) return { timing: 'past', minutesLate: 0 };
  if (reservation.date > today) return { timing: 'future', minutesLate: 0 };

  const slot = slotToMinutes(reservation.time);
  if (slot === null) return { timing: 'today', minutesLate: 0 };

  const minutesPast = nowMinutesIST(now) - slot;
  if (minutesPast > graceMinutes) return { timing: 'late', minutesLate: minutesPast };
  return { timing: 'today', minutesLate: 0 };
}

// Minutes between right now and a reservation's booked slot, TODAY only:
// positive = the slot is still ahead (how early it would be to seat them),
// negative = already past it. Returns null for any other date (yesterday,
// tomorrow, etc.) since "early/late" only means something on the day itself.
export function getMinutesUntilSlot(reservation, now = new Date()) {
  if (reservation.date !== getTodayIST(now)) return null;
  const slot = slotToMinutes(reservation.time);
  if (slot === null) return null;
  return slot - nowMinutesIST(now);
}

// Sort key: date first, then booked time of day.
export function compareReservations(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (slotToMinutes(a.time) ?? 0) - (slotToMinutes(b.time) ?? 0);
}