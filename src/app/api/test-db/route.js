// pages/api/test-db.js
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    res.status(200).json({ status: "✅ MongoDB Connected Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
