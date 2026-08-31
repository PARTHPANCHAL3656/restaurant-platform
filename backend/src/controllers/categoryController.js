import Category from "../models/Category.js"
import MenuItem from "../models/MenuItem.js"
import { io } from "../index.js"

// GET /api/categories
// Public — the customer menu needs this to render section headers too.
// One-time, idempotent seed: if this is the first time this endpoint runs
// against an existing menu (i.e. before categories were their own
// collection), backfill one Category per distinct MenuItem.category value
// so nothing already on the live menu disappears from the tab list.
export const getAllCategories = async (req, res) => {
  try {
    const count = await Category.countDocuments()
    if (count === 0) {
      const existingNames = await MenuItem.distinct("category")
      if (existingNames.length > 0) {
        await Category.insertMany(
          existingNames
            .filter(Boolean)
            .map((name, i) => ({ name, sortOrder: i })),
          { ordered: false }
        ).catch(() => {}) // ignore duplicate-key races if two requests seed at once
      }
    }

    const categories = await Category.find().sort({ sortOrder: 1, name: 1 })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/categories  { name }
// Creates an empty category — no items required. This is the "create the
// category first" step; dishes get added to it afterward from the normal
// Add Dish form.
export const createCategory = async (req, res) => {
  try {
    const name = (req.body.name || "").trim()
    if (!name) {
      return res.status(400).json({ error: "Category name is required." })
    }

    const existing = await Category.findOne({ name: new RegExp(`^${name}$`, "i") })
    if (existing) {
      return res.status(409).json({ error: `A category named "${existing.name}" already exists.` })
    }

    const maxOrder = await Category.findOne().sort({ sortOrder: -1 }).select("sortOrder")
    const category = await Category.create({
      name,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1
    })

    io.emit("category:updated", { action: "create", category })
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/categories/:id  { name }
// Renaming a category also renames it on every existing menu item that
// carries the old name, so items don't silently fall out of the menu.
export const renameCategory = async (req, res) => {
  try {
    const newName = (req.body.name || "").trim()
    if (!newName) {
      return res.status(400).json({ error: "Category name is required." })
    }

    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: "Category not found." })

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${newName}$`, "i")
    })
    if (duplicate) {
      return res.status(409).json({ error: `A category named "${duplicate.name}" already exists.` })
    }

    const oldName = category.name
    category.name = newName
    await category.save()

    if (oldName !== newName) {
      await MenuItem.updateMany({ category: oldName }, { $set: { category: newName } })
      io.emit("menu:updated", { action: "category-rename" })
    }

    io.emit("category:updated", { action: "rename", category })
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/categories/:id?reassignTo=<name>
// Refuses to delete a category that still has dishes in it, UNLESS
// reassignTo is given — in which case every item in the deleted category
// is moved there first. This is the safe default: staff has to explicitly
// choose where the dishes go rather than having them silently vanish or
// get force-deleted along with the category.
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: "Category not found." })

    const itemCount = await MenuItem.countDocuments({ category: category.name })
    const reassignTo = (req.query.reassignTo || "").trim()

    if (itemCount > 0) {
      if (!reassignTo) {
        return res.status(409).json({
          error: `"${category.name}" still has ${itemCount} dish${itemCount === 1 ? "" : "es"} in it. Move them to another category first, or pass reassignTo.`,
          itemCount
        })
      }
      if (reassignTo.toLowerCase() === category.name.toLowerCase()) {
        return res.status(400).json({ error: "reassignTo must be a different category." })
      }
      const target = await Category.findOne({ name: new RegExp(`^${reassignTo}$`, "i") })
      if (!target) {
        return res.status(404).json({ error: `Target category "${reassignTo}" does not exist.` })
      }
      await MenuItem.updateMany({ category: category.name }, { $set: { category: target.name } })
    }

    await category.deleteOne()
    if (itemCount > 0) io.emit("menu:updated", { action: "category-delete-reassign" })
    io.emit("category:updated", { action: "delete", id: category._id.toString() })
    res.json({ message: "Category deleted successfully.", movedItems: itemCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}