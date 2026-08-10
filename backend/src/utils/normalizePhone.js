// Normalizes a phone number to a bare 10-digit string so the same person
// always maps to the same Customer record, regardless of how the number
// was typed (spaces, dashes, +91 prefix, etc).
// Returns "" if the input doesn't look like a valid 10-digit Indian mobile number.
export function normalizePhone(raw) {
  if (!raw) return ""

  let digits = String(raw).replace(/\D/g, "") // strip everything but digits

  // Strip a leading country code (91) if the number is longer than 10 digits
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }

  if (digits.length !== 10) return ""

  return digits
}