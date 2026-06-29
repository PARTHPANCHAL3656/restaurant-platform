import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it is a chunk load error
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      /Failed to fetch dynamically imported module/i.test(error.message) ||
      /Loading chunk/i.test(error.message);
      
    if (isChunkError) {
      const reloaded = sessionStorage.getItem('chunk_load_reloaded');
      if (!reloaded) {
        sessionStorage.setItem('chunk_load_reloaded', 'true');
        console.warn('Chunk load error detected. Reloading page...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Clear reload flag after rendering recovery UI so subsequent navigation can try again
      sessionStorage.removeItem('chunk_load_reloaded');
      
      return (
        <div className="min-h-screen bg-canvas-cream flex flex-col items-center justify-center p-8 text-center select-none">
          <span className="material-symbols-outlined text-4xl text-saffron-gold mb-4">error_outline</span>
          <h2 className="font-serif text-2xl text-ink-navy mb-2">Something went wrong</h2>
          <p className="font-sans text-xs text-subtle-text max-w-md mb-6 leading-relaxed">
            The page failed to load or encountered a temporary issue. Please try refreshing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-ink-navy text-canvas-cream font-cta-label text-cta-label uppercase tracking-widest hover:bg-saffron-gold hover:text-ink-navy transition-colors cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
