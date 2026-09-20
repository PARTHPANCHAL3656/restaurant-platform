import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useStaff } from '../context/StaffContext';

export default function Footer() {
  const { restaurantInfo } = useStaff();
  const navigate = useNavigate();
  const location = useLocation();

  const handleExperienceClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: 'experience' } });
    } else {
      const element = document.getElementById('experience');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full mt-section-gap border-t border-muted-border bg-surface text-ink-navy">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter">
        
        {/* 1. Brand Section */}
        <div className="md:col-span-3 flex flex-col space-y-6">
          <Link to="/" className="w-fit block" aria-label="Spice Garden home">
            <BrandLogo colorClassName="text-ink-navy" />
          </Link>
          <p className="font-body-md text-subtle-text text-xs tracking-wider">
            Est. 1924 • Michelin Starred Fine Dining
          </p>
          <div className="flex space-x-5 text-ink-navy">
            <a href={restaurantInfo.links.facebook} target="_blank" rel="noreferrer" className="hover:text-saffron-gold transition-colors flex items-center gap-1.5" aria-label="Facebook">
              <span className="material-symbols-outlined text-[20px]">share</span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest hidden md:inline">Facebook</span>
            </a>
            <a href={restaurantInfo.links.instagram} target="_blank" rel="noreferrer" className="hover:text-saffron-gold transition-colors flex items-center gap-1.5" aria-label="Instagram">
              <span className="material-symbols-outlined text-[20px]">public</span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest hidden md:inline">Instagram</span>
            </a>
          </div>
        </div>

        {/* 2. Contact Section */}
        <div className="md:col-span-3 space-y-6">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Contact &amp; Location</h3>
          <div className="font-body-md text-subtle-text text-sm leading-[1.7] space-y-3">
            <p>
              {restaurantInfo.address}
            </p>
            <p>
              <span className="font-semibold text-ink-navy">Phone:</span>{' '}
              <a href={`tel:${restaurantInfo.primaryPhone}`} className="hover:text-saffron-gold transition-colors">
                {restaurantInfo.primaryPhone}
              </a>
            </p>
            <p>
              <span className="font-semibold text-ink-navy">Email:</span>{' '}
              <a href={`mailto:${restaurantInfo.email}`} className="hover:text-saffron-gold transition-colors">
                {restaurantInfo.email}
              </a>
            </p>
          </div>
        </div>

        {/* 3. Opening Hours Section */}
        <div className="md:col-span-3 space-y-6">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Opening Hours</h3>
          <div className="font-body-md text-subtle-text text-sm leading-[1.7] space-y-3">
            {restaurantInfo.openingHours.map((oh, i) => (
              <div key={i}>
                <p className="font-semibold text-ink-navy">{oh.days}</p>
                <p>{oh.hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Quick Links Section */}
        <div className="md:col-span-3 space-y-6">
          <h3 className="font-label-caps text-[11px] text-ink-navy tracking-widest uppercase border-b border-muted-border pb-2">Quick Navigation</h3>
          <nav className="flex flex-col space-y-2 font-body-md text-sm text-subtle-text">
            <Link to="/" className="hover:text-saffron-gold transition-colors">Home</Link>
            <a href="#experience" onClick={handleExperienceClick} className="hover:text-saffron-gold transition-colors">Experience</a>
            <Link to="/menu" className="hover:text-saffron-gold transition-colors">Menu</Link>
            <Link to="/reservation" className="hover:text-saffron-gold transition-colors">Reservation</Link>
            <Link to="/order-status" className="hover:text-saffron-gold transition-colors">Track Order</Link>
            <Link to="/gallery" className="hover:text-saffron-gold transition-colors">Gallery</Link>
            <Link to="/contact" className="hover:text-saffron-gold transition-colors">Contact</Link>
          </nav>
        </div>

        {/* Bottom copyright row */}
        <div className="md:col-span-12 mt-16 pt-8 border-t border-muted-border flex flex-col md:flex-row justify-between items-center text-[10px] font-label-caps text-subtle-text tracking-widest gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>© 2024 SPICE GARDEN RESTAURANT GROUP. ALL RIGHTS RESERVED.</span>
            <span className="hidden md:inline opacity-30">|</span>
              <Link to="#" className="hover:text-ink-navy transition-colors py-2 px-1 -mx-1">PRIVACY POLICY</Link>
              <span className="hidden md:inline opacity-30">|</span>
              <Link to="#" className="hover:text-ink-navy transition-colors py-2 px-1 -mx-1">TERMS OF SERVICE</Link>
          </div>
          
          <Link 
            to="/staff/login" 
            className="hover:text-ink-navy transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[12px]">lock</span> STAFF LOGIN
          </Link>
        </div>

      </div>
    </footer>
  );
}
