import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from './StaffSidebar';
import StaffHeader from './StaffHeader';
import ProtectedRoute from './ProtectedRoute';

export default function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
      <div className="bg-[#faf9f8] text-[#1a1c1c] font-sans min-h-screen flex overflow-x-hidden">
        
        {/* Responsive Drawer Sidebar */}
        <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Viewport Container */}
        <div className="flex-grow min-h-screen flex flex-col lg:pl-[300px] transition-all duration-300">
          
          {/* Sticky Header */}
          <StaffHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Dashboard/Feature Screen Contents */}
          <main className="flex-grow pt-20">
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
    </ProtectedRoute>
  );
}
