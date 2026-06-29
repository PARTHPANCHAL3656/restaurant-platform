# Spice Garden — Restaurant & Staff Management Portal

A premium, luxury hospitality web application designed for **Spice Garden**. This project combines an elegant, editorial customer-facing digital dining website with a real-time operational staff command center (Maître D' Floor Planner, Live Kitchen Queue, Billing Ledger, Waitlist Directory, and Catalog Administration).

> **Live Production URL:** [https://spice-garden-ebon.vercel.app](https://spice-garden-ebon.vercel.app)

---

## 1. Technology Stack

| Layer | Technology |
|:---|:---|
| Core UI Library | [React 18](https://react.dev/) — Single Page Application |
| Build Tooling | [Vite v8](https://vitejs.dev/) — HMR + optimized production outputs |
| Styling Engine | [Tailwind CSS v3](https://tailwindcss.com/) — utility-first brand tokens |
| Smooth Scroll | [Lenis](https://lenis.darkroom.engineering/) — physics-based momentum scroll |
| Animations | [Framer Motion](https://www.framer.com/motion/) — page transitions & micro-animations |
| State Management | React Context API (`CartContext` + `StaffContext`) |
| Routing | React Router v6 (`react-router-dom`) |
| Deployment | [Vercel](https://vercel.com/) — SPA rewrite rules via `vercel.json` |

---

## 2. Codebase Architecture

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── images/
│   │       ├── landing/          # Hero banners & interior photography
│   │       ├── gallery/          # Editorial culinary photo board
│   │       └── menu/
│   │           ├── starters/
│   │           ├── mains/
│   │           ├── rice/
│   │           ├── breads/
│   │           ├── desserts/
│   │           └── beverages/
│   ├── components/
│   │   ├── staff/
│   │   │   ├── ProtectedRoute.jsx   # Session-guarded router wrapper
│   │   │   ├── StaffAvatar.jsx      # SVG profile placeholder
│   │   │   ├── StaffHeader.jsx      # Sticky nav bar (Clock, Shift, Profile)
│   │   │   ├── StaffLayout.jsx      # Sidebar-to-viewport container frame
│   │   │   └── StaffLogo.jsx        # Staff portal wordmark SVG
│   │   ├── CartDrawer.jsx           # Customer cart overlay & checkout
│   │   ├── DesktopSidebar.jsx       # Customer desktop nav bar
│   │   ├── Footer.jsx               # Shared bottom links & staff login lock
│   │   ├── MobileHeader.jsx         # Customer mobile top bar
│   │   ├── MobileMenu.jsx           # Customer drawer navigation
│   │   └── Navbar.jsx               # Sticky customer top bar
│   ├── context/
│   │   ├── CartContext.jsx          # Customer shopping cart state
│   │   └── StaffContext.jsx         # Unified restaurant operational state
│   ├── pages/
│   │   ├── staff/
│   │   │   ├── StaffBillingPage.jsx     # Transaction ledger & settlements
│   │   │   ├── StaffDashboardPage.jsx   # Bento overview & activity timeline
│   │   │   ├── StaffGuestQueuePage.jsx  # Waitlist tracker & table assignment
│   │   │   ├── StaffLoginPage.jsx       # Staff authentication portal
│   │   │   ├── StaffMenuPage.jsx        # Menu catalog manager & forms drawer
│   │   │   └── StaffTablesPage.jsx      # Live Maître D' floor plan map
│   │   ├── BillSummaryPage.jsx      # Customer bill receipt view
│   │   ├── CartPage.jsx             # Customer cart checkout
│   │   ├── ContactPage.jsx          # Customer support & location
│   │   ├── GalleryPage.jsx          # Editorial culinary photo board
│   │   ├── LandingPage.jsx          # Customer splash & dining context
│   │   ├── MenuPage.jsx             # Customer digital menu & cart
│   │   ├── OrderTrackingPage.jsx    # Live order status tracker
│   │   ├── ReservationPage.jsx      # Table booking form
│   │   └── ReservationSuccess.jsx   # Booking confirmation screen
│   ├── utils/
│   │   └── assetHelper.js           # Vite-compatible image path resolver
│   ├── App.jsx                      # Global route declarations & Lenis init
│   ├── index.css                    # Design tokens & global style overrides
│   └── main.jsx                     # Application bootstrap entry point
├── vercel.json                      # SPA rewrite rules for Vercel deployment
├── vite.config.js                   # Vite build config & manual chunk splitting
└── tailwind.config.js               # Brand token design system
```

---

## 3. All Application Routes

### Customer Routes
| Path | Page |
|:---|:---|
| `/` | Landing Page |
| `/menu` | Digital Menu |
| `/reservation` | Table Booking |
| `/reservation-success` | Booking Confirmation |
| `/cart` | Cart & Checkout |
| `/order-status` | Live Order Tracker |
| `/bill` | Bill Summary |
| `/gallery` | Photo Gallery |
| `/contact` | Contact & Location |

### Staff Portal Routes
| Path | Page |
|:---|:---|
| `/staff/login` | Staff Authentication |
| `/staff/dashboard` | Operations Dashboard |
| `/staff/tables` | Maître D' Floor Plan |
| `/staff/orders` | Kitchen Order Pipeline |
| `/staff/billing` | Billing & Settlements |
| `/staff/guest-queue` | Guest Waitlist |
| `/staff/menu` | Menu Catalog Manager |

---

## 4. Design System Tokens

All styling inherits from `tailwind.config.js`:

### Typography
- **Serif (Headings):** `Playfair Display`, Georgia → `font-serif`
- **Sans-Serif (Body):** `Hanken Grotesk`, sans-serif → `font-sans`

### Color Palette
| Token | Hex | Usage |
|:---|:---|:---|
| `saffron-gold` | `#D4AF37` | Primary brand / interactive accents |
| `ink-navy` | `#1A1F2C` | Typography & headers |
| `canvas-cream` | `#FDFCFB` | Customer page backgrounds |
| `subtle-text` | `#6B6560` | Secondary labels & descriptions |

---

## 5. Development Guide

### Prerequisites
[Node.js](https://nodejs.org/) v18 or higher required.

### Setup & Installation
```bash
# Navigate into the frontend directory
cd frontend

# Install dependencies
npm install

# Start the local dev server (hot reload)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
Outputs to `dist/` with code-split chunks via Vite `manualChunks`.

### Accessing the Staff Portal
1. Scroll to the footer on the customer site → click the **lock icon**.
2. Enter any credentials on the login screen:
   - **Staff ID:** `SG-1924` (or any value)
   - **Password:** `admin` (or any value)
3. Click **Sign In** → redirected to `/staff/dashboard`.

---

## 6. Vercel Deployment

The `vercel.json` at the root of `frontend/` ensures all routes rewrite to `index.html` for SPA client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> ⚠️ **Important:** Do NOT add `"cleanUrls": true` — it conflicts with SPA rewrites and causes 404s on all sub-routes.

---

## 7. Recent Fixes (v1.1.0)

| Fix | Description |
|:---|:---|
| **Vercel 404 on `/staff/menu`** | Removed `"cleanUrls": true` from `vercel.json` which was intercepting routes before the SPA rewrite could fire |
| **Menu cards disappearing after 1s** | Fixed infinite render loop in `StaffContext.jsx` — `useEffect([orders])` was calling `advanceOrder` (stale closure) on every state update, causing cascading re-renders. Replaced with `useRef`-based interval that runs once on mount |
| **Wrong image fallback** | `addMenuItem` was defaulting new dishes to `paneer-tikka.jpg` — changed to `''` so the "Image Missing" placeholder renders correctly |
| **Code splitting** | Configured Vite `manualChunks` to split `vendor-react`, `vendor-motion` into separate bundles for faster page loads |
| **Static import order** | Moved `StaffLayout` static import to the top of `App.jsx` (above `React.lazy` declarations) |

---

## 8. Backend Integration Blueprint

To transition from the stateful mock engine to a real backend:

1. **Initial State:** `GET /api/restaurant/state` in `StaffContext.jsx` — loads menu catalog, reservations, tables, and queue.
2. **Cart Orders:** `POST /api/orders` in `CartContext.jsx` — writes guest checkouts to the database.
3. **Live Sync:** WebSockets (`socket.io` or `ws`) — stream real-time updates for orders, billing, seating, and menu changes.

*See [backend_integration_guide.md](backend_integration_guide.md) for full REST contracts, SQL schemas, and WebSocket events.*
