import React, { useState } from 'react';
import { useStaff } from '../../context/StaffContext';

export default function StaffGuestQueuePage() {
  const { queue, assignTable, addGuestToQueue, tables } = useStaff();
  const [selectedGuestId, setSelectedGuestId] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    name: '',
    partySize: '2',
    phone: '',
    vip: false,
    notes: ''
  });

  const handleSeatGuest = (guestId, tableId) => {
    assignTable(guestId, tableId);
    setSelectedGuestId(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newGuestData.name.trim()) return;
    
    addGuestToQueue(newGuestData);
    setNewGuestData({ name: '', partySize: '2', phone: '', vip: false, notes: '' });
    setShowAddForm(false);
  };

  const selectedGuest = queue.find(g => g.id === selectedGuestId);

  // Filter available tables for assignment select dropdown
  const availableTables = tables.filter(t => t.status === 'available');

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative select-none">
      
      {/* Queue Grid Dashboard */}
      <div className="flex-grow flex flex-col h-full bg-[#faf9f8] p-6 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          
          {/* Summary counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 border border-[#E5E1DA] shadow-xs">
              <span className="font-label-caps text-[9px] text-[#D4AF37] tracking-widest uppercase font-bold">Total Waiting</span>
              <p className="font-serif text-3xl text-ink-navy mt-2">{queue.length} Parties</p>
            </div>
            <div className="bg-white p-6 border border-[#E5E1DA] shadow-xs">
              <span className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase font-bold">Longest Wait</span>
              <p className="font-serif text-3xl text-ink-navy mt-2">{queue.length > 0 ? '35 Mins' : '—'}</p>
            </div>
            <div className="bg-white p-6 border border-[#E5E1DA] shadow-xs">
              <span className="font-label-caps text-[9px] text-subtle-text tracking-widest uppercase font-bold">Average Wait</span>
              <p className="font-serif text-3xl text-ink-navy mt-2">{queue.length > 0 ? '19 Mins' : '—'}</p>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg text-ink-navy border-l-2 border-[#D4AF37] pl-4">Queue Directory</h3>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-3 px-6 bg-ink-navy text-canvas-cream font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer text-center"
              >
                {showAddForm ? 'Cancel' : 'Add Guest'}
              </button>
            </div>

            {/* Add walk-in form */}
            {showAddForm && (
              <form onSubmit={handleAddSubmit} className="bg-white border border-[#E5E1DA] p-6 space-y-4 max-w-md">
                <h4 className="font-serif text-sm font-semibold">New Waitlist Guest</h4>
                
                <div className="space-y-1">
                  <label className="font-label-caps text-[9px] text-subtle-text uppercase block">Guest Name</label>
                  <input 
                    type="text" 
                    value={newGuestData.name} 
                    onChange={e => setNewGuestData({ ...newGuestData, name: e.target.value })}
                    className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-2.5 text-xs outline-none focus:border-ink-navy" 
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-subtle-text uppercase block">Party Size</label>
                    <input 
                      type="number" 
                      value={newGuestData.partySize} 
                      onChange={e => setNewGuestData({ ...newGuestData, partySize: e.target.value })}
                      className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-2.5 text-xs outline-none focus:border-ink-navy" 
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[9px] text-subtle-text uppercase block">Phone</label>
                    <input 
                      type="tel" 
                      value={newGuestData.phone} 
                      onChange={e => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                      className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-2.5 text-xs outline-none" 
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                  <input 
                    type="checkbox" 
                    checked={newGuestData.vip} 
                    onChange={e => setNewGuestData({ ...newGuestData, vip: e.target.checked })}
                    className="form-checkbox text-[#D4AF37] focus:ring-0 rounded-xs"
                  />
                  <span className="font-label-caps text-[9px] uppercase tracking-wider text-subtle-text">VIP Priority Guest</span>
                </label>

                <div className="space-y-1">
                  <label className="font-label-caps text-[9px] text-subtle-text uppercase block">Seating Notes</label>
                  <textarea 
                    value={newGuestData.notes} 
                    onChange={e => setNewGuestData({ ...newGuestData, notes: e.target.value })}
                    className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-2.5 text-xs h-16 resize-none" 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md rounded-none cursor-pointer"
                >
                  Confirm Waitlist Placement
                </button>
              </form>
            )}
            
            {queue.length === 0 ? (
              <div className="bg-white p-12 text-center border border-[#E5E1DA] text-subtle-text">
                <span className="material-symbols-outlined text-4xl mb-2">hourglass_disabled</span>
                <p className="font-serif text-md">Queue is currently clear</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {queue.map(guest => (
                  <div 
                    key={guest.id}
                    onClick={() => setSelectedGuestId(guest.id)}
                    className={`p-6 bg-white border border-[#E5E1DA] hover:border-[#D4AF37] cursor-pointer transition-all duration-300 relative ${
                      selectedGuestId === guest.id ? 'ring-2 ring-[#D4AF37]/30 border-[#D4AF37]' : ''
                    }`}
                  >
                    {guest.vip && (
                      <span className="absolute top-4 right-4 bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-black tracking-widest px-2 py-0.5 uppercase">
                        VIP Priority
                      </span>
                    )}
                    <span className="font-mono text-xs text-subtle-text font-semibold">{guest.id}</span>
                    <h4 className="font-serif text-lg text-ink-navy mt-2">{guest.name}</h4>
                    
                    <div className="mt-4 flex gap-6 text-xs text-subtle-text font-sans">
                      <div>
                        <span className="font-semibold block text-ink-navy">Party Size</span>
                        <span>{guest.partySize} Guests</span>
                      </div>
                      <div className="h-6 w-px bg-[#E5E1DA]" />
                      <div>
                        <span className="font-semibold block text-ink-navy">Time elapsed</span>
                        <span className="text-[#D4AF37] font-bold">{guest.waitTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Right Drawer details */}
      <div className={`h-full bg-white border-l border-[#E5E1DA] shrink-0 transition-all duration-300 shadow-2xl flex flex-col ${
        selectedGuest ? 'w-96' : 'w-0 opacity-0 overflow-hidden'
      }`}>
        {selectedGuest && (
          <div className="h-full flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 bg-[#1A1F2C] text-canvas-cream shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-label-caps text-[9px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">
                    Waiting List
                  </span>
                  <h3 className="font-serif text-2xl">{selectedGuest.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedGuestId(null)}
                  className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto hide-scrollbar text-xs">
              <div className="space-y-3.5 border-b border-[#E5E1DA] pb-6">
                <div className="flex justify-between">
                  <span className="text-subtle-text">Queue ID:</span>
                  <span className="font-mono font-bold text-ink-navy">{selectedGuest.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Party Size:</span>
                  <span className="font-bold text-ink-navy">{selectedGuest.partySize} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Contact Phone:</span>
                  <span className="text-ink-navy">{selectedGuest.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Wait Elapsed:</span>
                  <span className="text-[#D4AF37] font-bold">{selectedGuest.waitTime}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedGuest.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs italic text-ink-navy rounded-xs">
                  <p className="font-semibold text-yellow-800 font-label-caps text-[9px] uppercase tracking-wider mb-1">Queue Preferences</p>
                  <p>"{selectedGuest.notes}"</p>
                </div>
              )}

              {/* Table assignment selector simulation */}
              <div className="space-y-3">
                <label className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold block">Assign Table</label>
                {availableTables.length === 0 ? (
                  <p className="text-xs text-red-500 font-semibold italic">No vacant tables on the floor map. Clear occupied tables first.</p>
                ) : (
                  <select 
                    id="table_assign_select"
                    className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
                  >
                    {availableTables.map(t => (
                      <option key={t.id} value={t.id}>Table {t.id} ({t.seats} Seats Available)</option>
                    ))}
                  </select>
                )}
              </div>

            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] shrink-0">
              <button 
                onClick={() => {
                  const selectEl = document.getElementById('table_assign_select');
                  if (!selectEl) {
                    alert('No table selected or available.');
                    return;
                  }
                  handleSeatGuest(selectedGuest.id, selectEl.value);
                }}
                disabled={availableTables.length === 0}
                className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-55 disabled:cursor-not-allowed rounded-none cursor-pointer text-center"
              >
                Seat Party & Settle
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
