// Replaces an empty/whitespace-only value in any of `requiredKeys` with
// the corresponding value from `previous` (the last value actually
// saved) — so a required field can never be saved blank. Keys not
// listed are left exactly as typed, even if empty, since some fields
// (WhatsApp number, social links) are meant to be clearable.
export function fillEmptyFields(form, previous, requiredKeys) {
  const result = { ...form };
  for (const key of requiredKeys) {
    if (typeof result[key] === 'string' && result[key].trim() === '') {
      result[key] = previous[key];
    }
  }
  return result;
}