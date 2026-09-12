// Asset map to resolve old filenames to their new organized subdirectory paths
const ASSET_MAP = {
  // Landing/Hero Elements
  'interior-1.jpg': 'landing/hero-1.webp',
  'interior-2.jpg': 'landing/hero-2.webp',
  'table-setting.jpg': 'landing/restaurant-interior.webp',
  'chef-prep.jpg': 'landing/chef.webp',
  'story-spices.jpg': 'landing/ambience.webp',
  
  // Photo Gallery
  'gallery-vibe-1.jpg': 'gallery/gallery-1.webp',
  'gallery-vibe-2.jpg': 'gallery/gallery-2.webp',
  'gallery-mixology.jpg': 'gallery/gallery-3.webp',
  'gallery-terrace.jpg': 'gallery/gallery-4.webp',
  'gallery-ingredients.jpg': 'gallery/gallery-5.webp',
  
  // Menu (Starters)
  'tracking-scallops.jpg': 'menu/starters/saffron-infused-scallops.webp',
  'saffron-infused-scallops.jpg': 'menu/starters/saffron-infused-scallops.webp',
  'menu-truffle-paneer.jpg': 'menu/starters/malai-truffle-paneer.webp',
  'malai-truffle-paneer.jpg': 'menu/starters/malai-truffle-paneer.webp',
  'Paneer Tikka.jpeg': 'menu/starters/malai-truffle-paneer.webp',
  'paneer-tikka.jpg': 'menu/starters/malai-truffle-paneer.webp',
  'Hara Bhara Kebab.jpeg': 'menu/starters/hara-bhara-kebab.webp',
  'hara-bhara-kebab.jpg': 'menu/starters/hara-bhara-kebab.webp',
  'Cheese Balls.jpeg': 'menu/starters/golden-cheese-croquettes.webp',
  'golden-cheese-croquettes.jpg': 'menu/starters/golden-cheese-croquettes.webp',
  'Masala dosa.jpeg': 'menu/starters/heritage-masala-dosa.webp',
  'heritage-masala-dosa.jpg': 'menu/starters/heritage-masala-dosa.webp',
  'signature-paneer-tikka.jpg': 'menu/starters/signature-paneer-tikka.webp',
  
  // Menu (Mains)
  'menu-makhani-murgh.jpg': 'menu/mains/royal-makhani-murgh.webp',
  'royal-makhani-murgh.jpg': 'menu/mains/royal-makhani-murgh.webp',
  'butter-chicken.jpg': 'menu/mains/royal-makhani-murgh.webp',
  'Malai Kofta.jpeg': 'menu/mains/malai-kofta-royale.webp',
  'malai-kofta-royale.jpg': 'menu/mains/malai-kofta-royale.webp',
  'glazed-quail.jpg': 'menu/mains/truffle-glazed-quail.webp',
  'truffle-glazed-quail.jpg': 'menu/mains/truffle-glazed-quail.webp',
  'dal-makhani.jpg': 'menu/mains/dal-makhani.webp',
  'palak-paneer.jpg': 'menu/mains/palak-paneer.webp',
  
  // Menu (Rice)
  'lamb-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.webp',
  'menu-nawabi-mutton-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.webp',
  'nawabi-mutton-biryani.jpg': 'menu/rice/nawabi-mutton-biryani.webp',
  'Veg Biryani.jpeg': 'menu/rice/royal-dum-veg-biryani.webp',
  'royal-dum-veg-biryani.jpg': 'menu/rice/royal-dum-veg-biryani.webp',
  'jeera-rice.jpg': 'menu/rice/jeera-rice.webp',
  'kashmiri-pulao.jpg': 'menu/rice/kashmiri-pulao.webp',

  // Menu (Breads)
  'butter-naan.jpg': 'menu/breads/butter-naan.webp',
  'garlic-naan.jpg': 'menu/breads/garlic-naan.webp',
  'laccha-paratha.jpg': 'menu/breads/laccha-paratha.webp',
  
  // Menu (Desserts)
  'gallery-detail.jpg': 'menu/desserts/golden-leaf-panna-cotta.webp',
  'golden-leaf-panna-cotta.jpg': 'menu/desserts/golden-leaf-panna-cotta.webp',
  'menu-saffron-rose-mahal.jpg': 'menu/desserts/saffron-rose-mahal.webp',
  'saffron-rose-mahal.jpg': 'menu/desserts/saffron-rose-mahal.webp',
  'Brownie with Ice Cream.jpeg': 'menu/desserts/belgian-chocolate-brownie.webp',
  'belgian-chocolate-brownie.jpg': 'menu/desserts/belgian-chocolate-brownie.webp',
  'gulab-jamun.jpg': 'menu/desserts/gulab-jamun.webp',
  
  // Menu (Beverages)
  'tracking-elixir.jpg': 'menu/beverages/garden-elixir.webp',
  'garden-elixir.jpg': 'menu/beverages/garden-elixir.webp',
  'cocktails.jpg': 'menu/beverages/vintage-krug-2008.webp',
  'vintage-krug-2008.jpg': 'menu/beverages/vintage-krug-2008.webp',

  // General & Backdrops
  'tracking-chef-bg.jpg': 'landing/chef.webp',
  'contact-map.jpg': 'landing/restaurant-interior.webp',
  'restaurant-interior.jpg': 'landing/restaurant-interior.webp'
};

// Eagerly resolves every image under src/assets/images at build time, in BOTH
// the client and SSR builds. Unlike `new URL(dynamicPath, import.meta.url)`,
// import.meta.glob is Vite's officially-supported way to look up many assets
// by name and is statically analyzable in every build target — so it always
// produces the real public URL (e.g. /assets/ambience-HASH.webp), never a
// raw filesystem path. This is what was producing file:///vercel/path0/...
// URLs (and the accompanying browser errors) once the landing page content
// started being rendered during SSR.
const imageModules = import.meta.glob('../assets/images/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

const IMAGE_URLS = {};
for (const [modulePath, url] of Object.entries(imageModules)) {
  const key = modulePath.replace('../assets/images/', '');
  IMAGE_URLS[key] = url;
}

const FALLBACK_KEY = 'menu/starters/hara-bhara-kebab.webp';

/**
 * Resolves local image URLs dynamically based on target assets subdirectories
 * @param {string} filename 
 * @returns {string} Fully qualified browser-ready URL
 */
export const getImage = (filename) => {
  if (!filename) {
    // Return a food placeholder image so broken image icons never show
    return IMAGE_URLS[FALLBACK_KEY];
  }

  // Bypass resolution for data previews, blob URLs, and external HTTP assets
  if (filename.startsWith('data:') || filename.startsWith('blob:') || filename.startsWith('http')) {
    return filename;
  }

  const relativePath = ASSET_MAP[filename] || filename;

  return IMAGE_URLS[relativePath] || IMAGE_URLS[FALLBACK_KEY];
};
