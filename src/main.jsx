import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')

// Only "/" is prerendered. Some hosts (Cloudflare Pages) hand the prerendered
// home page to unknown paths as well, so the path is checked too - hydrating
// the home markup into any other route throws hydration errors.
if (container.hasChildNodes() && window.location.pathname === '/') {
  // Prerendered HTML was served for "/" — hydrate the existing markup
  // instead of wiping it and rendering from scratch.
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  // Plain shell was served (every other route) — mount normally.
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
