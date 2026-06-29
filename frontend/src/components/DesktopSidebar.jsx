import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 w-[300px] h-screen bg-ink-navy text-canvas-cream border-r border-canvas-cream/10 z-30 pt-14 pb-8 justify-between overflow-y-auto hide-scrollbar select-none">
      
      {/* 1. BRAND SECTION */}
      <div className="text-center flex flex-col items-center">
        <Link to="/" className="inline-block text-canvas-cream hover:opacity-90 transition-opacity">
          <BrandLogo colorClassName="text-canvas-cream" heightClass="h-[96px]" />
        </Link>
        <p className="font-body-md text-xs text-canvas-cream/50 tracking-wider mt-8">
          Est. 1924 • Michelin Starred
        </p>
      </div>

      {/* 2. PRIMARY NAVIGATION & 3. CTA CONTAINER */}
      <div className="flex flex-col mt-10">
        <nav className="flex flex-col space-y-6 pl-8 mb-12">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive && location.hash === '' ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Home
          </NavLink>
          <button 
            onClick={() => handleNavClick('experience')}
            className="font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors text-left text-canvas-cream/70 cursor-pointer"
          >
            Experience
          </button>
          <NavLink 
            to="/menu" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Menu
          </NavLink>
          <NavLink 
            to="/reservation" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Reservation
          </NavLink>
          <NavLink 
            to="/order-status" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Track Order
          </NavLink>
          <NavLink 
            to="/gallery" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Gallery
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => 
              `font-label-caps text-label-caps tracking-widest uppercase hover:text-saffron-gold transition-colors ${
                isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* RESERVE BUTTON (48px spacing from nav) */}
        <div className="flex justify-center w-full">
          <Link 
            to="/reservation" 
            className="bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] w-[85%] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all shadow-md"
          >
            Reserve Table
          </Link>
        </div>
      </div>

      {/* 4. STAFF LOGIN (Pinned to absolute bottom via mt-auto) */}
      <div className="mt-auto flex flex-col items-center">
        <Link 
          to="/staff/login" 
          className="font-label-caps text-label-caps text-canvas-cream/40 hover:text-saffron-gold transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <span className="material-symbols-outlined text-sm">lock</span> STAFF LOGIN
        </Link>
      </div>

    </aside>
  );
}
