import MenuItem from "../models/MenuItem.js"
import { Server } from "socket.io"
import { uploadMenuImageIfNeeded, deleteMenuImageIfOwned } from "../utils/cloudinary.js"

let io;
export const setMenuIo = (socketIo) => { io = socketIo; }

export const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find()
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createMenuItem = async (req, res) => {
  try {
    const { image, imagePublicId } = await uploadMenuImageIfNeeded(req.body.image)
    const item = await MenuItem.create({ ...req.body, image, imagePublicId })
    if (io) io.emit("menu:updated", { action: "create", item })
    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateMenuItem = async (req, res) => {
  try {
    const existing = await MenuItem.findById(req.params.id)
    if (!existing) return res.status(404).json({ error: "Item not found" })

    const { image, imagePublicId } = await uploadMenuImageIfNeeded(req.body.image)
    const updatePayload = { ...req.body, image }
    // Only touch imagePublicId if this call actually uploaded something new -
    // otherwise leave the existing one alone (photo wasn't changed this edit).
    if (imagePublicId) updatePayload.imagePublicId = imagePublicId

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updatePayload, { new: true })

    // A genuinely new photo replaced an old uploaded one - remove the old
    // one from Cloudinary so it doesn't sit there unused forever.
    if (imagePublicId && existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
      deleteMenuImageIfOwned(existing.imagePublicId)
    }

    if (io) io.emit("menu:updated", { action: "update", item })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: "Item not found" })
    if (item.imagePublicId) deleteMenuImageIfOwned(item.imagePublicId)
    if (io) io.emit("menu:updated", { action: "delete", id: req.params.id })
    res.json({ message: "Item deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ...DEFAULT_MENU and seedMenuItems stay exactly as they are, unchanged

const DEFAULT_MENU = [
  { name: 'Signature Paneer Tikka', price: 450.00, category: 'Starters', tag: 'Classic', description: 'Charcoal grilled cottage cheese, spiced yogurt marinade, bell peppers, mint chutney.', image: 'signature-paneer-tikka.jpg', foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Medium' },
  { name: 'Hara Bhara Kebab', price: 380.00, category: 'Starters', tag: 'Veg Delight', description: 'Pan-seared patties of spinach, green peas, and potatoes, spiced with aromatic herbs.', image: 'hara-bhara-kebab.jpg', foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Golden Cheese Croquettes', price: 340.00, category: 'Starters', tag: 'Crunchy', description: 'Crispy spiced potato shell stuffed with melted mozzarella, cheddar, and fresh herbs.', image: 'golden-cheese-croquettes.jpg', foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Malai Truffle Paneer', price: 520.00, category: 'Starters', tag: 'Veg Signature', description: 'Hand-pressed cottage cheese marinated in a delicate truffle-infused cream and white pepper, char-grilled.', image: 'malai-truffle-paneer.jpg', foodType: 'Vegetarian', prepTime: '20 min', spiceLevel: 'Medium' },
  { name: 'Saffron Infused Scallops', price: 650.00, category: 'Starters', tag: 'Signature', description: 'Wild caught scallops, smooth green pea purée, and a tangy pomegranate reduction.', image: 'saffron-infused-scallops.jpg', special: true, foodType: 'Non Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Royal Makhani Murgh', price: 680.00, category: 'Mains', tag: 'Chef Special', description: 'Slow-cooked tandoori chicken in a velvet-smooth tomato and cashew reduction, finished with fenugreek and cultured butter.', image: 'royal-makhani-murgh.jpg', special: true, foodType: 'Non Vegetarian', prepTime: '30 min', spiceLevel: 'Medium' },
  { name: 'Truffle Glazed Quail', price: 1450.00, category: 'Mains', tag: 'Awadhi Heritage', description: 'Tender quail roasted with a black truffle glaze, cracked coriander seeds, and caramelized wild forest honey.', image: 'truffle-glazed-quail.jpg', foodType: 'Non Vegetarian', prepTime: '45 min', spiceLevel: 'Hot' },
  { name: 'Malai Kofta Royale', price: 560.00, category: 'Mains', tag: 'Classic Veg', description: 'Cottage cheese dumplings stuffed with dry fruits, served in a rich cashew onion gravy.', image: 'malai-kofta-royale.jpg', foodType: 'Vegetarian', prepTime: '25 min', spiceLevel: 'Mild' },
  { name: 'Dal Makhani', price: 420.00, category: 'Mains', tag: 'Classic', description: 'Black lentils slow-cooked overnight with cream, butter, tomato purée, and house spices.', image: 'dal-makhani.jpg', foodType: 'Vegetarian', prepTime: '20 min', spiceLevel: 'Mild' },
  { name: 'Palak Paneer', price: 460.00, category: 'Mains', tag: 'Classic', description: 'Fresh cottage cheese cubes simmered in a spiced spinach gravy, touched with fresh cream.', image: 'palak-paneer.jpg', foodType: 'Vegetarian', prepTime: '20 min', spiceLevel: 'Medium' },
  { name: 'Royal Dum Veg Biryani', price: 580.00, category: 'Rice & Biryani', tag: 'Royal Veg', description: 'Slow-cooked basmati rice with assorted seasonal vegetables, mint, and saffron.', image: 'royal-dum-veg-biryani.jpg', foodType: 'Vegetarian', prepTime: '30 min', spiceLevel: 'Medium' },
  { name: 'Nawabi Mutton Biryani', price: 780.00, category: 'Rice & Biryani', tag: 'Awadhi Heritage', description: 'Aromatic basmati rice layered with tender lamb, house-secret spices, and saffron, dum-cooked for six hours.', image: 'nawabi-mutton-biryani.jpg', foodType: 'Non Vegetarian', prepTime: '45 min', spiceLevel: 'Medium' },
  { name: 'Jeera Rice', price: 220.00, category: 'Rice & Biryani', tag: 'Simple Side', description: 'Long grain basmati rice tempered with cumin seeds and fresh ghee.', image: 'jeera-rice.jpg', foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Kashmiri Pulao', price: 340.00, category: 'Rice & Biryani', tag: 'Fragrant', description: 'Saffron-scented pulao loaded with walnuts, almonds, raisins, and fresh pomegranate.', image: 'kashmiri-pulao.jpg', foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Butter Naan', price: 110.00, category: 'Breads', tag: 'Freshly Baked', description: 'Traditional leavened flatbread baked in the tandoor, brushed with rich butter.', image: 'butter-naan.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Garlic Naan', price: 130.00, category: 'Breads', tag: 'Freshly Baked', description: 'Traditional leavened flatbread topped with minced garlic and coriander.', image: 'garlic-naan.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Laccha Paratha', price: 150.00, category: 'Breads', tag: 'Layered', description: 'Crispy, multi-layered whole wheat flatbread roasted in the tandoor.', image: 'laccha-paratha.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Belgian Chocolate Brownie', price: 320.00, category: 'Desserts', tag: 'Decadent', description: 'Warm, gooey Belgian chocolate brownie served with a scoop of Madagascar vanilla bean gelato.', image: 'belgian-chocolate-brownie.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Golden Leaf Panna Cotta', price: 380.00, category: 'Desserts', tag: 'Signature', description: 'Creamy vanilla bean panna cotta topped with organic rose water reduction and 24k gold leaf details.', image: 'golden-leaf-panna-cotta.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Saffron Rose Mahal', price: 480.00, category: 'Desserts', tag: 'Michelin Style', description: 'A deconstructed dessert featuring rose-scented milk reduction, Iranian saffron strands, and 24k edible gold leaf.', image: 'saffron-rose-mahal.jpg', special: true, foodType: 'Vegetarian', prepTime: '15 min', spiceLevel: 'Mild' },
  { name: 'Gulab Jamun', price: 220.00, category: 'Desserts', tag: 'Traditional', description: 'Warm dumplings made of milk solids, soaked in cardamom-flavored rose water syrup.', image: 'gulab-jamun.jpg', foodType: 'Vegetarian', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'The Garden Elixir', price: 420.00, category: 'Signature Cocktails', tag: 'Mixology', description: 'Botanical gin, elderflower liqueur, cucumber cloud, fresh garden mint, and organic sparkling tonic.', image: 'garden-elixir.jpg', special: true, foodType: 'Vegan', prepTime: '10 min', spiceLevel: 'Mild' },
  { name: 'Vintage Krug 2008', price: 5200.00, category: 'Signature Cocktails', tag: "Sommelier Pick", description: 'Rare vintage champagne with toasted notes, vibrant citrus acidity, and an incredibly smooth, creamy finish.', image: 'vintage-krug-2008.jpg', special: true, foodType: 'Vegan', prepTime: '10 min', spiceLevel: 'Mild' }
]

export const seedMenuItems = async (req, res) => {
  try {
    const bulkOps = DEFAULT_MENU.map((dish) => ({
      updateOne: {
        filter: { name: dish.name },
        update: { $set: dish },
        upsert: true
      }
    }))

    const result = await MenuItem.bulkWrite(bulkOps)
    if (io) io.emit("menu:updated", { action: "seed" })
    res.json({
      message: `Synced ${DEFAULT_MENU.length} demo menu items.`,
      created: result.upsertedCount,
      updated: result.modifiedCount
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
