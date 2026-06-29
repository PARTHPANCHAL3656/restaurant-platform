import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useCart } from '../context/CartContext';

export default function MobileHeader({ onMenuToggle, onCartToggle }) {
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="lg:hidden fixed top-0 w-full z-40 bg-canvas-cream/90 backdrop-blur-md border-b border-muted-border">
      <div className="flex justify-between items-center px-4 py-3 max-w-container-max mx-auto">
        {/* BrandLogo */}
        <Link to="/" className="flex items-center text-ink-navy">
          <BrandLogo colorClassName="text-ink-navy" />
        </Link>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Cart Icon */}
          <button 
            onClick={onCartToggle} 
            className="relative p-2 text-ink-navy hover:text-saffron-gold transition-colors focus:outline-none"
            aria-label="Open cart drawer"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-saffron-gold text-canvas-cream text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger Trigger */}
          <button 
            onClick={onMenuToggle} 
            className="text-ink-navy p-2 flex items-center gap-1.5 focus:outline-none hover:text-saffron-gold transition-colors"
            aria-label="Open menu overlay"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
            <span className="hidden md:inline font-cta-label text-cta-label uppercase tracking-wider text-xs">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
