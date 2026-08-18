import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [orderId, setOrderId] = useState(() => sessionStorage.getItem('lastOrderId') || null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tableId, setTableId] = useState(null);
  const [tableSessionId, setTableSessionId] = useState(null);

  useEffect(() => {
    const handleCustomerExpired = () => {
      setSessionExpired(true);
    };
    const handleCustomerInvalid = () => {
      sessionStorage.removeItem('tableToken');
      setTableToken('');
    };
    window.addEventListener('customer-session-expired', handleCustomerExpired);
    window.addEventListener('customer-session-invalid', handleCustomerInvalid);
    return () => {
      window.removeEventListener('customer-session-expired', handleCustomerExpired);
      window.removeEventListener('customer-session-invalid', handleCustomerInvalid);
    };
  }, []);
  
  const isFreshScanRef = useRef(false);

  const [tableToken, setTableToken] = useState(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) {
      sessionStorage.setItem('tableToken', urlToken);
      window.history.replaceState({}, '', window.location.pathname);
      isFreshScanRef.current = true;
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

  // Decode table ID and session ID from tableToken
  useEffect(() => {
    if (tableToken) {
      try {
        const payload = JSON.parse(atob(tableToken.split('.')[1]));
        if (payload) {
          setTableId(payload.tableId || null);
          setTableSessionId(payload.sessionId || null);
        }
      } catch (e) {
        console.error('Error decoding table token:', e);
        setTableId(null);
        setTableSessionId(null);
      }
    } else {
      setTableId(null);
      setTableSessionId(null);
    }
  }, [tableToken]);

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

  // Socket updates for session end
  useEffect(() => {
    const handleInvoicePaid = (data) => {
      if (data && data.sessionId && data.sessionId === tableSessionId) {
        setSessionExpired(true);
      }
    };

    const handleTableReleased = (data) => {
      if (data && data.tableId && data.tableId === tableId) {
        setSessionExpired(true);
      }
    };

    socket.on('invoice:paid', handleInvoicePaid);
    socket.on('table:released', handleTableReleased);

    return () => {
      socket.off('invoice:paid', handleInvoicePaid);
      socket.off('table:released', handleTableReleased);
    };
  }, [tableId, tableSessionId]);

  const [activeOrder, setActiveOrder] = useState(null);

  // Session reset
  useEffect(() => {
    if (sessionExpired) {
      sessionStorage.removeItem('lastOrderId');
      localStorage.removeItem('lastReservationId');
      localStorage.removeItem('reservationId');
      sessionStorage.removeItem('tableToken');
      
      setCartItems([]);
      setOrderId(null);
      setTableToken('');
      setTableNumber('Garden Terrace 14');
      setActiveOrder(null);
    }
  }, [sessionExpired]);

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

    useEffect(() => {
    if (!tableToken) {
      setActiveOrder(null);
      return;
    }

    const fetchMyOrder = async () => {
      try {
        const res = await api.get('/api/orders/my-order');
        setActiveOrder(res.data);
        // Rediscover orderId if it was lost (e.g. a full tab close cleared
        // sessionStorage) but the table session itself is still valid.
        if (res.data && res.data._id && res.data._id !== orderId) {
          setOrderId(res.data._id);
          sessionStorage.setItem('lastOrderId', res.data._id);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setActiveOrder(null);
        } else {
          console.error('Error fetching my-order in CartContext:', err);
        }
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
      case 'Received': return 'Received';
      case 'Preparing': return 'Preparing';
      case 'Ready': return 'Ready';
      case 'Served': return 'At Table';
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
  const activeOrderTotal = activeOrder ? (() => {
    const sub = activeOrder.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    return sub + sub * 0.10 + sub * 0.075;
  })() : 0;
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
    return sub * 0.10;
  };

  const getGST = (sub) => {
    return sub * 0.075;
  };

  const getGrandTotal = () => {
    const sub = getSubtotal();
    return sub + getServiceCharge(sub) + getGST(sub);
  };

  const placeOrder = async (guestPhone) => {
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
      if (guestPhone) {
        payload.guestPhone = guestPhone;
      }
      
      const response = await api.post('/api/orders/add-items', payload);
      const order = response.data.order;
      if (order && order._id) {
        setOrderId(order._id);
        sessionStorage.setItem('lastOrderId', order._id);
      }
      if (guestPhone) {
        sessionStorage.setItem('guestPhoneCaptured', 'true');
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
      tableToken,
      setTableToken,
      tableNumber,
      setTableNumber,
      orderId,
      orderStatus,
      activeOrderItems,
      activeOrderTotal,
      activeOrderTime,
      consumeFreshScan: () => {
        const was = isFreshScanRef.current;
        isFreshScanRef.current = false;
        return was;
      },
      addToCart,
      removeFromCart,
      deleteFromCart,
      clearCart,
      getSubtotal,
      getServiceCharge,
      getGST,
      getGrandTotal,
      placeOrder,
      sessionExpired,
      setSessionExpired
    }}>
      {children}
    </CartContext.Provider>
  );
}
