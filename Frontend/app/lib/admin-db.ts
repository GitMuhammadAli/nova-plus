import { MongoClient, Db } from "mongodb";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://root:password@localhost:27017/novapulse?authSource=admin";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getAdminDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  cachedClient = client;

  // Extract the database name from the URI
  const url = new URL(MONGO_URI);
  const dbName = url.pathname.slice(1).split("?")[0] || "novapulse";
  cachedDb = client.db(dbName);
  return cachedDb;
}

export async function getAdminClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client;
}
