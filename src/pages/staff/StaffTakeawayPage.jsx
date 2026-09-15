import React, { useState } from 'react';
import { useStaff } from '../../context/StaffContext';
import { formatINR } from '../../utils/currency';

export default function StaffTakeawayPage() {
  const { orders, advanceOrder, flagCustomerNoShow } = useStaff();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const takeoutOrders = orders.filter(o => o.orderType === 'takeout');
  const getOrdersByStatus = (status) => takeoutOrders.filter(o => o.status === status);

  const selectedOrder = takeoutOrders.find(o => o.id === selectedOrderId);

  const columns = [
    { key: 'new', title: 'Received', badgeClass: 'bg-saffron-gold/15 text-saffron-gold' },
    { key: 'preparing', title: 'Preparing', badgeClass: 'bg-blue-100 text-blue-800' },
    { key: 'ready', title: 'Ready for Pickup', badgeClass: 'bg-green-100 text-green-800' }
  ];

  const advanceLabel = {
    new: 'Start Preparing',
    preparing: 'Mark Ready for Pickup',
    ready: 'Confirm Picked Up'
  };

  const orderTotal = (order) => order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="flex flex-col-reverse md:flex-row min-h-[calc(100vh-80px)] relative select-none">

      <div className="flex-grow flex flex-col overflow-y-auto bg-surface">
        <div className="p-4 md:p-6 pb-0">
          <h2 className="font-serif text-xl text-ink-navy font-semibold">Takeaway Orders</h2>
          <p className="text-xs text-subtle-text mt-1">
            Self-service pickup orders customers place online — independent of table seating.
            Orders start on <span className="font-mono">/takeout</span>.
          </p>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
          {columns.map(col => (
            <div key={col.key} className="flex flex-col bg-white border border-muted-border p-4">
              <div className="flex justify-between items-center pb-4 border-b border-muted-border mb-4 shrink-0">
                <h3 className="font-serif text-md text-ink-navy font-semibold">{col.title}</h3>
                <span className={`${col.badgeClass} text-xs px-2.5 py-0.5 font-bold rounded-full`}>
                  {getOrdersByStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-4 overflow-y-auto flex-grow hide-scrollbar">
                {getOrdersByStatus(col.key).length === 0 && (
                  <p className="text-xs text-subtle-text/60 italic">No orders here right now.</p>
                )}
                {getOrdersByStatus(col.key).map(o => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`p-4 border border-muted-border hover:border-saffron-gold cursor-pointer bg-canvas-cream transition-all duration-300 ${
                      selectedOrderId === o.id ? 'ring-2 ring-saffron-gold/30 border-saffron-gold' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label-caps text-xs font-bold text-ink-navy">{o.table}</span>
                      <span className="text-[10px] text-subtle-text">{o.time}</span>
                    </div>
                    <p className="text-[11px] text-subtle-text font-semibold uppercase tracking-wider">{o.guestName}</p>
                    <p className="text-xs text-ink-navy mt-2 line-clamp-1">
                      {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </p>
                    <p className="text-[10px] text-saffron-gold font-semibold mt-1 uppercase tracking-wide">
                      Pickup: {o.pickupTime || 'ASAP'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Slide-over Panel */}
      {selectedOrder && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSelectedOrderId(null)} />}
      <div className={`fixed md:static inset-y-0 right-0 z-50 md:z-auto bg-white border-l border-muted-border shrink-0 transition-all duration-300 shadow-2xl flex flex-col ${
        selectedOrder ? 'w-full md:w-96 translate-x-0' : 'w-full md:w-96 translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
      }`}>
        {selectedOrder && (
          <div className="h-full flex flex-col justify-between">
            <div className="p-6 bg-ink-navy text-canvas-cream shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-label-caps text-[9px] text-saffron-gold tracking-widest font-bold uppercase block mb-1">
                    {selectedOrder.table}
                  </span>
                  <h3 className="font-serif text-2xl">{selectedOrder.guestName}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined normal-case">close</span>
                </button>
              </div>
              <p className="text-[11px] text-canvas-cream/60 font-label-caps tracking-widest uppercase">
                {selectedOrder.guestPhone} • Ordered {selectedOrder.time}
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 hide-scrollbar">
              <div className="space-y-3 pb-6 border-b border-muted-border text-xs">
                <div className="flex justify-between">
                  <span className="text-subtle-text">Pickup Time:</span>
                  <span className="font-bold text-ink-navy">{selectedOrder.pickupTime || 'ASAP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Order Total:</span>
                  <span className="font-bold font-mono text-ink-navy">{formatINR(orderTotal(selectedOrder))}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-label-caps text-[10px] text-subtle-text uppercase tracking-widest font-bold">Items</h4>
                <ul className="space-y-3.5 text-xs text-ink-navy divide-y divide-muted-border/50">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center pt-3.5 first:pt-0">
                      <div>
                        <span className="font-bold text-saffron-gold mr-3">{item.qty}x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold font-mono">{formatINR(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs italic text-ink-navy rounded-xs">
                  <p className="font-semibold text-yellow-800 font-label-caps text-[9px] uppercase tracking-wider mb-1">Special Notes</p>
                  <p>"{selectedOrder.notes}"</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-muted-border bg-canvas-cream shrink-0 space-y-3">
              <button
                onClick={() => {
                  advanceOrder(selectedOrder.id);
                  if (selectedOrder.status === 'ready') setSelectedOrderId(null);
                }}
                className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md rounded-none cursor-pointer"
              >
                {advanceLabel[selectedOrder.status]}
              </button>
              {selectedOrder.status === 'ready' && (
                <button
                  onClick={() => {
                    flagCustomerNoShow(selectedOrder.guestPhone, selectedOrder.id);
                    setSelectedOrderId(null);
                  }}
                  className="w-full text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-2 cursor-pointer"
                >
                  Flag as No-Show
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}