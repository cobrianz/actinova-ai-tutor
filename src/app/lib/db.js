// lib/db.js

import { connectToDatabase } from "./mongodb";
import bcrypt from "bcryptjs";

export async function createUser({ firstName, lastName, email, password }) {
  const { db } = await connectToDatabase();
  const hashedPassword = await bcrypt.hash(password, 12);
  const now = new Date();

  const result = await db.collection("users").insertOne({
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    role: "student",
    password: hashedPassword,
    status: "active",
    joinDate: now.toISOString(),
    lastActive: now.toISOString(),
    createdAt: now,
  });

  return result;
}

export async function findUserByEmail(email) {
  const { db } = await connectToDatabase();
  return db.collection("users").findOne({ email });
}
