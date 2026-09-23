// Shared billing math — every place that generates a real invoice must
// call this instead of hardcoding rates, so the numbers can never drift
// out of sync with each other or with what's configured in Settings.
//
// orderType: "dine-in" | "takeout"
// billing: the Settings.billing subdocument (or a plain object with the
//   same shape)
export function calculateBill({ items, orderType, billing }) {
  const rawSubtotal = Math.round(items.reduce((sum, i) => sum + i.price * i.qty, 0))
  const isDineIn = orderType !== "takeout"
  const totalGstRate = billing.cgstRate + billing.sgstRate

  let subtotal = rawSubtotal
  let cgst
  let sgst

  if (billing.pricesIncludeGst) {
    // Menu prices already include GST — back the tax out of the raw
    // total so the invoice can show a proper taxable-value + GST split
    // that still adds back up to the original menu price.
    subtotal = Math.round(rawSubtotal / (1 + totalGstRate / 100))
    const totalGst = rawSubtotal - subtotal
    cgst = Math.round(totalGst / 2)
    sgst = totalGst - cgst // avoids a rupee vanishing to rounding
  }

  const serviceCharge = (billing.serviceChargeEnabled && isDineIn)
    ? Math.round(subtotal * (billing.serviceChargePercent / 100))
    : 0

  const packagingFee = (billing.packagingFeeEnabled && orderType === "takeout")
    ? billing.packagingFeeAmount
    : 0

  if (!billing.pricesIncludeGst) {
    const taxableValue = billing.serviceChargeTaxable ? subtotal + serviceCharge : subtotal
    cgst = Math.round(taxableValue * (billing.cgstRate / 100))
    sgst = Math.round(taxableValue * (billing.sgstRate / 100))
  }

  const gst = cgst + sgst
  const total = Math.round(subtotal + serviceCharge + packagingFee + gst)

  return {
    subtotal, serviceCharge, packagingFee,
    cgst, sgst, gst,
    cgstRate: billing.cgstRate, sgstRate: billing.sgstRate,
    total
  }
}