import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';

export default function MobileMenu({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId) => {
    onClose();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); // Wait for menu close transition
    }
  };

  const menuVariants = {
    closed: {
      y: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const linkVariants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 w-full h-screen bg-ink-navy text-canvas-cream flex flex-col justify-between p-8"
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <BrandLogo colorClassName="text-canvas-cream" />
            <button 
              onClick={onClose} 
              className="text-canvas-cream p-2 focus:outline-none"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col space-y-6 my-auto pt-8">
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive && location.hash === '' ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Home
              </NavLink>
            </motion.div>
            <motion.div variants={linkVariants}>
              <button 
                onClick={() => handleNavClick('experience')}
                className="font-display-lg text-4xl block text-left w-full text-canvas-cream/70 hover:text-saffron-gold transition-colors"
              >
                Experience
              </button>
            </motion.div>
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/menu" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Menu
              </NavLink>
            </motion.div>
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/reservation" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Reservation
              </NavLink>
            </motion.div>
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/order-status" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Track Order
              </NavLink>
            </motion.div>
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/gallery" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Gallery
              </NavLink>
            </motion.div>
            <motion.div variants={linkVariants}>
              <NavLink 
                to="/contact" 
                onClick={onClose}
                className={({ isActive }) => 
                  `font-display-lg text-4xl block hover:text-saffron-gold transition-colors ${
                    isActive ? 'text-saffron-gold' : 'text-canvas-cream/70'
                  }`
                }
              >
                Contact
              </NavLink>
            </motion.div>
          </nav>

          {/* Footer Actions */}
          <div className="flex flex-col space-y-6 pt-6 border-t border-canvas-cream/10">
            <Link 
              to="/reservation" 
              onClick={onClose}
              className="bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[55px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all"
            >
              Reserve A Table
            </Link>

            <Link 
              to="/staff/login" 
              onClick={onClose} 
              className="font-label-caps text-label-caps text-canvas-cream/40 hover:text-saffron-gold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">lock</span> STAFF LOGIN
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
