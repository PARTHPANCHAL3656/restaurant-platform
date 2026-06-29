// Asset map to resolve old filenames to their new organized subdirectory paths
const ASSET_MAP = {
  // Landing/Hero Elements
  'interior-1.jpg': 'landing/hero-1.jpg',
  'interior-2.jpg': 'landing/hero-2.jpg',
  'table-setting.jpg': 'landing/restaurant-interior.jpg',
  'chef-prep.jpg': 'landing/chef.jpg',
  'story-spices.jpg': 'landing/ambience.jpg',
  
  // Photo Gallery
  'gallery-vibe-1.jpg': 'gallery/gallery-1.jpg',
  'gallery-vibe-2.jpg': 'gallery/gallery-2.jpg',
  'gallery-mixology.jpg': 'gallery/gallery-3.jpg',
  'gallery-terrace.jpg': 'gallery/gallery-4.jpg',
  'gallery-ingredients.jpg': 'gallery/gallery-5.jpg',
  
  // Menu (Starters)
  'tracking-scallops.jpg': 'menu/starters/saffron-infused-scallops.jpg',
  'saffron-infused-scallops.jpg': 'menu/starters/saffron-infused-scallops.jpg',
  'menu-truffle-paneer.jpg': 'menu/starters/malai-truffle-paneer.jpg',
  'malai-truffle-paneer.jpg': 'menu/starters/malai-truffle-paneer.jpg',
  'Paneer Tikka.jpeg': 'menu/starters/malai-truffle-paneer.jpg',
  'paneer-tikka.jpg': 'menu/starters/malai-truffle-paneer.jpg',
  'Hara Bhara Kebab.jpeg': 'menu/starters/hara-bhara-kebab.jpg',
  'hara-bhara-kebab.jpg': 'menu/starters/hara-bhara-kebab.jpg',
  'Cheese Balls.jpeg': 'menu/starters/golden-cheese-croquettes.jpg',
  'golden-cheese-croquettes.jpg': 'menu/starters/golden-cheese-croquettes.jpg',
  'Masala dosa.jpeg': 'menu/starters/heritage-masala-dosa.jpg',
  'heritage-masala-dosa.jpg': 'menu/starters/heritage-masala-dosa.jpg',
  'signature-paneer-tikka.jpg': 'menu/starters/signature-paneer-tikka.jpg',
  
  // Menu (Mains)
  'menu-makhani-murgh.jpg': 'menu/mains/royal-makhani-murgh.jpg',
  'royal-makhani-murgh.jpg': 'menu/mains/royal-makhani-murgh.jpg',
  'butter-chicken.jpg': 'menu/mains/royal-makhani-murgh.jpg',
  'Malai Kofta.jpeg': 'menu/mains/malai-kofta-royale.jpg',
  'malai-kofta-royale.jpg': 'menu/mains/malai-kofta-royale.jpg',
  'glazed-quail.jpg': 'menu/mains/truffle-glazed-quail.jpg',
  'truffle-glazed-quail.jpg': 'menu/mains/truffle-glazed-quail.jpg',
  'dal-makhani.jpg': 'menu/mains/dal-makhani.jpg',
  'palak-paneer.jpg': 'menu/mains/palak-paneer.jpg',
  
  // Menu (Rice)
  'lamb-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.jpg',
  'menu-nawabi-mutton-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.jpg',
  'nawabi-mutton-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.jpg',
  'Veg Biryani.jpeg': 'menu/rice/royal-dum-veg-biryani.jpg',
  'royal-dum-veg-biryani.jpg': 'menu/rice/royal-dum-veg-biryani.jpg',
  'jeera-rice.jpg': 'menu/rice/jeera-rice.jpg',
  'kashmiri-pulao.jpg': 'menu/rice/kashmiri-pulao.jpg',

  // Menu (Breads)
  'butter-naan.jpg': 'menu/breads/butter-naan.jpg',
  'garlic-naan.jpg': 'menu/breads/garlic-naan.jpg',
  'laccha-paratha.jpg': 'menu/breads/laccha-paratha.jpg',
  
  // Menu (Desserts)
  'gallery-detail.jpg': 'menu/desserts/golden-leaf-panna-cotta.jpg',
  'golden-leaf-panna-cotta.jpg': 'menu/desserts/golden-leaf-panna-cotta.jpg',
  'menu-saffron-rose-mahal.jpg': 'menu/desserts/saffron-rose-mahal.jpg',
  'saffron-rose-mahal.jpg': 'menu/desserts/saffron-rose-mahal.jpg',
  'Brownie with Ice Cream.jpeg': 'menu/desserts/belgian-chocolate-brownie.jpg',
  'belgian-chocolate-brownie.jpg': 'menu/desserts/belgian-chocolate-brownie.jpg',
  'gulab-jamun.jpg': 'menu/desserts/gulab-jamun.jpg',
  
  // Menu (Beverages)
  'tracking-elixir.jpg': 'menu/beverages/garden-elixir.jpg',
  'garden-elixir.jpg': 'menu/beverages/garden-elixir.jpg',
  'cocktails.jpg': 'menu/beverages/vintage-krug-2008.jpg',
  'vintage-krug-2008.jpg': 'menu/beverages/vintage-krug-2008.jpg',

  // General & Backdrops
  'tracking-chef-bg.jpg': 'landing/chef.jpg',
  'contact-map.jpg': 'landing/restaurant-interior.jpg',
  'restaurant-interior.jpg': 'landing/restaurant-interior.jpg'
};

/**
 * Resolves local image URLs dynamically based on target assets subdirectories
 * @param {string} filename 
 * @returns {string} Fully qualified browser-ready URL
 */
export const getImage = (filename) => {
  if (!filename) return '';
  
  // Bypass resolution for data previews, blob URLs, and external HTTP assets
  if (filename.startsWith('data:') || filename.startsWith('blob:') || filename.startsWith('http')) {
    return filename;
  }
  
  const relativePath = ASSET_MAP[filename] || filename;

  // Static template literal expressions per flat subdirectory 
  // allows Vite's compiler to analyze and generate separate flat glob trees.
  if (relativePath.startsWith('landing/')) {
    const file = relativePath.replace('landing/', '');
    return new URL(`../assets/images/landing/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('gallery/')) {
    const file = relativePath.replace('gallery/', '');
    return new URL(`../assets/images/gallery/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/starters/')) {
    const file = relativePath.replace('menu/starters/', '');
    return new URL(`../assets/images/menu/starters/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/mains/')) {
    const file = relativePath.replace('menu/mains/', '');
    return new URL(`../assets/images/menu/mains/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/rice/')) {
    const file = relativePath.replace('menu/rice/', '');
    return new URL(`../assets/images/menu/rice/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/breads/')) {
    const file = relativePath.replace('menu/breads/', '');
    return new URL(`../assets/images/menu/breads/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/desserts/')) {
    const file = relativePath.replace('menu/desserts/', '');
    return new URL(`../assets/images/menu/desserts/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('menu/beverages/')) {
    const file = relativePath.replace('menu/beverages/', '');
    return new URL(`../assets/images/menu/beverages/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('qr/')) {
    const file = relativePath.replace('qr/', '');
    return new URL(`../assets/images/qr/${file}`, import.meta.url).href;
  }
  if (relativePath.startsWith('branding/')) {
    const file = relativePath.replace('branding/', '');
    return new URL(`../assets/images/branding/${file}`, import.meta.url).href;
  }
  
  // Fallback default resolver if path remains root-level relative
  return new URL(`../assets/images/${relativePath}`, import.meta.url).href;
};
