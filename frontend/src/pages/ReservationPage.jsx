import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { useStaff } from '../context/StaffContext';
import api from '../utils/api';

import { getImage } from '../utils/assetHelper';

export default function ReservationPage() {
  const navigate = useNavigate();
  const { addReservation } = useStaff();
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    guests: '2',
    timeSlot: '',
    requests: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTimeSelect = (slot) => {
    setFormData(prev => ({
      ...prev,
      timeSlot: slot
    }));
    if (errors.timeSlot) {
      setErrors(prev => ({ ...prev, timeSlot: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          date: formData.date,
          time: formData.timeSlot,
          guests: parseInt(formData.guests) || 2
        };
        const response = await api.post('/api/reservations', payload);
        

        // Navigate to ReservationSuccess page and pass reservation details via state
        navigate('/reservation-success', { 
          state: { 
            reservation: {
              ...formData,
              id: response.data._id
            } 
          } 
        });
      } catch (err) {
        setSubmitError(err.message || 'Failed to submit reservation. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const formattedDate = formData.date 
    ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '--';

  return (
    <div className="bg-canvas-cream text-ink-navy min-h-screen pt-20">
      {/* Header */}
      <header className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center border-b border-muted-border">
        <span className="font-label-caps text-label-caps text-saffron-gold tracking-[0.3em] uppercase mb-4 block">Table Booking</span>
        <h1 className="font-serif text-display-lg-mobile md:text-display-lg mb-6 max-w-3xl mx-auto">Savor the Art of Spice</h1>
        <p className="font-sans text-body-lg text-subtle-text max-w-2xl mx-auto">
          Secure your table at Spice Garden for an unforgettable Michelin-starred journey through India's rich culinary heritage.
        </p>
      </header>

      {/* Main Reservation Flow */}
      <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Reservation Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-12 bg-white/50 p-6 md:p-10 border border-muted-border shadow-sm">
            {/* Step 1: Details */}
            <section className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="w-8 h-8 rounded-full border border-ink-navy flex items-center justify-center font-label-caps text-xs">01</span>
                <h2 className="font-serif text-headline-sm">Your Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Full Name</label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none"
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-1 font-sans">{errors.name}</p>}
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Phone Number</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none"
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1 font-sans">{errors.phone}</p>}
                </div>
              </div>
            </section>

            {/* Step 2: Date & Guests */}
            <section className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="w-8 h-8 rounded-full border border-ink-navy flex items-center justify-center font-label-caps text-xs">02</span>
                <h2 className="font-serif text-headline-sm">Select Date &amp; Guests</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Preferred Date</label>
                  <input 
                    type="date"
                    name="date"
                    min={todayStr}
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none cursor-pointer"
                  />
                  {errors.date && <p className="text-red-600 text-xs mt-1 font-sans">{errors.date}</p>}
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-subtle-text uppercase block mb-2">Number of Guests</label>
                  <select 
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-ink-navy py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md outline-none cursor-pointer appearance-none"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="6">6+ People</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Step 3: Choose Time */}
            <section className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="w-8 h-8 rounded-full border border-ink-navy flex items-center justify-center font-label-caps text-xs">03</span>
                <h2 className="font-serif text-headline-sm">Choose Time</h2>
              </div>
              {errors.timeSlot && <p className="text-red-600 text-xs mt-1 font-sans">{errors.timeSlot}</p>}
              
              <div>
                <p className="font-label-caps text-label-caps text-subtle-text uppercase mb-3">Lunch slots</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['12:00 PM', '1:00 PM', '2:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleTimeSelect(slot)}
                      className={`py-3 text-center border font-body-md transition-all uppercase tracking-wider text-xs focus:outline-none ${
                        formData.timeSlot === slot 
                          ? 'bg-ink-navy text-canvas-cream border-ink-navy' 
                          : 'border-muted-border hover:border-ink-navy text-ink-navy'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <p className="font-label-caps text-label-caps text-subtle-text uppercase mb-3">Dinner slots</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleTimeSelect(slot)}
                      className={`py-3 text-center border font-body-md transition-all uppercase tracking-wider text-xs focus:outline-none ${
                        formData.timeSlot === slot 
                          ? 'bg-ink-navy text-canvas-cream border-ink-navy' 
                          : 'border-muted-border hover:border-ink-navy text-ink-navy'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Step 4: Special Requests */}
            <section className="space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="w-8 h-8 rounded-full border border-ink-navy flex items-center justify-center font-label-caps text-xs">04</span>
                <h2 className="font-serif text-headline-sm">Special Requests</h2>
              </div>
              <textarea 
                name="requests"
                value={formData.requests}
                onChange={handleInputChange}
                placeholder="Allergies, anniversaries, or preferred seating..." 
                rows="4"
                className="w-full bg-transparent border border-muted-border p-4 focus:outline-none focus:border-ink-navy transition-colors font-body-md resize-none outline-none"
              />
            </section>
            
            {submitError && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-sans tracking-wide">
                {submitError}
              </div>
            )}

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-ink-navy text-canvas-cream font-cta-label text-cta-label py-5 uppercase tracking-[0.2em] hover:bg-saffron-gold hover:text-ink-navy transition-all duration-500 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Requesting...' : 'Request Reservation'}
            </button>
          </form>

          {/* Summary Sidebar Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            <div className="bg-[#f4f3f2] border border-muted-border p-8 md:p-12 space-y-8 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-serif text-headline-sm text-ink-navy">Reservation Summary</h3>
                <div className="h-px bg-muted-border w-16"></div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-caps text-[10px] text-subtle-text uppercase mb-1 tracking-wider">Guest</p>
                    <p className="font-serif text-lg italic">{formData.name || '--'}</p>
                  </div>
                  <span className="material-symbols-outlined text-saffron-gold">person</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-caps text-[10px] text-subtle-text uppercase mb-1 tracking-wider">Date &amp; Time</p>
                    <p className="font-serif text-lg italic">
                      {formattedDate} {formData.timeSlot ? `@ ${formData.timeSlot}` : ''}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-saffron-gold">calendar_today</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-caps text-[10px] text-subtle-text uppercase mb-1 tracking-wider">Party Size</p>
                    <p className="font-serif text-lg italic">
                      {formData.guests} {formData.guests === '1' ? 'Person' : 'People'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-saffron-gold">groups</span>
                </div>
              </div>

              {/* Cover Image Thumbnail */}
              <div className="relative group overflow-hidden border border-muted-border mt-8">
                <div className="aspect-[1.79] w-full overflow-hidden">
                  <img 
                    src={getImage('table-setting.jpg')} 
                    alt="Interior Gallery" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-muted-border">
                <p className="font-label-caps text-[10px] text-subtle-text leading-relaxed uppercase tracking-wider">
                  * Note: This is a reservation request. Our team will contact you within 2 hours to confirm your booking. For parties larger than 8, please contact us directly.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
