import "dotenv/config";
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI as string);
  const db = mongoose.connection.db!;
  await db.collection("users").deleteMany({ email: "admin@restaurant.com" });
  const hashed = await bcrypt.hash("password123", 10);
  await db.collection("users").insertOne({
    name: "Admin",
    email: "admin@restaurant.com",
    password: hashed,
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Admin seeded successfully");
  process.exit(0);
}

seed().catch(console.error);
