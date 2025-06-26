// src/lib/auth.js

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

// used for issuing JWTs
export function signToken(user, options = { expiresIn: "7d" }) {
  return jwt.sign(
    { id: user._id?.toString(), email: user.email },
    JWT_SECRET,
    options
  );
}

// used in /api/me
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// new: compare plaintext password against stored hash
export async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
