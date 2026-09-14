import React, { useState, useMemo } from 'react';
import { useStaff } from '../../context/StaffContext';
import { formatINR } from '../../utils/currency';

export default function StaffTakeawayPage() {
  const { takeawayOrders, menuItems, createTakeawayOrder, advanceTakeawayOrder, cancelTakeawayOrder } = useStaff();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  // New order form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState([]); // [{ itemId, name, price, qty }]
  const [itemSearch, setItemSearch] = useState('');

  const getOrdersByStatus = (status) => takeawayOrders.filter(o => o.status === status);

  const filteredMenuItems = useMemo(() => {
    if (!itemSearch.trim()) return menuItems.slice(0, 8);
    return menuItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 8);
  }, [menuItems, itemSearch]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id);
      if (existing) {
        return prev.map(c => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { itemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart(prev => prev
      .map(c => c.itemId === itemId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('Pending');
    setNotes('');
    setCart([]);
    setItemSearch('');
    setShowNewOrderForm(false);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) return;
    await createTakeawayOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cart.map(({ itemId, name, price, qty }) => ({ itemId, name, price, qty })),
      notes: notes.trim(),
      paymentMethod
    });
    resetForm();
  };

  const selectedOrder = takeawayOrders.find(o => o.id === selectedOrderId);

  const columns = [
    { key: 'received', title: 'Received', badgeClass: 'bg-saffron-gold/15 text-saffron-gold' },
    { key: 'preparing', title: 'Preparing', badgeClass: 'bg-blue-100 text-blue-800' },
    { key: 'ready', title: 'Ready for Pickup', badgeClass: 'bg-green-100 text-green-800' }
  ];

  const advanceLabel = {
    received: 'Start Preparing',
    preparing: 'Mark Ready for Pickup',
    ready: 'Confirm Picked Up'
  };

  return (
    <div className="flex flex-col-reverse md:flex-row min-h-[calc(100vh-80px)] relative select-none">

      <div className="flex-grow flex flex-col overflow-y-auto bg-surface">

        {/* Header + New Order button */}
        <div className="flex justify-between items-center p-4 md:p-6 pb-0">
          <div>
            <h2 className="font-serif text-xl text-ink-navy font-semibold">Takeaway Orders</h2>
            <p className="text-xs text-subtle-text mt-1">Phone-in and counter pickup orders — independent of table seating.</p>
          </div>
          <button
            onClick={() => setShowNewOrderForm(true)}
            className="flex items-center gap-2 bg-saffron-gold text-ink-navy font-cta-label text-cta-label px-5 h-11 uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            New Order
          </button>
        </div>

        {/* 3-Column Pipeline */}
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
                      <span className="font-label-caps text-xs font-bold text-ink-navy">{o.id}</span>
                      <span className="text-[10px] text-subtle-text">{o.time}</span>
                    </div>
                    <p className="text-[11px] text-subtle-text font-semibold uppercase tracking-wider">{o.customerName}</p>
                    <p className="text-xs text-ink-navy mt-2 line-clamp-1">
                      {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
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
                    {selectedOrder.id}
                  </span>
                  <h3 className="font-serif text-2xl">{selectedOrder.customerName}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-[11px] text-canvas-cream/60 font-label-caps tracking-widest uppercase">
                {selectedOrder.customerPhone} • Ordered {selectedOrder.time}
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 hide-scrollbar">
              <div className="space-y-3 pb-6 border-b border-muted-border text-xs">
                <div className="flex justify-between">
                  <span className="text-subtle-text">Payment Method:</span>
                  <span className="font-bold text-ink-navy">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle-text">Order Total:</span>
                  <span className="font-bold font-mono text-ink-navy">
                    {formatINR(selectedOrder.items.reduce((sum, i) => sum + i.price * i.qty, 0))}
                  </span>
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
                  advanceTakeawayOrder(selectedOrder.id);
                  if (selectedOrder.status === 'ready') setSelectedOrderId(null);
                }}
                className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[56px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md rounded-none cursor-pointer"
              >
                {advanceLabel[selectedOrder.status]}
              </button>
              <button
                onClick={() => {
                  cancelTakeawayOrder(selectedOrder.id);
                  setSelectedOrderId(null);
                }}
                className="w-full text-red-500 hover:text-red-600 text-xs font-semibold uppercase tracking-widest py-2 cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrderForm && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={resetForm}>
          <div
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-ink-navy text-canvas-cream flex justify-between items-center">
              <h3 className="font-serif text-xl">New Takeaway Order</h3>
              <button onClick={resetForm} className="text-canvas-cream/60 hover:text-canvas-cream">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
                    placeholder="e.g. Rohan Mehta"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
                    placeholder="+91 98250 xxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold bg-white"
                >
                  <option value="Pending">Pay at Pickup</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">Add Items</label>
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full mt-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
                  placeholder="Search menu..."
                />
                <div className="mt-2 border border-muted-border max-h-40 overflow-y-auto">
                  {filteredMenuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="w-full flex justify-between items-center px-3 py-2 text-xs hover:bg-canvas-cream text-left border-b border-muted-border/50 last:border-b-0"
                    >
                      <span className="text-ink-navy">{item.name}</span>
                      <span className="text-subtle-text font-mono">{formatINR(item.price)}</span>
                    </button>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <p className="px-3 py-2 text-xs text-subtle-text/60 italic">No matching items.</p>
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div className="border-t border-muted-border pt-4 space-y-2">
                  {cart.map(c => (
                    <div key={c.itemId} className="flex justify-between items-center text-xs">
                      <span className="text-ink-navy">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateCartQty(c.itemId, -1)} className="w-6 h-6 border border-muted-border flex items-center justify-center hover:border-saffron-gold">−</button>
                        <span className="w-4 text-center">{c.qty}</span>
                        <button onClick={() => updateCartQty(c.itemId, 1)} className="w-6 h-6 border border-muted-border flex items-center justify-center hover:border-saffron-gold">+</button>
                        <span className="font-mono w-16 text-right">{formatINR(c.price * c.qty)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-muted-border font-bold text-sm">
                    <span>Total</span>
                    <span className="font-mono text-saffron-gold">{formatINR(cartTotal)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-label-caps uppercase tracking-widest text-subtle-text font-bold">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-1 border border-muted-border px-3 py-2 text-sm focus:outline-none focus:border-saffron-gold resize-none"
                  placeholder="e.g. Less spicy, pickup after 8pm..."
                />
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={!customerName.trim() || !customerPhone.trim() || cart.length === 0}
                className="w-full bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[52px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Place Takeaway Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}