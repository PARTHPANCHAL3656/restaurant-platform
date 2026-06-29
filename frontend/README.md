# Spice Garden Restaurant & Staff Management Portal

A premium, luxury hospitality web application designed for **Spice Garden**. This project combines an elegant, editorial customer-facing digital dining website with a real-time operational staff command center (Maître D' Floor Planner, Live Kitchen Queue, Billing Ledger, Waitlist Directory, and Catalog Administration).

---

## 1. Technology Stack

*   **Core UI Library:** [React 18](https://react.dev/) (Single Page Application architecture)
*   **Build Tooling & Bundler:** [Vite v8](https://vitejs.dev/) (lightning-fast HMR and optimized production outputs)
*   **Styling Engine:** [Tailwind CSS v3](https://tailwindcss.com/) (utility-first rules mapped to brand tokens)
*   **Smooth Scroll Engine:** [Lenis](https://lenis.darkroom.engineering/) (physics-based momentum scroll across customer and staff views)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) (fluid route page transitions, dropdown fade-ins, and bento elevation hovers)
*   **State Management:** React Context API (`CartContext` for guest orders, `StaffContext` for live synchronized restaurant metrics)
*   **Routing:** React Router v6 (`react-router-dom` declarative browser routes)

---

## 2. Codebase Architecture

```
d:/Projects/WeIntern/Restaurant/
├── src/
│   ├── assets/
│   │   └── images/                # High-fidelity dish photos & interior hero banners
│   ├── components/
│   │   ├── staff/
│   │   │   ├── ProtectedRoute.jsx # Session-guarded router wrapper
│   │   │   ├── StaffAvatar.jsx    # SVG profile placeholder vector
│   │   │   ├── StaffHeader.jsx    # Sticky navigation bar (Clock, Shift, Profile)
│   │   │   ├── StaffLayout.jsx    # Sidebar-to-viewport container frame
│   │   │   └── StaffLogo.jsx      # Staff portal wordmark SVG lockup
│   │   ├── CartDrawer.jsx         # Customer cart overlay & checkout action triggers
│   │   ├── DesktopSidebar.jsx     # Customer desktop nav bar
│   │   ├── Footer.jsx             # Shared bottom signature links & staff login lock
│   │   ├── MobileMenu.jsx         # Customer drawer navigation
│   │   └── Navbar.jsx             # Sticky customer top bar
│   ├── context/
│   │   ├── CartContext.jsx        # Handles customer shopping cart additions/tallies
│   │   └── StaffContext.jsx       # Unified operational data (Tables, Orders, Invoices, Queue)
│   ├── pages/
│   │   ├── staff/
│   │   │   ├── StaffBillingPage.jsx    # Transaction ledger & cash settlements (unpaid, paid, partially-paid)
│   │   │   ├── StaffDashboardPage.jsx  # Bento overview counters & timeline logs
│   │   │   ├── StaffGuestQueuePage.jsx # Waitlist tracker & table assignment panel
│   │   │   ├── StaffLoginPage.jsx      # Centered credentials card & security tags
│   │   │   ├── StaffMenuPage.jsx       # Menu database catalog & sliding forms drawer
│   │   │   └── StaffTablesPage.jsx     # Maître D' live floor plan map
│   │   ├── ContactPage.jsx        # Customer support & location maps
│   │   ├── GalleryPage.jsx        # Culinary editorial photo board
│   │   ├── LandingPage.jsx        # Customer splash page & premium dining context
│   │   ├── MenuPage.jsx           # Customer digital menu and active cart controls
│   │   └── ReservationPage.jsx    # Customer table booking form
│   ├── App.jsx                    # Global routes declaration & Lenis initialization
│   ├── index.css                  # Global style variables & custom scrollbar overrides
│   └── main.jsx                   # Application bootstrap entry point
```

---

## 3. Design System Tokens

All styling inherits from a shared design token dictionary configured in [tailwind.config.js](file:///d:/Projects/WeIntern/Restaurant/tailwind.config.js):

### Typography
*   **Serif Pair (Headings):** `Playfair Display`, Georgia (uses Tailwind classes `font-serif`, `text-display-lg`, `text-headline-md`, `text-headline-sm`)
*   **Sans-Serif Pair (Body/Labels):** `Hanken Grotesk`, sans-serif (uses Tailwind classes `font-sans`, `text-body-lg`, `text-body-md`, `text-label-caps`, `text-cta-label`)

### Color Palette
*   **Luxury Gold:** `#D4AF37` (`saffron-gold`) — primary branding/interactive borders
*   **Ink Navy:** `#1A1F2C` (`ink-navy` / `brand-navy`) — typography and primary headers
*   **Canvas Cream:** `#FDFCFB` (`canvas-cream`) — customer backgrounds
*   **Warm Ivory:** `#FBF8F2` — low-contrast premium neutral blocks (e.g. pending badges, menu headers)

---

## 4. Key Functional Features

### Customer Experience
1.  **Floating Cart:** Dynamically animates into view in the bottom-right corner after the customer adds their first dish. Live indicators display item count and running subtotal.
2.  **Add-To-Order Feedbacks:** Clicking "Add to Order" converts the static button to an inline `[-] Quantity [+]` selector, updates the floating cart, and slides in a premium validation toast notification for 2.5 seconds.
3.  **Michelin-inspired Digital Menu:** Dynamic catalog that filters items by category and search strings. Out-of-Stock items locked by the manager display as "Out of Stock" to prevent order failures.

### Staff Operations Portal
1.  **Maître D' Tables Board:** Interactive table grid showing occupied, available, reserved, and cleaning statuses. Features slide-over drawers to seat guests from the waitlist and finalize table totals.
2.  **Kitchen Order Service Columns:** Three-column pipeline (New, Preparing, Ready-to-Serve) streaming live customer orders. Kitchen staff can accept tickets, mark dishes ready, and close tickets.
3.  **Transactions Ledger:** Settle checks manually through cash overrides. Badges are styled using premium brand colors rather than generic red/green alerts.
4.  **Menu Catalog Manager:** Supports duplicating, archiving, and editing menu dishes. Uploading custom dish images encodes them to base64, instantly updating both customer and staff pages.

---

## 5. Development Guide

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### Setup & Installation
1. Clone the project repository and open the workspace folder:
   ```bash
   cd d:/Projects/WeIntern/Restaurant
   ```
2. Install the necessary NPM dependencies:
   ```bash
   npm install
   ```

### Start the Development Server
Run Vite's live hot-reloading dev environment:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### Compile for Production
Verify typescript/ESLint rules and bundle assets into optimized chunk outputs:
```bash
npm run build
```
Production assets compile directly to the `/dist` directory.

### Accessing the Staff Portal
1. On the customer website, scroll to the footer and click the lock icon next to the branding signature.
2. The page routes to the authentication portal (`/staff/login`).
3. Enter credentials:
   *   **Staff ID:** `SG-1924` (or any value)
   *   **Password:** `admin` (or any value)
4. Click **Sign In** to navigate to `/staff/dashboard`.

---

## 6. Backend Integration & Production Configuration

The application is fully integrated with a production backend and real-time Socket.IO synchronization layers:

*   **API Client (`src/utils/api.js`):** Axios instance configured to dynamically attach authentication tokens (supporting both staff JWTs and customer table tokens). Integrates a response interceptor that dispatches an `auth-session-expired` event upon receiving `401/403` status codes.
*   **Real-time Synced Sockets (`src/utils/socket.js`):** Singleton client connecting to the Render backend to receive live status updates for tables, reservations, guest waitlist, and orders.
*   **Offline Mock Fallback Mode:** If the production API endpoints are offline or unreachable, the portal automatically logs in with local mock credentials and operates fully offline using stateful mock fallbacks (`MOCK_TABLES`, `MOCK_ORDERS`, etc.) in `StaffContext.jsx`.
*   **Error Recovery & Chunk Loading (`src/components/ErrorBoundary.jsx`):** A custom React ErrorBoundary wraps all lazy-loaded staff routes. It intercepts runtime failures and automatically reloads the page once if it detects a Vite chunk dynamic import error (which typically occurs when new deployments delete older hashed static assets on Vercel).

*For database Mongo/SQL schemas, REST contracts, and socket events, review the full **[Backend Integration Specification](backend_integration_guide.md)** in the project workspace.*
