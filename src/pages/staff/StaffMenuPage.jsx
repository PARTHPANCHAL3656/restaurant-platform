import React, { useState, useEffect, useMemo } from 'react';
import { useStaff } from '../../context/StaffContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getImage } from '../../utils/assetHelper';
import { formatINR } from '../../utils/currency';

export default function StaffMenuPage() {
  const {
    menuItems, addMenuItem, updateMenuItem, deleteMenuItem, reseedDemoMenu,
    categories: staffCategories, addCategory, renameCategory, deleteCategory
  } = useStaff();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [drawerMode, setDrawerMode] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!menuItems || menuItems.length === 0) {
        setNetworkError(true);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [menuItems]);

  const handleRetry = () => {
    setIsLoading(true);
    setNetworkError(false);
    setTimeout(() => {
      setIsLoading(false);
      if (!menuItems || menuItems.length === 0) {
        setNetworkError(true);
      }
    }, 450);
  };

  useEffect(() => {
    if (drawerMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerMode]);

  // Form states
  const [formState, setFormState] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    available: true,
    special: false,
    foodType: 'Vegetarian',
    prepTime: '15 min',
    spiceLevel: 'Medium',
    image: ''
  });

  // Modal confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Manage Categories drawer state
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryActionError, setCategoryActionError] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  // Category currently mid-delete that turned out to have items in it —
  // set to { category, itemCount } to show the "move dishes to..." step.
  const [reassignTarget, setReassignTarget] = useState(null);
  const [reassignToName, setReassignToName] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);

  const itemCountByCategory = useMemo(() => {
    const counts = {};
    menuItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryActionError('');
    setCategoryBusy(true);
    try {
      await addCategory(name);
      setNewCategoryName('');
    } catch (err) {
      setCategoryActionError(err.response?.data?.error || 'Could not add category.');
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleStartRename = (cat) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setCategoryActionError('');
  };

  const handleConfirmRename = async (cat) => {
    const name = editingCategoryName.trim();
    if (!name || name === cat.name) {
      setEditingCategoryId(null);
      return;
    }
    setCategoryActionError('');
    setCategoryBusy(true);
    try {
      await renameCategory(cat.id, name);
      setEditingCategoryId(null);
    } catch (err) {
      setCategoryActionError(err.response?.data?.error || 'Could not rename category.');
    } finally {
      setCategoryBusy(false);
    }
  };

  // First attempt with no reassignTo — if the backend says the category
  // still has dishes in it, drop into the "move dishes to..." step instead
  // of just failing.
  const handleDeleteCategory = async (cat) => {
    setCategoryActionError('');
    const count = itemCountByCategory[cat.name] || 0;
    if (count === 0) {
      if (!window.confirm(`Delete "${cat.name}"? It has no dishes in it.`)) return;
      setCategoryBusy(true);
      try {
        await deleteCategory(cat.id);
      } catch (err) {
        setCategoryActionError(err.response?.data?.error || 'Could not delete category.');
      } finally {
        setCategoryBusy(false);
      }
      return;
    }
    setReassignTarget({ category: cat, itemCount: count });
    setReassignToName('');
  };

  const handleConfirmReassignAndDelete = async () => {
    if (!reassignTarget) return;
    if (!reassignToName) {
      setCategoryActionError('Pick a category to move these dishes to.');
      return;
    }
    setCategoryActionError('');
    setCategoryBusy(true);
    try {
      await deleteCategory(reassignTarget.category.id, reassignToName);
      setReassignTarget(null);
    } catch (err) {
      setCategoryActionError(err.response?.data?.error || 'Could not delete category.');
    } finally {
      setCategoryBusy(false);
    }
  };

  // 'All' is a frontend-only pseudo-category, never stored in the DB.
  // Every real category now comes from staffCategories (the Category
  // collection) — no limit on how many, and a category can exist here
  // with zero items in it (see "Manage Categories" drawer below).
  const categories = useMemo(
    () => ['All', ...staffCategories.map((c) => c.name)],
    [staffCategories]
  );

  const [isResyncing, setIsResyncing] = useState(false);
  const handleResyncDemoMenu = async () => {
    const confirmed = window.confirm("This refreshes prices/details on the built-in demo dishes only (matched by name). Any custom dishes you've added yourself are never touched. Continue?");
    if (!confirmed) return;
    setIsResyncing(true);
    try { await reseedDemoMenu(); } catch { alert('Sync failed, check console for details.'); } finally { setIsResyncing(false); }
  };

  // Handle opening drawers
  const handleOpenAdd = () => {
    setFormState({
      name: '',
      category: staffCategories[0]?.name || '',
      description: '',
      price: '',
      available: true,
      special: false,
      foodType: 'Vegetarian',
      prepTime: '15 min',
      spiceLevel: 'Medium',
      image: ''
    });
    setDrawerMode('add');
  };

  const handleOpenEdit = (item) => {
    setFormState({
      ...item,
      price: item.price.toString()
    });
    setActiveItemId(item.id);
    setDrawerMode('edit');
  };

  const handleOpenPreview = (item) => {
    setActiveItemId(item.id);
    setDrawerMode('preview');
  };

  const handleDuplicate = (item) => {
    const duplicated = {
      ...item,
      name: `${item.name} (Copy)`,
      id: `${item.id}-copy`
    };
    addMenuItem(duplicated);
  };

  // Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormState(prev => ({
        ...prev,
        image: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.price) return;
    if (!formState.category) {
      alert('Add a category first (see "Manage Categories"), then pick it here.');
      return;
    }

    const dishPayload = {
      ...formState,
      price: parseFloat(formState.price) || 0
    };

    if (drawerMode === 'add') {
      addMenuItem(dishPayload);
    } else if (drawerMode === 'edit') {
      updateMenuItem({
        ...dishPayload,
        id: activeItemId
      });
    }

    setDrawerMode(null);
  };

  const handleConfirmArchive = () => {
    if (deleteConfirmId) {
      deleteMenuItem(deleteConfirmId);
      setDeleteConfirmId(null);
      if (drawerMode === 'preview' && activeItemId === deleteConfirmId) {
        setDrawerMode(null);
      }
    }
  };

  // Guard: if selectedCategory somehow becomes invalid, fall back to 'All'
  const safeCategory = categories.includes(selectedCategory) ? selectedCategory : 'All';

  // Memoize filtered dishes — prevents unnecessary re-renders from parent context updates
  const filteredDishes = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    return menuItems.filter(item => {
      const normalizedItemCat = item.category === 'Main Course' ? 'Mains' : item.category;
      const matchesCategory = safeCategory === 'All' || normalizedItemCat === safeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, safeCategory, searchQuery]);

  const activeItem = menuItems.find(i => i.id === activeItemId);

  if (isLoading) {
    return (
      <div className="relative select-none bg-surface min-h-screen pt-20">
        <div className="px-6 md:px-12 py-8 space-y-6 max-w-5xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white p-6 border border-muted-border space-y-6 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="h-6 bg-muted-border w-48 rounded" />
                <div className="h-4 bg-muted-border w-64 rounded" />
              </div>
              <div className="h-14 bg-muted-border w-40 rounded" />
            </div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-muted-border h-72 animate-pulse space-y-4 p-6">
                <div className="w-full h-40 bg-muted-border" />
                <div className="h-6 bg-muted-border w-3/4 rounded" />
                <div className="h-4 bg-muted-border w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="relative select-none bg-surface min-h-screen flex items-center justify-center p-6 pt-20">
        <div className="bg-white border border-muted-border max-w-md w-full p-8 shadow-md text-center space-y-6">
          <span className="material-symbols-outlined text-red-500 text-4xl">cloud_off</span>
          <h3 className="font-serif text-xl text-ink-navy font-bold">Failed to Load Menu</h3>
          <p className="font-sans text-xs text-subtle-text leading-relaxed">
            We encountered a network error while fetching the restaurant culinary menu offerings.
          </p>
          <button 
            onClick={handleRetry}
            className="w-full h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center font-bold"
          >
            Retry Fetching Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative select-none bg-surface min-h-screen">
      
      {/* Main Catalog Viewport */}
      <div className="px-6 md:px-12 py-8 space-y-6 max-w-5xl mx-auto">

          {/* Header Controls: Categories, Search, and Action */}
          <div className="bg-white p-6 border border-muted-border space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-serif text-lg text-ink-navy font-semibold">Menu Catalog</h3>
                <p className="text-xs text-subtle-text">Sartorial curation of restaurant culinary offerings.</p>
              </div>
              
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text text-sm">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signature dishes..." 
                  className="w-full bg-transparent border-b border-saffron-gold/20 py-2 pl-9 pr-4 focus:outline-none focus:border-saffron-gold focus:ring-1 focus:ring-saffron-gold/15 font-body-md text-xs placeholder:text-subtle-text/30 outline-none transition-all duration-300"
                />
              </div>

              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4">

                {/* Primary Add Action */}
                <button 
                  onClick={handleOpenAdd}
                  title="Add New Dish"
                  className="h-12 sm:h-[56px] px-2 sm:px-6 bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span className="hidden sm:inline">Add New Dish</span>
                </button>

                <button
                  onClick={() => setCategoryDrawerOpen(true)}
                  title="Manage Categories"
                  className="h-12 sm:h-[56px] px-2 sm:px-6 border border-muted-border text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:border-saffron-gold transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span className="hidden sm:inline">Manage Categories</span>
                </button>

                <button 
                onClick={handleResyncDemoMenu} 
                disabled={isResyncing} 
                title="Refreshes the built-in demo dishes to their current  default prices. Does not touch dishes you've added yourself." 
                className="h-12 sm:h-[56px] px-2 sm:px-6 border border-muted-border text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:border-saffron-gold transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className={`material-symbols-outlined text-lg ${isResyncing ? 'animate-spin' : ''}`}> sync </span>
                  <span className="hidden sm:inline"> {isResyncing ? 'Syncing...' : 'Sync Demo Prices'} </span>
                </button>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="overflow-x-auto hide-scrollbar whitespace-nowrap pt-2">
              <div className="flex gap-6 border-b border-muted-border">
                {categories.map((cat) => {
                  const active = safeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`pb-3 font-label-caps text-xs tracking-wider uppercase relative transition-colors focus:outline-none cursor-pointer ${
                        active ? 'text-saffron-gold font-bold' : 'text-subtle-text hover:text-ink-navy'
                      }`}
                    >
                      {cat}
                      {active && (
                        <motion.div 
                          layoutId="activeMenuTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-saffron-gold"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredDishes.length === 0 ? (
            <div className="bg-white p-16 text-center border border-muted-border text-subtle-text">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">restaurant_menu</span>
              <p className="font-serif text-md">No dishes matching the filters were found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDishes.map((dish) => (
                <article 
                  key={dish.id} 
                  className="bg-white border border-muted-border flex flex-col justify-between hover:shadow-xl group transition-all duration-300"
                >
                  <div>
                    {/* Image block */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-container border-b border-muted-border flex items-center justify-center">
                      <img 
                        src={getImage(dish.image)} 
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                        loading="lazy"
                      />
                      
                      {/* Badge overlays */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {dish.special && (
                          <span className="bg-saffron-gold/10 text-saffron-gold border border-saffron-gold/30 px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase font-bold">
                            Chef Special
                          </span>
                        )}
                        {!dish.available ? (
                          <span className="bg-surface-container-low text-[#8B6B3F] border border-[#C2B29A] px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase font-bold">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-[#FBF8F2] text-ink-navy border border-[#D8C6A5] px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase font-bold">
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata text */}
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-md font-bold text-ink-navy">{dish.name}</h4>
                        <span className="font-serif text-saffron-gold font-bold">{formatINR(dish.price)}</span>
                      </div>
                      <p className="text-xs text-subtle-text line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                      <div className="flex gap-4 text-[10px] font-label-caps text-subtle-text">
                        <span>Type: <strong className="text-ink-navy">{dish.foodType}</strong></span>
                        <span>Prep: <strong className="text-ink-navy">{dish.prepTime}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-6 py-4 border-t border-muted-border/40 flex justify-between items-center text-xs">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleOpenPreview(dish)}
                        className="text-subtle-text hover:text-saffron-gold transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(dish)}
                        className="text-subtle-text hover:text-ink-navy transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleDuplicate(dish)}
                        className="text-subtle-text hover:text-saffron-gold transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Duplicate
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(dish.id)}
                        className="text-red-500 hover:text-red-700 transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}

      </div>

      {/* Slide-over Right Drawer (Widths: 40% Desktop, 70% Tablet, 100% Mobile) */}
      <AnimatePresence>
        {drawerMode && (
          <>
            {/* Drawer Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerMode(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />

            {/* Slide drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 bg-white border-l border-muted-border shadow-2xl flex flex-col w-full sm:w-[70vw] lg:w-[40vw] h-screen overflow-hidden"
            >
              {drawerMode === 'preview' && activeItem ? (
                <div className="h-full flex flex-col justify-between">
                  {/* Header */}
                  <div className="p-6 bg-ink-navy text-canvas-cream shrink-0 flex justify-between items-start">
                    <div>
                      <span className="font-label-caps text-[9px] text-saffron-gold tracking-widest font-bold uppercase block mb-1">
                        Dish Preview
                      </span>
                      <h3 className="font-serif text-2xl">{activeItem.name}</h3>
                    </div>
                    <button 
                      onClick={() => setDrawerMode(null)}
                      className="p-1 text-canvas-cream/50 hover:text-canvas-cream hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  {/* Body Preview */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs">
                    <div className="aspect-[16/10] overflow-hidden bg-surface border border-muted-border flex items-center justify-center">
                      {activeItem.image ? (
                        <img 
                          src={getImage(activeItem.image)} 
                          alt={activeItem.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif italic text-xs text-subtle-text/50">Image Missing</span>
                      )}
                    </div>

                    <div className="flex justify-between items-end border-b border-muted-border pb-4">
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Category</span>
                        <span className="font-serif text-md text-ink-navy font-bold">{activeItem.category}</span>
                      </div>
                      <span className="font-serif text-3xl text-saffron-gold font-bold">{formatINR(activeItem.price)}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="font-label-caps text-[9px] text-subtle-text uppercase block">Culinary Description</span>
                      <p className="font-sans text-body-md text-ink-navy/80 leading-relaxed">
                        {activeItem.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-muted-border/40">
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Preparation Time</span>
                        <span className="font-body-md text-ink-navy font-bold">{activeItem.prepTime}</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Spice Rating</span>
                        <span className="font-body-md text-ink-navy font-bold">{activeItem.spiceLevel}</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Food Category</span>
                        <span className="font-body-md text-ink-navy font-bold">{activeItem.foodType}</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Kitchen Status</span>
                        {activeItem.available ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FBF8F2] text-ink-navy border border-[#D8C6A5] text-[10px] font-label-caps uppercase tracking-widest font-bold">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low text-[#8B6B3F] border border-[#C2B29A] text-[10px] font-label-caps uppercase tracking-widest font-bold">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-muted-border bg-canvas-cream shrink-0 flex gap-4">
                    <button 
                      onClick={() => handleOpenEdit(activeItem)}
                      className="flex-grow h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center font-bold"
                    >
                      Edit Dish
                    </button>
                    <button 
                      onClick={() => setDrawerMode(null)}
                      className="h-[56px] px-8 border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Add / Edit Form */
                <form onSubmit={handleFormSubmit} className="h-full flex flex-col justify-between">
                  {/* Header */}
                  <div className="p-6 border-b border-muted-border shrink-0 flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-lg text-ink-navy font-semibold">
                        {drawerMode === 'add' ? 'Add New Dish' : 'Edit Dish'}
                      </h3>
                      <p className="text-[10px] text-subtle-text font-mono tracking-widest uppercase mt-0.5">
                        {drawerMode === 'add' ? 'New Recipe Creation' : activeItem?.id}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setDrawerMode(null)}
                      className="p-1 hover:bg-surface-container-low rounded-full transition-colors focus:outline-none text-subtle-text"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  {/* Form Scroll Content */}
                  <div className="flex-grow p-6 space-y-6 overflow-y-auto text-xs">
                    
                    {/* Image Upload Area */}
                    <div className="space-y-2">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Dish Image</label>
                      <div className="border-2 border-dashed border-[#C2B29A] p-6 text-center hover:border-saffron-gold transition-colors relative flex flex-col items-center justify-center bg-canvas-cream">
                        {formState.image ? (
                          <div className="space-y-4 w-full">
                            <img src={getImage(formState.image)} alt="Preview" className="max-h-48 mx-auto object-cover border border-muted-border" />
                            <label className="inline-flex py-2 px-4 bg-ink-navy text-canvas-cream font-label-caps text-[9px] uppercase tracking-widest hover:bg-black transition-all cursor-pointer">
                              Replace Photo
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 py-8 w-full">
                            <span className="material-symbols-outlined text-4xl text-[#C2B29A]">add_a_photo</span>
                            <span className="font-label-caps text-[9px] text-[#8B6B3F] uppercase tracking-widest">Upload Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Dish Name */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Dish Name</label>
                      <input 
                        type="text" 
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="E.g. Truffle Butter Chicken"
                        className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy outline-none"
                        required
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Category</label>
                      <select 
                        value={formState.category}
                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                        className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
                      >
                        {staffCategories.length === 0 && (
                          <option value="">No categories yet — add one first</option>
                        )}
                        {staffCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price in ₹ */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formState.price}
                        onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                        placeholder="Price in ₹"
                        className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy outline-none"
                        required
                      />
                    </div>

                    {/* Food Type Radios */}
                    <div className="space-y-2">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Food Type</label>
                      <div className="flex gap-6">
                        {['Vegetarian', 'Non Vegetarian', 'Vegan'].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="radio" 
                              name="foodType" 
                              value={type}
                              checked={formState.foodType === type}
                              onChange={() => setFormState({ ...formState, foodType: type })}
                              className="form-radio text-saffron-gold focus:ring-0"
                            />
                            <span className="font-label-caps text-[9px] uppercase tracking-wider text-subtle-text">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Prep Time Selector */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Preparation Time</label>
                      <select 
                        value={formState.prepTime}
                        onChange={(e) => setFormState({ ...formState, prepTime: e.target.value })}
                        className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
                      >
                        <option value="10 min">10 min</option>
                        <option value="15 min">15 min</option>
                        <option value="20 min">20 min</option>
                        <option value="30 min">30 min</option>
                        <option value="45 min">45 min</option>
                        <option value="60 min">60 min</option>
                      </select>
                    </div>

                    {/* Spice Level Select */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Spice Level</label>
                      <div className="flex gap-6">
                        {['Mild', 'Medium', 'Hot'].map(level => (
                          <label key={level} className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="radio" 
                              name="spiceLevel" 
                              value={level}
                              checked={formState.spiceLevel === level}
                              onChange={() => setFormState({ ...formState, spiceLevel: level })}
                              className="form-radio text-saffron-gold focus:ring-0"
                            />
                            <span className="font-label-caps text-[9px] uppercase tracking-wider text-subtle-text">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Availability Toggles */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-muted-border/40">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={formState.available}
                          onChange={(e) => setFormState({ ...formState, available: e.target.checked })}
                          className="form-checkbox text-saffron-gold focus:ring-0 rounded-xs"
                        />
                        <div>
                          <span className="font-label-caps text-[9px] uppercase tracking-wider text-ink-navy font-bold block">Available</span>
                          <span className="text-[9px] text-subtle-text">Enable ordering</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={formState.special}
                          onChange={(e) => setFormState({ ...formState, special: e.target.checked })}
                          className="form-checkbox text-saffron-gold focus:ring-0 rounded-xs"
                        />
                        <div>
                          <span className="font-label-caps text-[9px] uppercase tracking-wider text-ink-navy font-bold block">Chef Special</span>
                          <span className="text-[9px] text-subtle-text">Promote on dashboard</span>
                        </div>
                      </label>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Description</label>
                      <textarea 
                        value={formState.description}
                        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                        placeholder="Provide details about culinary preparation, ingredients, and texture..."
                        className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy resize-none h-24 outline-none"
                      />
                    </div>

                  </div>

                  {/* Form Actions */}
                  <div className="p-6 border-t border-muted-border bg-canvas-cream shrink-0 flex gap-4">
                    <button 
                      type="submit"
                      className="flex-grow h-[56px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center font-bold"
                    >
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDrawerMode(null)}
                      className="h-[56px] px-8 border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete/Archive Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-muted-border max-w-md w-full p-8 shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-red-500 text-4xl">delete_forever</span>
                <h3 className="font-serif text-xl text-ink-navy font-bold">Permanently Delete This Dish?</h3>
                <p className="font-sans text-xs text-subtle-text leading-relaxed">
                  This cannot be undone. The dish will be removed from the database entirely and will no longer appear on the customer digital menu.
                </p>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-grow h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmArchive}
                  className="flex-grow h-[56px] bg-red-900/10 hover:bg-red-900/20 text-red-700 font-cta-label text-cta-label uppercase tracking-widest transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Categories Drawer */}
      <AnimatePresence>
        {categoryDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-ink-navy/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-canvas-cream shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-muted-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-serif text-xl text-ink-navy font-bold">Manage Categories</h3>
                  <p className="text-xs text-subtle-text">No limit on categories or dishes per category.</p>
                </div>
                <button
                  onClick={() => setCategoryDrawerOpen(false)}
                  className="text-subtle-text hover:text-ink-navy cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Add new category — create it here, empty, before adding any dishes to it */}
              <form onSubmit={handleAddCategory} className="p-6 border-b border-muted-border shrink-0 flex gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name…"
                  className="flex-grow bg-white border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy outline-none"
                />
                <button
                  type="submit"
                  disabled={categoryBusy || !newCategoryName.trim()}
                  className="px-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all duration-300 rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  Add
                </button>
              </form>

              {categoryActionError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-[11px] text-red-700 shrink-0">
                  {categoryActionError}
                </div>
              )}

              {/* List of existing categories */}
              <div className="flex-grow overflow-y-auto p-6 space-y-2">
                {staffCategories.length === 0 ? (
                  <p className="text-xs text-subtle-text text-center py-8">
                    No categories yet — add your first one above.
                  </p>
                ) : (
                  staffCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 bg-white border border-muted-border p-3"
                    >
                      {editingCategoryId === cat.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(cat); if (e.key === 'Escape') setEditingCategoryId(null); }}
                          className="flex-grow bg-surface-container-low border border-muted-border p-2 text-xs focus:outline-none focus:border-ink-navy outline-none"
                        />
                      ) : (
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-ink-navy font-semibold truncate">{cat.name}</p>
                          <p className="text-[10px] text-subtle-text">
                            {itemCountByCategory[cat.name] || 0} dish{(itemCountByCategory[cat.name] || 0) === 1 ? '' : 'es'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {editingCategoryId === cat.id ? (
                          <>
                            <button
                              onClick={() => handleConfirmRename(cat)}
                              disabled={categoryBusy}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 cursor-pointer disabled:opacity-50"
                              title="Save"
                            >
                              <span className="material-symbols-outlined text-lg">check</span>
                            </button>
                            <button
                              onClick={() => setEditingCategoryId(null)}
                              className="p-2 text-subtle-text hover:bg-surface-container-low cursor-pointer"
                              title="Cancel"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartRename(cat)}
                              className="p-2 text-ink-navy hover:bg-surface-container-low cursor-pointer"
                              title="Rename"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              disabled={categoryBusy}
                              className="p-2 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reassign-then-delete step — only shown when the category being
          deleted still has dishes in it */}
      <AnimatePresence>
        {reassignTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-ink-navy/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-muted-border max-w-md w-full p-8 shadow-2xl relative"
            >
              <div className="space-y-4">
                <h3 className="font-serif text-xl text-ink-navy font-bold">
                  "{reassignTarget.category.name}" has {reassignTarget.itemCount} dish{reassignTarget.itemCount === 1 ? '' : 'es'}
                </h3>
                <p className="font-sans text-xs text-subtle-text leading-relaxed">
                  Move {reassignTarget.itemCount === 1 ? 'it' : 'them'} to another category before deleting — nothing gets removed or hidden silently.
                </p>
                <select
                  value={reassignToName}
                  onChange={(e) => setReassignToName(e.target.value)}
                  className="w-full bg-surface-container-low border border-muted-border p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
                >
                  <option value="">Move dishes to…</option>
                  {staffCategories
                    .filter((c) => c.id !== reassignTarget.category.id)
                    .map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
                {categoryActionError && (
                  <p className="text-[11px] text-red-700">{categoryActionError}</p>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => { setReassignTarget(null); setCategoryActionError(''); }}
                  className="flex-grow h-[56px] border border-ink-navy text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:bg-ink-navy hover:text-canvas-cream transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReassignAndDelete}
                  disabled={categoryBusy || !reassignToName}
                  className="flex-grow h-[56px] bg-red-900/10 hover:bg-red-900/20 text-red-700 font-cta-label text-cta-label uppercase tracking-widest transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move &amp; Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
