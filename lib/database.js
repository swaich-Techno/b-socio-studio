import { ensureDatabase } from "@/lib/neon";

export default async function connectDB() {
  return ensureDatabase();
}
