import React, { createContext, useContext, useState } from 'react';
import { useStaff } from './StaffContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { orders, addOrder } = useStaff();
  const [cartItems, setCartItems] = useState([]);
  const [tableNumber, setTableNumber] = useState('Garden Terrace 14');
  const [orderId, setOrderId] = useState(null);

  // Translate user-facing table labels to system Table IDs
  const getTableId = (label) => {
    if (!label) return 'T-14';
    if (label.includes('14')) return 'T-14';
    if (label.includes('01')) return 'T-01';
    if (label.includes('02')) return 'T-02';
    if (label.includes('03')) return 'T-03';
    if (label.includes('04')) return 'T-04';
    if (label.includes('05')) return 'T-05';
    if (label.includes('06')) return 'T-06';
    return 'T-14';
  };

  // Dynamically lookup the active customer order from the shared staff orders collection
  const activeOrder = orders.find(o => o.id === orderId);

  // Map backend/staff status keys to customer tracking timeline labels
  const getCustomerStatusLabel = (status) => {
    switch (status) {
      case 'new': return 'Received';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'served': return 'At Table';
      default: return 'Received';
    }
  };

  const orderStatus = activeOrder ? getCustomerStatusLabel(activeOrder.status) : null;
  const activeOrderItems = activeOrder ? activeOrder.items.map(i => ({
    name: i.name,
    price: i.price,
    quantity: i.qty
  })) : [];
  const activeOrderTotal = activeOrder ? activeOrder.items.reduce((sum, i) => sum + (i.price * i.qty), 0) * 1.175 : 0;
  const activeOrderTime = activeOrder ? activeOrder.time : null;

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const deleteFromCart = (itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getServiceCharge = (sub) => {
    return sub * 0.125;
  };

  const getGST = (sub) => {
    return sub * 0.05;
  };

  const getGrandTotal = () => {
    const sub = getSubtotal();
    return sub + getServiceCharge(sub) + getGST(sub);
  };

  const placeOrder = () => {
    if (cartItems.length === 0) return;
    
    // Seat and place the order directly into the centralized staff order database
    const targetTableId = getTableId(tableNumber);
    const generatedOrderId = addOrder(targetTableId, cartItems, 'Placed from digital menu.');
    
    setOrderId(generatedOrderId);
    clearCart();
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      tableNumber,
      setTableNumber,
      orderId,
      orderStatus,
      activeOrderItems,
      activeOrderTotal,
      activeOrderTime,
      addToCart,
      removeFromCart,
      deleteFromCart,
      clearCart,
      getSubtotal,
      getServiceCharge,
      getGST,
      getGrandTotal,
      placeOrder
    }}>
      {children}
    </CartContext.Provider>
  );
}
