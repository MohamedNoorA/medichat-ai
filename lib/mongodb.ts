import { MongoClient, ServerApiVersion, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "medichat";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectMongoDB() {
  if (cachedClient && cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb,
    };
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    console.log("MongoDB connected successfully");
    return {
      client: client,
      db: db,
    };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db | null> {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const { db } = await connectMongoDB();
    return db;
  } catch (error) {
    console.error("Failed to get database:", error);
    return null;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const { client } = await connectMongoDB();
    await client.db(dbName).command({ ping: 1 });
    return true;
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    return false;
  }
}

export { connectMongoDB };
