import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import StaffLogo from './StaffLogo';
import { useStaff } from '../../context/StaffContext';

export default function StaffSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutStaff } = useStaff();

  const menuItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: 'dashboard' },
    { name: 'Tables & Reservations', path: '/staff/tables', icon: 'event_seat' },
    { name: 'Order Management', path: '/staff/orders', icon: 'receipt_long' },
    { name: 'Billing & Invoices', path: '/staff/billing', icon: 'payments' },
    { name: 'Guest Queue', path: '/staff/guest-queue', icon: 'hourglass_empty' },
    { name: 'Menu Management', path: '/staff/menu', icon: 'restaurant_menu' }
  ];

  const handleLogout = () => {
    logoutStaff();
    navigate('/staff/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#030612] border-r border-[#E5E1DA]/10 w-[300px] h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Branding header */}
        <div className="p-6 border-b border-[#E5E1DA]/10 shrink-0 relative">
          <StaffLogo heightClass="h-[76px]" colorClassName="text-canvas-cream" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-canvas-cream/50 hover:text-canvas-cream lg:hidden focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-grow py-8 pl-8 pr-4 space-y-6 overflow-y-auto hide-scrollbar">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 transition-colors group ${
                  active 
                    ? 'text-saffron-gold font-semibold' 
                    : 'text-canvas-cream/70 hover:text-saffron-gold'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                  active ? 'text-saffron-gold' : 'text-canvas-cream/40 group-hover:text-saffron-gold'
                }`}>{item.icon}</span>
                <span className="font-label-caps text-label-caps uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Support & Logout */}
        <div className="p-6 pl-8 border-t border-[#E5E1DA]/10 space-y-6 shrink-0">
          <Link
            to="#"
            className="flex items-center gap-4 text-canvas-cream/60 hover:text-saffron-gold transition-colors group"
          >
            <span className="material-symbols-outlined text-[20px] text-canvas-cream/40 group-hover:text-saffron-gold transition-colors">help_outline</span>
            <span className="font-label-caps text-label-caps uppercase tracking-widest">Support</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 text-red-400 hover:text-red-500 transition-colors group text-left focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px] text-red-400/60 group-hover:text-red-500 transition-colors">logout</span>
            <span className="font-label-caps text-label-caps uppercase tracking-widest">Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}
