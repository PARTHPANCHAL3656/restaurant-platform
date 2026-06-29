import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { CartProvider } from './context/CartContext';
import { StaffProvider } from './context/StaffContext';
import DesktopSidebar from './components/DesktopSidebar';
import MobileHeader from './components/MobileHeader';
import MobileMenu from './components/MobileMenu';
import CartDrawer from './components/CartDrawer';
import StaffLayout from './components/staff/StaffLayout';

// Pages (Lazy Loaded)
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const ReservationPage = React.lazy(() => import('./pages/ReservationPage'));
const ReservationSuccess = React.lazy(() => import('./pages/ReservationSuccess'));
const MenuPage = React.lazy(() => import('./pages/MenuPage'));
const OrderTrackingPage = React.lazy(() => import('./pages/OrderTrackingPage'));
const BillSummaryPage = React.lazy(() => import('./pages/BillSummaryPage'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));

// Staff Pages (Lazy Loaded)
const StaffLoginPage = React.lazy(() => import('./pages/staff/StaffLoginPage'));
const StaffDashboardPage = React.lazy(() => import('./pages/staff/StaffDashboardPage'));
const StaffTablesPage = React.lazy(() => import('./pages/staff/StaffTablesPage'));
const StaffOrdersPage = React.lazy(() => import('./pages/staff/StaffOrdersPage'));
const StaffBillingPage = React.lazy(() => import('./pages/staff/StaffBillingPage'));
const StaffGuestQueuePage = React.lazy(() => import('./pages/staff/StaffGuestQueuePage'));
const StaffMenuPage = React.lazy(() => import('./pages/staff/StaffMenuPage'));

// Premium Minimalist Loader
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-canvas-cream z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-2 border-saffron-gold/20 border-t-saffron-gold rounded-full animate-spin"></div>
        <p className="font-serif italic text-xs text-subtle-text tracking-widest animate-pulse">Spice Garden...</p>
      </div>
    </div>
  );
}

// Scroll control helper
function ScrollToTop() {
  const { pathname, state } = useLocation();

  useEffect(() => {
    if (state && state.scrollTo) {
      // Allow slight mount lag for elements to render
      setTimeout(() => {
        const el = document.getElementById(state.scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, state]);

  return null;
}

// Internal wrapper to manage layout state
function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas-cream text-ink-navy flex flex-col lg:flex-row">
      {/* Desktop Sidebar Layout */}
      <DesktopSidebar />

      {/* Mobile Top Header Navigation */}
      <MobileHeader 
        onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
        onCartToggle={() => setIsCartOpen(prev => !prev)}
      />

      {/* Mobile Menu Fullscreen Overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Global Slide-in Cart Panel */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Main viewport area, offset beside the desktop sidebar */}
      <div className="flex-grow lg:pl-[300px] pt-[65px] lg:pt-0 min-h-screen flex flex-col justify-between">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/reservation-success" element={<ReservationSuccess />} />
          <Route path="/menu" element={<MenuPage onCartToggle={() => setIsCartOpen(true)} />} />
          <Route path="/order-status" element={<OrderTrackingPage />} />
          <Route path="/bill" element={<BillSummaryPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </div>
    </div>
  );
}

function MainAppRouter() {
  const location = useLocation();
  const isStaffRoute = location.pathname.startsWith('/staff');

  if (isStaffRoute) {
    return (
      <Routes>
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route element={<StaffLayout />}>
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/tables" element={<StaffTablesPage />} />
          <Route path="/staff/orders" element={<StaffOrdersPage />} />
          <Route path="/staff/billing" element={<StaffBillingPage />} />
          <Route path="/staff/guest-queue" element={<StaffGuestQueuePage />} />
          <Route path="/staff/menu" element={<StaffMenuPage />} />
        </Route>
      </Routes>
    );
  }

  return <AppLayout />;
}

export default function App() {
  useEffect(() => {
    // Initialize Lenis smooth scrolling globally
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <StaffProvider>
        <CartProvider>
          <Suspense fallback={<PageLoader />}>
            <MainAppRouter />
          </Suspense>
        </CartProvider>
      </StaffProvider>
    </Router>
  );
}
