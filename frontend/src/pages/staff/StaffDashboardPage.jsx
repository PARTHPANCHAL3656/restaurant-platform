import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaff } from '../../context/StaffContext';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { tables, orders, invoices, queue, activities, staffProfile } = useStaff();

  // Computations based on shared context state
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  const activeReservations = tables.filter(t => t.status === 'reserved').length;
  const totalBookingsToday = activeReservations + 24; // Simulated baseline + active

  const activeOrdersCount = orders.length;
  const avgKitchenPrep = orders.length > 0 ? '14 Mins' : '—';
  
  const kitchenStatus = activeOrdersCount > 2 
    ? 'Busy Service' 
    : activeOrdersCount > 0 
      ? 'Active Service' 
      : 'Calm Service';

  const todayRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const quickActions = [
    { name: 'Reserve Table', icon: 'add_circle', path: '/staff/tables' },
    { name: 'Manage Orders', icon: 'receipt_long', path: '/staff/orders' },
    { name: 'Settle Payments', icon: 'payments', path: '/staff/billing' },
    { name: 'Guest Queue', icon: 'hourglass_empty', path: '/staff/guest-queue' },
    { name: 'Manage Catalog', icon: 'restaurant_menu', path: '/staff/menu' }
  ];

  return (
    <div className="px-6 md:px-12 py-8 space-y-10 max-w-container-max mx-auto">
      
      {/* Hero Welcome Row */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E1DA] pb-6">
        <div>
          <p className="font-label-caps text-[10px] text-[#D4AF37] tracking-[0.25em] uppercase font-bold mb-1">Shift active</p>
          <h1 className="font-serif text-display-lg-mobile md:text-headline-md text-ink-navy">Welcome Back, {(sessionStorage.getItem('staffName') || staffProfile.name).split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2.5 text-subtle-text font-body-md text-xs font-semibold">
          <span className="material-symbols-outlined text-lg text-[#D4AF37]">calendar_today</span>
          <span>Today is {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </section>

      {/* Today's Overview Grid */}
      <section className="space-y-6">
        <h3 className="font-serif text-headline-sm text-ink-navy border-l-2 border-[#D4AF37] pl-4">Today's Overview</h3>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Main Card: Restaurant Floor Operations */}
          <div 
            onClick={() => navigate('/staff/tables')}
          className="col-span-12 lg:col-span-7 bg-[#FDFCFB] border border-[#D4AF37]/25 p-8 shadow-sm flex flex-col justify-between min-h-[300px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-[10px] text-[#D4AF37] tracking-widest uppercase font-bold">Restaurant Operations</span>
              <span className="material-symbols-outlined text-saffron-gold text-2xl">table_restaurant</span>
            </div>
            
            <div className="flex items-end gap-10 mt-6">
              <div>
                <p className="font-serif text-6xl text-ink-navy leading-none mb-1">{occupiedTables}</p>
                <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider">Occupied Tables</p>
              </div>
              <div className="h-14 w-[1px] bg-[#E5E1DA] self-end mb-1" />
              <div>
                <p className="font-serif text-6xl text-subtle-text leading-none mb-1">{availableTables}</p>
                <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider">Available</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-[11px] font-label-caps text-subtle-text uppercase mb-2">
                <span>Occupancy Rate</span>
                <span className="font-bold text-ink-navy">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-[#f4f3f2] h-[2px] relative">
                <div 
                  className="absolute top-0 left-0 bg-[#D4AF37] h-[2px] transition-all duration-500" 
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Side Overview Cards Column */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 flex-grow">
              
              {/* Bookings */}
              <div 
                onClick={() => navigate('/staff/tables')}
                className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex justify-between items-center cursor-pointer"
              >
                <div>
                  <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">Today's Bookings</p>
                  <p className="font-serif text-3xl text-ink-navy">{totalBookingsToday}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xs text-[#D4AF37] font-label-caps">{activeReservations} Pending</p>
                  <p className="font-sans text-[11px] text-subtle-text">Floor mapping</p>
                </div>
              </div>

              {/* Kitchen */}
              <div 
                onClick={() => navigate('/staff/orders')}
                className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex justify-between items-center cursor-pointer"
              >
                <div>
                  <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">Active Orders</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <p className="font-serif text-xl text-ink-navy">{activeOrdersCount}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest">{kitchenStatus}</p>
                  <p className="font-serif text-md text-ink-navy">{avgKitchenPrep}</p>
                </div>
              </div>

            </div>

            {/* Revenue */}
            <div 
              onClick={() => navigate('/staff/billing')}
              className="bg-[#FDFCFB] border border-[#D4AF37]/15 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="font-label-caps text-[10px] text-subtle-text uppercase tracking-wider mb-1">Today's Revenue</p>
                  <p className="font-serif text-3xl text-ink-navy">${todayRevenue.toFixed(2)}</p>
                </div>
                <div className="text-right text-[10px] font-label-caps text-subtle-text">
                  <span>Target: $1,500.00</span>
                </div>
              </div>
              <div className="w-full bg-[#f4f3f2] h-[2px] relative">
                <div 
                  className="absolute top-0 left-0 bg-[#D4AF37] h-[2px]" 
                  style={{ width: `${Math.min(100, (todayRevenue / 1500) * 100)}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Actions & Recent Activity Lower Grid */}
      <section className="grid grid-cols-12 gap-8">
        
        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <h4 className="font-serif text-headline-sm text-ink-navy border-l-2 border-[#D4AF37] pl-4">Quick Actions</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button 
                key={action.name}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center p-6 border border-[#E5E1DA] bg-[#FDFCFB] hover:bg-[#1A1F2C] hover:text-canvas-cream transition-all duration-300 cursor-pointer shadow-xs focus:outline-none"
              >
                <span className="material-symbols-outlined text-[#D4AF37] mb-3 text-3xl">{action.icon}</span>
                <span className="font-label-caps text-[10px] tracking-wider uppercase font-semibold text-center">{action.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <h4 className="font-serif text-headline-sm text-ink-navy border-l-2 border-[#D4AF37] pl-4">Recent Activity</h4>
          <div className="relative border-l border-[#E5E1DA] ml-4 pl-6 space-y-8 py-2">
            {activities.map((act) => (
              <div 
                key={act.id} 
                onClick={() => navigate(act.link)}
                className="relative group cursor-pointer hover:translate-x-1 transition-transform duration-300"
              >
                {/* Marker Dot */}
                <div className="absolute -left-[31px] top-1 bg-[#faf9f8] border border-[#D4AF37] w-2.5 h-2.5 rounded-full flex items-center justify-center group-hover:scale-120 transition-all duration-300">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                </div>
                
                {/* Details */}
                <div className="space-y-1 bg-white p-4 border border-[#E5E1DA]/50 shadow-2xs hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-xs text-ink-navy flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#D4AF37]">{act.icon}</span>
                      {act.title}
                    </h5>
                    <span className="text-[10px] text-subtle-text">{act.time}</span>
                  </div>
                  <p className="text-xs text-subtle-text leading-relaxed">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
