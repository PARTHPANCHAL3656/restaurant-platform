import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import StaffAvatar from './StaffAvatar';
import NotificationBadge from './NotificationBadge';
import { useStaff } from '../../context/StaffContext';

// Rows shown in the bell panel (only the ones with something new are listed).
const BELL_ALERTS = [
  { key: 'reservations', label: 'New reservation requests', path: '/staff/tables', icon: 'event_seat' },
  { key: 'orders', label: 'New orders', path: '/staff/orders', icon: 'receipt_long' },
  { key: 'takeaway', label: 'New takeaway orders', path: '/staff/takeaway', icon: 'shopping_bag' },
  { key: 'billing', label: 'New invoices', path: '/staff/billing', icon: 'payments' }
];

export default function StaffHeader({ onMenuToggle, badges = {}, badgeTotal = 0, onMarkAllSeen }) {
  const { staffProfile, logoutStaff } = useStaff();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setBellOpen(false);
      }
    };
    if (dropdownOpen || bellOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen, bellOpen]);

  const bellAlerts = BELL_ALERTS.filter((a) => badges[a.key] > 0);

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
    navigate('/');
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
    <header className="h-16 md:h-20 border-b border-muted-border bg-canvas-cream/85 backdrop-blur-md fixed top-0 right-0 left-0 lg:left-[300px] z-30 px-4 sm:px-6 md:px-8 flex items-center justify-between overflow-visible">
      
      {/* Left side: Hamburger (mobile/tablet) + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="relative p-2 -ml-2 text-ink-navy hover:text-saffron-gold lg:hidden focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
          <NotificationBadge
            count={badgeTotal}
            label="new notifications"
            size="sm"
            className="absolute top-0.5 -right-1"
          />
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

        <div className="h-6 w-px bg-muted-border hidden md:block" />

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen(!bellOpen); setDropdownOpen(false); }}
            aria-label={badgeTotal > 0 ? `Notifications, ${badgeTotal} new` : 'Notifications'}
            aria-expanded={bellOpen}
            className="relative text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">notifications</span>
            <NotificationBadge
              count={badgeTotal}
              label="new notifications"
              size="sm"
              className="absolute -top-2 -right-3"
            />
          </button>

          {bellOpen && (
            <>
              <div onClick={() => setBellOpen(false)} className="fixed inset-0 z-[9998]" />
              <div className="absolute right-0 top-full mt-4 w-[300px] max-w-[calc(100vw-2rem)] bg-canvas-cream rounded-sm shadow-xl border border-muted-border z-[9999] overflow-hidden animate-fadeIn">
                <div className="px-4 py-3 border-b border-muted-border/60 flex items-center justify-between gap-3">
                  <p className="font-label-caps text-[11px] tracking-widest uppercase text-ink-navy font-semibold">Notifications</p>
                  {bellAlerts.length > 0 && (
                    <button
                      onClick={() => onMarkAllSeen && onMarkAllSeen()}
                      className="font-label-caps text-[10px] tracking-widest uppercase text-saffron-gold hover:underline focus:outline-none"
                    >
                      Mark all as seen
                    </button>
                  )}
                </div>

                {bellAlerts.length === 0 ? (
                  <p className="px-4 py-6 text-center font-serif italic text-xs text-subtle-text">You&apos;re all caught up</p>
                ) : (
                  <ul className="py-1">
                    {bellAlerts.map((alert) => (
                      <li key={alert.key}>
                        <Link
                          to={alert.path}
                          onClick={() => setBellOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg text-saffron-gold">{alert.icon}</span>
                          <span className="flex-grow text-xs text-ink-navy">{alert.label}</span>
                          <NotificationBadge count={badges[alert.key]} label={alert.label.toLowerCase()} size="sm" className="" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Profile Info & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}
            className="flex items-center gap-3 hover:opacity-85 focus:outline-none text-left"
          >
            <StaffAvatar className="w-9 h-9" />
            <div className="hidden sm:flex flex-col shrink-0">
              <span className="font-semibold text-xs text-ink-navy leading-tight">
                {sessionStorage.getItem('staffName') || staffProfile.name}
              </span>
              <span className="text-[10px] text-subtle-text mt-0.5 leading-none">
                {(() => {
                  const role = sessionStorage.getItem('staffRole');
                  return role ? role.charAt(0) + role.slice(1).toLowerCase() : staffProfile.role;
                })()}
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
                  to="/staff/settings" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-label-caps text-ink-navy hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-saffron-gold">settings</span>
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
