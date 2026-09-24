export function calculateBill({ items, orderType, billing, isRepeatCustomer = false }) {
  const rawSubtotal = Math.round(items.reduce((sum, i) => sum + i.price * i.qty, 0))
  const isDineIn = orderType !== "takeout"
  const totalGstRate = billing.cgstRate + billing.sgstRate

  let subtotal = rawSubtotal
  let cgst
  let sgst

  if (billing.pricesIncludeGst) {
    subtotal = Math.round(rawSubtotal / (1 + totalGstRate / 100))
    const totalGst = rawSubtotal - subtotal
    cgst = Math.round(totalGst / 2)
    sgst = totalGst - cgst
  }

  // Repeat-customer discount is applied to the subtotal BEFORE service
  // charge and GST — this is the legally correct order under Indian GST
  // law (Sec 15(3), CGST Act): a discount known and recorded on the
  // invoice at the time of supply reduces the taxable value itself,
  // rather than being a rebate bolted on after tax. It also means the
  // customer's actual tax goes down too, not just the sticker price.
  const discountEligible = billing.repeatCustomerDiscountEnabled && isRepeatCustomer
  const discount = discountEligible
    ? Math.round(subtotal * (billing.repeatCustomerDiscountPercent / 100))
    : 0
  const netSubtotal = subtotal - discount

  const serviceCharge = (billing.serviceChargeEnabled && isDineIn)
    ? Math.round(netSubtotal * (billing.serviceChargePercent / 100))
    : 0

  const packagingFee = (billing.packagingFeeEnabled && orderType === "takeout")
    ? billing.packagingFeeAmount
    : 0

  if (!billing.pricesIncludeGst) {
    const taxableValue = billing.serviceChargeTaxable ? netSubtotal + serviceCharge : netSubtotal
    cgst = Math.round(taxableValue * (billing.cgstRate / 100))
    sgst = Math.round(taxableValue * (billing.sgstRate / 100))
  }

  const gst = cgst + sgst
  const total = Math.round(netSubtotal + serviceCharge + packagingFee + gst)

  return {
    subtotal, discount, serviceCharge, packagingFee,
    cgst, sgst, gst,
    cgstRate: billing.cgstRate, sgstRate: billing.sgstRate,
    total
  }
}