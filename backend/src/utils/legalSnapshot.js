// The legal / contact details printed in the header and footer of every
// bill. Invoices store this at the moment they're created, so a tax
// invoice always shows the exact GSTIN / FSSAI / SAC it was issued with -
// on the customer's phone and on the staff screen alike - even if Settings
// is edited afterwards, or one screen is holding stale data.
export function legalSnapshotFrom(settings) {
  const legal = (settings && settings.legal) || {}
  const contact = (settings && settings.contact) || {}
  const snapshot = {
    legalBusinessName: legal.legalBusinessName,
    tagline: legal.tagline,
    address: legal.address,
    gstin: legal.gstin,
    fssai: legal.fssai,
    sacCode: legal.sacCode,
    primaryPhone: contact.primaryPhone,
    email: contact.email
  }
  // Never let a missing value overwrite a real one when this is merged
  // over the page's own copy of the restaurant details.
  return Object.fromEntries(Object.entries(snapshot).filter(([, v]) => v !== undefined && v !== null && v !== ""))
}