import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const StaffContext = createContext();

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
  const [tables, setTables] = useState([
    { 
      id: 'T-01', 
      seats: 2, 
      status: 'available', 
      guestName: '', 
      arrivalTime: '', 
      billTotal: 0, 
      notes: '', 
      items: [],
      qrId: 'QR-01',
      qrImage: 'qr/table-01.png',
      qrRoute: '/menu?table=T01',
      waiter: 'Rahul Sharma',
      guestCount: 0
    },
    { 
      id: 'T-02', 
      seats: 4, 
      status: 'occupied', 
      guestName: 'Julian Alvarez', 
      arrivalTime: '19:15', 
      billTotal: 96.00, 
      notes: 'No gluten. Prefers quiet corner table.', 
      items: [
        { name: 'Saffron Infused Scallops', qty: 2, price: 48.00 }
      ],
      qrId: 'QR-02',
      qrImage: 'qr/table-02.png',
      qrRoute: '/menu?table=T02',
      waiter: 'Rahul Sharma',
      guestCount: 2
    },
    { 
      id: 'T-03', 
      seats: 2, 
      status: 'reserved', 
      guestName: 'Aria Stark', 
      arrivalTime: '19:30', 
      billTotal: 0, 
      notes: 'Anniversary celebration. Requesting champagne.', 
      items: [],
      qrId: 'QR-03',
      qrImage: 'qr/table-03.png',
      qrRoute: '/menu?table=T03',
      waiter: 'Rahul Sharma',
      guestCount: 2
    },
    { 
      id: 'T-04', 
      seats: 4, 
      status: 'occupied', 
      guestName: 'Elena Vance', 
      arrivalTime: '20:00', 
      billTotal: 611.00, 
      notes: 'Frequent VIP diner. Walnuts allergy.', 
      items: [
        { name: 'Malai Truffle Paneer', qty: 2, price: 72.00 },
        { name: 'Royal Makhani Murgh', qty: 1, price: 85.00 },
        { name: 'Sommelier Champagne Selection', qty: 1, price: 420.00 }
      ],
      qrId: 'QR-04',
      qrImage: 'qr/table-04.png',
      qrRoute: '/menu?table=T04',
      waiter: 'Rahul Sharma',
      guestCount: 4
    },
    { 
      id: 'T-05', 
      seats: 4, 
      status: 'cleaning', 
      guestName: '', 
      arrivalTime: '', 
      billTotal: 0, 
      notes: '', 
      items: [],
      qrId: 'QR-05',
      qrImage: 'qr/table-05.png',
      qrRoute: '/menu?table=T05',
      waiter: 'Rahul Sharma',
      guestCount: 0
    },
    { 
      id: 'T-06', 
      seats: 6, 
      status: 'available', 
      guestName: '', 
      arrivalTime: '', 
      billTotal: 0, 
      notes: '', 
      items: [],
      qrId: 'QR-06',
      qrImage: 'qr/table-06.png',
      qrRoute: '/menu?table=T06',
      waiter: 'Rahul Sharma',
      guestCount: 0
    },
    { 
      id: 'T-14', 
      seats: 4, 
      status: 'occupied', 
      guestName: 'Garden Terrace Guest', 
      arrivalTime: '20:30', 
      billTotal: 0, 
      notes: '', 
      items: [],
      qrId: 'QR-14',
      qrImage: 'qr/table-14.png',
      qrRoute: '/menu?table=T14',
      waiter: 'Rahul Sharma',
      guestCount: 2
    }
  ]);

  // Shared Reservations List state
  const [reservations, setReservations] = useState([
    { id: 'res-1', time: '6:30 PM', guest: 'Rahul Sharma', partySize: 4, table: 'T-03', vip: false, phone: '+44 7946 0901', status: 'confirmed' },
    { id: 'res-2', time: '7:00 PM', guest: 'Priya Mehta', partySize: 2, table: 'T-06', vip: false, phone: '+44 7946 0902', status: 'confirmed' },
    { id: 'res-3', time: '7:30 PM', guest: 'Aarav Kapoor', partySize: 3, table: 'T-08', vip: true, phone: '+44 7946 0903', status: 'confirmed' }
  ]);

  // Unified Orders pipeline state
  const [orders, setOrders] = useState([
    {
      id: 'ORD-402',
      table: 'T-03',
      section: 'Main Hall',
      time: '4 mins ago',
      status: 'new',
      items: [
        { name: 'Malai Truffle Paneer', qty: 2, price: 26.00 },
        { name: 'Artisanal Garlic Naan', qty: 3, price: 6.00 }
      ],
      notes: 'Walnut allergy warning. Make starters medium spicy.'
    },
    {
      id: 'ORD-398',
      table: 'T-02',
      section: 'Main Hall',
      time: '12 mins ago',
      status: 'preparing',
      items: [
        { name: 'Royal Makhani Murgh', qty: 1, price: 32.00 },
        { name: 'Nawabi Mutton Biryani', qty: 2, price: 38.00 },
        { name: 'Artisanal Garlic Naan', qty: 4, price: 6.00 }
      ],
      notes: 'Serve extra raita with biryani.'
    },
    {
      id: 'ORD-391',
      table: 'T-04',
      section: 'Window Alcove',
      time: '22 mins ago',
      status: 'ready',
      items: [
        { name: 'Saffron Infused Scallops', qty: 3, price: 24.00 }
      ],
      notes: 'VIP customer. Serve immediately.'
    }
  ]);

  // Centralized Billing Ledger state
  const [invoices, setInvoices] = useState([
    { id: 'INV-042', table: 'T-04', guest: 'Elena Vance', amount: 611.00, date: '28 Jun 2026', status: 'paid', paymentMethod: 'Credit Card', subtotal: 520.00, gst: 26.00, serviceCharge: 65.00 },
    { id: 'INV-041', table: 'T-02', guest: 'Julian Alvarez', amount: 96.00, date: '28 Jun 2026', status: 'unpaid', paymentMethod: '—', subtotal: 81.70, gst: 4.08, serviceCharge: 10.22 },
    { id: 'INV-040', table: 'T-01', guest: 'Aria Stark', amount: 142.50, date: '27 Jun 2026', status: 'partially-paid', paymentMethod: 'Split Cash', subtotal: 121.28, gst: 6.06, serviceCharge: 15.16 },
    { id: 'INV-039', table: 'T-05', guest: 'John Doe', amount: 204.00, date: '27 Jun 2026', status: 'paid', paymentMethod: 'Apple Pay', subtotal: 173.62, gst: 8.68, serviceCharge: 21.70 },
    { id: 'INV-038', table: 'T-03', guest: 'Winston Churchill', amount: 350.00, date: '26 Jun 2026', status: 'unpaid', paymentMethod: '—', subtotal: 297.87, gst: 14.89, serviceCharge: 37.24 }
  ]);

  // Guest Waitlist Queue state
  const [queue, setQueue] = useState([
    { id: 'Q-01', name: 'Julianne Moore', partySize: 2, waitTime: '35 Mins', phone: '+1 (555) 019-2834', vip: true, notes: 'Prefers window alcove table.', status: 'Waiting' },
    { id: 'Q-02', name: 'Marcus Aurelius', partySize: 6, waitTime: '15 Mins', phone: '+1 (555) 042-9988', vip: true, notes: 'Celebrating birthday. Requesting Chef\'s Table.', status: 'Waiting' },
    { id: 'Q-03', name: 'Diana Prince', partySize: 4, waitTime: '8 Mins', phone: '+1 (555) 088-7711', vip: false, notes: 'Need high-chair for toddler.', status: 'Waiting' }
  ]);

  // Recent Activity Timeline state
  const [activities, setActivities] = useState([
    { id: 'act-1', title: 'Table T-02 ordered', detail: 'Saffron Infused Scallops ordered by Julian Alvarez', time: '7 mins ago', icon: 'restaurant', link: '/staff/orders' },
    { id: 'act-2', title: 'Invoice INV-042 generated', detail: 'Table T-04 final invoice issued for Elena Vance', time: '12 mins ago', icon: 'payments', link: '/staff/billing' },
    { id: 'act-3', title: 'Guest checked into Garden Terrace', detail: 'Table T-04 marked active and occupied', time: '22 mins ago', icon: 'check_circle', link: '/staff/tables' },
    { id: 'act-4', title: 'Nawabi Mutton Biryani updated', detail: 'Menu item price set to $38.00 by Rahul Sharma', time: '1 hour ago', icon: 'edit_note', link: '/staff/menu' }
  ]);

  // Auto-simulation: use a ref so the interval never goes stale
  // and never causes an infinite render loop via [orders] dependency.
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const advanceOrderRef = useRef(null);
  useEffect(() => {
    // Store advanceOrder in a ref so the interval always calls the latest version
    advanceOrderRef.current = (orderId) => {
      setOrders(prev => {
        const orderToUpdate = prev.find(o => o.id === orderId);
        if (!orderToUpdate) return prev;
        const statusMap = { new: 'preparing', preparing: 'ready' };
        const nextStatus = statusMap[orderToUpdate.status];
        if (!nextStatus) {
          // served — remove from pipeline
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => o.id === orderId ? { ...o, status: nextStatus, time: 'Just now' } : o);
      });
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const active = ordersRef.current.filter(o => o.isCustomerOrder && o.status !== 'served');
      if (active.length > 0 && advanceOrderRef.current) {
        advanceOrderRef.current(active[0].id);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []); // Empty deps — runs ONCE on mount, never re-triggers

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
  const addReservation = (formData) => {
    const timeSlot = formData.timeSlot || '20:00';
    const newRes = {
      id: `res-${Date.now()}`,
      time: timeSlot,
      guest: formData.name,
      partySize: parseInt(formData.guests) || 2,
      table: 'T-01',
      vip: false,
      phone: formData.phone || '',
      status: 'pending'
    };
    setReservations(prev => [newRes, ...prev]);

    logActivity(
      `Table reserved by ${formData.name}`,
      `Reservation confirmed for Party of ${formData.guests} at ${timeSlot}`,
      'event_seat',
      '/staff/tables'
    );

    // Update Table Floor Map status to reserved
    setTables(prev => prev.map(t => {
      if (t.status === 'available') {
        return {
          ...t,
          status: 'reserved',
          guestName: formData.name,
          arrivalTime: timeSlot,
          notes: formData.requests || '',
          guestCount: parseInt(formData.guests) || 2
        };
      }
      return t;
    }));
  };

  // Add Customer Cart Order
  const addOrder = (tableId, cartItems, specialNotes) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedItems = cartItems.map(item => ({
      name: item.name,
      qty: item.quantity,
      price: item.price
    }));
    
    const newOrder = {
      id: orderId,
      table: tableId,
      section: tableId === 'T-14' ? 'Garden Terrace' : 'Dining Room',
      time: 'Just now',
      status: 'new',
      items: formattedItems,
      notes: specialNotes || '',
      isCustomerOrder: true
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update Table Bill items & Total
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updatedItems = [...t.items, ...formattedItems];
        const subtotal = updatedItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
        const serviceCharge = subtotal * 0.125;
        const gst = subtotal * 0.05;
        const total = subtotal + serviceCharge + gst;
        
        return {
          ...t,
          status: 'occupied',
          items: updatedItems,
          billTotal: parseFloat(total.toFixed(2)),
          guestCount: t.guestCount || 2,
          guestName: t.guestName || 'Terrace Diner',
          arrivalTime: t.arrivalTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return t;
    }));

    logActivity(
      `Order ${orderId} placed`,
      `Table ${tableId} submitted new kitchen order`,
      'restaurant',
      '/staff/orders'
    );
    
    return orderId;
  };

  // Kitchen Advance Order status
  const advanceOrder = (orderId) => {
    let orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    let nextStatus = orderToUpdate.status;
    let title = '';
    let detail = '';

    if (orderToUpdate.status === 'new') {
      nextStatus = 'preparing';
      title = `Order ${orderId} in Preparation`;
      detail = `Kitchen started preparing order for Table ${orderToUpdate.table}`;
    } else if (orderToUpdate.status === 'preparing') {
      nextStatus = 'ready';
      title = `Order ${orderId} Ready`;
      detail = `Chef marked order for Table ${orderToUpdate.table} Ready to Serve`;
    } else if (orderToUpdate.status === 'ready') {
      nextStatus = 'served';
      title = `Order ${orderId} Served`;
      detail = `Waiter served order to Table ${orderToUpdate.table}`;
    }

    if (nextStatus === 'served') {
      // Remove from active order pipeline
      setOrders(prev => prev.filter(o => o.id !== orderId));
      
      // Auto-generate invoice
      const targetTable = tables.find(t => t.id === orderToUpdate.table);
      const billAmount = targetTable?.billTotal || 120.00;
      const invoiceId = `INV-0${Math.floor(43 + Math.random() * 50)}`;
      const sub = billAmount / 1.175;
      
      const newInvoice = {
        id: invoiceId,
        table: orderToUpdate.table,
        guest: targetTable?.guestName || 'Terrace Diner',
        amount: billAmount,
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
        `Table ${orderToUpdate.table} bill issued for $${billAmount.toFixed(2)}`,
        'payments',
        '/staff/billing'
      );
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus, time: 'Just now' } : o));
      logActivity(title, detail, 'schedule', '/staff/orders');
    }
  };

  // Seating Guest from Queue to Table
  const assignTable = (queueId, tableId) => {
    const guest = queue.find(q => q.id === queueId);
    if (!guest) return;

    // Remove from queue
    setQueue(prev => prev.filter(q => q.id !== queueId));

    // Seat at table
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'occupied',
          guestName: guest.name,
          arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes: guest.notes || '',
          guestCount: guest.partySize
        };
      }
      return t;
    }));

    logActivity(
      `Guest ${guest.name} seated`,
      `Assigned to Table ${tableId} from guest waitlist`,
      'check_circle',
      '/staff/tables'
    );
  };

  // Settle & Release Table
  const markInvoicePaid = (invoiceId) => {
    let invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    setInvoices(prev => prev.map(i => 
      i.id === invoiceId ? { ...i, status: 'paid', paymentMethod: 'Card (Staff Settled)' } : i
    ));

    // Release table (Set to cleaning first, then available)
    setTables(prev => prev.map(t => {
      if (t.id === invoice.table) {
        return {
          ...t,
          status: 'cleaning',
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

    logActivity(
      `Invoice ${invoiceId} paid`,
      `Table ${invoice.table} settled bill of $${invoice.amount.toFixed(2)}`,
      'check_circle',
      '/staff/billing'
    );

    // After 15s of cleaning, release to available
    setTimeout(() => {
      setTables(prev => prev.map(t => {
        if (t.id === invoice.table && t.status === 'cleaning') {
          return { ...t, status: 'available' };
        }
        return t;
      }));
    }, 15000);
  };

  // Finalize table invoice manually
  const finalizeTableBill = (tableId) => {
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

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: 'cleaning', guestName: '', arrivalTime: '', billTotal: 0, notes: '', items: [], guestCount: 0 };
      }
      return t;
    }));

    logActivity(
      `Invoice ${invoiceId} generated`,
      `Table ${tableId} manually finalized and billed`,
      'payments',
      '/staff/billing'
    );
  };

  // Release Table manually (mark Available, clear orders/guest data)
  const releaseTable = (tableId) => {
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

    logActivity(
      `Table ${tableId} released`,
      `Table is now vacant and available for seating`,
      'check_circle',
      '/staff/tables'
    );
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
    const table = tables.find(t => t.id === tableId);
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
  const addGuestToQueue = (guestDetails) => {
    const queueId = `Q-0${queue.length + 1}`;
    const newGuest = {
      id: queueId,
      name: guestDetails.name,
      partySize: parseInt(guestDetails.partySize) || 2,
      waitTime: 'Just now',
      phone: guestDetails.phone || '',
      vip: guestDetails.vip || false,
      notes: guestDetails.notes || '',
      status: 'Waiting'
    };

    setQueue(prev => [...prev, newGuest]);
    logActivity(
      `Guest ${guestDetails.name} queued`,
      `Added party of ${newGuest.partySize} to waiting list`,
      'hourglass_empty',
      '/staff/guest-queue'
    );
  };

  // Menu Updates
  const addMenuItem = (item) => {
    const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newItem = {
      ...item,
      id,
      image: item.image || '',  // Never substitute a wrong dish image
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
      orders,
      invoices,
      queue,
      activities,
      menuItems,
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
