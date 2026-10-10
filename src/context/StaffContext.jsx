import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';
import { formatINR } from '../utils/currency';

const StaffContext = createContext();

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}

export function StaffProvider({ children }) {
  // Opening hours, legal/tax identity, contact details, and ordering
  // links all live in the backend Settings collection now, so an
  // owner/manager can update them without a developer redeploying code.
  // These are the fallbacks shown until the fetch below resolves (or if
  // it fails) — the exact values that used to be hardcoded here for good.
  const [openingHours, setOpeningHours] = useState([
    { days: "Monday - Thursday", hours: "12:00 PM - 10:30 PM" },
    { days: "Friday - Saturday", hours: "12:00 PM - 11:30 PM" },
    { days: "Sunday", hours: "12:00 PM - 10:00 PM" }
  ]);

  const [legal, setLegal] = useState({
    legalBusinessName: "Spice Garden",
    tagline: "Modern Indian Fine Dining",
    address: "12 Alkapuri Boulevard, Vadodara, Gujarat 390007",
    gstin: "24AABCS1429B1Z8",
    fssai: "21423011000123",
    fssaiEnabled: true,
    sacCode: "996331"
  });

  const [contact, setContact] = useState({
    primaryPhone: "+91 265 234 5678",
    whatsappNumber: "",
    secondaryPhone: "+91 70960 34960",
    email: "concierge@spicegarden.com",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=12+Alkapuri+Boulevard%2C+Vadodara%2C+Gujarat+390007",
    googleMapsEmbedUrl: "https://www.google.com/maps?q=Alkapuri,+Vadodara,+Gujarat+390007&output=embed"
  });

  const [links, setLinks] = useState({
    zomato: "",
    swiggy: "",
    instagram: "https://instagram.com/spicegarden.vadodara",
    facebook: "https://facebook.com/spicegarden.vadodara",
    twitter: "https://twitter.com/spicegardenvd"
  });

  const [billing, setBilling] = useState({
    gstMode: "CUSTOM",
    cgstRate: 3.75,
    sgstRate: 3.75,
    pricesIncludeGst: false,
    serviceChargeEnabled: true,
    serviceChargePercent: 10,
    serviceChargeTaxable: false,
    packagingFeeEnabled: true,
    packagingFeeAmount: 30,
    packagingFeeLabel: "Packaging Charges",
    billFooterNote: "Please verify the bill before payment. No complaints will be entertained thereafter.",
    takeoutBillNote: "Pay at counter. Collect within 20 min of ready time.",
    invoicePrefix: "SG",
    repeatCustomerDiscountEnabled: true,
    repeatCustomerVisitThreshold: 3,
    repeatCustomerDiscountPercent: 5,
    tableAutoReleaseMinutes: 10
  });

  // Reservation booking rules (Settings -> Operations). Mirrors the backend
  // defaults in models/Settings.js so the UI behaves sensibly before the
  // real values load.
  const [reservationRules, setReservationRules] = useState({
    resMinLeadTimeHours: 2,
    resMaxAdvanceDays: 14,
    resHoldGraceMinutes: 15,
    resRequireManagerLargeParties: 0,
    resAutoRejectIfFull: true
  });

  useEffect(() => {
    api.get('/api/settings')
      .then(res => {
        if (res.data?.openingHours?.length) {
          setOpeningHours(res.data.openingHours);
        }
        if (res.data?.legal) {
          setLegal(res.data.legal);
        }
        if (res.data?.contact) {
          setContact(res.data.contact);
        }
        if (res.data?.links) {
          setLinks(res.data.links);
        }
        if (res.data?.billing) {
          setBilling(res.data.billing);
        }
        if (res.data?.reservations) {
          setReservationRules(res.data.reservations);
        }
      })
      .catch(() => {
        // Backend offline or unreachable — keep the fallbacks above so
        // the site still renders, just with stale/default info.
      });
  }, []);

  const updateOpeningHours = async (newHours) => {
    const res = await api.patch('/api/settings', { openingHours: newHours });
    setOpeningHours(res.data.openingHours);
    return res.data.openingHours;
  };

  // Owner-only on the backend — a MANAGER calling this gets a 403, which
  // the settings UI surfaces as an error message rather than silently failing.
  const updateLegalInfo = async (newLegal) => {
    const res = await api.patch('/api/settings', { legal: newLegal });
    setLegal(res.data.legal);
    return res.data.legal;
  };

  // Owner-only on the backend, same as updateLegalInfo.
  const updateContactInfo = async (newContact) => {
    const res = await api.patch('/api/settings', { contact: newContact });
    setContact(res.data.contact);
    return res.data.contact;
  };

  // Owner OR Manager on the backend — no role check needed here, the
  // route itself already allows both.
  const updateLinksInfo = async (newLinks) => {
    const res = await api.patch('/api/settings', { links: newLinks });
    setLinks(res.data.links);
    return res.data.links;
  };
  // Owner-only on the backend — this is the tax/fee math, so it's locked
  // down the same as legal/contact.
  const updateBillingInfo = async (newBilling) => {
    const res = await api.patch('/api/settings', { billing: newBilling });
    setBilling(res.data.billing);
    return res.data.billing;
  };

  // Owner OR Manager on the backend, same access as opening hours/links.
  const updateReservationRules = async (newRules) => {
    const res = await api.patch('/api/settings', { reservations: newRules });
    setReservationRules(res.data.reservations);
    return res.data.reservations;
  };

  // Restaurant Information — now sourced from the backend Settings
  // collection (legal + contact + links + openingHours) instead of
  // being hardcoded here.
  const restaurantInfo = {
    ...legal,
    ...contact,
    ...billing,
    openingHours,
    links
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
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  // Categories are their own collection now — see backend/src/models/Category.js.
  // This lets a category exist (and show up as a tab) with zero items in it.
  const [categories, setCategories] = useState([]);
  // const [menuItems, setMenuItems] = useState([
  //   // STARTERS
  //   {
  //     id: 'paneer-tikka',
  //     name: 'Signature Paneer Tikka',
  //     price: 22.00,
  //     category: 'Starters',
  //     tag: 'Classic',
  //     description: 'Charcoal grilled cottage cheese, spiced yogurt marinade, bell peppers, mint chutney.',
  //     image: 'signature-paneer-tikka.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Medium'
  //   },
  //   {
  //     id: 'hara-bhara-kebab',
  //     name: 'Hara Bhara Kebab',
  //     price: 18.00,
  //     category: 'Starters',
  //     tag: 'Veg Delight',
  //     description: 'Pan-seared patties of spinach, green peas, and potatoes, spiced with aromatic herbs.',
  //     image: 'hara-bhara-kebab.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'croquettes',
  //     name: 'Golden Cheese Croquettes',
  //     price: 16.00,
  //     category: 'Starters',
  //     tag: 'Crunchy',
  //     description: 'Crispy spiced potato shell stuffed with melted mozzarella, cheddar, and fresh herbs.',
  //     image: 'golden-cheese-croquettes.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'truffle-paneer',
  //     name: 'Malai Truffle Paneer',
  //     price: 26.00,
  //     category: 'Starters',
  //     tag: 'Veg Signature',
  //     description: 'Hand-pressed cottage cheese marinated in a delicate truffle-infused cream and white pepper, char-grilled.',
  //     image: 'malai-truffle-paneer.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '20 min',
  //     spiceLevel: 'Medium'
  //   },
  //   {
  //     id: 'scallops',
  //     name: 'Saffron Infused Scallops',
  //     price: 24.00,
  //     category: 'Starters',
  //     tag: 'Signature',
  //     description: 'Wild caught scallops, smooth green pea purée, and a tangy pomegranate reduction.',
  //     image: 'saffron-infused-scallops.jpg',
  //     available: true,
  //     special: true,
  //     foodType: 'Non Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   // MAINS
  //   {
  //     id: 'makhani-murgh',
  //     name: 'Royal Makhani Murgh',
  //     price: 32.00,
  //     category: 'Mains',
  //     tag: 'Chef Special',
  //     description: 'Slow-cooked tandoori chicken in a velvet-smooth tomato and cashew reduction, finished with fenugreek and cultured butter.',
  //     image: 'royal-makhani-murgh.jpg',
  //     available: true,
  //     special: true,
  //     foodType: 'Non Vegetarian',
  //     prepTime: '30 min',
  //     spiceLevel: 'Medium'
  //   },
  //   {
  //     id: 'glazed-quail',
  //     name: 'Truffle Glazed Quail',
  //     price: 58.00,
  //     category: 'Mains',
  //     tag: 'Awadhi Heritage',
  //     description: 'Tender quail roasted with a black truffle glaze, cracked coriander seeds, and caramelized wild forest honey.',
  //     image: 'truffle-glazed-quail.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Non Vegetarian',
  //     prepTime: '45 min',
  //     spiceLevel: 'Hot'
  //   },
  //   {
  //     id: 'kofta-royale',
  //     name: 'Malai Kofta Royale',
  //     price: 28.00,
  //     category: 'Mains',
  //     tag: 'Classic Veg',
  //     description: 'Cottage cheese dumplings stuffed with dry fruits, served in a rich cashew onion gravy.',
  //     image: 'malai-kofta-royale.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '25 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'dal-makhani',
  //     name: 'Dal Makhani',
  //     price: 20.00,
  //     category: 'Mains',
  //     tag: 'Classic',
  //     description: 'Black lentils slow-cooked overnight with cream, butter, tomato purée, and house spices.',
  //     image: 'dal-makhani.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '20 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'palak-paneer',
  //     name: 'Palak Paneer',
  //     price: 22.00,
  //     category: 'Mains',
  //     tag: 'Classic',
  //     description: 'Fresh cottage cheese cubes simmered in a spiced spinach gravy, touched with fresh cream.',
  //     image: 'palak-paneer.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '20 min',
  //     spiceLevel: 'Medium'
  //   },
  //   // RICE & BIRYANI
  //   {
  //     id: 'veg-biryani',
  //     name: 'Royal Dum Veg Biryani',
  //     price: 28.00,
  //     category: 'Rice & Biryani',
  //     tag: 'Royal Veg',
  //     description: 'Slow-cooked basmati rice with assorted seasonal vegetables, mint, and saffron.',
  //     image: 'royal-dum-veg-biryani.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '30 min',
  //     spiceLevel: 'Medium'
  //   },
  //   {
  //     id: 'mutton-biryani',
  //     name: 'Nawabi Mutton Biryani',
  //     price: 38.00,
  //     category: 'Rice & Biryani',
  //     tag: 'Awadhi Heritage',
  //     description: 'Aromatic basmati rice layered with tender lamb, house-secret spices, and saffron, dum-cooked for six hours.',
  //     image: 'nawabi-mutton-biryani.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Non Vegetarian',
  //     prepTime: '45 min',
  //     spiceLevel: 'Medium'
  //   },
  //   {
  //     id: 'jeera-rice',
  //     name: 'Jeera Rice',
  //     price: 12.00,
  //     category: 'Rice & Biryani',
  //     tag: 'Simple Side',
  //     description: 'Long grain basmati rice tempered with cumin seeds and fresh ghee.',
  //     image: 'jeera-rice.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'kashmiri-pulao',
  //     name: 'Kashmiri Pulao',
  //     price: 16.00,
  //     category: 'Rice & Biryani',
  //     tag: 'Fragrant',
  //     description: 'Saffron-scented pulao loaded with walnuts, almonds, raisins, and fresh pomegranate.',
  //     image: 'kashmiri-pulao.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   // BREADS
  //   {
  //     id: 'butter-naan',
  //     name: 'Butter Naan',
  //     price: 5.00,
  //     category: 'Breads',
  //     tag: 'Freshly Baked',
  //     description: 'Traditional leavened flatbread baked in the tandoor, brushed with rich butter.',
  //     image: 'butter-naan.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'garlic-naan',
  //     name: 'Garlic Naan',
  //     price: 6.00,
  //     category: 'Breads',
  //     tag: 'Freshly Baked',
  //     description: 'Traditional leavened flatbread topped with minced garlic and coriander.',
  //     image: 'garlic-naan.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'paratha',
  //     name: 'Laccha Paratha',
  //     price: 7.00,
  //     category: 'Breads',
  //     tag: 'Layered',
  //     description: 'Crispy, multi-layered whole wheat flatbread roasted in the tandoor.',
  //     image: 'laccha-paratha.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   // DESSERTS
  //   {
  //     id: 'brownie',
  //     name: 'Belgian Chocolate Brownie',
  //     price: 14.00,
  //     category: 'Desserts',
  //     tag: 'Decadent',
  //     description: 'Warm, gooey Belgian chocolate brownie served with a scoop of Madagascar vanilla bean gelato.',
  //     image: 'belgian-chocolate-brownie.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'panna-cotta',
  //     name: 'Golden Leaf Panna Cotta',
  //     price: 15.00,
  //     category: 'Desserts',
  //     tag: 'Signature',
  //     description: 'Creamy vanilla bean panna cotta topped with organic rose water reduction and 24k gold leaf details.',
  //     image: 'golden-leaf-panna-cotta.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'rose-mahal',
  //     name: 'Saffron Rose Mahal',
  //     price: 18.00,
  //     category: 'Desserts',
  //     tag: 'Michelin Style',
  //     description: 'A deconstructed dessert featuring rose-scented milk reduction, Iranian saffron strands, and 24k edible gold leaf.',
  //     image: 'saffron-rose-mahal.jpg',
  //     available: true,
  //     special: true,
  //     foodType: 'Vegetarian',
  //     prepTime: '15 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'gulab-jamun',
  //     name: 'Gulab Jamun',
  //     price: 10.00,
  //     category: 'Desserts',
  //     tag: 'Traditional',
  //     description: 'Warm dumplings made of milk solids, soaked in cardamom-flavored rose water syrup.',
  //     image: 'gulab-jamun.jpg',
  //     available: true,
  //     special: false,
  //     foodType: 'Vegetarian',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   // SIGNATURE COCKTAILS
  //   {
  //     id: 'garden-elixir',
  //     name: 'The Garden Elixir',
  //     price: 18.00,
  //     category: 'Signature Cocktails',
  //     tag: 'Mixology',
  //     description: 'Botanical gin, elderflower liqueur, cucumber cloud, fresh garden mint, and organic sparkling tonic.',
  //     image: 'garden-elixir.jpg',
  //     available: true,
  //     special: true,
  //     foodType: 'Vegan',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   },
  //   {
  //     id: 'krug-champagne',
  //     name: 'Vintage Krug 2008',
  //     price: 240.00,
  //     category: 'Signature Cocktails',
  //     tag: 'Sommelier Pick',
  //     description: 'Rare vintage champagne with toasted notes, vibrant citrus acidity, and an incredibly smooth, creamy finish.',
  //     image: 'vintage-krug-2008.jpg',
  //     available: true,
  //     special: true,
  //     foodType: 'Vegan',
  //     prepTime: '10 min',
  //     spiceLevel: 'Mild'
  //   }
  // ]);

  // Unified Tables Floor Map state
  const [tables, setTables] = useState([]);

  // Live QR data captured from the backend when a table is assigned.
  // Keyed by table id (e.g. "T-03") -> { qrDataUrl, token, menuUrl }
  // Kept separate from `tables` because loadAllData() re-fetches/re-maps
  // tables from GET /api/tables, which does NOT include QR data
  // (the backend only returns it once, at the moment of assignment).
  const [tableQrData, setTableQrData] = useState(() => {
    if (typeof window === 'undefined') return {};
    const saved = sessionStorage.getItem('tableQrData');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    sessionStorage.setItem('tableQrData', JSON.stringify(tableQrData));
  }, [tableQrData]);

  // Shared Reservations List state
  const [reservations, setReservations] = useState([]);

  // Unified Orders pipeline state — holds both dine-in and takeout orders,
  // distinguished by orderType on each order.
  const [orders, setOrders] = useState([]);

  // Guest Waitlist Queue state
  const [queue, setQueue] = useState([]);

  // Centralized Billing Ledger state — populated by loadStaffData() from /api/invoices
  const [invoices, setInvoices] = useState([]);

  // Data Loading States
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const isFetchingRef = useRef(false);
  const reloadQueuedRef = useRef(false);
  const isFetchingPublicRef = useRef(false);

  // Recent Activity Timeline state — starts empty and fills from live events
  const [activities, setActivities] = useState([]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('staffAuthenticated') === 'true' && !!sessionStorage.getItem('staffToken');
  });

  const logoutStaff = useCallback(() => {
    sessionStorage.removeItem('staffToken');
    sessionStorage.removeItem('staffAuthenticated');
    sessionStorage.removeItem('staffName');
    sessionStorage.removeItem('staffRole');
    
    // Wipe all staff-sensitive data from context
    setTables([]);
    setReservations([]);
    setOrders([]);
    setQueue([]);
    setInvoices([]);
    setIsDataLoaded(false);

    setIsAuthenticated(false);
    socket.disconnect();
    socket.connect();
  }, []);

  // The signed-in person's name lives in state so the header and dashboard
  // update the moment it changes (sessionStorage alone can't trigger a re-render).
  const [staffName, setStaffName] = useState(() => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('staffName') || '' : ''));

  const authenticateStaff = useCallback((token, name, role) => {
    sessionStorage.setItem('staffToken', token);
    sessionStorage.setItem('staffAuthenticated', 'true');
    sessionStorage.setItem('staffName', name);
    sessionStorage.setItem('staffRole', role);
    setStaffName(name);
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

  // The role shown in the sidebar and used by every page's access checks is
  // cached in sessionStorage at login. Ask the server who we are now — on
  // load, when the tab regains focus, once a minute, and right after any 403
  // — and if the role or name changed, update the cache and reload to the
  // dashboard so every page re-renders with the new permissions.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let checking = false;
    const refreshIdentity = async () => {
      if (checking) return;
      checking = true;
      try {
        const res = await api.get('/api/auth/me');
        const { name, role } = res.data || {};
        if (!role) return;
        const roleChanged = sessionStorage.getItem('staffRole') !== role;
        const nameChanged = sessionStorage.getItem('staffName') !== name;
        if (roleChanged || nameChanged) {
          sessionStorage.setItem('staffRole', role);
          sessionStorage.setItem('staffName', name);
          window.location.assign('/staff/dashboard');
        }
      } catch (err) {
        // 401 is handled globally (it logs out). Anything else: try again later.
      } finally {
        checking = false;
      }
    };

    refreshIdentity();
    const interval = setInterval(refreshIdentity, 60000);
    window.addEventListener('focus', refreshIdentity);
    window.addEventListener('staff-permission-denied', refreshIdentity);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshIdentity);
      window.removeEventListener('staff-permission-denied', refreshIdentity);
    };
  }, [isAuthenticated]);

  // Data mapping helper functions
  const mapBackendOrder = useCallback((o) => {
    const isTakeout = o.orderType === 'takeout';
    const tableStr = isTakeout ? (o.orderNumber || 'Takeout') : "T-" + String(o.tableNumber).padStart(2, '0');
    const diffMs = new Date() - new Date(o.createdAt);
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const timeStr = diffMins === 0 ? 'Just now' : `${diffMins} mins ago`;

    let mappedStatus = 'new';
    if (o.status === 'Preparing') {
      mappedStatus = 'preparing';
    } else if (o.status === 'Ready') {
      mappedStatus = 'ready';
    } else if (o.status === 'Served') {
      mappedStatus = 'served';
    }

    return {
      id: o._id,
      table: tableStr,
      // Tables have no section in the data, so there is only one dining area.
      // (This used to guess "Garden Terrace" for every table above T-05.)
      section: isTakeout ? 'Takeout' : 'Dining Room',
      orderType: o.orderType || 'dine-in',
      orderNumber: o.orderNumber || '',
      pickupTime: o.pickupTime || '',
      readyAt: o.readyAt || null,
      time: timeStr,
      status: mappedStatus,
      items: o.items.map(i => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        round: i.round
      })),
      servedThroughRound: o.servedThroughRound || 0,
      notes: o.notes || '',
      isCustomerOrder: true,
      createdAt: o.createdAt,
      guestName: o.guestName || (isTakeout ? 'Takeout Guest' : `Table ${o.tableNumber} Guest`),
      guestPhone: o.guestPhone || '',
      reservationId: o.reservationId || '',
      sessionId: o.sessionId || ''
    };
  }, []);

  const mapBackendTable = useCallback((t, currentOrders) => {
    const tableStr = "T-" + String(t.tableNumber).padStart(2, '0');
    // Match on the table's actual currentOrderId pointer, not order status.
    // Matching by status !== 'served' was wrong: once the kitchen marked an
    // order served, it silently vanished from the bill view even though the
    // guest was still seated and the invoice hadn't been generated yet.
    const associatedOrder = t.currentOrderId
      ? currentOrders.find(o => o.id === t.currentOrderId)
      : currentOrders.find(o => o.table === tableStr && o.status !== 'served');

    const items = associatedOrder ? associatedOrder.items : [];
    const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    // Was hardcoded to * 1.175 (10% SC + 7.5% GST, the old pre-settings
    // defaults) — this is a live preview of an unbilled table, so it uses
    // the same real, configurable rates the actual invoice will use.
    const serviceCharge = billing.serviceChargeEnabled ? Math.round(subtotal * (billing.serviceChargePercent / 100)) : 0;
    const taxableValue = billing.serviceChargeTaxable ? subtotal + serviceCharge : subtotal;
    const gstAmount = subtotal > 0 ? Math.round(taxableValue * ((billing.cgstRate + billing.sgstRate) / 100)) : 0;
    const total = subtotal > 0 ? subtotal + serviceCharge + gstAmount : 0;

    return {
      id: tableStr,
      seats: t.capacity,
      status: t.status,
      guestName: t.guestName || (associatedOrder ? associatedOrder.guestName || `Table ${t.tableNumber} Guest` : (t.status === 'reserved' ? 'Reserved Guest' : '')),
      arrivalTime: t.arrivalTime || (associatedOrder ? new Date(associatedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
      billTotal:Math.round(total),
      notes: t.notes || (associatedOrder ? associatedOrder.notes : ''),
      items,
      qrId: `QR-${String(t.tableNumber).padStart(2, '0')}`,
      qrImage: t.qrDataUrl || `qr/table-${String(t.tableNumber).padStart(2, '0')}.png`,
      qrRoute: t.token ? `/menu?token=${t.token}` : `/menu?table=T${String(t.tableNumber).padStart(2, '0')}`,
      waiter: t.waiter || 'Rahul Sharma',
      guestCount: t.guestCount || (associatedOrder ? associatedOrder.items.reduce((sum, i) => sum + i.qty, 0) || 2 : 0),
      _id: t._id,
      currentSessionId: t.currentSessionId,
      currentOrderId: t.currentOrderId,
      reservationId: t.reservationId,
      token: t.token,
      // Set once this table's bill is paid; the server frees the table at this time.
      autoReleaseAt: t.autoReleaseAt || null
    };
  }, [billing]);

  const mapBackendReservation = useCallback((r) => {
    return {
      id: r._id,
      time: r.time,
      guest: r.name,
      partySize: r.guests,
      table: r.table || '',
      referenceCode: r.referenceCode || '',
      vip: r.guests >= 5,
      phone: r.phone,
      status: r.status,
      date: r.date,
      specialRequest: r.notes || r.specialRequest || '',
      source: r.source || 'Customer',
      arrivalTime: r.arrivalTime || ''
    };
  }, []);

  const mapBackendQueueItem = useCallback((q) => {
    const diffMs = new Date() - new Date(q.createdAt);
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    // The queue only ever holds walk-ins now (reservations live in their own
    // list), so the wait is always "minutes since they were added". This used
    // to branch on q.source, which waitlist entries don't carry — that's what
    // produced "undefined at undefined" on the Guest Queue screen.
    const waitTimeStr = diffMins === 0 ? 'Just now' : `${diffMins} Mins`;

    const size = q.partySize || q.guests || 2;

    return {
      id: q._id,
      name: q.name,
      partySize: size,
      waitTime: waitTimeStr,
      phone: q.phone || '',
      vip: q.vip || size >= 5,
      notes: q.notes || q.specialRequest || '',
      status: q.status || 'Waiting',
      date: q.date || '',
      time: q.time || '',
      source: q.source || 'Walk-in',
      arrivalTime: q.arrivalTime || '',
      createdAt: q.createdAt
    };
  }, []);

  const mapBackendInvoice = useCallback((inv) => {
    const isTakeout = inv.orderType === 'takeout';
    const tableStr = isTakeout ? (inv.orderNumber || 'Takeout') : "T-" + String(inv.tableNumber).padStart(2, '0');
    const dateStr = new Date(inv.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      table: tableStr,
      guest: inv.guestName || 'Guest',
      partySize: inv.partySize || null,
      amount: inv.total,
      date: dateStr,
      time: timeStr,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      generatedBy: inv.generatedBy || 'Floor Manager',
      orderSource: inv.orderSource || (isTakeout ? 'Takeout' : (inv.reservationId ? 'Reservation' : 'Walk-in')),
      subtotal: inv.subtotal,
      discount: inv.discount || 0,
      gst: inv.gst,
      cgst: inv.cgst,
      sgst: inv.sgst,
      cgstRate: inv.cgstRate,
      sgstRate: inv.sgstRate,
      serviceCharge: inv.serviceCharge,
      serviceChargePercent: inv.serviceChargePercent,
      packagingFee: inv.packagingFee || 0,
      items: inv.items.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      sessionId: inv.sessionId,
      orderId: inv.orderId,
      // GSTIN / FSSAI / SAC as printed when the invoice was issued, so the
      // staff receipt matches what the customer downloaded.
      legalSnapshot: inv.legalSnapshot || null
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

  const fetchInvoices = useCallback(async () => {
    const res = await api.get('/api/invoices');
    return res.data;
  }, []);

  const fetchMenuItems = useCallback(async () => {
    const res = await api.get('/api/menu');
    return res.data;
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/api/categories');
    return res.data;
  }, []);

  const loadPublicData = useCallback(async () => {
  if (isFetchingPublicRef.current) return;
  isFetchingPublicRef.current = true;

  try {
    const [rawMenuItems, rawCategories] = await Promise.all([
      fetchMenuItems(),
      fetchCategories()
    ]);
    if (rawMenuItems && rawMenuItems.length > 0) {
      setMenuItems(rawMenuItems);
      setIsMenuLoading(false);
    }
    if (rawCategories) {
      setCategories(rawCategories);
    }
  } catch (err) {
    console.error('Menu fetch failed, retrying in 3s:', err);
    setTimeout(() => {
      isFetchingPublicRef.current = false;
      loadPublicData();
    }, 3000);
    return;
  } finally {
    isFetchingPublicRef.current = false;
  }
  }, [fetchMenuItems, fetchCategories]);

  const loadStaffData = useCallback(async () => {
    if (!sessionStorage.getItem('staffToken')) return;
    // A refresh is already running. Don't drop this request — it was
    // triggered by a change that may have landed AFTER that refresh read the
    // data — so run once more as soon as the current one finishes.
    if (isFetchingRef.current) {
      reloadQueuedRef.current = true;
      return;
    }
    
    isFetchingRef.current = true;
    setIsError(false);

    try {
      const staffRole = sessionStorage.getItem('staffRole');
      const canViewInvoices = staffRole === 'OWNER' || staffRole === 'MANAGER';

      const [rawTables, rawReservations, rawOrders, rawQueue, rawInvoices] = await Promise.all([
        fetchTables(),
        fetchReservations(),
        fetchOrders(),
        fetchQueue(),
        // Invoices are the only owner/manager-gated source here. If this
        // account was just demoted, a 403 on this one call must not take
        // the whole dashboard down; the identity check will fix the role.
        canViewInvoices ? fetchInvoices().catch(() => []) : Promise.resolve([]),
      ]);

      const mappedOrders = rawOrders.map(mapBackendOrder);
      setOrders(mappedOrders);
      setTables(rawTables.map(t => mapBackendTable(t, mappedOrders)));
      setReservations(rawReservations.map(mapBackendReservation));
      setQueue(rawQueue.map(mapBackendQueueItem));
      setInvoices(rawInvoices.map(mapBackendInvoice));
      setIsDataLoaded(true);
    } catch (err) {
      // Never substitute made-up data for real data. Keep whatever was last
      // loaded (or nothing) and flag the error.
      console.warn('Could not load staff data from the server.', err);
      setIsError(true);
    } finally {
      isFetchingRef.current = false;
      if (reloadQueuedRef.current) {
        reloadQueuedRef.current = false;
        loadStaffData();
      }
    }
  }, [fetchTables, fetchReservations, fetchOrders, fetchQueue, fetchInvoices, mapBackendOrder, mapBackendTable, mapBackendReservation, mapBackendQueueItem, mapBackendInvoice]);

  // Load public data on mount unconditionally
  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // Load data reactively when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadStaffData();
    }
  }, [isAuthenticated, loadStaffData]);

  // Backward-compat alias used by all action functions (assignTable, advanceOrder, etc.)
  // Calls loadStaffData which has the race-condition guard built in.
  const loadAllData = useCallback(() => loadStaffData(), [loadStaffData]);

  // Join the server's "staff" room so events that carry customer details
  // reach this dashboard. Runs on login, and again on every reconnect (a
  // reconnect is a brand-new socket with no room membership). Logging out
  // already disconnects and reconnects the socket, which drops the room.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const joinStaffRoom = () => {
      const token = sessionStorage.getItem('staffToken');
      if (token) socket.emit('staff:join', token);
    };

    if (socket.connected) joinStaffRoom();
    socket.on('connect', joinStaffRoom);
    return () => {
      socket.off('connect', joinStaffRoom);
    };
  }, [isAuthenticated]);

  // Live Socket Updates
  useEffect(() => {
    const handleTableUpdate = () => {
      if (isAuthenticated) loadStaffData();
    };

    const handleOrderUpdate = () => {
      if (isAuthenticated) loadStaffData();
    };

    const handleReservationNew = (newRes) => {
      if (!isAuthenticated) return;
      setReservations(prev => [mapBackendReservation(newRes), ...prev]);
      logActivity(
        `Table reserved by ${newRes.name}`,
        `New reservation for Party of ${newRes.guests} at ${newRes.time}`,
        'event_seat',
        '/staff/tables'
      );
      loadStaffData();
    };

    const handleReservationUpdated = () => {
      if (isAuthenticated) loadStaffData();
    };

    const handleWaitingListUpdate = () => {
      if (isAuthenticated) loadStaffData();
    };

    const handleMenuUpdated = () => {
      loadPublicData();
    };

    const handleSettingsUpdated = () => {
      api.get('/api/settings')
        .then(res => {
          if (res.data?.openingHours?.length) setOpeningHours(res.data.openingHours);
          if (res.data?.legal) setLegal(res.data.legal);
          if (res.data?.contact) setContact(res.data.contact);
          if (res.data?.billing) setBilling(res.data.billing);
          if (res.data?.links) setLinks(res.data.links);
          if (res.data?.reservations) setReservationRules(res.data.reservations);
        })
        .catch(() => {});
    };

    // Safety-net events, so staff are never surprised by a table changing on
    // its own. logActivity is defined further down this component; it only runs
    // later, when an event arrives.
    const handleAutoReleaseNotice = (data) => {
      if (data && (data.reason === 'auto' || data.reason === 'receipt' || data.reason === 'paid-order-attempt')) {
        const why = data.reason === 'receipt'
          ? 'Guest downloaded the receipt after paying'
          : data.reason === 'paid-order-attempt'
            ? 'Guest tried to order after paying'
            : 'Bill was paid and the release timer ran out';
        logActivity(`Table ${data.tableNumber} released automatically`, why, 'check_circle', '/staff/tables');
      }
    };
    const handleAutoReleaseSkipped = (data) => {
      logActivity(`Table ${data?.tableNumber} was not auto-released`, 'New items were added after the bill. Check the table before releasing.', 'warning', '/staff/tables');
    };

    socket.on('table:updated', handleTableUpdate);
    socket.on('table:released', handleTableUpdate);
    socket.on('table:released', handleAutoReleaseNotice);
    socket.on('table:autoReleaseSkipped', handleAutoReleaseSkipped);
    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:new', handleOrderUpdate);
    socket.on('reservation:new', handleReservationNew);
    socket.on('reservation:updated', handleReservationUpdated);
    socket.on('waitingList:updated', handleWaitingListUpdate);
    socket.on('menu:updated', handleMenuUpdated);
    socket.on('category:updated', handleMenuUpdated);
    socket.on('invoice:generated', handleTableUpdate);
    socket.on('invoice:paid', handleTableUpdate);
    socket.on('settings:updated', handleSettingsUpdated);

    return () => {
      socket.off('table:updated', handleTableUpdate);
      socket.off('table:released', handleTableUpdate);
      socket.off('table:released', handleAutoReleaseNotice);
      socket.off('table:autoReleaseSkipped', handleAutoReleaseSkipped);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:new', handleOrderUpdate);
      socket.off('reservation:new', handleReservationNew);
      socket.off('reservation:updated', handleReservationUpdated);
      socket.off('waitingList:updated', handleWaitingListUpdate);
      socket.off('menu:updated', handleMenuUpdated);
      socket.off('category:updated', handleMenuUpdated);
      socket.off('invoice:generated', handleTableUpdate);
      socket.off('invoice:paid', handleTableUpdate);
      socket.off('settings:updated', handleSettingsUpdated);
    };
  }, [isAuthenticated, loadStaffData, loadPublicData, mapBackendReservation]);

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
  const addReservation = async (formData) => {
    const timeSlot = formData.timeSlot || '20:00';
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    
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
        guests: parseInt(formData.guests) || 2,
        notes: formData.notes || ''
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

  // Returns true on success, false on failure. The backend now enforces
  // real rules here (only a Manager/Owner can confirm a large party or mark
  // a no-show), so its error message is shown to the staff member instead
  // of the click silently doing nothing.
  const updateReservationStatus = async (reservationId, status) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status } : r));
      return true;
    }
    try {
      await api.patch(`/api/reservations/${reservationId}`, { status });
      await loadAllData();
      return true;
    } catch (err) {
      console.error('Error updating reservation status:', err);
      alert(err.response?.data?.error || 'Failed to update reservation.');
      return false;
    }
  };

  const deleteReservation = async (reservationId) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      return;
    }
    try {
      await api.delete(`/api/reservations/${reservationId}`);
      await loadAllData();
    } catch (err) {
      console.error('Error deleting reservation:', err);
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

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
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
        nextBackendStatus = 'Preparing';
      } else if (order.status === 'preparing') {
        nextBackendStatus = 'Ready';
      } else if (order.status === 'ready') {
        nextBackendStatus = 'Served';
      }

      if (nextBackendStatus) {
        await api.patch(`/api/orders/${orderId}/status`, { status: nextBackendStatus });
        await loadAllData();

        if (nextBackendStatus === 'Preparing') {
          logActivity(
            `Order ${orderId} in Preparation`,
            `Kitchen started preparing order for Table ${order.table}`,
            'schedule',
            '/staff/orders'
          );
        } else if (nextBackendStatus === 'Ready') {
          logActivity(
            `Order ${orderId} Ready`,
            `Chef marked order for Table ${order.table} Ready to Serve`,
            'schedule',
            '/staff/orders'
          );
        } else if (nextBackendStatus === 'Served') {
          logActivity(
            `Order ${orderId} Served`,
            `Waiter served order to Table ${order.table}`,
            'check_circle',
            '/staff/orders'
          );
        }
      }
    } catch (err) {
      console.error('Error advancing order status:', err);
      alert(err.message || 'Failed to update order status.');
    }
  };

  // Plain cancel — no blacklist, no reason required. For clearing abandoned
  // orders (empty cart, customer never came back) that never should count
  // against the customer, unlike flagCustomerNoShow.
  const cancelOrder = async (orderId) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      return;
    }

    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: 'Cancelled' });
      await loadAllData();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.message || 'Failed to cancel order.');
    }
  };

  // Seating Guest from Queue or Reservation to Table

  const assignTable = async (assignId, tableId) => {
    let guest = queue.find(q => q.id === assignId);
    let isReservation = false;
    if (!guest) {
      guest = reservations.find(r => r.id === assignId);
      isReservation = !!guest;
    }
    const table = tables.find(t => t.id === tableId);
    if (!guest || !table) return;

    const guestName = guest.name || guest.guest;
    const guestPartySize = guest.partySize;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      if (!isReservation) {
        setQueue(prev => prev.filter(q => q.id !== assignId));
      } else {
        setReservations(prev => prev.map(r => r.id === assignId ? { ...r, table: tableId, status: 'seated' } : r));
      }
      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        status: 'occupied',
        guestName: guestName,
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        guestCount: guestPartySize,
        reservationId: isReservation ? assignId : undefined
      } : t));

      logActivity(
        `Guest ${guestName} seated`,
        `Assigned to Table ${tableId}`,
        'check_circle',
        '/staff/tables'
      );
      return;
    }

    try {
      // Assign table session on backend and associate the reservation/walk-in guest
      // Real reservations and walk-ins live in different collections now,
      // so the backend needs to know which id it's been handed.
      const assignPayload = isReservation ? { reservationId: assignId } : { waitlistId: assignId };
      const res = await api.post(`/api/tables/${table._id}/assign`, assignPayload);
      const { qrDataUrl, token } = res.data;
      if (qrDataUrl && token) {
        const menuUrl = `${window.location.origin}/menu?token=${token}`;
        setTableQrData(prev => ({ ...prev, [tableId]: { qrDataUrl, token, menuUrl } }));
      }
      await loadAllData();

      logActivity(
        `Guest ${guestName} seated`,
        `Assigned to Table ${tableId}`,
        'check_circle',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error assigning table:', err);
      alert(err.message || 'Failed to assign table.');
    }
  };

  // Settle & Release Table (Invoice Payment flow)
  const markInvoicePaid = async (invoiceId, paymentMethod = 'Cash') => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setInvoices(prev => prev.map(i => 
        i.id === invoiceId ? { ...i, status: 'paid', paymentMethod } : i
      ));

      logActivity(
        `Invoice ${invoiceId} paid`,
        `Table ${invoice.table} settled bill of ${formatINR(invoice.amount)}`,
        'check_circle',
        '/staff/billing'
      );
      await releaseTable(invoice.table);
      return;
    }

    try {
      await api.patch(`/api/invoices/${invoiceId}`, { status: 'paid', paymentMethod });
      await loadAllData();

      logActivity(
        `Invoice ${invoice.invoiceNumber || invoiceId} paid`,
        `Table ${invoice.table} settled bill of ${formatINR(invoice.amount)}`,
        'check_circle',
        '/staff/billing'
      );
    } catch (err) {
      console.error('Error settling invoice:', err);
      alert(err.message || 'Failed to settle invoice.');
    }
  };

  // Flags a takeout customer's phone number after a no-show, blocking that
  // number from self-starting new online takeout orders. This is the
  // no-OTP-needed anti-ghosting policy — see startTakeoutSession backend.
  const flagCustomerNoShow = async (phone, orderId, reason = '') => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      logActivity(
        'Customer flagged as no-show',
        `${phone} blocked from future online takeout orders — ${reason || 'no reason given'}`,
        'block',
        '/staff/orders'
      );
      return;
    }

    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: 'Cancelled', noShowReason: reason });
      await api.patch(`/api/crm/customers/${phone}/blacklist`, { isBlacklisted: true });
      await loadAllData();
      logActivity(
        'Customer flagged as no-show',
        `${phone} blocked from future online takeout orders — ${reason || 'no reason given'}`,
        'block',
        '/staff/orders'
      );
    } catch (err) {
      console.error('Error flagging no-show:', err);
      alert(err.message || 'Failed to flag customer.');
    }
  };

  // Finalize table invoice manually
  const finalizeTableBill = async (tableId, guestPhone) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table._id) return null;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      const invoiceId = `INV-0${Math.floor(43 + Math.random() * 50)}`;
      const sub = table.billTotal / 1.175;
      
      const newInvoice = {
        id: invoiceId,
        table: tableId,
        guest: table.guestName || 'Diner',
        amount: table.billTotal,
        date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'unpaid',
        paymentMethod: '—',
        orderSource: table.orderSource || (table.reservationId ? 'Reservation' : 'Walk-in'),
        subtotal: Math.round(sub),
        gst: Math.round(sub * 0.05),
        serviceCharge: Math.round(sub * 0.125)
      };

      setInvoices(prev => [newInvoice, ...prev]);

      logActivity(
        `Invoice ${invoiceId} generated`,
        `Table ${tableId} manually finalized and billed`,
        'payments',
        '/staff/billing'
      );
      return newInvoice;
    }

    try {
      const res = await api.post(`/api/invoices/table/${table._id}`, {
        guestName: table.guestName,
        ...(guestPhone ? { guestPhone } : {})
      });
      const newInvoice = mapBackendInvoice(res.data);
      await loadAllData();

      logActivity(
        `Invoice ${newInvoice.invoiceNumber || newInvoice.id} generated`,
        `Table ${tableId} finalized and billed`,
        'payments',
        '/staff/billing'
      );
      return newInvoice;
    } catch (err) {
      console.error('Error finalising table bill:', err);
      alert(err.response?.data?.error || err.message || 'Failed to generate invoice.');
      return null;
    }
  };

  // Release Table manually (free session on backend)
  const releaseTable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
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
  const checkInGuest = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
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
      logActivity(
        `Guest checked in`,
        `Guest ${table?.guestName || 'Reserved Diner'} seated at Table ${tableId}`,
        'check_circle',
        '/staff/tables'
      );
      return;
    }

    try {
      const res = await api.post(`/api/tables/${table._id}/assign`, { reservationId: table.reservationId });
      const { qrDataUrl, token } = res.data;
      if (qrDataUrl && token) {
        const menuUrl = `${window.location.origin}/menu?token=${token}`;
        setTableQrData(prev => ({ ...prev, [tableId]: { qrDataUrl, token, menuUrl } }));
      }
      await loadAllData();
      logActivity(
        `Guest checked in`,
        `Guest ${table.guestName || 'Reserved Diner'} seated at Table ${tableId}`,
        'check_circle',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error checking in guest:', err);
      alert(err.message || 'Failed to check in guest.');
    }
  };

  // Hold a specific table for a confirmed reservation ahead of arrival —
  // the table tile turns "reserved" (yellow) and stays linked to the
  // reservation until the guest is seated or a Manager marks a no-show.
  const holdTableForReservation = async (reservationId, tableId) => {
    const table = tables.find(t => t.id === tableId);
    const reservation = reservations.find(r => r.id === reservationId);
    if (!table || !reservation) return false;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setTables(prev => prev.map(t => t.id === tableId ? {
        ...t,
        status: 'reserved',
        guestName: reservation.guest,
        guestCount: reservation.partySize,
        arrivalTime: reservation.time,
        reservationId
      } : t));
      setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, table: tableId } : r));
      return true;
    }

    try {
      await api.patch(`/api/tables/${table._id}/reserve`, { reservationId });
      await loadAllData();
      logActivity(
        `Table ${tableId} held`,
        `Held for ${reservation.guest} (party of ${reservation.partySize}) at ${reservation.time}`,
        'event_seat',
        '/staff/tables'
      );
      return true;
    } catch (err) {
      console.error('Error holding table:', err);
      alert(err.response?.data?.error || 'Failed to hold table.');
      return false;
    }
  };

  // Cancel Reservation
  const cancelReservation = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
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
      return;
    }

    try {
      if (table.reservationId) {
        await api.patch(`/api/reservations/${table.reservationId}`, { status: 'cancelled' });
      }
      await api.patch(`/api/tables/${table._id}/status`, { status: 'available' });
      await loadAllData();
      logActivity(
        `Reservation cancelled`,
        `Reservation for ${table?.guestName || 'Reserved Diner'} cancelled`,
        'cancel',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    }
  };

  // Mark Table Cleaning
  const markTableCleaning = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
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
      return;
    }

    try {
      await api.patch(`/api/tables/${table._id}/status`, { status: 'cleaning' });
      await loadAllData();
      logActivity(
        `Table ${tableId} cleaning`,
        `Table set to cleaning state`,
        'sanitizer',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error marking table cleaning:', err);
    }
  };

  // Mark Table Available
  const markTableAvailable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
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
      return;
    }

    try {
      await api.patch(`/api/tables/${table._id}/status`, { status: 'available' });
      await loadAllData();
      logActivity(
        `Table ${tableId} available`,
        `Table marked available for seating`,
        'check_circle',
        '/staff/tables'
      );
    } catch (err) {
      console.error('Error marking table available:', err);
    }
  };

  // Add Walk-in/Guest to Queue
  const addGuestToQueue = async (guestDetails) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
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
        notes: guestDetails.notes || '',
        vip: !!guestDetails.vip
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

  // Walk-in left before a table opened up — takes them off the waitlist.
  const removeFromQueue = async (queueId) => {
    const guest = queue.find(q => q.id === queueId);
    if (!guest) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setQueue(prev => prev.filter(q => q.id !== queueId));
      return;
    }

    try {
      await api.delete(`/api/tables/waiting/${queueId}`);
      await loadAllData();
      logActivity(
        `Guest ${guest.name} left the waitlist`,
        `Party of ${guest.partySize} removed from the walk-in waitlist`,
        'hourglass_disabled',
        '/staff/guest-queue'
      );
    } catch (err) {
      console.error('Error removing guest from waitlist:', err);
      alert(err.response?.data?.error || 'Failed to remove guest from waitlist.');
    }
  };

  // Menu Updates
  const addMenuItem = async (item) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
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
      return;
    }

    try {
      const payload = {
        ...item,
        tag: item.special ? "Chef Special" : "Classic"
      };
      await api.post('/api/menu', payload);
      await loadAllData();
      logActivity(
        `New dish added`,
        `Added "${item.name}" to menu catalog under ${item.category}`,
        'restaurant_menu',
        '/staff/menu'
      );
    } catch (err) {
      console.error('Error adding menu item:', err);
    }
  };

  const reseedDemoMenu = async () => {
  const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
  if (isMock) {
      logActivity(`Demo menu synced`, `Demo prices refreshed (preview mode, no backend call made)`, 'restaurant_menu', '/staff/menu');
      return { message: 'Preview mode: no backend call made.' };
    }
    try {
      const res = await api.post('/api/menu/seed');
      await loadAllData();
      logActivity(`Demo menu synced`, `Refreshed built-in demo dishes to current prices (${res.data.created} created, ${res.data.updated} updated)`, 'restaurant_menu', '/staff/menu');
      return res.data;
    } catch (err) {
      console.error('Error syncing demo menu:', err);
      throw err;
    }
  };

  const updateMenuItem = async (updatedItem) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      logActivity(
        `Menu item updated`,
        `Updated "${updatedItem.name}" details in menu catalog`,
        'edit_note',
        '/staff/menu'
      );
      return;
    }

    try {
      await api.patch(`/api/menu/${updatedItem.id}`, updatedItem);
      await loadAllData();
      logActivity(
        `Menu item updated`,
        `Updated "${updatedItem.name}" details in menu catalog`,
        'edit_note',
        '/staff/menu'
      );
    } catch (err) {
      console.error('Error updating menu item:', err);
    }
  };

  const deleteMenuItem = async (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      logActivity(
        `Menu item deleted`,
        `Permanently deleted "${item.name}" from the menu catalog`,
        'delete',
        '/staff/menu'
      );
      return;
    }

    try {
      await api.delete(`/api/menu/${itemId}`);
      await loadAllData();
      logActivity(
          `Menu item deleted`,
          `Permanently deleted "${item.name}" from the menu catalog`,
          'delete',
          '/staff/menu'
      );
    } catch (err) {
      console.error('Error deleting menu item:', err);
    }
  };

  // Category management — categories now exist independently of items,
  // so a category can be created empty and dishes added to it afterward.
  // Nudges one category up or down by swapping its sortOrder with its
  // immediate neighbor, then persists the resulting full order. Optimistic
  // local update first so the arrow feels instant — loadPublicData() then
  // reconciles with the server's actual state.
  const reorderCategories = async (categoryId, direction) => {
    const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = sorted.findIndex(c => c.id === categoryId);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= sorted.length) return;

    [sorted[index], sorted[swapWith]] = [sorted[swapWith], sorted[index]];
    const orderedIds = sorted.map(c => c.id);

    setCategories(prev => {
      const byId = Object.fromEntries(sorted.map((c, i) => [c.id, i]));
      return [...prev].sort((a, b) => byId[a.id] - byId[b.id]).map((c, i) => ({ ...c, sortOrder: i }));
    });

    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) return;

    await api.patch('/api/categories/reorder', { orderedIds });
    await loadPublicData();
  };

  const addCategory = async (name) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      const fakeCategory = { id: `local-${Date.now()}`, name, sortOrder: categories.length };
      setCategories(prev => [...prev, fakeCategory]);
      logActivity(`Category added`, `Added "${name}" as a new menu category`, 'category', '/staff/menu');
      return fakeCategory;
    }

    const res = await api.post('/api/categories', { name });
    await loadPublicData();
    logActivity(`Category added`, `Added "${name}" as a new menu category`, 'category', '/staff/menu');
    return res.data;
  };

  const renameCategory = async (categoryId, newName) => {
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: newName } : c));
      logActivity(`Category renamed`, `Renamed a category to "${newName}"`, 'category', '/staff/menu');
      return;
    }

    const res = await api.patch(`/api/categories/${categoryId}`, { name: newName });
    await loadPublicData();
    logActivity(`Category renamed`, `Renamed a category to "${newName}"`, 'category', '/staff/menu');
    return res.data;
  };

  // reassignTo (optional): name of another category to move this
  // category's dishes into first. Without it, the backend refuses to
  // delete a non-empty category — this function surfaces that refusal
  // to the caller (StaffMenuPage) rather than silently swallowing it, so
  // the UI can ask "move these N dishes where?" instead of items just
  // disappearing.
  const deleteCategory = async (categoryId, reassignTo) => {
    const category = categories.find(c => c.id === categoryId);
    const isMock = sessionStorage.getItem('staffToken') === 'mock-jwt-token-for-preview-only';
    if (isMock) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      if (reassignTo && category) {
        setMenuItems(prev => prev.map(i => i.category === category.name ? { ...i, category: reassignTo } : i));
      }
      logActivity(`Category deleted`, `Removed "${category?.name || categoryId}" from menu categories`, 'category', '/staff/menu');
      return;
    }

    const params = reassignTo ? { reassignTo } : {};
    const res = await api.delete(`/api/categories/${categoryId}`, { params });
    await loadPublicData();
    logActivity(`Category deleted`, `Removed "${category?.name || categoryId}" from menu categories`, 'category', '/staff/menu');
    return res.data;
  };

  return (
    <StaffContext.Provider value={{
      restaurantInfo,
      staffProfile,
      staffName,
      setStaffName,
      reservations,
      tables,
      tableQrData,
      orders,
      invoices,
      queue,
      activities,
      menuItems,
      categories,
      isAuthenticated,
      isDataLoaded,
      isError,
      authenticateStaff,
      logoutStaff,
      addReservation,
      updateReservationStatus,
      deleteReservation,
      addOrder,
      advanceOrder,
      cancelOrder,
      assignTable,
      markInvoicePaid,
      updateOpeningHours,
      updateLegalInfo,
      updateContactInfo,
      updateBillingInfo,
      updateLinksInfo,
      reservationRules,
      updateReservationRules,
      holdTableForReservation,
      flagCustomerNoShow,
      finalizeTableBill,
      addGuestToQueue,
      removeFromQueue,
      addMenuItem,
      reseedDemoMenu,
      updateMenuItem,
      deleteMenuItem,
      addCategory,
      renameCategory,
      deleteCategory,
      reorderCategories,
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
