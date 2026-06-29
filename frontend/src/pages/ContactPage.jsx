import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

import { getImage } from '../utils/assetHelper';

import { useStaff } from '../context/StaffContext';

export default function ContactPage() {
  const navigate = useNavigate();
  const { restaurantInfo } = useStaff();

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      
      {/* Intro Header */}
      <section className="px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto border-b border-muted-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-end">
          <div className="lg:col-span-7">
            <span className="font-label-caps text-label-caps text-saffron-gold uppercase mb-4 block tracking-widest">Get in Touch</span>
            <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-ink-navy leading-tight">
              We look forward to <br /> welcoming you.
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pb-4">
            <p className="font-sans text-body-lg text-subtle-text max-w-md leading-relaxed">
              Experience the finest modern Indian cuisine in the heart of London. Join us for an unforgettable culinary journey.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Details */}
      <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-stretch">
          
          {/* Contact Cards Column */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            
            {/* Info Box */}
            <div className="bg-white p-8 md:p-10 border border-muted-border shadow-sm space-y-8 flex-grow">
              <div className="space-y-3">
                <h3 className="font-label-caps text-[10px] text-subtle-text tracking-widest uppercase">The Garden Estate</h3>
                <p className="font-serif text-headline-sm text-ink-navy font-semibold leading-snug">{restaurantInfo.address}</p>
                <a href={`tel:${restaurantInfo.phone}`} className="font-body-md text-saffron-gold hover:underline transition-all block font-semibold">
                  {restaurantInfo.phone}
                </a>
              </div>

              <div className="pt-8 border-t border-muted-border space-y-4">
                <h3 className="font-label-caps text-[10px] text-subtle-text tracking-widest uppercase">Opening Hours</h3>
                {restaurantInfo.openingHours.map((oh, i) => (
                  <div key={i} className="flex justify-between text-sm font-body-md">
                    <span className="text-subtle-text">{oh.days}</span>
                    <span className="text-ink-navy font-semibold">{oh.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inquiries Box */}
            <div className="bg-ink-navy p-8 md:p-10 text-canvas-cream space-y-6 shadow-sm">
              <h3 className="font-label-caps text-label-caps text-saffron-gold tracking-widest uppercase">Specific Inquiries</h3>
              <div className="space-y-6">
                <div>
                  <p className="font-sans text-xs opacity-70 mb-1">General &amp; Press</p>
                  <a href={`mailto:${restaurantInfo.email}`} className="font-serif text-lg md:text-xl text-canvas-cream hover:text-saffron-gold transition-colors block">
                    {restaurantInfo.email}
                  </a>
                </div>
                <div>
                  <p className="font-sans text-xs opacity-70 mb-1">Private Events</p>
                  <a href="mailto:events@spicegarden.com" className="font-serif text-lg md:text-xl text-canvas-cream hover:text-saffron-gold transition-colors block">
                    events@spicegarden.com
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Map Column */}
          <div className="lg:col-span-8 relative min-h-[450px] border border-muted-border overflow-hidden shadow-sm">
            <div className="w-full h-full bg-surface-container relative">
              <img 
                src={getImage('contact-map.jpg')} 
                alt="Spice Garden Location Map Mayfair" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1500ms]"
              />
              {/* Pulsing Pin Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <motion.div 
                  className="w-12 h-12 bg-ink-navy rounded-full flex items-center justify-center shadow-xl border border-saffron-gold"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                >
                  <span className="material-symbols-outlined text-saffron-gold text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    restaurant
                  </span>
                </motion.div>
                <div className="mt-4 bg-canvas-cream px-6 py-2 shadow-lg border border-muted-border inline-block">
                  <p className="font-label-caps text-label-caps text-ink-navy uppercase whitespace-nowrap tracking-wider text-xs">
                    Spice Garden London
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* CTA Reservation Banner */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto">
        <div className="bg-[#f4f3f2] p-8 md:p-16 flex flex-col items-center text-center space-y-8 border border-muted-border shadow-sm">
          <h2 className="font-serif text-headline-md md:text-headline-lg text-ink-navy">Secure Your Table</h2>
          <p className="font-sans text-body-lg text-subtle-text max-w-xl leading-relaxed">
            We recommend booking in advance to ensure the best experience. For parties larger than 8, please contact our events team directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/reservation')}
              className="bg-ink-navy text-canvas-cream px-12 py-5 font-cta-label text-cta-label uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-all duration-300 shadow-md w-full sm:w-auto"
            >
              Book a Reservation
            </button>
            <a 
              href="mailto:events@spicegarden.com"
              className="border border-ink-navy text-ink-navy px-12 py-5 font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 shadow-sm w-full sm:w-auto text-center block"
            >
              Private Dining
            </a>
          </div>
        </div>
      </section>

      {/* Atmospheric double images */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="h-[300px] md:h-[450px] overflow-hidden border border-muted-border">
          <img 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1500ms]" 
            src={getImage('gallery-vibe-1.jpg')} 
            alt="Plated fine dining Indian dish close-up"
            loading="lazy"
          />
        </div>
        <div className="h-[300px] md:h-[450px] overflow-hidden border border-muted-border">
          <img 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1500ms]" 
            src={getImage('gallery-vibe-2.jpg')} 
            alt="Luxury restaurant interior botanical vibe"
            loading="lazy"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
