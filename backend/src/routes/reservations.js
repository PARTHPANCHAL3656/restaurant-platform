import express from "express"
import staffAuth from "../middleware/auth.js"
import {
  createReservation,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getReservationAvailability,
  getReservationStatusByPhone
} from "../controllers/reservationController.js"

const router = express.Router()

router.post("/", createReservation)                              // public — customer books
router.get("/availability", getReservationAvailability)          // public — slot capacity check
router.get("/status/:phone", getReservationStatusByPhone)        // public — guest status tracker
router.get("/", staffAuth, getAllReservations)                   // staff views all
router.patch("/:id", staffAuth, updateReservationStatus)        // staff updates status
router.delete("/:id", staffAuth, deleteReservation)             // staff deletes

export default router