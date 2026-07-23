import mongoose from "mongoose"
import Table from "./src/models/Table.js"
import dotenv from "dotenv"
dotenv.config()
const MONGO_URI = process.env.MONGO_URI

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log("Connected to MongoDB to seed tables...")

    await Table.deleteMany({})
    console.log("Cleared existing tables.")

    const tables = [
      { tableNumber: 1, capacity: 6 },
      { tableNumber: 2, capacity: 6 },
      { tableNumber: 3, capacity: 6 },
      { tableNumber: 4, capacity: 6 },
      { tableNumber: 5, capacity: 6 },
      { tableNumber: 6, capacity: 6 },
      { tableNumber: 7, capacity: 6 },
      { tableNumber: 8, capacity: 6 },
      { tableNumber: 9, capacity: 10 },
      { tableNumber: 10, capacity: 10 }
    ]

    await Table.insertMany(tables)
    console.log("Successfully seeded 10 restaurant tables.")

    await mongoose.connection.close()
    console.log("Database connection closed.")
  } catch (error) {
    console.error("Error seeding tables:", error)
    process.exit(1)
  }
}

seed()
