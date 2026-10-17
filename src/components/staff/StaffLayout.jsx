import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from './StaffSidebar';
import StaffHeader from './StaffHeader';
import ProtectedRoute from './ProtectedRoute';
import { useStaff } from '../../context/StaffContext';
import useSidebarBadges from '../../hooks/useSidebarBadges';

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Collapsible icon-only sidebar on desktop. The kitchen screens (orders and
  // takeaway) start collapsed to give the tickets room; every other page starts
  // expanded. A choice made with the « » button is remembered separately for
  // those two kinds of page. Phones and tablets keep the slide-in drawer.
  const onKitchenPage = location.pathname === '/staff/orders' || location.pathname === '/staff/takeaway';
  const prefKey = onKitchenPage ? 'staffSidebarKitchen' : 'staffSidebarOther';
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return {
        staffSidebarKitchen: localStorage.getItem('staffSidebarKitchen'),
        staffSidebarOther: localStorage.getItem('staffSidebarOther')
      };
    } catch (e) {
      return {};
    }
  });
  const collapsed = prefs[prefKey] ? prefs[prefKey] === 'collapsed' : onKitchenPage;
  const toggleCollapsed = () => {
    const next = collapsed ? 'expanded' : 'collapsed';
    setPrefs(prev => ({ ...prev, [prefKey]: next }));
    try { localStorage.setItem(prefKey, next); } catch (e) { /* storage blocked */ }
  };
  const { isDataLoaded, isError, isAuthenticated, queue, reservations, orders, invoices, tables } = useStaff();

  // Live counters (sidebar, bell, mobile menu button), worked out from the loaded data
  const { badges, total: badgeTotal, markAllSeen } = useSidebarBadges({
    enabled: isAuthenticated,
    ready: isDataLoaded,
    pathname: location.pathname,
    queueCount: queue.length,
    reservations,
    orders,
    invoices,
    tables
  });

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 }
  };

  const pageTransition = {
    duration: 0.35,
    ease: 'easeInOut'
  };

  return (
    <ProtectedRoute>
      {!isDataLoaded && !isError ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-canvas-cream text-ink-navy">
          <div className="w-10 h-10 border-2 border-saffron-gold/20 border-t-saffron-gold rounded-full animate-spin"></div>
          <p className="mt-4 font-serif italic text-xs text-subtle-text tracking-widest animate-pulse">Syncing Staff Portal...</p>
        </div>
      ) : (
      <div className="bg-surface text-[#1a1c1c] font-sans min-h-screen flex overflow-x-hidden">
        
        {/* Responsive Drawer Sidebar */}
        <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} badges={badges} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

        {/* Main Viewport Container */}
        <div className={`flex-grow min-w-0 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[300px]'}`}>
          
          {/* Sticky Header */}
          <StaffHeader
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            collapsed={collapsed}
            badges={badges}
            badgeTotal={badgeTotal}
            onMarkAllSeen={markAllSeen}
          />
          
          {/* Dashboard/Feature Screen Contents */}
          <main className="flex-grow min-w-0 pt-16 md:pt-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className="w-full h-full flex flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
      )}
    </ProtectedRoute>
  );
}
