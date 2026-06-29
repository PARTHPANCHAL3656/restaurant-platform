import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

import { getImage } from '../utils/assetHelper';

// Reusable Image Card with premium mouse-movement parallax hover effect
function GalleryImageCard({ src, alt, title, subtitle, aspect = 'aspect-square' }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setCoords({ x: x * 15, y: y * 15 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative overflow-hidden ${aspect} bg-[#eeeeed] border border-muted-border cursor-pointer`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
          style={{
            transform: isHovered 
              ? `scale(1.08) translate3d(${coords.x}px, ${coords.y}px, 0)` 
              : 'scale(1) translate3d(0, 0, 0)',
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)'
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-ink-navy/5 group-hover:bg-transparent transition-colors duration-500" />
      </div>
      
      {title && (
        <div className="space-y-1">
          <h3 className="font-serif text-headline-sm text-ink-navy">{title}</h3>
          {subtitle && <p className="font-label-caps text-label-caps text-saffron-gold uppercase">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing, ${email}!`);
      setEmail('');
    }
  };

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      
      {/* Narrative Intro */}
      <section className="px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto text-center">
        <span className="font-label-caps text-label-caps text-saffron-gold uppercase tracking-[0.2em] mb-4 block">Visual Narrative</span>
        <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-ink-navy mb-8 leading-tight">The Art of the Garden</h1>
        <p className="font-sans text-body-lg text-subtle-text max-w-2xl mx-auto">
          A curated glimpse into our world. From the architectural serenity of our dining room to the meticulous craft within our kitchen, every frame tells a story of heritage and modern culinary artistry.
        </p>
      </section>

      {/* Main Feature Horizontal Image */}
      <section className="px-margin-mobile md:px-margin-desktop pb-16 max-w-container-max mx-auto">
        <div className="relative overflow-hidden aspect-[21/9] group border border-muted-border shadow-sm">
          <img 
            alt="Spice Garden Interior" 
            className="w-full h-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-103" 
            src={getImage('interior-1.jpg')}
          />
          <div className="absolute inset-0 bg-ink-navy/20 group-hover:bg-ink-navy/10 transition-colors duration-700"></div>
          <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 text-canvas-cream max-w-lg">
            <span className="font-label-caps text-label-caps uppercase mb-2 block border-l-2 border-saffron-gold pl-4 text-xs tracking-widest text-canvas-cream/90">The Dining Room</span>
            <h2 className="font-serif text-headline-sm md:text-headline-md italic">An atmosphere designed for lingering.</h2>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Vertical Craft item */}
          <div className="md:col-span-4">
            <GalleryImageCard 
              src={getImage('chef-prep.jpg')}
              alt="Chef Prep Craft"
              title="The Craft"
              subtitle="Culinary Precision"
              aspect="aspect-[3/4]"
            />
          </div>

          {/* Right items */}
          <div className="md:col-span-8 flex flex-col gap-gutter">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
              <div className="space-y-4">
                <GalleryImageCard 
                  src={getImage('gallery-detail.jpg')}
                  alt="Interior Details"
                  aspect="aspect-square"
                />
                <p className="font-serif text-base italic text-subtle-text leading-relaxed">
                  "Design is the silent ambassador of your brand."
                </p>
              </div>
              <div>
                <GalleryImageCard 
                  src={getImage('gallery-mixology.jpg')}
                  alt="Mixology"
                  title="Elixirs"
                  subtitle="Botanical Mixology"
                  aspect="aspect-square"
                />
              </div>
            </div>

            <div>
              <GalleryImageCard 
                src={getImage('gallery-terrace.jpg')}
                alt="The Terrace"
                title="The Terrace"
                subtitle="Alfresco Serenity"
                aspect="aspect-[21/9]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Quote Banner */}
      <section className="bg-[#f4f3f2] py-section-gap px-margin-mobile md:px-margin-desktop my-12 border-t border-b border-muted-border">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="material-symbols-outlined text-saffron-gold text-5xl">format_quote</span>
          <blockquote className="font-serif text-headline-md md:text-headline-lg text-ink-navy leading-snug italic">
            "We don't just serve food; we curate moments that linger on the palate and in the memory."
          </blockquote>
          <cite className="font-label-caps text-label-caps tracking-widest text-ink-navy block not-italic">
            Chef Devanshu Sharma — Executive Chef
          </cite>
        </div>
      </section>

      {/* Large scale narrative details */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
        <div>
          <GalleryImageCard 
            src={getImage('gallery-ingredients.jpg')}
            alt="Authentic Ingredients"
            aspect="aspect-[4/5]"
          />
        </div>
        <div className="space-y-6 lg:pl-12">
          <span className="font-label-caps text-label-caps text-saffron-gold uppercase tracking-wider block">The Foundation</span>
          <h2 className="font-serif text-headline-md md:text-headline-lg text-ink-navy">Ingredients with Heritage</h2>
          <p className="font-sans text-body-lg text-subtle-text leading-relaxed">
            Our kitchen is a laboratory of taste, where ancient techniques meet contemporary aesthetics. Every spice is sourced from small-batch estates in India, ensuring the soul of the dish remains authentic while the presentation pushes the boundaries of modern fine dining.
          </p>
          <button 
            onClick={() => navigate('/menu')}
            className="inline-block font-cta-label text-cta-label text-saffron-gold uppercase border-b border-saffron-gold pb-1 hover:text-ink-navy hover:border-ink-navy transition-all duration-300 tracking-wider focus:outline-none"
          >
            Explore the Menu
          </button>
        </div>
      </section>

      {/* Newsletter Signup Banner */}
      <section className="px-margin-mobile md:px-margin-desktop py-12">
        <div className="bg-ink-navy text-canvas-cream p-8 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12 max-w-container-max mx-auto shadow-md">
          <div className="max-w-md space-y-4 text-center lg:text-left">
            <h2 className="font-serif text-headline-md text-canvas-cream leading-tight">Join the Inner Circle</h2>
            <p className="font-sans text-body-md opacity-70 leading-relaxed">
              Be the first to hear about seasonal menu launches, chef's table events, and exclusive culinary experiences at Spice Garden.
            </p>
          </div>
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSubscribe} className="flex flex-col gap-6">
              <div className="border-b border-canvas-cream/30 pb-2">
                <label className="font-label-caps text-[10px] uppercase text-canvas-cream/50 tracking-wider mb-1 block">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="bg-transparent border-none w-full text-canvas-cream focus:ring-0 placeholder:text-canvas-cream/20 font-body-md outline-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="bg-saffron-gold text-ink-navy px-8 py-4 font-cta-label text-cta-label uppercase tracking-widest self-start hover:bg-canvas-cream hover:text-ink-navy transition-colors duration-300 focus:outline-none"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
