import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import StaffAvatar from './StaffAvatar';
import { useStaff } from '../../context/StaffContext';

export default function StaffHeader({ onMenuToggle }) {
  const { staffProfile, logoutStaff } = useStaff();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/staff/dashboard':
        return 'Operations Dashboard';
      case '/staff/tables':
        return 'Table & Reservation Management';
      case '/staff/orders':
        return 'Order Management';
      case '/staff/billing':
        return 'Billing & Invoice Management';
      case '/staff/guest-queue':
        return 'Guest Queue Management';
      case '/staff/menu':
        return 'Menu Management';
      default:
        return 'Staff Portal';
    }
  };

  const handleLogout = () => {
    logoutStaff();
    navigate('/staff/login');
  };

  const getServiceType = () => {
    const hours = time.getHours();
    if (hours >= 6 && hours < 11) {
      return 'Breakfast Service';
    } else if (hours >= 11 && hours < 16) {
      return 'Lunch Service';
    } else {
      return 'Dinner Service';
    }
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="h-16 md:h-20 border-b border-[#E5E1DA] bg-[#FDFCFB]/85 backdrop-blur-md fixed top-0 right-0 left-0 lg:left-[300px] z-30 px-4 sm:px-6 md:px-8 flex items-center justify-between overflow-visible">
      
      {/* Left side: Hamburger (mobile/tablet) + Page Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-2 -ml-2 text-ink-navy hover:text-saffron-gold lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="hidden sm:block">
          <h2 className="font-serif text-headline-sm text-ink-navy leading-none">{getPageTitle()}</h2>
          <p className="text-[10px] font-label-caps text-subtle-text tracking-widest uppercase mt-1">Spice Garden Staff</p>
        </div>
      </div>

      {/* Right side: Time, Shift, Notifications, Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* Shift Details (Hidden on small screens) */}
        <div className="hidden md:flex flex-col text-right">
          <span className="font-label-caps text-[9px] text-saffron-gold tracking-widest uppercase font-semibold">{getServiceType()}</span>
          <span className="font-sans text-[11px] text-subtle-text mt-0.5">{formattedDate} • {formattedTime}</span>
        </div>

        <div className="h-6 w-px bg-[#E5E1DA] hidden md:block" />

        {/* Search Field (Understated) */}
        <div className="relative hidden lg:block w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text text-sm">search</span>
          <input 
            type="text" 
            placeholder="Search portal..." 
            className="w-full bg-transparent border-b border-[#D4AF37]/20 py-1.5 pl-9 pr-4 focus:outline-none focus:border-saffron-gold font-body-md text-xs placeholder:text-subtle-text/30 outline-none"
          />
        </div>

        {/* Notifications Icon */}
        <button className="relative text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-saffron-gold rounded-full" />
        </button>

        {/* User Profile Info & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:opacity-85 focus:outline-none text-left"
          >
            <StaffAvatar className="w-9 h-9" />
            <div className="hidden sm:flex flex-col shrink-0">
              <span className="font-semibold text-xs text-ink-navy leading-tight">
                {sessionStorage.getItem('staffName') || staffProfile.name}
              </span>
              <span className="text-[10px] text-subtle-text mt-0.5 leading-none">
                {sessionStorage.getItem('staffRole') || staffProfile.role}
              </span>
            </div>
          </button>

          {/* Luxury Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-[9998]" />
              <div className="absolute right-0 top-full mt-3 w-[240px] bg-canvas-cream rounded-sm shadow-xl border border-muted-border z-[9999] overflow-hidden py-1 animate-fadeIn">
                <div className="px-4 py-2 border-b border-muted-border/60">
                  <p className="font-sans text-xs text-subtle-text">Shift Status</p>
                  <p className="font-sans text-[11px] text-green-600 font-bold uppercase tracking-wider mt-0.5">On Duty</p>
                </div>
                
                <Link 
                  to="#" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-label-caps text-ink-navy hover:bg-[#f4f3f2] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-[#D4AF37]">person</span>
                  <span>My Profile</span>
                </Link>

                <Link 
                  to="#" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-label-caps text-ink-navy hover:bg-[#f4f3f2] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-[#D4AF37]">settings</span>
                  <span>Settings</span>
                </Link>

                <div className="h-px bg-muted-border/60 my-1" />

                <button 
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-label-caps text-red-600 hover:bg-red-500/5 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>

    </header>
  );
}
