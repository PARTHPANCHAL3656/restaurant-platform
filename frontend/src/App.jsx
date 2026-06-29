import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { CartProvider } from './context/CartContext';
import { StaffProvider } from './context/StaffContext';
import DesktopSidebar from './components/DesktopSidebar';
import MobileHeader from './components/MobileHeader';
import MobileMenu from './components/MobileMenu';
import CartDrawer from './components/CartDrawer';

// Pages
import LandingPage from './pages/LandingPage';
import ReservationPage from './pages/ReservationPage';
import ReservationSuccess from './pages/ReservationSuccess';
import MenuPage from './pages/MenuPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import BillSummaryPage from './pages/BillSummaryPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';

// Staff Pages & Shell Components
import StaffLayout from './components/staff/StaffLayout';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import StaffTablesPage from './pages/staff/StaffTablesPage';
import StaffOrdersPage from './pages/staff/StaffOrdersPage';
import StaffBillingPage from './pages/staff/StaffBillingPage';
import StaffGuestQueuePage from './pages/staff/StaffGuestQueuePage';
import StaffMenuPage from './pages/staff/StaffMenuPage';

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
          <MainAppRouter />
        </CartProvider>
      </StaffProvider>
    </Router>
  );
}
