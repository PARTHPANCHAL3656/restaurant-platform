import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import Staff from "./models/Staff.js"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import rateLimit from "express-rate-limit"

import tableRoutes from "./routes/tables.js"
import orderRoutes from "./routes/orders.js"
import takeoutRoutes from "./routes/takeout.js"
import settingsRoutes from "./routes/settings.js"
import staffRoutes from "./routes/staff.js"
import reservationRoutes from "./routes/reservations.js"
import menuRoutes from "./routes/menu.js"
import categoryRoutes from "./routes/categories.js"
import { setMenuIo } from "./controllers/menuController.js"

import authRoutes from "./routes/auth.js"
import { runEmergencyPasswordResetIfConfigured } from "./utils/emergencyPasswordReset.js"
import paymentRoutes from "./routes/payments.js"
import invoiceRoutes from "./routes/invoices.js"
import analyticsRoutes from "./routes/analytics.js"
import crmRoutes from "./routes/crm.js"

dotenv.config()
connectDB()
runEmergencyPasswordResetIfConfigured()

const app = express()
app.set('trust proxy', 1)
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

// Which websites may call this API (REST and live updates):
//   FRONTEND_URL - the main frontend. ONE url, no comma. It is also used to
//                  build the QR-code and takeout links, so it must stay a
//                  single address.
//   CORS_ORIGINS - optional extra frontends (e.g. the same app on Cloudflare),
//                  comma separated: "https://spice-garden-5gd.pages.dev"
// Trailing slashes and spaces are ignored. Both empty = nothing is allowed.
const allowedOrigins = [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || "").split(",")]
  .map((s) => (s || "").trim().replace(/\/+$/, ""))
  .filter(Boolean)
const corsOrigin = allowedOrigins.length ? allowedOrigins : undefined

export const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
})

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Every browser can connect, but only verified staff get into the "staff"
  // room — the only audience for events that carry customer details. A
  // dashboard proves who it is by sending its JWT after connecting; the
  // checks mirror staffAuth (valid signature, account exists, still active,
  // not signed out by a password reset).
  socket.on("staff:join", async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
      const staff = await Staff.findById(decoded.staffId).select("active tokenVersion")
      if (!staff || !staff.active || (decoded.tv ?? 0) !== (staff.tokenVersion ?? 0)) return
      socket.join(["staff", `staff:${staff._id}`])
    } catch (err) {
      // Bad or expired token: stay out of the room, say nothing.
    }
  })

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

setMenuIo(io)

app.use(cors({ origin: corsOrigin }))
console.log('CORS configured for origins:', allowedOrigins)
app.use(helmet())
app.use(express.json({ limit: "10mb" }))
app.use(mongoSanitize())

// Safety net for every 5xx: controllers still write `{ error: err.message }`
// in their catch blocks, and raw error text can expose database or code
// details. Outside local development, replace it with a generic message and
// keep the real one in the server log.
app.use((req, res, next) => {
  const sendJson = res.json.bind(res)
  res.json = (body) => {
    if (res.statusCode >= 500 && process.env.NODE_ENV !== "development") {
      console.error(`[${req.method} ${req.originalUrl}] ${res.statusCode}:`, body?.error ?? body)
      return sendJson({ error: "Something went wrong on our side. Please try again." })
    }
    return sendJson(body)
  }
  next()
})

// -------------------------------------------------------
// DEPLOYMENT NOTE — Socket.IO on Render:
// Socket.IO works on Render with no extra config.
// If you ever move to Vercel for the backend (not recommended),
// Socket.IO will NOT work — Vercel is serverless and does not
// support persistent connections. Stay on Render for the backend.
// -------------------------------------------------------

// After
// Staff-auth rate limits live in routes/auth.js, applied per route. They
// can't share one budget across the whole /api/auth prefix: every open
// dashboard polls /api/auth/me, which would eat the login allowance.

// Customer-facing intake (queue join, phone capture, reservation submit):
// sized generously since a full restaurant on shared WiFi can look like
// one IP sending a burst of legitimate requests.
const publicIntakeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300,                 // ~60/min sustained — comfortably above real usage, well below a scripted flood
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again in a few minutes." }
})

app.use("/api/auth", authRoutes)
app.use("/api/tables", publicIntakeLimiter, tableRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/takeout", takeoutRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/staff", staffRoutes)
app.use("/api/reservations", publicIntakeLimiter, reservationRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/invoices", invoiceRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/crm", crmRoutes)

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