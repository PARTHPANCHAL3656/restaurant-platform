import React, { useState, useEffect, useMemo } from 'react';
import { useStaff } from '../../context/StaffContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getImage } from '../../utils/assetHelper';

export default function StaffMenuPage() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useStaff();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer modes: 'add', 'edit', 'preview', null
  const [drawerMode, setDrawerMode] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

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
    category: 'Starters',
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

  const categories = ['All', 'Starters', 'Mains', 'Rice & Biryani', 'Breads', 'Desserts', 'Signature Cocktails'];

  // Handle opening drawers
  const handleOpenAdd = () => {
    setFormState({
      name: '',
      category: 'Starters',
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

  return (
    <div className="relative select-none bg-[#faf9f8] min-h-screen">
      
      {/* Main Catalog Viewport */}
      <div className="px-6 md:px-12 py-8 space-y-6 max-w-5xl mx-auto">

          {/* Header Controls: Categories, Search, and Action */}
          <div className="bg-white p-6 border border-[#E5E1DA] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-serif text-lg text-ink-navy font-semibold">Menu Catalog</h3>
                <p className="text-xs text-subtle-text">Sartorial curation of restaurant culinary offerings.</p>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 shrink-0">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text text-sm">search</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search signature dishes..." 
                    className="w-full bg-transparent border-b border-[#D4AF37]/20 py-2 pl-9 pr-4 focus:outline-none focus:border-saffron-gold focus:ring-1 focus:ring-[#D4AF37]/15 font-body-md text-xs placeholder:text-subtle-text/30 outline-none transition-all duration-300"
                  />
                </div>

                {/* Primary Add Action */}
                <button 
                  onClick={handleOpenAdd}
                  className="h-[56px] px-6 bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add New Dish
                </button>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="overflow-x-auto hide-scrollbar whitespace-nowrap pt-2">
              <div className="flex gap-6 border-b border-[#E5E1DA]">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
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
            <div className="bg-white p-16 text-center border border-[#E5E1DA] text-subtle-text">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">restaurant_menu</span>
              <p className="font-serif text-md">No dishes matching the filters were found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDishes.map((dish) => (
                <article 
                  key={dish.id} 
                  className="bg-white border border-[#E5E1DA] flex flex-col justify-between hover:shadow-xl group transition-all duration-300"
                >
                  <div>
                    {/* Image block */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface-container border-b border-[#E5E1DA] flex items-center justify-center">
                      {dish.image ? (
                        <img 
                          src={getImage(dish.image)} 
                          alt={dish.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-serif italic text-xs text-subtle-text/50">Image Missing</span>
                      )}
                      
                      {/* Badge overlays */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {dish.special && (
                          <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase font-bold">
                            Chef Special
                          </span>
                        )}
                        {!dish.available ? (
                          <span className="bg-[#f4f3f2] text-[#8B6B3F] border border-[#C2B29A] px-3 py-1 font-label-caps text-[9px] tracking-widest uppercase font-bold">
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
                        <span className="font-serif text-saffron-gold font-bold">${dish.price.toFixed(2)}</span>
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
                  <div className="px-6 py-4 border-t border-[#E5E1DA]/40 flex justify-between items-center text-xs">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleOpenPreview(dish)}
                        className="text-subtle-text hover:text-[#D4AF37] transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
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
                        className="text-subtle-text hover:text-[#D4AF37] transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Duplicate
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(dish.id)}
                        className="text-red-500 hover:text-red-700 transition-colors focus:outline-none font-semibold uppercase tracking-wider text-[10px]"
                      >
                        Archive
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
              className="fixed right-0 top-0 bottom-0 z-50 bg-white border-l border-[#E5E1DA] shadow-2xl flex flex-col w-full sm:w-[70vw] lg:w-[40vw] h-screen overflow-hidden"
            >
              {drawerMode === 'preview' && activeItem ? (
                <div className="h-full flex flex-col justify-between">
                  {/* Header */}
                  <div className="p-6 bg-[#1A1F2C] text-canvas-cream shrink-0 flex justify-between items-start">
                    <div>
                      <span className="font-label-caps text-[9px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">
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
                    <div className="aspect-[16/10] overflow-hidden bg-[#faf9f8] border border-[#E5E1DA] flex items-center justify-center">
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

                    <div className="flex justify-between items-end border-b border-[#E5E1DA] pb-4">
                      <div>
                        <span className="font-label-caps text-[9px] text-subtle-text uppercase block mb-1">Category</span>
                        <span className="font-serif text-md text-ink-navy font-bold">{activeItem.category}</span>
                      </div>
                      <span className="font-serif text-3xl text-saffron-gold font-bold">${activeItem.price.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="font-label-caps text-[9px] text-subtle-text uppercase block">Culinary Description</span>
                      <p className="font-sans text-body-md text-ink-navy/80 leading-relaxed">
                        {activeItem.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#E5E1DA]/40">
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f4f3f2] text-[#8B6B3F] border border-[#C2B29A] text-[10px] font-label-caps uppercase tracking-widest font-bold">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] shrink-0 flex gap-4">
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
                  <div className="p-6 border-b border-[#E5E1DA] shrink-0 flex justify-between items-start">
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
                      className="p-1 hover:bg-[#f4f3f2] rounded-full transition-colors focus:outline-none text-subtle-text"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  {/* Form Scroll Content */}
                  <div className="flex-grow p-6 space-y-6 overflow-y-auto text-xs">
                    
                    {/* Image Upload Area */}
                    <div className="space-y-2">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Dish Image</label>
                      <div className="border-2 border-dashed border-[#C2B29A] p-6 text-center hover:border-saffron-gold transition-colors relative flex flex-col items-center justify-center bg-[#fdfcfb]">
                        {formState.image ? (
                          <div className="space-y-4 w-full">
                            <img src={getImage(formState.image)} alt="Preview" className="max-h-48 mx-auto object-cover border border-[#E5E1DA]" />
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
                        className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy outline-none"
                        required
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-[9px] text-subtle-text uppercase tracking-widest font-bold block">Category</label>
                      <select 
                        value={formState.category}
                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                        className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
                      >
                        <option value="Starters">Starters</option>
                        <option value="Soups">Soups</option>
                        <option value="Mains">Main Course</option>
                        <option value="Rice & Biryani">Rice & Biryani</option>
                        <option value="Breads">Breads</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Signature Cocktails">Beverages</option>
                        <option value="Signature Cocktails">Chef Specials</option>
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
                        className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy outline-none"
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
                              className="form-radio text-[#D4AF37] focus:ring-0"
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
                        className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy cursor-pointer"
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
                              className="form-radio text-[#D4AF37] focus:ring-0"
                            />
                            <span className="font-label-caps text-[9px] uppercase tracking-wider text-subtle-text">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Availability Toggles */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#E5E1DA]/40">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={formState.available}
                          onChange={(e) => setFormState({ ...formState, available: e.target.checked })}
                          className="form-checkbox text-[#D4AF37] focus:ring-0 rounded-xs"
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
                          className="form-checkbox text-[#D4AF37] focus:ring-0 rounded-xs"
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
                        className="w-full bg-[#f4f3f2] border border-[#E5E1DA] p-3 text-xs focus:outline-none focus:border-ink-navy resize-none h-24 outline-none"
                      />
                    </div>

                  </div>

                  {/* Form Actions */}
                  <div className="p-6 border-t border-[#E5E1DA] bg-[#fdfcfb] shrink-0 flex gap-4">
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
              className="bg-white border border-[#E5E1DA] max-w-md w-full p-8 shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-red-500 text-4xl">archive</span>
                <h3 className="font-serif text-xl text-ink-navy font-bold">Remove Menu Item?</h3>
                <p className="font-sans text-xs text-subtle-text leading-relaxed">
                  This dish will be archived and will no longer appear on the customer digital menu.
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
                  Archive Dish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
