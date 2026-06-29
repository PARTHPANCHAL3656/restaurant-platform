import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

import { getImage } from '../utils/assetHelper';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStoryScroll = () => {
    const el = document.getElementById('story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="bg-canvas-cream text-ink-navy">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id="home">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Spice Garden Interior" 
            className="w-full h-full object-cover brightness-[0.70]" 
            src={getImage('interior-1.jpg')}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-navy/40 via-transparent to-canvas-cream"></div>
        </div>

        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <motion.span 
            className="font-label-caps text-label-caps text-canvas-cream/90 tracking-[0.25em] block mb-6 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
          >
            MICHELIN STAR CUISINE
          </motion.span>
          <motion.h1 
            className="font-serif text-display-lg-mobile md:text-display-lg text-canvas-cream mb-8 leading-[1.1] max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.165, 0.84, 0.44, 1] }}
          >
            Elevating Heritage through a<br />
            <span className="italic text-saffron-gold">Lens of Modern Luxury</span>
          </motion.h1>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <button 
              onClick={() => navigate('/menu')}
              className="bg-saffron-gold text-ink-navy font-cta-label text-cta-label px-12 py-5 uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all w-full sm:w-auto"
            >
              Explore The Menu
            </button>
            <button 
              onClick={handleStoryScroll}
              className="border border-canvas-cream text-canvas-cream font-cta-label text-cta-label px-12 py-5 uppercase tracking-widest hover:bg-canvas-cream hover:text-ink-navy transition-all w-full sm:w-auto"
            >
              Our Story
            </button>
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer text-canvas-cream hover:text-saffron-gold transition-colors"
          onClick={handleStoryScroll}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="material-symbols-outlined text-3xl">expand_more</span>
        </motion.div>
      </section>

      {/* The Story Section */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-canvas-cream" id="story">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <motion.div 
            className="lg:col-span-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="font-label-caps text-label-caps text-saffron-gold mb-4 block uppercase tracking-widest">SINCE 1924</span>
            <h2 className="font-serif text-headline-md md:text-display-lg-mobile lg:text-headline-lg text-ink-navy mb-8 leading-tight">
              A Sanctuary of Botanical Flavors
            </h2>
            <p className="font-sans text-body-lg text-subtle-text mb-8 leading-relaxed">
              For nearly a century, Spice Garden has been an architectural and culinary landmark. Our philosophy bridges the gap between ancient spice traditions and avant-garde preparation, served within a sun-drenched estate that breathes with the spirit of the earth.
            </p>
            <button 
              onClick={() => navigate('/contact')}
              className="group font-cta-label text-cta-label text-saffron-gold border-b border-transparent hover:border-saffron-gold transition-all duration-300 uppercase tracking-widest pb-1 flex items-center gap-2"
            >
              READ THE HERITAGE STORY
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
            </button>
          </motion.div>

          <motion.div 
            className="lg:col-span-5 lg:col-start-8 mt-12 lg:mt-0"
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
          >
            <div className="aspect-[4/5] overflow-hidden shadow-sm">
              <img 
                className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                alt="Exotic Spices"
                src={getImage('story-spices.jpg')}
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Menu Highlights Section */}
      <section className="bg-[#f4f3f2] py-section-gap px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="font-label-caps text-label-caps text-saffron-gold block mb-2 uppercase tracking-widest">Signature Selections</span>
              <h2 className="font-serif text-headline-md md:text-headline-lg text-ink-navy">Masterpieces of the Plate</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <button 
                onClick={() => navigate('/menu')}
                className="font-cta-label text-cta-label text-ink-navy hover:text-saffron-gold transition-colors flex items-center gap-2 uppercase tracking-widest border-b border-ink-navy pb-1"
              >
                VIEW FULL COLLECTION <span className="material-symbols-outlined text-sm">east</span>
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Dish 1 */}
            <motion.article 
              className="group"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-[16/10] overflow-hidden mb-6 shadow-sm">
                <img 
                  alt="Velvet Butter Chicken" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src={getImage('butter-chicken.jpg')}
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-canvas-cream/90 px-4 py-1 backdrop-blur-sm border border-muted-border">
                  <span className="font-label-caps text-[10px] tracking-widest uppercase">Iconic</span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-headline-sm text-ink-navy mb-2 group-hover:text-saffron-gold transition-colors">Velvet Butter Chicken</h3>
                  <p className="font-sans text-body-md text-subtle-text max-w-md leading-relaxed">
                    Free-range chicken simmered for 24 hours in a charcoal-smoked tomato velouté, finished with aged saffron cream.
                  </p>
                </div>
                <span className="font-serif text-saffron-gold font-semibold text-xl">$42</span>
              </div>
            </motion.article>

            {/* Dish 2 */}
            <motion.article 
              className="group mt-12 lg:mt-0"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative aspect-[16/10] overflow-hidden mb-6 shadow-sm">
                <img 
                  alt="Heritage Lamb Biryani" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src={getImage('lamb-biryani.jpg')}
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-canvas-cream/90 px-4 py-1 backdrop-blur-sm border border-muted-border">
                  <span className="font-label-caps text-[10px] tracking-widest uppercase">Heritage</span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-headline-sm text-ink-navy mb-2 group-hover:text-saffron-gold transition-colors">Heritage Lamb Biryani</h3>
                  <p className="font-sans text-body-md text-subtle-text max-w-md leading-relaxed">
                    Long-grain Basmati steamed in a sealed terracotta pot with grass-fed lamb, caramelized onions, and 12-spice blend.
                  </p>
                </div>
                <span className="font-serif text-saffron-gold font-semibold text-xl">$48</span>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* Experience Bento Grid */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-canvas-cream" id="experience">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-label-caps text-saffron-gold mb-2 block tracking-[0.25em] uppercase">CURATED ATMOSPHERE</span>
            <h2 className="font-serif text-headline-md md:text-headline-lg text-ink-navy">The Garden Experience</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Large Bento item */}
            <motion.div 
              className="lg:col-span-8 overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[650px] shadow-sm relative group"
              initial={{ opacity: 0, scale: 1.02 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <img 
                alt="Interior Architecture" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                src={getImage('interior-2.jpg')}
                loading="lazy"
              />
            </motion.div>

            {/* Split right column items */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <motion.div 
                className="overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[317px] shadow-sm relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <img 
                  alt="Table Setting" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                  src={getImage('table-setting.jpg')}
                  loading="lazy"
                />
              </motion.div>
              <motion.div 
                className="overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[317px] shadow-sm relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <img 
                  alt="Mixology Craft" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                  src={getImage('cocktails.jpg')}
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking CTA Section */}
      <section className="relative py-section-gap bg-ink-navy overflow-hidden" id="reservation">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-saffron-gold/30 via-transparent to-transparent animate-pulse"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-margin-mobile text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="font-serif text-display-lg-mobile md:text-headline-lg text-canvas-cream mb-6">Secure Your Table</h2>
            <p className="font-sans text-body-lg text-canvas-cream/70 mb-10 max-w-2xl mx-auto">
              Join us for an unforgettable evening under the canopy of flavors. Reservations are recommended two weeks in advance.
            </p>
            <button
              onClick={() => navigate('/reservation')}
              className="bg-saffron-gold text-ink-navy font-cta-label text-cta-label px-12 py-5 uppercase tracking-widest hover:bg-canvas-cream hover:text-ink-navy transition-all duration-300 shadow-xl"
            >
              REQUEST RESERVATION
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
