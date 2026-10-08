import express from "express"
import staffAuth from "../middleware/auth.js"
import tableSession, { invoiceLookupSession } from "../middleware/tableSession.js"
import { requireRole } from "../middleware/roleCheck.js"
import {
  getAllInvoices,
  getMyInvoice,
  getMyBillPreview,
  updateInvoiceStatus,
  generateInvoiceForTable,
  deleteInvoice,
  markReceiptDownloaded
} from "../controllers/invoiceController.js"

const router = express.Router()

// Customer routes — need a valid QR/session token.
// my-invoice uses the relaxed check: viewing an already-generated invoice
// must keep working even after staff releases the table or marks a
// takeout order served, which can happen within seconds of the bill
// being presented. my-bill-preview keeps the strict check — there's
// nothing meaningful to estimate for an order that's already finished.
router.get("/my-invoice", invoiceLookupSession, getMyInvoice)
router.get("/my-bill-preview", tableSession, getMyBillPreview)
// Same relaxed check as my-invoice: this must keep working after the table
// is released, since the guest may download their receipt after that.
router.post("/my-invoice/receipt-downloaded", invoiceLookupSession, markReceiptDownloaded)

// Staff routes
router.get("/", staffAuth, requireRole("OWNER", "MANAGER"), getAllInvoices)
router.post("/table/:id", staffAuth, generateInvoiceForTable)
router.patch("/:id", staffAuth, requireRole("OWNER", "MANAGER"), updateInvoiceStatus)
router.delete("/:id", staffAuth, requireRole("OWNER"), deleteInvoice)
export default router