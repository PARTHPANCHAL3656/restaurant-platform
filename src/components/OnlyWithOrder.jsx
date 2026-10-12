import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

// Shows its children only on a browser that holds a live order session, so the
// "Track Order" links appear for the person who ordered and for nobody else.
// It waits until the page has mounted before deciding, so the pre-rendered
// page (which knows nothing about this browser) and the browser agree.
export default function OnlyWithOrder({ children }) {
  const { orderId, tableToken } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted && orderId && tableToken ? children : null;
}