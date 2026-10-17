import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import StaffLogo from './StaffLogo';
import NotificationBadge from './NotificationBadge';
import { useStaff } from '../../context/StaffContext';

// On desktop the sidebar can collapse to a slim icon-only strip (the « » button
// at the bottom). Labels hide and each badge becomes a small gold dot on its
// icon. On phones and tablets nothing changes: it is still the slide-in drawer.
export default function StaffSidebar({ isOpen, onClose, badges = {}, collapsed = false, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutStaff } = useStaff();

  // Mirrors the backend's requireRole boundaries exactly (see
  // backend/src/routes/{categories,crm,invoices,menu,settings}.js) - a
  // STAFF-role user hitting these would just get a 403, so there's no
  // reason to show the link at all. `roles: null` means every staff role
  // can access it (matches routes that only require staffAuth, no
  // requireRole - orders, tables, takeaway, guest queue).
  const allMenuItems = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: 'dashboard', roles: null },
    { name: 'Analytics', path: '/staff/analytics', icon: 'monitoring', roles: ['OWNER', 'MANAGER'] },
    { name: 'Tables & Reservations', path: '/staff/tables', icon: 'event_seat', roles: null, badgeKey: 'reservations', badgeLabel: 'new reservations' },
    { name: 'Order Management', path: '/staff/orders', icon: 'receipt_long', roles: null, badgeKey: 'orders', badgeLabel: 'new orders' },
    { name: 'Takeaway Orders', path: '/staff/takeaway', icon: 'shopping_bag', roles: null, badgeKey: 'takeaway', badgeLabel: 'new takeaway orders' },
    { name: 'Billing & Invoices', path: '/staff/billing', icon: 'payments', roles: ['OWNER', 'MANAGER'], badgeKey: 'billing', badgeLabel: 'new invoices' },
    { name: 'Guest Queue', path: '/staff/guest-queue', icon: 'hourglass_empty', roles: null, badgeKey: 'queue', badgeLabel: 'parties waiting' },
    { name: 'Menu Management', path: '/staff/menu', icon: 'restaurant_menu', roles: ['OWNER', 'MANAGER'] },
    { name: 'Settings', path: '/staff/settings', icon: 'settings', roles: ['OWNER', 'MANAGER'] }
  ];

  const staffRole = sessionStorage.getItem('staffRole');
  const menuItems = allMenuItems.filter(item => !item.roles || item.roles.includes(staffRole));

  const handleLogout = () => {
    logoutStaff();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Label text and spacing that only apply on desktop when collapsed.
  const labelHide = collapsed ? 'lg:hidden' : '';
  const rowCentre = collapsed ? 'lg:justify-center lg:gap-0' : '';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-midnight-black border-r border-muted-border/10 w-[300px] h-screen transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${
        collapsed ? 'lg:w-[76px]' : ''
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Branding header (hidden when collapsed on desktop) */}
        <div className={`p-6 border-b border-muted-border/10 shrink-0 relative ${collapsed ? 'lg:hidden' : ''}`}>
          <StaffLogo heightClass="h-[76px]" colorClassName="text-canvas-cream" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-canvas-cream/50 hover:text-canvas-cream lg:hidden focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className={`flex-grow py-8 pl-8 pr-4 space-y-6 overflow-y-auto hide-scrollbar ${collapsed ? 'lg:px-0 lg:pt-10' : ''}`} data-lenis-prevent>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const hasBadge = item.badgeKey && Number(badges[item.badgeKey]) > 0;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                title={item.name}
                className={`flex items-center gap-4 transition-colors group ${rowCentre} ${
                  active 
                    ? 'text-saffron-gold font-semibold' 
                    : 'text-canvas-cream/70 hover:text-saffron-gold'
                }`}
              >
                <span className="relative shrink-0 flex">
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${
                    active ? 'text-saffron-gold' : 'text-canvas-cream/40 group-hover:text-saffron-gold'
                  }`}>{item.icon}</span>
                  {hasBadge && (
                    <span className={`hidden ${collapsed ? 'lg:block' : ''} absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-saffron-gold border border-midnight-black`} />
                  )}
                </span>
                <span className={`font-label-caps text-label-caps uppercase tracking-widest ${labelHide}`}>{item.name}</span>
                {item.badgeKey && (
                  <NotificationBadge count={badges[item.badgeKey]} label={item.badgeLabel} className={collapsed ? 'ml-auto lg:hidden' : 'ml-auto'} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: collapse button, Support & Logout */}
        <div className={`p-6 pl-8 border-t border-muted-border/10 space-y-6 shrink-0 ${collapsed ? 'lg:px-0' : ''}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            className={`hidden lg:flex w-full items-center gap-4 text-canvas-cream/60 hover:text-saffron-gold transition-colors focus:outline-none ${collapsed ? 'justify-center gap-0' : ''}`}
          >
            <span className="w-5 text-center text-lg leading-none shrink-0">{collapsed ? '»' : '«'}</span>
            <span className={`font-label-caps text-label-caps uppercase tracking-widest ${collapsed ? 'hidden' : ''}`}>Collapse</span>
          </button>
          <Link
            to="#"
            title="Support"
            className={`flex items-center gap-4 text-canvas-cream/60 hover:text-saffron-gold transition-colors group ${rowCentre}`}
          >
            <span className="material-symbols-outlined text-[20px] text-canvas-cream/40 group-hover:text-saffron-gold transition-colors">help_outline</span>
            <span className={`font-label-caps text-label-caps uppercase tracking-widest ${labelHide}`}>Support</span>
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center gap-4 text-red-400 hover:text-red-500 transition-colors group text-left focus:outline-none ${rowCentre}`}
          >
            <span className="material-symbols-outlined text-[20px] text-red-400/60 group-hover:text-red-500 transition-colors">logout</span>
            <span className={`font-label-caps text-label-caps uppercase tracking-widest ${labelHide}`}>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}