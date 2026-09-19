// Run: node src/scripts/seedStaff.js --username=manager1 --password="Test@1234" --name="Test Manager" --role=MANAGER
import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import Staff from "../models/Staff.js"

function parseArgs() {
  const args = {}
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/)
    if (match) args[match[1]] = match[2]
  }
  return args
}

async function run() {
  const { username, password, name, role } = parseArgs()

  if (!username || !password || !name || !role) {
    console.error('Usage: node src/scripts/seedStaff.js --username=... --password=... --name="..." --role=MANAGER|STAFF')
    process.exit(1)
  }

  if (!["OWNER", "MANAGER", "STAFF"].includes(role)) {
    console.error(`Invalid role "${role}". Must be OWNER, MANAGER, or STAFF.`)
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const existing = await Staff.findOne({ username: username.trim().toLowerCase() })
  if (existing) {
    console.log(`A staff account with username "${username}" already exists (role: ${existing.role}). Nothing done.`)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const staff = await Staff.create({
    username: username.trim().toLowerCase(),
    passwordHash,
    name,
    role
  })

  console.log(`${staff.role} account created: ${staff.username}`)
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
