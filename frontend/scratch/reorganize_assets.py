import os
import shutil

# Paths
root_dir = "d:\\Projects\\WeIntern\\Restaurant"
root_assets_dir = os.path.join(root_dir, "assets")
src_assets_dir = os.path.join(root_dir, "src", "assets")
src_images_dir = os.path.join(src_assets_dir, "images")
src_qr_dir = os.path.join(src_assets_dir, "qr")
scratch_chat_images_dir = os.path.join(root_dir, "scratch", "chat_images")

# Define target directories under src/assets/images/
subdirs = [
    "branding",
    "landing",
    "gallery",
    "menu/starters",
    "menu/mains",
    "menu/rice",
    "menu/breads",
    "menu/desserts",
    "menu/beverages",
    "qr"
]

# Create directories
for subdir in subdirs:
    dirpath = os.path.join(src_images_dir, subdir.replace("/", os.sep))
    os.makedirs(dirpath, exist_ok=True)
os.makedirs(scratch_chat_images_dir, exist_ok=True)

# 1. Copy files from src/assets/images/ (Stitch assets)
stitch_mappings = {
    "interior-1.jpg": "landing/hero-1.jpg",
    "interior-2.jpg": "landing/hero-2.jpg",
    "table-setting.jpg": "landing/restaurant-interior.jpg",
    "chef-prep.jpg": "landing/chef.jpg",
    "story-spices.jpg": "landing/ambience.jpg",

    "gallery-vibe-1.jpg": "gallery/gallery-1.jpg",
    "gallery-vibe-2.jpg": "gallery/gallery-2.jpg",
    "gallery-mixology.jpg": "gallery/gallery-3.jpg",
    "gallery-terrace.jpg": "gallery/gallery-4.jpg",
    "gallery-ingredients.jpg": "gallery/gallery-5.jpg",

    "menu-truffle-paneer.jpg": "menu/starters/malai-truffle-paneer.jpg",
    "tracking-scallops.jpg": "menu/starters/saffron-infused-scallops.jpg",
    
    "menu-makhani-murgh.jpg": "menu/mains/royal-makhani-murgh.jpg",
    "butter-chicken.jpg": "menu/mains/royal-makhani-murgh.jpg", # Keep duplicate source mapped to single
    
    "menu-nawabi-mutton-biryani.jpg": "menu/rice/nawabi-mutton-biryani.jpg",
    "lamb-biryani.jpg": "menu/rice/nawabi-mutton-biryani.jpg", # Map to unified mutton biryani
    
    "gallery-detail.jpg": "menu/desserts/golden-leaf-panna-cotta.jpg",
    "menu-saffron-rose-mahal.jpg": "menu/desserts/saffron-rose-mahal.jpg",

    "tracking-elixir.jpg": "menu/beverages/garden-elixir.jpg",
    "cocktails.jpg": "menu/beverages/vintage-krug-2008.jpg",
}

# Apply Stitch Mappings
for old_name, new_rel in stitch_mappings.items():
    src_file = os.path.join(src_images_dir, old_name)
    dest_file = os.path.join(src_images_dir, new_rel.replace("/", os.sep))
    if os.path.exists(src_file):
        shutil.copy2(src_file, dest_file)
        print(f"Copied Stitch asset: {old_name} -> {new_rel}")

# 2. Copy files from root assets/ (Manually added assets & chat screenshots)
root_mappings = {
    "Paneer Tikka.jpeg": "menu/starters/paneer-tikka.jpg",
    "Hara Bhara Kebab.jpeg": "menu/starters/hara-bhara-kebab.jpg",
    "Cheese Balls.jpeg": "menu/starters/golden-cheese-croquettes.jpg",
    "Masala dosa.jpeg": "menu/starters/heritage-masala-dosa.jpg",
    "Malai Kofta.jpeg": "menu/mains/malai-kofta-royale.jpg",
    "Veg Biryani.jpeg": "menu/rice/royal-dum-veg-biryani.jpg",
    "Brownie with Ice Cream.jpeg": "menu/desserts/belgian-chocolate-brownie.jpg",
}

for old_name, new_rel in root_mappings.items():
    src_file = os.path.join(root_assets_dir, old_name)
    dest_file = os.path.join(src_images_dir, new_rel.replace("/", os.sep))
    if os.path.exists(src_file):
        shutil.copy2(src_file, dest_file)
        print(f"Copied manually added asset: {old_name} -> {new_rel}")

# Copy chat screenshots to scratch/chat_images to preserve them, but clear from root assets
if os.path.exists(root_assets_dir):
    for filename in os.listdir(root_assets_dir):
        if filename.startswith("ChatGPT Image"):
            src_file = os.path.join(root_assets_dir, filename)
            dest_file = os.path.join(scratch_chat_images_dir, filename)
            shutil.copy2(src_file, dest_file)
            print(f"Archived chat screenshot: {filename}")

# 3. Copy QR codes from src/assets/qr/ to src/assets/images/qr/
if os.path.exists(src_qr_dir):
    for filename in os.listdir(src_qr_dir):
        if filename.endswith(".png"):
            src_file = os.path.join(src_qr_dir, filename)
            dest_file = os.path.join(src_images_dir, "qr", filename)
            shutil.copy2(src_file, dest_file)
            print(f"Moved QR asset: {filename} -> qr/{filename}")

# Write small dummy images for future/placeholder items listed in structure
placeholders = [
    # Starters
    "menu/starters/hara-bhara-kebab.jpg",
    # Mains
    "menu/mains/dal-makhani.jpg",
    "menu/mains/palak-paneer.jpg",
    # Rice
    "menu/rice/jeera-rice.jpg",
    "menu/rice/kashmiri-pulao.jpg",
    # Breads
    "menu/breads/butter-naan.jpg",
    "menu/breads/garlic-naan.jpg",
    "menu/breads/laccha-paratha.jpg",
    # Desserts
    "menu/desserts/gulab-jamun.jpg",
    # Beverages
    "menu/beverages/blue-lagoon.jpg",
    "menu/beverages/virgin-mojito.jpg",
    "menu/beverages/mango-breeze.jpg",
    "menu/beverages/watermelon-cooler.jpg"
]

# Use a tiny solid color JPG or copy another existing menu item for placeholder
dummy_src = os.path.join(src_images_dir, "menu/starters/malai-truffle-paneer.jpg")
if os.path.exists(dummy_src):
    for placeholder in placeholders:
        dest_file = os.path.join(src_images_dir, placeholder.replace("/", os.sep))
        if not os.path.exists(dest_file):
            shutil.copy2(dummy_src, dest_file)
            print(f"Created placeholder: {placeholder}")

# Clean up old root assets folder and old unorganized files in src/assets/images
print("\n--- Cleaning up original locations ---")

# Remove old files in src/assets/images (only keep subdirectories)
for item in os.listdir(src_images_dir):
    item_path = os.path.join(src_images_dir, item)
    if os.path.isfile(item_path):
        os.remove(item_path)
        print(f"Removed old Stitch file: {item}")

# Remove old src/assets/qr folder
if os.path.exists(src_qr_dir):
    shutil.rmtree(src_qr_dir)
    print("Removed old src/assets/qr/ directory.")

# Remove old root-level assets folder
if os.path.exists(root_assets_dir):
    shutil.rmtree(root_assets_dir)
    print("Removed old root-level assets/ directory.")

print("\nReorganization script complete.")
