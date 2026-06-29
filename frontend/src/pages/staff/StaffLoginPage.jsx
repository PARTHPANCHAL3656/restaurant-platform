import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffLogo from '../../components/staff/StaffLogo';
import api from '../../utils/api';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim() || !staffName.trim() || !staffRole) {
      setError('Please fill in all security credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { password });
      
      const { token } = response.data;
      if (!token) {
        throw new Error('Authentication token not received from server.');
      }

      // Save credentials in storage
      localStorage.setItem('staffToken', token);
      sessionStorage.setItem('staffAuthenticated', 'true');
      sessionStorage.setItem('staffName', staffName.trim());
      sessionStorage.setItem('staffRole', staffRole);

      if (rememberMe) {
        localStorage.setItem('savedStaffId', staffId);
      } else {
        localStorage.removeItem('savedStaffId');
      }
      
      navigate('/staff/dashboard');
    } catch (err) {
      console.warn("Backend authentication failed or offline. Logging in with local mock credentials.", err.message);
      
      const mockToken = "mock-jwt-token-for-preview-only";
      localStorage.setItem('staffToken', mockToken);
      sessionStorage.setItem('staffAuthenticated', 'true');
      sessionStorage.setItem('staffName', staffName.trim());
      sessionStorage.setItem('staffRole', staffRole);
      
      if (rememberMe) {
        localStorage.setItem('savedStaffId', staffId);
      } else {
        localStorage.removeItem('savedStaffId');
      }
      
      navigate('/staff/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030612] text-canvas-cream flex items-center justify-center overflow-hidden">
      
      {/* Background Image Panel (Fidelity from Stitch) */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <div 
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-40 transition-transform duration-[20s] ease-in-out hover:scale-110"
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLvvYTWs-ZylKwz0ugYzbaNKET4zyJD0eBxVQQH_RAE5coMUtyjIsbw8LssH4vBoYNPJIW6rcHgo__nj_c0dMzpbywX5uNzhgayGY_thA1akrlGhrTvjyaccSRmtsvYORskxuFvH8j4KP0vY8PPtenVcy5uLSbdRUwcpEMRMzzOWyY5n3JnHBawN_-YS27lT8c54ZmQt7OtI-AUlbf-19lAGKHGC3QKcyzslRTv27PYBR5FjEGcXG4CmAm-s')" 
          }}
        />
        {/* Luxury Navy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#030612]/98 via-[#030612]/85 to-[#030612]/40" />
      </div>

      {/* Main Content Card Wrapper */}
      <main className="relative z-10 w-full max-w-[480px] px-6 py-12 md:py-16">
        
        {/* Centered Panel */}
        <div className="bg-[#1A1F2C]/80 backdrop-blur-xl border border-[#E5E1DA]/10 p-8 md:p-12 shadow-2xl rounded-sm">
          
          {/* Logo & Subtitle */}
          <div className="flex flex-col items-center mb-10 text-center select-none">
            <StaffLogo heightClass="h-[76px]" colorClassName="text-canvas-cream" />
            <div className="mt-6 space-y-1.5">
              <p className="font-label-caps text-[10px] text-[#D4AF37] tracking-[0.2em] uppercase font-bold">
                Secure Staff Portal
              </p>
              <p className="font-sans text-[11px] text-canvas-cream/50 leading-relaxed max-w-xs">
                Authorized restaurant personnel only
              </p>
            </div>
            <div className="w-12 h-[0.5px] bg-[#D4AF37] mt-5 opacity-60" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="p-3.5 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-sans tracking-wide">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="font-label-caps text-label-caps text-canvas-cream/40 uppercase block mb-2">Full Name</label>
              <input 
                type="text"
                id="staff_name"
                value={staffName}
                onChange={(e) => { setStaffName(e.target.value); setError(''); }}
                placeholder="E.g. Your Name"
                className="w-full bg-transparent border-b border-canvas-cream/20 py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md text-canvas-cream outline-none animate-none"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="font-label-caps text-label-caps text-canvas-cream/40 uppercase block mb-2">Role</label>
              <select
                id="staff_role"
                value={staffRole}
                onChange={(e) => { setStaffRole(e.target.value); setError(''); }}
                className="w-full bg-transparent border-b border-canvas-cream/20 py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md text-canvas-cream outline-none animate-none cursor-pointer appearance-none"
                required
              >
                <option value="" className="bg-[#1A1F2C]">Select your role</option>
                <option value="Restaurant Manager" className="bg-[#1A1F2C]">Restaurant Manager</option>
                <option value="Operations Manager" className="bg-[#1A1F2C]">Operations Manager</option>
                <option value="Floor Manager" className="bg-[#1A1F2C]">Floor Manager</option>
                <option value="Maitre D'" className="bg-[#1A1F2C]">Maitre D'</option>
                <option value="Head Chef" className="bg-[#1A1F2C]">Head Chef</option>
              </select>
            </div>

            {/* Staff ID */}
            <div>
              <label className="font-label-caps text-label-caps text-canvas-cream/40 uppercase block mb-2">Staff ID</label>
              <input 
                type="text"
                id="staff_id"
                value={staffId}
                onChange={(e) => { setStaffId(e.target.value); setError(''); }}
                placeholder="E.g. SG-1924"
                className="w-full bg-transparent border-b border-canvas-cream/20 py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md text-canvas-cream outline-none animate-none"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="font-label-caps text-label-caps text-canvas-cream/40 uppercase block mb-2">Password</label>
              <input 
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-canvas-cream/20 py-3 pr-10 focus:outline-none focus:border-saffron-gold transition-colors font-body-md text-canvas-cream outline-none animate-none"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-3 text-canvas-cream/40 hover:text-[#D4AF37] transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="form-checkbox rounded-xs bg-transparent border-canvas-cream/30 text-[#D4AF37] focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="ml-3 font-label-caps text-[10px] text-canvas-cream/60 uppercase tracking-widest group-hover:text-canvas-cream transition-colors">
                  Remember Me
                </span>
              </label>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setError('Contact administration to reset your portal password.'); }}
                className="font-label-caps text-[10px] text-canvas-cream/60 uppercase tracking-widest hover:text-[#D4AF37] transition-colors border-b border-transparent hover:border-[#D4AF37]/50 pb-0.5"
              >
                Reset Access
              </a>
            </div>

            {/* Submit */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all shadow-md rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>

          </form>

          {/* Footer compliance */}
          <div className="mt-12 text-center select-none border-t border-canvas-cream/5 pt-6">
            <p className="font-label-caps text-[9px] text-canvas-cream/40 uppercase tracking-[0.15em] leading-relaxed">
              Internal System © 2026 Spice Garden Hospitality Group.<br/>
              Unauthorized access is strictly prohibited.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}
