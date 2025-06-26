// app/api/test-db/route.js
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return Response.json({ status: "MongoDB Connected Successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
