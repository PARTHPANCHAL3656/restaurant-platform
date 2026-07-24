// Formats a number as a whole-rupee amount with Indian digit grouping.
// Rupees don't carry paise in everyday menu/invoice display the way
// dollars carry cents, so this rounds instead of showing decimals.
// e.g. formatINR(1450) -> "₹1,450"   formatINR(38000.75) -> "₹38,001"
export const formatINR = (amount) => `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`