// Keeps only the digits of whatever was typed or pasted. Indian mobile numbers
// never start with 0, so leading zeros ("09876...", "0091 98765...") are
// dropped, and a pasted "+91 98765 43210" loses its country code.
// Capped at 10 digits. Same rule the takeout page and the server use.
export function cleanPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}