import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStaff } from './StaffContext';
import api from '../utils/api';
import socket from '../utils/socket';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { orders, addOrder } = useStaff();
  const [cartItems, setCartItems] = useState([]);
  const [orderId, setOrderId] = useState(() => localStorage.getItem('lastOrderId') || null);
  
  const [tableToken, setTableToken] = useState(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) {
      sessionStorage.setItem('tableToken', urlToken);
      return urlToken;
    }
    return sessionStorage.getItem('tableToken') || '';
  });

  const [tableNumber, setTableNumber] = useState(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    const token = urlToken || sessionStorage.getItem('tableToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.tableNumber) {
          return `Table T-${String(payload.tableNumber).padStart(2, '0')}`;
        }
      } catch (e) {
        console.error('Error parsing table token:', e);
      }
    }
    return 'Garden Terrace 14';
  });

  // Keep track of URL changes to extract token automatically
  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken && urlToken !== tableToken) {
      sessionStorage.setItem('tableToken', urlToken);
      setTableToken(urlToken);
      try {
        const payload = JSON.parse(atob(urlToken.split('.')[1]));
        if (payload && payload.tableNumber) {
          setTableNumber(`Table T-${String(payload.tableNumber).padStart(2, '0')}`);
        }
      } catch (e) {
        console.error('Error parsing table token in effect:', e);
      }
    }
  }, [tableToken]);

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

  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    if (!orderId || !tableToken) {
      setActiveOrder(null);
      return;
    }

    const fetchMyOrder = async () => {
      try {
        const res = await api.get('/api/orders/my-order');
        setActiveOrder(res.data);
      } catch (err) {
        console.error('Error fetching my-order in CartContext:', err);
      }
    };

    fetchMyOrder();

    const handleStatusChange = (data) => {
      if (data.orderId === orderId) {
        fetchMyOrder();
      }
    };

    const handleOrderUpdate = (data) => {
      if (data.orderId === orderId) {
        fetchMyOrder();
      }
    };

    socket.on('order:statusChanged', handleStatusChange);
    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:statusChanged', handleStatusChange);
      socket.off('order:updated', handleOrderUpdate);
    };
  }, [orderId, tableToken]);

  // Map backend/staff status keys to customer tracking timeline labels
  const getCustomerStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Received';
      case 'billed': return 'Ready';
      case 'closed': return 'At Table';
      default: return 'Received';
    }
  };

  const orderStatus = activeOrder ? getCustomerStatusLabel(activeOrder.status) : null;
  const activeOrderItems = activeOrder
    ? Object.values(
        activeOrder.items.reduce((acc, i) => {
          const key = i.name;
          if (acc[key]) {
            acc[key] = { ...acc[key], quantity: acc[key].quantity + i.qty };
          } else {
            acc[key] = { name: i.name, price: i.price, quantity: i.qty };
          }
          return acc;
        }, {})
      )
    : [];
  const activeOrderTotal = activeOrder ? activeOrder.items.reduce((sum, i) => sum + (i.price * i.qty), 0) * 1.175 : 0;
  const activeOrderTime = activeOrder ? new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

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

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const payload = {
        items: cartItems.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty: item.quantity
        }))
      };
      
      const response = await api.post('/api/orders/add-items', payload);
      const order = response.data.order;
      if (order && order._id) {
        setOrderId(order._id);
        localStorage.setItem('lastOrderId', order._id);
      }
      clearCart();
    } catch (err) {
      console.error('Error placing order:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    }
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
