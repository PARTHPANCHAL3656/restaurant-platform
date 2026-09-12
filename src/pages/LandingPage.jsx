import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';

// LandingPageContent is deliberately client-only (its whileInView animations
// depend on IntersectionObserver, a browser-only API) and is meant to stay
// suspended (Suspense fallback={null}) during server rendering — it's
// below-the-fold, non-LCP content, so this is correct behavior, not a gap.
//
// The problem: a real `lazy(() => import(...))` can end up resolving eagerly
// inside the production SSR bundle if the bundler inlines the module instead
// of keeping it a genuinely separate async chunk. When that happens its real
// code runs in Node for the first time, throws (no IntersectionObserver in
// Node), and React silently falls back per-boundary — this is React error
// #419 ("server could not finish this Suspense boundary... switched to
// client rendering").
//
// Fix: on the server, use a lazy() whose promise never resolves, so this
// boundary is *guaranteed* to stay suspended and render its null fallback,
// regardless of how the bundler treats the import. Client behavior is
// completely unchanged.
const LandingPageContent = typeof window !== 'undefined'
  ? lazy(() => import('./LandingPageContent'))
  : lazy(() => new Promise(() => {})); // intentionally never resolves during SSR

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStoryScroll = () => {
    const el = document.getElementById('story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
            src="/hero-lcp.webp"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-navy/40 via-transparent to-canvas-cream"></div>
        </div>

        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <span 
            className="hero-fade-up hero-fade-up-delay-1 font-label-caps text-label-caps text-canvas-cream/90 tracking-[0.25em] block mb-6 uppercase"
          >
            MICHELIN STAR CUISINE
          </span>
          <h1 
            className="hero-fade-up hero-fade-up-delay-2 font-serif text-display-lg-mobile md:text-display-lg text-canvas-cream mb-8 leading-[1.1] max-w-4xl mx-auto"
          >
            Elevating Heritage through a<br />
            <span className="italic text-saffron-gold">Lens of Modern Luxury</span>
          </h1>
          
          <div 
            className="hero-fade-up hero-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mt-12"
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
          </div>
        </div>

        <div 
          className="hero-bounce absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer text-canvas-cream hover:text-saffron-gold transition-colors"
          onClick={handleStoryScroll}
        >
          <span className="material-symbols-outlined text-3xl">expand_more</span>
        </div>
      </section>

      <Suspense fallback={null}>
        <LandingPageContent />
      </Suspense>
    </div>
  );
}