import { connectToDatabase } from "./mongodb";

export default async function dbConnect() {
    return await connectToDatabase();
}
