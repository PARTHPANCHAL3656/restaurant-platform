import axios from "axios"

// -------------------------------------------------------
// DEPLOYMENT NOTE:
// import.meta.env.VITE_API_URL is set in frontend/.env
// DEV:        http://localhost:5000
// PRODUCTION: https://your-render-app.onrender.com
//
// Before deploying, add VITE_API_URL to Vercel/Netlify's
// Environment Variables panel in their dashboard.
// Do NOT rely on the .env file being uploaded — it won't be.
// -------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Automatically attach the right token to every request
api.interceptors.request.use((config) => {
  // Staff routes: token stored in localStorage after login
  const staffToken = localStorage.getItem("staffToken")

  // Customer routes: token comes from QR URL → ?token=eyJ...
  const params = new URLSearchParams(window.location.search)
  const tableToken = params.get("token")

  if (staffToken) {
    config.headers.Authorization = `Bearer ${staffToken}`
  } else if (tableToken) {
    config.headers.Authorization = `Bearer ${tableToken}`
  }

  return config
})

export default api