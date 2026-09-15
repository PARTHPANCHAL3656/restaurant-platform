import express from "express"
import staffAuth from "../middleware/auth.js"
import tableSession from "../middleware/tableSession.js"
import {
  getAllInvoices,
  getMyInvoice,
  updateInvoiceStatus,
  generateInvoiceForTable,
  deleteInvoice
} from "../controllers/invoiceController.js"

const router = express.Router()

// Customer route — needs valid table QR token, scoped to their own session
router.get("/my-invoice", tableSession, getMyInvoice)

// Staff routes
router.get("/", staffAuth, getAllInvoices)
router.post("/table/:id", staffAuth, generateInvoiceForTable)
router.patch("/:id", staffAuth, updateInvoiceStatus)
router.delete("/:id", staffAuth, deleteInvoice)
export default router