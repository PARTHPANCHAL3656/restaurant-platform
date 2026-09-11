import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')

if (container.hasChildNodes()) {
  // Prerendered HTML was served (currently only "/") — hydrate the
  // existing markup instead of wiping it and rendering from scratch.
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
