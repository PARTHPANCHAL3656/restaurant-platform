import React, { useState } from 'react';
import { useStaff } from '../../context/StaffContext';

export default function StaffOrdersPage() {
  const { orders, advanceOrder } = useStaff();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const getOrdersByStatus = (status) => orders.filter(o => o.status === status);

  const handleAdvanceStatus = (orderId, currentStatus) => {
    advanceOrder(orderId);
    // If the next status moves to 'served' (which removes it from orders list), close drawer
    const nextStatusVal = currentStatus === 'new' ? 'preparing' : currentStatus === 'preparing' ? 'ready' : 'served';
    if (nextStatusVal === 'served') {
      setSelectedOrderId(null);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative select-none">
      
      {/* 3-Column Service Pipeline */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto bg-[#faf9f8]">
        
        {/* Column 1: New Orders */}
        <div className="flex flex-col h-full bg-white border border-[#E5E1DA] p-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#E5E1DA] mb-4 shrink-0">
            <h3 className="font-serif text-md text-ink-navy font-semibold">New Orders</h3>
            <span className="bg-saffron-gold/15 text-saffron-gold text-xs px-2.5 py-0.5 font-bold rounded-full">
              {getOrdersByStatus('new').length}
            </span>
          </div>
          <div className="space-y-4 overflow-y-auto flex-grow hide-scrollbar">
            {getOrdersByStatus('new').map(o => (
              <div 
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`p-4 border border-[#E5E1DA] hover:border-[#D4AF37] cursor-pointer bg-[#FDFCFB] transition-all duration-300 ${
                  selectedOrderId === o.id ? 'ring-2 ring-[#D4AF37]/30 border-[#D4AF37]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-caps text-xs font-bold text-ink-navy">Table {o.table}</span>
                  <span className="text-[10px] text-subtle-text">{o.time}</span>
                </div>
                <p className="text-[11px] text-subtle-text font-semibold uppercase tracking-wider">{o.section}</p>
                <p className="text-xs text-ink-navy mt-2 line-clamp-1">
                  {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="flex flex-col h-full bg-white border border-[#E5E1DA] p-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#E5E1DA] mb-4 shrink-0">
            <h3 className="font-serif text-md text-ink-navy font-semibold">In Preparation</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 font-bold rounded-full">
              {getOrdersByStatus('preparing').length}
            </span>
          </div>
          <div className="space-y-4 overflow-y-auto flex-grow hide-scrollbar">
            {getOrdersByStatus('preparing').map(o => (
              <div 
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`p-4 border border-[#E5E1DA] hover:border-[#D4AF37] cursor-pointer bg-[#FDFCFB] transition-all duration-300 ${
                  selectedOrderId === o.id ? 'ring-2 ring-[#D4AF37]/30 border-[#D4AF37]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-caps text-xs font-bold text-ink-navy">Table {o.table}</span>
                  <span className="text-[10px] text-subtle-text">{o.time}</span>
                </div>
                <p className="text-[11px] text-subtle-text font-semibold uppercase tracking-wider">{o.section}</p>
                <p className="text-xs text-ink-navy mt-2 line-clamp-1">
                  {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready to Serve */}
        <div className="flex flex-col h-full bg-white border border-[#E5E1DA] p-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#E5E1DA] mb-4 shrink-0">
            <h3 className="font-serif text-md text-ink-navy font-semibold">Ready to Serve</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 font-bold rounded-full">
              {getOrdersByStatus('ready').length}
            </span>
          </div>
          <div className="space-y-4 overflow-y-auto flex-grow hide-scrollbar">
            {getOrdersByStatus('ready').map(o => (
              <div 
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`p-4 border border-[#E5E1DA] hover:border-[#D4AF37] cursor-pointer bg-[#FDFCFB] transition-all duration-300 ${
                  selectedOrderId === o.id ? 'ring-2 ring-[#D4AF37]/30 border-[#D4AF37]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-caps text-xs font-bold text-ink-navy">Table {o.table}</span>
                  <span className="text-[10px] text-subtle-text">{o.time}</span>
                </div>
                <p className="text-[11px] text-subtle-text font-semibold uppercase tracking-wider">{o.section}</p>
                <p className="text-xs text-ink-navy mt-2 line-clamp-1">
                  {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detail Slide-over Panel (Order Drawer) */}
      <div className={`h-full bg-white border-l border-[#E5E1DA] shrink-0 transition-all duration-300 shadow-2xl flex flex-col ${
        selectedOrder ? 'w-96' : 'w-0 opacity-0 overflow-hidden'
      }`}>
        {selectedOrder && (
          <div className="h-full flex flex-col justify-between">
            
            {/* Header */}
            <div className="p-6 bg-[#1A1F2C] text-canvas-cream shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-label-caps text-[9px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">
                    {selectedOrder.id}
                  </span>
                  <h3 className="font-serif text-2xl">Table {selectedOrder.table}</h3>
                </div>
                <button 
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-[11px] text-canvas-cream/60 font-label-caps tracking-widest uppercase">
                {selectedOrder.section} • Ordered {selectedOrder.time}
              </p>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 hide-scrollbar">
              <div className="space-y-4">
                <h4 className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold">Ordered Dishes</h4>
                <ul className="space-y-3.5 text-xs text-ink-navy divide-y divide-[#E5E1DA]/50">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center pt-3.5 first:pt-0">
                      <div>
                        <span className="font-bold text-saffron-gold mr-3">{item.qty}x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono">${(item.price * item.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs italic text-ink-navy rounded-xs">
                  <p className="font-semibold text-yellow-800 font-label-caps text-[9px] uppercase tracking-wider mb-1">Special Notes</p>
                  <p>"{selectedOrder.notes}"</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] shrink-0">
              <button 
                onClick={() => handleAdvanceStatus(selectedOrder.id, selectedOrder.status)}
                className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md rounded-none cursor-pointer"
              >
                {selectedOrder.status === 'new' && 'Accept & Start Prep'}
                {selectedOrder.status === 'preparing' && 'Mark Ready to Serve'}
                {selectedOrder.status === 'ready' && 'Confirm Order Served'}
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
