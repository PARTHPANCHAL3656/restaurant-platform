import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db.js"

import tableRoutes from "./routes/tables.js"
import orderRoutes from "./routes/orders.js"
import reservationRoutes from "./routes/reservations.js"
import menuRoutes from "./routes/menu.js"
import { setMenuIo } from "./controllers/menuController.js"
import authRoutes from "./routes/auth.js"
import paymentRoutes from "./routes/payments.js"
import invoiceRoutes from "./routes/invoices.js"

dotenv.config()
connectDB()

const app = express()
const httpServer = createServer(app)

// -------------------------------------------------------
// DEPLOYMENT NOTE — CORS:
// process.env.FRONTEND_URL controls which origin can call this API.
// DEV:        http://localhost:5173
// PRODUCTION: https://your-app.vercel.app
//
// Update FRONTEND_URL in Render's environment variables panel
// after you deploy the frontend and get its URL.
// If you get CORS errors after deploying, this is the first thing to check.
// -------------------------------------------------------

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
})

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

setMenuIo(io)

app.use(cors({ origin: process.env.FRONTEND_URL }))
console.log('CORS configured for origin:', process.env.FRONTEND_URL)
app.use(express.json({ limit: "10mb" }))

// -------------------------------------------------------
// DEPLOYMENT NOTE — Socket.IO on Render:
// Socket.IO works on Render with no extra config.
// If you ever move to Vercel for the backend (not recommended),
// Socket.IO will NOT work — Vercel is serverless and does not
// support persistent connections. Stay on Render for the backend.
// -------------------------------------------------------

app.use("/api/auth", authRoutes)
app.use("/api/tables", tableRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/invoices", invoiceRoutes)

app.get("/", (req, res) => {
  res.json({ message: "Restaurant API is running" })
})

app.get("/api/ping", (req, res) => {
  res.json({ pong: true, time: new Date().toISOString() })
})

// -------------------------------------------------------
// DEPLOYMENT NOTE — PORT:
// Render assigns its own PORT automatically via process.env.PORT.
// The fallback 5000 is only used locally.
// Do not hardcode a port number here.
// -------------------------------------------------------

const PORT = process.env.PORT || 5000
if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
export default httpServer