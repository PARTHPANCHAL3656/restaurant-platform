import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';

const StaffContext = createContext();

const MOCK_TABLES = [
  { id: 'T-01', seats: 2, status: 'available', guestName: '', arrivalTime: '', billTotal: 0, notes: '', items: [], qrId: 'QR-01', qrImage: 'qr/table-01.png', qrRoute: '/menu?table=T01', waiter: 'Rahul Sharma', guestCount: 0 },
  { id: 'T-02', seats: 4, status: 'occupied', guestName: 'Julian Alvarez', arrivalTime: '19:15', billTotal: 96.00, notes: 'No gluten. Prefers quiet corner table.', items: [{ name: 'Saffron Infused Scallops', qty: 2, price: 48.00 }], qrId: 'QR-02', qrImage: 'qr/table-02.png', qrRoute: '/menu?table=T02', waiter: 'Rahul Sharma', guestCount: 2 },
  { id: 'T-03', seats: 2, status: 'reserved', guestName: 'Aria Stark', arrivalTime: '19:30', billTotal: 0, notes: 'Anniversary celebration. Requesting champagne.', items: [], qrId: 'QR-03', qrImage: 'qr/table-03.png', qrRoute: '/menu?table=T03', waiter: 'Rahul Sharma', guestCount: 2 },
  { id: 'T-04', seats: 4, status: 'occupied', guestName: 'Elena Vance', arrivalTime: '20:00', billTotal: 611.00, notes: 'Frequent VIP diner. Walnuts allergy.', items: [{ name: 'Malai Truffle Paneer', qty: 2, price: 26.00 }, { name: 'Royal Makhani Murgh', qty: 1, price: 32.00 }], qrId: 'QR-04', qrImage: 'qr/table-04.png', qrRoute: '/menu?table=T04', waiter: 'Rahul Sharma', guestCount: 4 },
  { id: 'T-05', seats: 4, status: 'cleaning', guestName: '', arrivalTime: '', billTotal: 0, notes: '', items: [], qrId: 'QR-05', qrImage: 'qr/table-05.png', qrRoute: '/menu?table=T05', waiter: 'Rahul Sharma', guestCount: 0 },
  { id: 'T-06', seats: 6, status: 'available', guestName: '', arrivalTime: '', billTotal: 0, notes: '', items: [], qrId: 'QR-06', qrImage: 'qr/table-06.png', qrRoute: '/menu?table=T06', waiter: 'Rahul Sharma', guestCount: 0 },
  { id: 'T-14', seats: 4, status: 'occupied', guestName: 'Garden Terrace Guest', arrivalTime: '20:30', billTotal: 0, notes: '', items: [], qrId: 'QR-14', qrImage: 'qr/table-14.png', qrRoute: '/menu?table=T14', waiter: 'Rahul Sharma', guestCount: 2 }
];

const MOCK_RESERVATIONS = [
  { id: 'res-1', time: '6:30 PM', guest: 'Rahul Sharma', partySize: 4, table: 'T-03', vip: false, phone: '+44 7946 0901', status: 'confirmed' },
  { id: 'res-2', time: '7:00 PM', guest: 'Priya Mehta', partySize: 2, table: 'T-06', vip: false, phone: '+44 7946 0902', status: 'confirmed' },
  { id: 'res-3', time: '7:30 PM', guest: 'Aarav Kapoor', partySize: 3, table: 'T-08', vip: true, phone: '+44 7946 0903', status: 'confirmed' }
];

const MOCK_ORDERS = [
  { id: 'ORD-402', table: 'T-03', section: 'Main Hall', time: '4 mins ago', status: 'new', items: [{ name: 'Malai Truffle Paneer', qty: 2, price: 26.00 }, { name: 'Artisanal Garlic Naan', qty: 3, price: 6.00 }], notes: 'Walnut allergy warning. Make starters medium spicy.' },
  { id: 'ORD-398', table: 'T-02', section: 'Main Hall', time: '12 mins ago', status: 'preparing', items: [{ name: 'Royal Makhani Murgh', qty: 1, price: 32.00 }, { name: 'Nawabi Mutton Biryani', qty: 2, price: 38.00 }], notes: 'Serve extra raita with biryani.' },
  { id: 'ORD-391', table: 'T-04', section: 'Window Alcove', time: '22 mins ago', status: 'ready', items: [{ name: 'Saffron Infused Scallops', qty: 3, price: 24.00 }], notes: 'VIP customer. Serve immediately.' }
];

const MOCK_QUEUE = [
  { id: 'Q-01', name: 'Julianne Moore', partySize: 2, waitTime: '35 Mins', phone: '+1 (555) 019-2834', vip: true, notes: 'Prefers window alcove table.', status: 'Waiting' },
  { id: 'Q-02', name: 'Marcus Aurelius', partySize: 6, waitTime: '15 Mins', phone: '+1 (555) 042-9988', vip: true, notes: 'Celebrating birthday. Requesting Chef\'s Table.', status: 'Waiting' },
  { id: 'Q-03', name: 'Diana Prince', partySize: 4, waitTime: '8 Mins', phone: '+1 (555) 088-7711', vip: false, notes: 'Need high-chair for toddler.', status: 'Waiting' }
];

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}

export function StaffProvider({ children }) {
  // Static Restaurant Information Configuration
  const restaurantInfo = {
    name: "Spice Garden",
    tagline: "Modern Indian Fine Dining",
    address: "14 Garden Terrace, London, W1K 7HB",
    phone: "+44 (0) 20 7946 0958",
    reservationPhone: "+44 (0) 20 7946 0900",
    email: "concierge@spicegarden.com",
    openingHours: [
      { days: "Monday - Thursday", hours: "12:00 PM - 10:30 PM" },
      { days: "Friday - Saturday", hours: "12:00 PM - 11:30 PM" },
      { days: "Sunday", hours: "12:00 PM - 10:00 PM" }
    ],
    socials: {
      instagram: "@spicegarden.london",
      facebook: "spicegarden.london",
      twitter: "@spicegardenldn"
    }
  };

  // Staff Profile state
  const [staffProfile, setStaffProfile] = useState({
    name: "Rahul Sharma",
    role: "Maître D' & Operations Lead",
    shift: "Dinner Service",
    avatar: null,
    notifications: [
      { id: 1, text: "Table T-03 requested guest check out", time: "2 mins ago" },
      { id: 2, text: "New reservation request for 8:30 PM", time: "10 mins ago" }
    ]
  });

  // Centralized Menu Catalog state (22 active dishes across 6 categories)
  const [menuItems, setMenuItems] = useState([
    // STARTERS
    {
      id: 'paneer-tikka',
      name: 'Signature Paneer Tikka',
      price: 22.00,
      category: 'Starters',
      tag: 'Classic',
      description: 'Charcoal grilled cottage cheese, spiced yogurt marinade, bell peppers, mint chutney.',
      image: 'signature-paneer-tikka.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Medium'
    },
    {
      id: 'hara-bhara-kebab',
      name: 'Hara Bhara Kebab',
      price: 18.00,
      category: 'Starters',
      tag: 'Veg Delight',
      description: 'Pan-seared patties of spinach, green peas, and potatoes, spiced with aromatic herbs.',
      image: 'hara-bhara-kebab.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'croquettes',
      name: 'Golden Cheese Croquettes',
      price: 16.00,
      category: 'Starters',
      tag: 'Crunchy',
      description: 'Crispy spiced potato shell stuffed with melted mozzarella, cheddar, and fresh herbs.',
      image: 'golden-cheese-croquettes.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'truffle-paneer',
      name: 'Malai Truffle Paneer',
      price: 26.00,
      category: 'Starters',
      tag: 'Veg Signature',
      description: 'Hand-pressed cottage cheese marinated in a delicate truffle-infused cream and white pepper, char-grilled.',
      image: 'malai-truffle-paneer.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '20 min',
      spiceLevel: 'Medium'
    },
    {
      id: 'scallops',
      name: 'Saffron Infused Scallops',
      price: 24.00,
      category: 'Starters',
      tag: 'Signature',
      description: 'Wild caught scallops, smooth green pea purée, and a tangy pomegranate reduction.',
      image: 'saffron-infused-scallops.jpg',
      available: true,
      special: true,
      foodType: 'Non Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    // MAINS
    {
      id: 'makhani-murgh',
      name: 'Royal Makhani Murgh',
      price: 32.00,
      category: 'Mains',
      tag: 'Chef Special',
      description: 'Slow-cooked tandoori chicken in a velvet-smooth tomato and cashew reduction, finished with fenugreek and cultured butter.',
      image: 'royal-makhani-murgh.jpg',
      available: true,
      special: true,
      foodType: 'Non Vegetarian',
      prepTime: '30 min',
      spiceLevel: 'Medium'
    },
    {
      id: 'glazed-quail',
      name: 'Truffle Glazed Quail',
      price: 58.00,
      category: 'Mains',
      tag: 'Awadhi Heritage',
      description: 'Tender quail roasted with a black truffle glaze, cracked coriander seeds, and caramelized wild forest honey.',
      image: 'truffle-glazed-quail.jpg',
      available: true,
      special: false,
      foodType: 'Non Vegetarian',
      prepTime: '45 min',
      spiceLevel: 'Hot'
    },
    {
      id: 'kofta-royale',
      name: 'Malai Kofta Royale',
      price: 28.00,
      category: 'Mains',
      tag: 'Classic Veg',
      description: 'Cottage cheese dumplings stuffed with dry fruits, served in a rich cashew onion gravy.',
      image: 'malai-kofta-royale.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '25 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'dal-makhani',
      name: 'Dal Makhani',
      price: 20.00,
      category: 'Mains',
      tag: 'Classic',
      description: 'Black lentils slow-cooked overnight with cream, butter, tomato purée, and house spices.',
      image: 'dal-makhani.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '20 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'palak-paneer',
      name: 'Palak Paneer',
      price: 22.00,
      category: 'Mains',
      tag: 'Classic',
      description: 'Fresh cottage cheese cubes simmered in a spiced spinach gravy, touched with fresh cream.',
      image: 'palak-paneer.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '20 min',
      spiceLevel: 'Medium'
    },
    // RICE & BIRYANI
    {
      id: 'veg-biryani',
      name: 'Royal Dum Veg Biryani',
      price: 28.00,
      category: 'Rice & Biryani',
      tag: 'Royal Veg',
      description: 'Slow-cooked basmati rice with assorted seasonal vegetables, mint, and saffron.',
      image: 'royal-dum-veg-biryani.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '30 min',
      spiceLevel: 'Medium'
    },
    {
      id: 'mutton-biryani',
      name: 'Nawabi Mutton Biryani',
      price: 38.00,
      category: 'Rice & Biryani',
      tag: 'Awadhi Heritage',
      description: 'Aromatic basmati rice layered with tender lamb, house-secret spices, and saffron, dum-cooked for six hours.',
      image: 'nawabi-mutton-biryani.jpg',
      available: true,
      special: false,
      foodType: 'Non Vegetarian',
      prepTime: '45 min',
      spiceLevel: 'Medium'
    },
    {
      id: 'jeera-rice',
      name: 'Jeera Rice',
      price: 12.00,
      category: 'Rice & Biryani',
      tag: 'Simple Side',
      description: 'Long grain basmati rice tempered with cumin seeds and fresh ghee.',
      image: 'jeera-rice.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'kashmiri-pulao',
      name: 'Kashmiri Pulao',
      price: 16.00,
      category: 'Rice & Biryani',
      tag: 'Fragrant',
      description: 'Saffron-scented pulao loaded with walnuts, almonds, raisins, and fresh pomegranate.',
      image: 'kashmiri-pulao.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    // BREADS
    {
      id: 'butter-naan',
      name: 'Butter Naan',
      price: 5.00,
      category: 'Breads',
      tag: 'Freshly Baked',
      description: 'Traditional leavened flatbread baked in the tandoor, brushed with rich butter.',
      image: 'butter-naan.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'garlic-naan',
      name: 'Garlic Naan',
      price: 6.00,
      category: 'Breads',
      tag: 'Freshly Baked',
      description: 'Traditional leavened flatbread topped with minced garlic and coriander.',
      image: 'garlic-naan.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'paratha',
      name: 'Laccha Paratha',
      price: 7.00,
      category: 'Breads',
      tag: 'Layered',
      description: 'Crispy, multi-layered whole wheat flatbread roasted in the tandoor.',
      image: 'laccha-paratha.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    // DESSERTS
    {
      id: 'brownie',
      name: 'Belgian Chocolate Brownie',
      price: 14.00,
      category: 'Desserts',
      tag: 'Decadent',
      description: 'Warm, gooey Belgian chocolate brownie served with a scoop of Madagascar vanilla bean gelato.',
      image: 'belgian-chocolate-brownie.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'panna-cotta',
      name: 'Golden Leaf Panna Cotta',
      price: 15.00,
      category: 'Desserts',
      tag: 'Signature',
      description: 'Creamy vanilla bean panna cotta topped with organic rose water reduction and 24k gold leaf details.',
      image: 'golden-leaf-panna-cotta.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'rose-mahal',
      name: 'Saffron Rose Mahal',
      price: 18.00,
      category: 'Desserts',
      tag: 'Michelin Style',
      description: 'A deconstructed dessert featuring rose-scented milk reduction, Iranian saffron strands, and 24k edible gold leaf.',
      image: 'saffron-rose-mahal.jpg',
      available: true,
      special: true,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'gulab-jamun',
      name: 'Gulab Jamun',
      price: 10.00,
      category: 'Desserts',
      tag: 'Traditional',
      description: 'Warm dumplings made of milk solids, soaked in cardamom-flavored rose water syrup.',
      image: 'gulab-jamun.jpg',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    // SIGNATURE COCKTAILS
    {
      id: 'garden-elixir',
      name: 'The Garden Elixir',
      price: 18.00,
      category: 'Signature Cocktails',
      tag: 'Mixology',
      description: 'Botanical gin, elderflower liqueur, cucumber cloud, fresh garden mint, and organic sparkling tonic.',
      image: 'garden-elixir.jpg',
      available: true,
      special: true,
      foodType: 'Vegan',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    },
    {
      id: 'krug-champagne',
      name: 'Vintage Krug 2008',
      price: 240.00,
      category: 'Signature Cocktails',
      tag: 'Sommelier Pick',
      description: 'Rare vintage champagne with toasted notes, vibrant citrus acidity, and an incredibly smooth, creamy finish.',
      image: 'vintage-krug-2008.jpg',
      available: true,
      special: true,
      foodType: 'Vegan',
      prepTime: '10 min',
      spiceLevel: 'Mild'
    }
  ]);

  // Unified Tables Floor Map state
  const [tables, setTables] = useState([]);

  // Live QR data captured from the backend when a table is assigned.
  // Keyed by table id (e.g. "T-03") -> { qrDataUrl, token, menuUrl }
  // Kept separate from `tables` because loadAllData() re-fetches/re-maps
  // tables from GET /api/tables, which does NOT include QR data
  // (the backend only returns it once, at the moment of assignment).
  const [tableQrData, setTableQrData] = useState({});

  // Shared Reservations List state
  const [reservations, setReservations] = useState([]);

  // Unified Orders pipeline state
  const [orders, setOrders] = useState([]);

  // Guest Waitlist Queue state
  const [queue, setQueue] = useState([]);

  // Centralized Billing Ledger state (Keep mock as no backend endpoint exists)
  const [invoices, setInvoices] = useState([
    { id: 'INV-042', table: 'T-04', guest: 'Elena Vance', amount: 611.00, date: '28 Jun 2026', status: 'paid', paymentMethod: 'Credit Card', subtotal: 520.00, gst: 26.00, serviceCharge: 65.00 },
    { id: 'INV-041', table: 'T-02', guest: 'Julian Alvarez', amount: 96.00, date: '28 Jun 2026', status: 'unpaid', paymentMethod: '—', subtotal: 81.70, gst: 4.08, serviceCharge: 10.22 },
    { id: 'INV-040', table: 'T-01', guest: 'Aria Stark', amount: 142.50, date: '27 Jun 2026', status: 'partially-paid', paymentMethod: 'Split Cash', subtotal: 121.28, gst: 6.06, serviceCharge: 15.16 },
    { id: 'INV-039', table: 'T-05', guest: 'John Doe', amount: 204.00, date: '27 Jun 2026', status: 'paid', paymentMethod: 'Apple Pay', subtotal: 173.62, gst: 8.68, serviceCharge: 21.70 },
    { id: 'INV-038', table: 'T-03', guest: 'Winston Churchill', amount: 350.00, date: '26 Jun 2026', status: 'unpaid', paymentMethod: '—', subtotal: 297.87, gst: 14.89, serviceCharge: 37.24 }
  ]);

  // Recent Activity Timeline state (Keep mock)
  const [activities, setActivities] = useState([
    { id: 'act-1', title: 'Table T-02 ordered', detail: 'Saffron Infused Scallops ordered by Julian Alvarez', time: '7 mins ago', icon: 'restaurant', link: '/staff/orders' },
    { id: 'act-2', title: 'Invoice INV-042 generated', detail: 'Table T-04 final invoice issued for Elena Vance', time: '12 mins ago', icon: 'payments', link: '/staff/billing' },
    { id: 'act-3', title: 'Guest checked into Garden Terrace', detail: 'Table T-04 marked active and occupied', time: '22 mins ago', icon: 'check_circle', link: '/staff/tables' },
    { id: 'act-4', title: 'Nawabi Mutton Biryani updated', detail: 'Menu item price set to $38.00 by Rahul Sharma', time: '1 hour ago', icon: 'edit_note', link: '/staff/menu' }
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('staffAuthenticated') === 'true' && !!localStorage.getItem('staffToken');
  });

  const logoutStaff = useCallback(() => {
    localStorage.removeItem('staffToken');
    sessionStorage.removeItem('staffAuthenticated');
    sessionStorage.removeItem('staffName');
    sessionStorage.removeItem('staffRole');
    setIsAuthenticated(false);
    socket.disconnect();
    socket.connect();
  }, []);

  const authenticateStaff = useCallback((token, name, role) => {
    localStorage.setItem('staffToken', token);
    sessionStorage.setItem('staffAuthenticated', 'true');
    sessionStorage.setItem('staffName', name);
    sessionStorage.setItem('staffRole', role);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      logoutStaff();
      alert('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [logoutStaff]);

  // Data mapping helper functions
  const mapBackendOrder = useCallback((o) => {
    const tableStr = "T-" + String(o.tableNumber).padStart(2, '0');
    const diffMs = new Date() - new Date(o.createdAt);
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const timeStr = diffMins === 0 ? 'Just now' : `${diffMins} mins ago`;

    let mappedStatus = 'new';
    if (o.status === 'billed') {
      mappedStatus = 'ready';
    } else if (o.status === 'closed') {
      mappedStatus = 'served';
    }

    return {
      id: o._id,
      table: tableStr,
      section: o.tableNumber <= 5 ? 'Dining Room' : 'Garden Terrace',
      time: timeStr,
      status: mappedStatus,
      items: o.items.map(i => ({
        name: i.name,
        qty: i.qty,
        price: i.price
      })),
      notes: o.notes || '',
      isCustomerOrder: true,
      createdAt: o.createdAt
    };
  }, []);

  const mapBackendTable = useCallback((t, currentOrders) => {
    const tableStr = "T-" + String(t.tableNumber).padStart(2, '0');
    const associatedOrder = currentOrders.find(o => o.table === tableStr && o.status !== 'served');
    
    const items = associatedOrder ? associatedOrder.items : [];
    const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const total = subtotal > 0 ? subtotal * 1.175 : 0;

    return {
      id: tableStr,
      seats: t.capacity,
      status: t.status,
      guestName: associatedOrder ? `Table ${t.tableNumber} Guest` : (t.status === 'reserved' ? 'Reserved Guest' : ''),
      arrivalTime: associatedOrder ? new Date(associatedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      billTotal: parseFloat(total.toFixed(2)),
      notes: associatedOrder ? associatedOrder.notes : '',
      items,
      qrId: `QR-${String(t.tableNumber).padStart(2, '0')}`,
      qrImage: `qr/table-${String(t.tableNumber).padStart(2, '0')}.png`,
      qrRoute: `/menu?table=T${String(t.tableNumber).padStart(2, '0')}`,
      waiter: 'Rahul Sharma',
      guestCount: associatedOrder ? associatedOrder.items.reduce((sum, i) => sum + i.qty, 0) || 2 : 0,
      _id: t._id
    };
  }, []);

  const mapBackendReservation = useCallback((r) => {
    return {
      id: r._id,
      time: r.time,
      guest: r.name,
      partySize: r.guests,
      table: 'T-01',
      vip: r.guests >= 5,
      phone: r.phone,
      status: r.status
    };
  }, []);

  const mapBackendQueueItem = useCallback((q) => {
    const diffMs = new Date() - new Date(q.createdAt);
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const waitTimeStr = diffMins === 0 ? 'Just now' : `${diffMins} Mins`;

    return {
      id: q._id,
      name: q.name,
      partySize: q.partySize,
      waitTime: waitTimeStr,
      phone: q.phone,
      vip: q.partySize >= 5,
      notes: q.notes || '',
      status: 'Waiting'
    };
  }, []);

  // Fetch all data from backend
  const fetchTables = useCallback(async () => {
    const res = await api.get('/api/tables');
    return res.data;
  }, []);

  const fetchReservations = useCallback(async () => {
    const res = await api.get('/api/reservations');
    return res.data;
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await api.get('/api/orders/all-active');
    return res.data;
  }, []);

  const fetchQueue = useCallback(async () => {
    const res = await api.get('/api/tables/waiting');
    return res.data;
  }, []);

  const loadAllData = useCallback(async () => {
    if (!localStorage.getItem('staffToken')) return;

    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setTables(prev => prev.length ? prev : MOCK_TABLES);
      setReservations(prev => prev.length ? prev : MOCK_RESERVATIONS);
      setOrders(prev => prev.length ? prev : MOCK_ORDERS);
      setQueue(prev => prev.length ? prev : MOCK_QUEUE);
      return;
    }

    try {
      const [rawTables, rawReservations, rawOrders, rawQueue] = await Promise.all([
        fetchTables(),
        fetchReservations(),
        fetchOrders(),
        fetchQueue(),
      ]);

      const mappedOrders = rawOrders.map(mapBackendOrder);
      setOrders(mappedOrders);
      setTables(rawTables.map(t => mapBackendTable(t, mappedOrders)));
      setReservations(rawReservations.map(mapBackendReservation));
      setQueue(rawQueue.map(mapBackendQueueItem));
    } catch (err) {
      console.warn('Backend server is offline or failed. Falling back to local mock data.', err);
      setTables(prev => prev.length ? prev : MOCK_TABLES);
      setReservations(prev => prev.length ? prev : MOCK_RESERVATIONS);
      setOrders(prev => prev.length ? prev : MOCK_ORDERS);
      setQueue(prev => prev.length ? prev : MOCK_QUEUE);
    }
  }, [fetchTables, fetchReservations, fetchOrders, fetchQueue, mapBackendOrder, mapBackendTable, mapBackendReservation, mapBackendQueueItem]);

  // Load data reactively when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Live Socket Updates
  useEffect(() => {
    const handleTableUpdate = () => {
      loadAllData();
    };

    const handleOrderUpdate = () => {
      loadAllData();
    };

    const handleReservationNew = (newRes) => {
      setReservations(prev => [mapBackendReservation(newRes), ...prev]);
      logActivity(
        `Table reserved by ${newRes.name}`,
        `New reservation for Party of ${newRes.guests} at ${newRes.time}`,
        'event_seat',
        '/staff/tables'
      );
      loadAllData();
    };

    const handleWaitingListUpdate = () => {
      loadAllData();
    };

    socket.on('table:updated', handleTableUpdate);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('reservation:new', handleReservationNew);
    socket.on('waitingList:updated', handleWaitingListUpdate);

    return () => {
      socket.off('table:updated', handleTableUpdate);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('reservation:new', handleReservationNew);
      socket.off('waitingList:updated', handleWaitingListUpdate);
    };
  }, [loadAllData, mapBackendReservation]);

  // Helper to add activity log
  const logActivity = (title, detail, icon, link = '/staff/dashboard') => {
    const newAct = {
      id: `act-${Date.now()}`,
      title,
      detail,
      time: 'Just now',
      icon,
      link
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Actions:
  // Add Customer Reservation
  const addReservation = async (formData) => {
    const timeSlot = formData.timeSlot || '20:00';
    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    
    if (isMock) {
      const newRes = {
        id: 'res-' + Date.now(),
        time: timeSlot,
        guest: formData.name,
        partySize: parseInt(formData.guests) || 2,
        table: 'T-03',
        vip: (parseInt(formData.guests) || 2) >= 5,
        phone: formData.phone || '',
        status: 'confirmed'
      };
      setReservations(prev => [newRes, ...prev]);
      logActivity(
        `Table reserved by ${formData.name}`,
        `Reservation confirmed for Party of ${formData.guests} at ${timeSlot}`,
        'event_seat',
        '/staff/tables'
      );
      return;
    }

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: timeSlot,
        guests: parseInt(formData.guests) || 2
      };
      await api.post('/api/reservations', payload);
      await loadAllData();

      logActivity(
        `Table reserved by ${formData.name}`,
        `Reservation confirmed for Party of ${formData.guests} at ${timeSlot}`,
        'event_seat',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error adding reservation:', err);
    }
  };

  // Add Customer Cart Order (from guest flow checkout - fallback/mock reference)
  const addOrder = (tableId, cartItems, specialNotes) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    logActivity(
      `Order ${orderId} placed`,
      `Table ${tableId} submitted new kitchen order`,
      'restaurant',
      '/staff/orders'
    );
    return orderId;
  };

  // Kitchen Advance Order status (Accept & Start Prep -> Mark Ready -> Settle)
  const advanceOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      if (order.status === 'new') {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
        logActivity(
          `Order ${orderId} in Preparation`,
          `Kitchen started preparing order for Table ${order.table}`,
          'schedule',
          '/staff/orders'
        );
      } else if (order.status === 'preparing') {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o));
        logActivity(
          `Order ${orderId} Ready`,
          `Chef marked order for Table ${order.table} Ready to Serve`,
          'schedule',
          '/staff/orders'
        );
      } else if (order.status === 'ready') {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'served' } : o));
        logActivity(
          `Order ${orderId} Served`,
          `Waiter served order to Table ${order.table}`,
          'check_circle',
          '/staff/orders'
        );
      }
      return;
    }

    try {
      let nextBackendStatus = null;
      if (order.status === 'new') {
        // new -> preparing (both are 'active' in backend)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
        logActivity(
          `Order ${orderId} in Preparation`,
          `Kitchen started preparing order for Table ${order.table}`,
          'schedule',
          '/staff/orders'
        );
        return;
      } else if (order.status === 'preparing') {
        nextBackendStatus = 'billed';
      } else if (order.status === 'ready') {
        nextBackendStatus = 'closed';
      }

      if (nextBackendStatus) {
        await api.patch(`/api/orders/${orderId}/status`, { status: nextBackendStatus });
        await loadAllData();

        if (nextBackendStatus === 'closed') {
          logActivity(
            `Order ${orderId} Served`,
            `Waiter served order to Table ${order.table}`,
            'check_circle',
            '/staff/orders'
          );
        } else {
          logActivity(
            `Order ${orderId} Ready`,
            `Chef marked order for Table ${order.table} Ready to Serve`,
            'schedule',
            '/staff/orders'
          );
        }
      }
    } catch (err) {
      console.error('Error advancing order status:', err);
      alert(err.message || 'Failed to update order status.');
    }
  };

  // Seating Guest from Queue to Table
  const assignTable = async (queueId, tableId) => {
    const guest = queue.find(q => q.id === queueId);
    const table = tables.find(t => t.id === tableId);
    if (!guest || !table) return;

    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setQueue(prev => prev.filter(q => q.id !== queueId));
      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        status: 'occupied',
        guestName: guest.name,
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        guestCount: guest.partySize
      } : t));

      logActivity(
        `Guest ${guest.name} seated`,
        `Assigned to Table ${tableId} from guest waitlist`,
        'check_circle',
        '/staff/tables'
      );
      return;
    }

    try {
      // Remove from waitlist on backend
      await api.delete(`/api/tables/waiting/${queueId}`);
      // Assign table session on backend — this is the ONLY moment the
      // real QR code / customer token is ever returned, so we must
      // capture it here rather than relying on a later refetch.
      const res = await api.post(`/api/tables/${table._id}/assign`);
      const { qrDataUrl, token } = res.data;
      if (qrDataUrl && token) {
        const menuUrl = `${window.location.origin}/menu?token=${token}`;
        setTableQrData(prev => ({ ...prev, [tableId]: { qrDataUrl, token, menuUrl } }));
      }
      await loadAllData();

      logActivity(
        `Guest ${guest.name} seated`,
        `Assigned to Table ${tableId} from guest waitlist`,
        'check_circle',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error assigning table:', err);
      alert(err.message || 'Failed to assign table.');
    }
  };

  // Settle & Release Table (Invoice Payment flow)
  const markInvoicePaid = async (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    setInvoices(prev => prev.map(i => 
      i.id === invoiceId ? { ...i, status: 'paid', paymentMethod: 'Card (Staff Settled)' } : i
    ));

    logActivity(
      `Invoice ${invoiceId} paid`,
      `Table ${invoice.table} settled bill of $${invoice.amount.toFixed(2)}`,
      'check_circle',
      '/staff/billing'
    );

    // Call releaseTable to free table session in backend
    await releaseTable(invoice.table);
  };

  // Finalize table invoice manually
  const finalizeTableBill = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.billTotal === 0) return;

    const invoiceId = `INV-0${Math.floor(43 + Math.random() * 50)}`;
    const sub = table.billTotal / 1.175;
    
    const newInvoice = {
      id: invoiceId,
      table: tableId,
      guest: table.guestName || 'Diner',
      amount: table.billTotal,
      date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'unpaid',
      paymentMethod: '—',
      subtotal: parseFloat(sub.toFixed(2)),
      gst: parseFloat((sub * 0.05).toFixed(2)),
      serviceCharge: parseFloat((sub * 0.125).toFixed(2))
    };

    setInvoices(prev => [newInvoice, ...prev]);

    logActivity(
      `Invoice ${invoiceId} generated`,
      `Table ${tableId} manually finalized and billed`,
      'payments',
      '/staff/billing'
    );

    await releaseTable(tableId);
  };

  // Release Table manually (free session on backend)
  const releaseTable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        status: 'available',
        guestName: '',
        arrivalTime: '',
        billTotal: 0,
        notes: '',
        items: [],
        guestCount: 0
      } : t));

      logActivity(
        `Table ${tableId} released`,
        `Table is now vacant and available for seating`,
        'check_circle',
        '/staff/tables'
      );
      return;
    }

    try {
      await api.post(`/api/tables/${table._id}/free`);
      setTableQrData(prev => {
        const next = { ...prev };
        delete next[tableId];
        return next;
      });
      await loadAllData();

      logActivity(
        `Table ${tableId} released`,
        `Table is now vacant and available for seating`,
        'check_circle',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error releasing table:', err);
      alert(err.message || 'Failed to release table.');
    }
  };

  // Check In Reserved Guest
  const checkInGuest = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'occupied',
          arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return t;
    }));

    const table = tables.find(t => t.id === tableId);
    logActivity(
      `Guest checked in`,
      `Guest ${table?.guestName || 'Reserved Diner'} seated at Table ${tableId}`,
      'check_circle',
      '/staff/tables'
    );
  };

  // Cancel Reservation
  const cancelReservation = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'available',
          guestName: '',
          arrivalTime: '',
          billTotal: 0,
          notes: '',
          items: [],
          guestCount: 0
        };
      }
      return t;
    }));

    const table = tables.find(t => t.id === tableId);
    logActivity(
      `Reservation cancelled`,
      `Reservation for ${table?.guestName || 'Reserved Diner'} cancelled`,
      'cancel',
      '/staff/tables'
    );
  };

  // Mark Table Cleaning
  const markTableCleaning = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: 'cleaning' };
      }
      return t;
    }));

    logActivity(
      `Table ${tableId} cleaning`,
      `Table set to cleaning state`,
      'sanitizer',
      '/staff/tables'
    );
  };

  // Mark Table Available
  const markTableAvailable = (tableId) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: 'available' };
      }
      return t;
    }));

    logActivity(
      `Table ${tableId} available`,
      `Table marked available for seating`,
      'check_circle',
      '/staff/tables'
    );
  };

  // Add Walk-in/Guest to Queue
  const addGuestToQueue = async (guestDetails) => {
    const isMock = localStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      const newGuest = {
        id: 'Q-' + Date.now(),
        name: guestDetails.name,
        partySize: parseInt(guestDetails.partySize) || 2,
        waitTime: 'Just now',
        phone: guestDetails.phone || '',
        vip: (parseInt(guestDetails.partySize) || 2) >= 5,
        notes: guestDetails.notes || '',
        status: 'Waiting'
      };
      setQueue(prev => [...prev, newGuest]);
      logActivity(
        `Guest ${guestDetails.name} queued`,
        `Added party of ${guestDetails.partySize} to waiting list`,
        'hourglass_empty',
        '/staff/guest-queue'
      );
      return;
    }

    try {
      await api.post('/api/tables/waiting', {
        name: guestDetails.name,
        phone: guestDetails.phone || '',
        partySize: parseInt(guestDetails.partySize) || 2,
        notes: guestDetails.notes || ''
      });
      await loadAllData();

      logActivity(
        `Guest ${guestDetails.name} queued`,
        `Added party of ${guestDetails.partySize} to waiting list`,
        'hourglass_empty',
        '/staff/guest-queue'
      );
    } catch (err) {
      console.error('Error adding guest to waiting list:', err);
      alert(err.message || 'Failed to add guest to waiting list.');
    }
  };

  // Menu Updates (Local mock as no backend endpoint exists)
  const addMenuItem = (item) => {
    const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newItem = {
      ...item,
      id,
      image: item.image || '',
      tag: item.special ? "Chef Special" : "Classic"
    };
    setMenuItems(prev => [...prev, newItem]);
    logActivity(
      `New dish added`,
      `Added "${item.name}" to menu catalog under ${item.category}`,
      'restaurant_menu',
      '/staff/menu'
    );
  };

  const updateMenuItem = (updatedItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    logActivity(
      `Menu item updated`,
      `Updated "${updatedItem.name}" details in menu catalog`,
      'edit_note',
      '/staff/menu'
    );
  };

  const deleteMenuItem = (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    setMenuItems(prev => prev.filter(i => i.id !== itemId));
    logActivity(
      `Menu item archived`,
      `Removed "${item.name}" from active menu catalog`,
      'archive',
      '/staff/menu'
    );
  };

  return (
    <StaffContext.Provider value={{
      restaurantInfo,
      staffProfile,
      reservations,
      tables,
      tableQrData,
      orders,
      invoices,
      queue,
      activities,
      menuItems,
      isAuthenticated,
      authenticateStaff,
      logoutStaff,
      addReservation,
      addOrder,
      advanceOrder,
      assignTable,
      markInvoicePaid,
      finalizeTableBill,
      addGuestToQueue,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      releaseTable,
      checkInGuest,
      cancelReservation,
      markTableCleaning,
      markTableAvailable
    }}>
      {children}
    </StaffContext.Provider>
  );
}
