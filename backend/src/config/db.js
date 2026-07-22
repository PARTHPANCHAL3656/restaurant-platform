import mongoose from "mongoose"

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    // Don't crash the whole server on a DB failure — routes that don't
    // touch MongoDB (like staff login) should still be able to respond.
  }
}

export default connectDB