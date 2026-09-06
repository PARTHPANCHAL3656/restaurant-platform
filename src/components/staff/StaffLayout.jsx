import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from './StaffSidebar';
import StaffHeader from './StaffHeader';
import ProtectedRoute from './ProtectedRoute';
import { useStaff } from '../../context/StaffContext';

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isDataLoaded, isError } = useStaff();

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
        <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Viewport Container */}
        <div className="flex-grow min-w-0 min-h-screen flex flex-col lg:pl-[300px] transition-all duration-300">
          
          {/* Sticky Header */}
          <StaffHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          
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
