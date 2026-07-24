import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  getAllInvoices,
  updateInvoiceStatus,
  generateInvoiceForTable,
  deleteInvoice
} from "../controllers/invoiceController.js"

const router = express.Router()

router.get("/", staffAuth, getAllInvoices)
router.post("/table/:id", staffAuth, generateInvoiceForTable)
router.patch("/:id", staffAuth, updateInvoiceStatus)
router.delete("/:id", staffAuth, deleteInvoice)
export default router